import React, {useEffect, useState} from "react";
import {NewsCard} from "@/components/news-card";
import {API_BASE_URL} from "@/app-config";
import {getAccessToken} from "@/context/tokenStore";
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
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const token = getAccessToken();
        
        // Only include token if it's valid (not expired)
        const validToken = token && !isJwtExpired(token) ? token : null;
        
        const url = validToken 
          ? `${API_BASE_URL}news/get?token=${validToken}`
          : `${API_BASE_URL}news/get`;
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch news");
        }
        
        const data = await response.json();
        setNews(data || []);
      } catch (err: any) {
        setError("Неуспешно зареждане на новините");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  // Pagination helpers
  const total = news.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const startIdx = (page - 1) * PAGE_SIZE;
  const endIdx = Math.min(startIdx + PAGE_SIZE, total);
  const pageItems = news.slice(startIdx, endIdx);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6">Новини</h2>
      
      {loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Зареждане на новини...</p>
        </div>
      )}
      
      {error && (
        <div className="text-center py-8">
          <p className="text-destructive">{error}</p>
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
