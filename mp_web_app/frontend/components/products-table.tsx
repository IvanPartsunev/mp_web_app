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
import {usePagination} from "@/hooks/usePagination";
import {TABLE_STYLES, COLUMN_WIDTHS, EMPTY_MESSAGES, LOADING_MESSAGES} from "@/lib/tableUtils";
import {SECTION_STYLES} from "@/lib/styles";

type ProductsTableProps = {
  title?: string;
};

export function ProductsTable({title = "Продукти"}: ProductsTableProps) {
  const {data = [], isLoading: loading, error: queryError} = useProducts();
  const pagination = usePagination(data);
  const error = queryError ? "Възникна грешка при зареждане." : null;

  return (
    <section className={SECTION_STYLES.fullWidth}>
      {title && <h1 className="text-3xl font-bold mb-6">{title}</h1>}

      <Card>
        <CardHeader>
          <CardTitle>Списък с налични продукти</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className={TABLE_STYLES.scrollWrapper}>
            <Table className={TABLE_STYLES.tableBase}>
              <TableHeader>
                <TableRow>
                  <TableHead className={`${TABLE_STYLES.headPadded} ${COLUMN_WIDTHS.rowNumber}`}>№</TableHead>
                  <TableHead className={`${TABLE_STYLES.headPadded} ${COLUMN_WIDTHS.large}`}>Име</TableHead>
                  <TableHead className={`${TABLE_STYLES.headPadded} ${TABLE_STYLES.headCenter} ${COLUMN_WIDTHS.small}`}>
                    Дължина (см)
                  </TableHead>
                  <TableHead className={`${TABLE_STYLES.headPadded} ${TABLE_STYLES.headCenter} ${COLUMN_WIDTHS.small}`}>
                    Ширина (см)
                  </TableHead>
                  <TableHead className={`${TABLE_STYLES.headPadded} ${TABLE_STYLES.headCenter} ${COLUMN_WIDTHS.small}`}>
                    Височина (см)
                  </TableHead>
                  <TableHead className={`${TABLE_STYLES.headPadded} ${COLUMN_WIDTHS.description} pl-8`}>
                    Описание
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={6} className={TABLE_STYLES.cellPadded}>
                      {LOADING_MESSAGES.generic}
                    </TableCell>
                  </TableRow>
                )}
                {error && !loading && (
                  <TableRow>
                    <TableCell colSpan={6} className={`text-red-600 ${TABLE_STYLES.cellPadded}`}>
                      {error}
                    </TableCell>
                  </TableRow>
                )}
                {!loading && !error && pagination.pageItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className={TABLE_STYLES.cellPadded}>
                      {EMPTY_MESSAGES.products}
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  !error &&
                  pagination.pageItems.map((product: Product, idx: number) => (
                    <TableRow key={product.id ?? `product-${pagination.startIdx + idx}`}>
                      <TableCell className={TABLE_STYLES.rowNumberCell}>{pagination.startIdx + idx + 1}</TableCell>
                      <TableCell className={`${TABLE_STYLES.cellPadded} font-medium`}>{product.name}</TableCell>
                      <TableCell className={`${TABLE_STYLES.cellPadded} ${TABLE_STYLES.cellCenter}`}>
                        {product.length ?? "-"}
                      </TableCell>
                      <TableCell className={`${TABLE_STYLES.cellPadded} ${TABLE_STYLES.cellCenter}`}>
                        {product.width ?? "-"}
                      </TableCell>
                      <TableCell className={`${TABLE_STYLES.cellPadded} ${TABLE_STYLES.cellCenter}`}>
                        {product.height ?? "-"}
                      </TableCell>
                      <TableCell className="py-2 pl-8 min-w-[350px]">{product.description || "-"}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-2">
              <Pagination>
                <PaginationContent className="px-1 py-1">
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        pagination.prevPage();
                      }}
                    />
                  </PaginationItem>

                  {pagination.page > 2 && (
                    <>
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            pagination.goToPage(1);
                          }}
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>
                      {pagination.page > 3 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                    </>
                  )}

                  {pagination.page > 1 && (
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          pagination.prevPage();
                        }}
                      >
                        {pagination.page - 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  <PaginationItem>
                    <PaginationLink href="#" isActive onClick={(e) => e.preventDefault()}>
                      {pagination.page}
                    </PaginationLink>
                  </PaginationItem>

                  {pagination.page < pagination.totalPages && (
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          pagination.nextPage();
                        }}
                      >
                        {pagination.page + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  {pagination.page < pagination.totalPages - 1 && (
                    <>
                      {pagination.page < pagination.totalPages - 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            pagination.goToPage(pagination.totalPages);
                          }}
                        >
                          {pagination.totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        pagination.nextPage();
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              <div className="px-1 text-xs text-muted-foreground">
                Показани {pagination.startIdx + 1}-{pagination.endIdx} от {pagination.total}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
