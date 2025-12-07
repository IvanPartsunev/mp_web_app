// components/products-table.tsx
import React from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {useProducts, type Product} from "@/hooks/useProducts";

type ProductsTableProps = {
  title?: string;
};

const PAGE_SIZE = 25;

export function ProductsTable({title = "Продукти"}: ProductsTableProps) {
  // Use React Query hook for caching (1 hour)
  const {data = [], isLoading: loading, error: queryError} = useProducts();
  const [page, setPage] = React.useState<number>(1);
  
  // Convert error to string for display
  const error = queryError ? "Възникна грешка при зареждане." : null;

  // Pagination helpers
  const total = data.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const startIdx = (page - 1) * PAGE_SIZE;
  const endIdx = Math.min(startIdx + PAGE_SIZE, total);
  const pageItems = data.slice(startIdx, endIdx);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  return (
    <section className="w-full px-2 xl:container xl:mx-auto xl:px-4 py-8">
      {title && <h1 className="text-3xl font-bold mb-6">{title}</h1>}

      <Card>
        <CardHeader>
          <CardTitle>Списък с налични продукти</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="py-2 w-[5%] whitespace-nowrap">№</TableHead>
                <TableHead className="py-2 w-[20%] whitespace-nowrap">Име</TableHead>
                <TableHead className="py-2 text-center w-[10%] whitespace-nowrap">Дължина (см)</TableHead>
                <TableHead className="py-2 text-center w-[10%] whitespace-nowrap">Ширина (см)</TableHead>
                <TableHead className="py-2 text-center w-[10%] whitespace-nowrap">Височина (см)</TableHead>
                <TableHead className="py-2 w-[45%] pl-8 whitespace-nowrap">Описание</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} className="py-2">
                    Зареждане...
                  </TableCell>
                </TableRow>
              )}
              {error && !loading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-red-600 py-2">
                    {error}
                  </TableCell>
                </TableRow>
              )}
              {!loading && !error && pageItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-2">
                    Няма налични продукти.
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                !error &&
                pageItems.map((product: Product, idx: number) => (
                  <TableRow key={product.id ?? `product-${startIdx + idx}`}>
                    <TableCell className="font-medium py-2">{startIdx + idx + 1}</TableCell>
                    <TableCell className="py-2 font-medium">{product.name}</TableCell>
                    <TableCell className="py-2 text-center">{product.length ?? "-"}</TableCell>
                    <TableCell className="py-2 text-center">{product.width ?? "-"}</TableCell>
                    <TableCell className="py-2 text-center">{product.height ?? "-"}</TableCell>
                    <TableCell className="py-2 pl-8 min-w-[350px]">{product.description || "-"}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>

          {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="mt-2">
            <Pagination>
              <PaginationContent className="px-1 py-1">
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      goToPage(page - 1);
                    }}
                  />
                </PaginationItem>

                {/* Show first, current-1, current, current+1, last with ellipses */}
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
            <div className="px-1 text-xs text-muted-foreground">
              Показани {startIdx + 1}-{endIdx} от {total}
            </div>
          </div>
        )}
        </CardContent>
      </Card>
    </section>
  );
}
