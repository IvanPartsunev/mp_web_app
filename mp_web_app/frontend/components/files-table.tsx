// components/files/FilesTable.tsx
import React from "react";
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

type FileType =
  | "governing_documents"
  | "forms"
  | "minutes"
  | "transcripts"
  | "accounting"
  | "private_documents"
  | "others";

type FileMetadata = {
  id?: string | null;
  file_name?: string | null;
  file_type: FileType;
  uploaded_by?: string | null;
  created_at?: string | null;
};

type FilesTableProps = {
  fileType: FileType;
  title?: string;
};

const PAGE_SIZE = 25;

export function FilesTable({fileType, title = "Документи"}: FilesTableProps) {
  const [data, setData] = React.useState<FileMetadata[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState<number>(1);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<FileMetadata[]>(`files/list`, {
        params: {file_type: fileType},
        withCredentials: true,
      });
      setData(res.data ?? []);
      setPage(1); // reset page on type change/fresh load
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "Възникна грешка при зареждане.");
    } finally {
      setLoading(false);
    }
  }, [fileType]);

  React.useEffect(() => {
    load();
  }, [load]);

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
      {/* Hero Section */}
      {title && (
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-primary/10 dark:from-gray-900 dark:via-gray-800 dark:to-primary/5 border-b border-gray-200/50">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="container mx-auto px-4 py-12 md:py-16 relative">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-primary to-gray-900 dark:from-white dark:via-primary dark:to-white bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {title}
              </h1>
            </div>
          </div>
        </section>
      )}

      <section className="w-full px-2 xl:container xl:mx-auto xl:px-4 py-8">

      <Card>
        <CardHeader>
          <CardTitle>Списък с налични файлове</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] py-2">№</TableHead>
                <TableHead className="py-2">Име на файл</TableHead>
                <TableHead className="py-2">Дата на създаване</TableHead>
                <TableHead className="text-right py-2">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={4} className="py-2">
                    Зареждане...
                  </TableCell>
                </TableRow>
              )}
              {error && !loading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-red-600 py-2">
                    {error}
                  </TableCell>
                </TableRow>
              )}
              {!loading && !error && pageItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-2">
                    Няма налични записи.
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                !error &&
                pageItems.map((file, idx) => (
                  <TableRow key={file.id ?? `${file.file_name}-${startIdx + idx}`}>
                    <TableCell className="font-medium py-2">{startIdx + idx + 1}</TableCell>
                    <TableCell className="py-2">{file.file_name}</TableCell>
                    <TableCell className="py-2">
                      {file.created_at ? new Date(file.created_at).toLocaleString() : "-"}
                    </TableCell>
                    <TableCell className="text-right py-2">
                      <Button size="sm" onClick={() => handleDownload(file)}>
                        Изтегли
                      </Button>
                    </TableCell>
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
    </div>
  );
}
