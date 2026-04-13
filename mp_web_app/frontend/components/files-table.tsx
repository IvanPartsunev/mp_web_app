import {Button} from "@/components/ui/button";
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
import apiClient from "@/context/apiClient";
import {useFiles, type FileType, type FileMetadata} from "@/hooks/useFiles";
import {usePagination} from "@/hooks/usePagination";
import {TABLE_STYLES, COLUMN_WIDTHS, EMPTY_MESSAGES, LOADING_MESSAGES} from "@/lib/tableUtils";
import {HERO_STYLES, SECTION_STYLES} from "@/lib/styles";

type FilesTableProps = {
  fileType: FileType;
  title?: string;
};

export function FilesTable({fileType, title = "Документи"}: FilesTableProps) {
  const {data = [], isLoading: loading, error: queryError} = useFiles(fileType);
  const pagination = usePagination(data);
  const error = queryError ? "Възникна грешка при зареждане." : null;

  const handleDownload = async (file: FileMetadata) => {
    if (!file.id || !file.file_name) return;
    try {
      const res = await apiClient.post(
        `files/download`,
        {
          id: file.id,
          file_name: file.file_name,
          file_type: file.file_type,
          uploaded_by: file.uploaded_by ?? null,
          created_at: file.created_at ?? null,
        } as FileMetadata,
        {
          responseType: "blob",
          withCredentials: true,
        }
      );

      const blob = new Blob([res.data], {type: res.headers["content-type"] || "application/octet-stream"});
      const contentDisposition = res.headers["content-disposition"] as string | undefined;
      const suggestedName = (() => {
        if (contentDisposition) {
          const match = /filename\*?=(?:UTF-8'')?"?([^"]+)"?/i.exec(contentDisposition);
          if (match && match[1]) return decodeURIComponent(match[1]);
        }
        return file.file_name || "download";
      })();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = suggestedName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.response?.data?.detail ?? "Неуспешно изтегляне.");
    }
  };

  return (
    <div className="min-h-screen">
      {title && (
        <section className={HERO_STYLES.section}>
          <div className={HERO_STYLES.overlay} />
          <div className={HERO_STYLES.container}>
            <div className={HERO_STYLES.content}>
              <h1 className={HERO_STYLES.title}>{title}</h1>
            </div>
          </div>
        </section>
      )}

      <section className={SECTION_STYLES.fullWidth}>
        <Card>
          <CardHeader>
            <CardTitle>Списък с налични файлове</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className={TABLE_STYLES.scrollWrapper}>
              <Table className={TABLE_STYLES.tableBase}>
                <TableHeader>
                  <TableRow>
                    <TableHead className={`${TABLE_STYLES.headPadded} ${COLUMN_WIDTHS.rowNumber}`}>№</TableHead>
                    <TableHead className={TABLE_STYLES.headPadded}>Име на файл</TableHead>
                    <TableHead className={TABLE_STYLES.headPadded}>Дата на създаване</TableHead>
                    <TableHead className={`${TABLE_STYLES.headPadded} ${TABLE_STYLES.headRight}`}>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={4} className={TABLE_STYLES.cellPadded}>
                        {LOADING_MESSAGES.generic}
                      </TableCell>
                    </TableRow>
                  )}
                  {error && !loading && (
                    <TableRow>
                      <TableCell colSpan={4} className={`text-red-600 ${TABLE_STYLES.cellPadded}`}>
                        {error}
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && !error && pagination.pageItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className={TABLE_STYLES.cellPadded}>
                        {EMPTY_MESSAGES.files}
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading &&
                    !error &&
                    pagination.pageItems.map((file: FileMetadata, idx: number) => (
                      <TableRow key={file.id ?? `${file.file_name}-${pagination.startIdx + idx}`}>
                        <TableCell className={TABLE_STYLES.rowNumberCell}>{pagination.startIdx + idx + 1}</TableCell>
                        <TableCell className={TABLE_STYLES.cellPadded}>{file.file_name}</TableCell>
                        <TableCell className={TABLE_STYLES.cellPadded}>
                          {file.created_at
                            ? new Date(file.created_at).toLocaleDateString("bg-BG", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })
                            : "-"}
                        </TableCell>
                        <TableCell className={`${TABLE_STYLES.cellPadded} ${TABLE_STYLES.cellRight}`}>
                          <Button size="sm" onClick={() => handleDownload(file)}>
                            Изтегли
                          </Button>
                        </TableCell>
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
    </div>
  );
}
