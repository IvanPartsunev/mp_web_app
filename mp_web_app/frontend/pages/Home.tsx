import React, {useEffect, useState} from "react";
import {useLocation} from "react-router-dom";
import {NewsCard} from "@/components/news-card";
import apiClient from "@/context/apiClient";
import {getAccessToken, setAccessToken} from "@/context/tokenStore";
import {isJwtExpired} from "@/context/jwt";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface News {
  id: string;
  title: string;
  content: string;
  author_id: string;
  created_at: string;
  news_type: "regular" | "private";
}

const PAGE_SIZE = 6;

export default function Home() {
  const location = useLocation();
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if token exists and is expired
        const token = getAccessToken();
        if (token && isJwtExpired(token)) {
          // Token is expired, explicitly refresh it first
          try {
            const refreshResponse = await apiClient.post("auth/refresh");
            // Update token in localStorage with the new one from response
            if (refreshResponse.data?.access_token) {
              setAccessToken(refreshResponse.data.access_token);
            }
          } catch (refreshError) {
            // Refresh failed, user will be logged out by apiClient
            // Just fetch public news
          }
        }

        // Now fetch news with fresh token (or no token if refresh failed)
        const response = await apiClient.get("news/list");
        setNews(response.data || []);
      } catch (err: any) {
        if (err.response?.status !== 401) {
          setError("Неуспешно зареждане на новините");
        }
        setNews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [location.key]); // Refetch when navigation occurs (including browser refresh)

  // Pagination helpers
  const total = news.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const startIdx = (page - 1) * PAGE_SIZE;
  const endIdx = Math.min(startIdx + PAGE_SIZE, total);
  const pageItems = news.slice(startIdx, endIdx);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    window.scrollTo({top: 0, behavior: "smooth"});
  };

  return (
    <section className="container mx-auto px-4 py-8">

      {loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Зареждане на новини...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              apiClient
                .get("news/get")
                .then((response) => setNews(response.data || []))
                .catch((err) => {
                  if (err.response?.status !== 401) {
                    setError("Неуспешно зареждане на новините");
                  }
                  setNews([]);
                })
                .finally(() => setLoading(false));
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Опитай отново
          </button>
        </div>
      )}

      {!loading && !error && news.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Няма налични новини</p>
        </div>
      )}

      {!loading && !error && news.length > 0 && (
        <>
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {pageItems.map((item) => (
              <NewsCard
                key={item.id}
                title={item.title}
                content={item.content}
                author_id={item.author_id}
                created_at={item.created_at}
                news_type={item.news_type}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        goToPage(page - 1);
                      }}
                    />
                  </PaginationItem>

                  {page > 2 && (
                    <>
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            goToPage(1);
                          }}
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>
                      {page > 3 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                    </>
                  )}

                  {page > 1 && (
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          goToPage(page - 1);
                        }}
                      >
                        {page - 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  <PaginationItem>
                    <PaginationLink href="#" isActive onClick={(e) => e.preventDefault()}>
                      {page}
                    </PaginationLink>
                  </PaginationItem>

                  {page < totalPages && (
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          goToPage(page + 1);
                        }}
                      >
                        {page + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  {page < totalPages - 1 && (
                    <>
                      {page < totalPages - 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            goToPage(totalPages);
                          }}
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        goToPage(page + 1);
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              <div className="text-center mt-2 text-sm text-muted-foreground">
                Показани {startIdx + 1}-{endIdx} от {total}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
