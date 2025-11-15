import {useState} from "react";
import {NewsCard} from "@/components/news-card";
import {useNews} from "@/hooks/useNews";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const PAGE_SIZE = 6;

export default function Home() {
  // Use React Query hook for caching
  const {data: news = [], isLoading: loading, error: queryError} = useNews();
  const [page, setPage] = useState(1);
  
  // Convert error to string for display
  const error = queryError ? "Неуспешно зареждане на новините" : null;

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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-primary/10 dark:from-gray-900 dark:via-gray-800 dark:to-primary/5 border-b border-gray-200/50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-primary to-gray-900 dark:from-white dark:via-primary dark:to-white bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-1000">
              Добре дошли в ГПК
            </h1>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
              Следете последните новини и актуализации от нашата кооперация
            </p>
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className="container mx-auto px-4 py-12">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 animate-pulse">Зареждане на новини...</p>
          </div>
        )}

        {error && (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 space-y-4">
              <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-800 dark:text-red-200 font-semibold">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Опитай отново
              </button>
            </div>
          </div>
        )}

        {!loading && !error && news.length === 0 && (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-12 space-y-4">
              <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">Няма налични новини</p>
            </div>
          </div>
        )}

        {!loading && !error && news.length > 0 && (
          <>
            <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-8 duration-700">
              {pageItems.map((item, index) => (
                <div
                  key={item.id}
                  className="animate-in fade-in slide-in-from-bottom-4"
                  style={{animationDelay: `${index * 100}ms`, animationFillMode: "backwards"}}
                >
                  <NewsCard
                    title={item.title}
                    content={item.content}
                    created_at={item.created_at || ""}
                    news_type={item.is_public === false ? "private" : "regular"}
                  />
                </div>
              ))}
            </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12">
              <Pagination>
                <PaginationContent className="gap-2">
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
    </div>
  );
}
