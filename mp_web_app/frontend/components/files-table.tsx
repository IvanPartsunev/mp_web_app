import {useState, useMemo} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
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
import {Search} from "lucide-react";
import apiClient from "@/context/apiClient";
import {useFiles, type FileType, type FileMetadata} from "@/hooks/useFiles";
import {usePagination} from "@/hooks/usePagination";
import {TABLE_STYLES, COLUMN_WIDTHS, EMPTY_MESSAGES, LOADING_MESSAGES} from "@/lib/tableUtils";
import {HERO_STYLES, SECTION_STYLES} from "@/lib/styles";
import {ExpandableLabelCell} from "@/components/expandable-label-cell";
import {ExpandableNameCell} from "@/components/expandable-name-cell";

type FilesTableProps =
  | {fileType: FileType; title?: string; files?: undefined; isLoading?: undefined; error?: undefined}
  | {files: FileMetadata[]; title?: string; fileType?: undefined; isLoading?: boolean; error?: string | null};

function matchesSearch(file: FileMetadata, query: string): boolean {
  if (!query.trim()) return true;
  const terms = query.trim().toLowerCase().split(/\s+/);
  return terms.every(
    (term) =>
      (file.file_name ?? "").toLowerCase().includes(term) ||
      (file.labels ?? []).some((lbl) => lbl.toLowerCase().includes(term))
  );
}

export function FilesTable({
  fileType,
  title = "Документи",
  files: externalFiles,
  isLoading: externalLoading,
  error: externalError,
}: FilesTableProps) {
  const query = useFiles(fileType as FileType, {enabled: fileType !== undefined});
  const data = externalFiles ?? query.data ?? [];
  const loading = externalLoading ?? query.isLoading;
  const error = externalError !== undefined ? externalError : query.error ? "Възникна грешка при зареждане." : null;

  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => matchesSearch ? data.filter((f) => matchesSearch(f, searchQuery)) : data, [data, searchQuery]);

  const pagination = usePagination(filteredData);

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
    } catch (e: unknown) {
      const apiErr = e as {response?: {data?: {detail?: string}}};
      alert(apiErr?.response?.data?.detail ?? "Неуспешно изтегляне.");
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle>Списък с налични файлове</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Търсене по име или етикет..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <div className={TABLE_STYLES.scrollWrapper}>
              <Table className={TABLE_STYLES.tableBase}>
                <TableHeader>
                  <TableRow>
                    <TableHead className={`${TABLE_STYLES.headPadded} ${COLUMN_WIDTHS.rowNumber}`}>№</TableHead>
                    <TableHead className={`${TABLE_STYLES.headPadded} w-[50%]`}>Име на файл</TableHead>
                    <TableHead className={`${TABLE_STYLES.headPadded} w-[200px]`}>Етикети</TableHead>
                    <TableHead className={`${TABLE_STYLES.headPadded} w-[15%]`}>Качено от</TableHead>
                    <TableHead className={`${TABLE_STYLES.headPadded} w-[10%]`}>Дата на създаване</TableHead>
                    <TableHead className={`${TABLE_STYLES.headPadded} ${TABLE_STYLES.headRight}`}>Действия</TableHead>
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
                        {searchQuery ? "Няма намерени резултати." : EMPTY_MESSAGES.files}
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading &&
                    !error &&
                    pagination.pageItems.map((file: FileMetadata, idx: number) => (
                      <TableRow key={file.id ?? `${file.file_name}-${pagination.startIdx + idx}`}>
                        <TableCell className={TABLE_STYLES.rowNumberCell}>{pagination.startIdx + idx + 1}</TableCell>
                        <TableCell className="py-2 w-[50%] min-w-[280px]">
                          <ExpandableNameCell name={file.file_name} />
                        </TableCell>
                        <TableCell className="py-2 w-[200px] min-w-[200px] max-w-[200px]">
                          <ExpandableLabelCell labels={file.labels} />
                        </TableCell>
                        <TableCell className="py-2 whitespace-nowrap w-[15%]">{file.uploaded_by_name ?? "-"}</TableCell>
                        <TableCell className="py-2 whitespace-nowrap w-[10%]">
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
