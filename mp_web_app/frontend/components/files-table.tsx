// components/files/FilesTable.tsx
import React from "react";
import axios from "axios";
import {API_BASE_URL} from "@/app-config";
import {Button} from "@/components/ui/button";
import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
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

const API_BASE = API_BASE_URL;
const PAGE_SIZE = 25;

export function FilesTable({fileType, title}: FilesTableProps) {
  const [data, setData] = React.useState<FileMetadata[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState<number>(1);

  const token = React.useMemo(() => localStorage.getItem("access_token"), []);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<FileMetadata[]>(`files/get_files`, {
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

  // Simple compact Card styling with small paddings and subtle shadow
  return (
    <section className="space-y-3 p-3">
      {title ? <h1 className="text-2xl font-bold py-3">{title}</h1> : null}

      <div className="rounded-lg border bg-card shadow-sm p-2">
        <div className="rounded-md overflow-hidden">
          <Table>
            <TableCaption className="py-1">Списък с налични файлове.</TableCaption>
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
        </div>

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
      </div>
    </section>
  );
}
