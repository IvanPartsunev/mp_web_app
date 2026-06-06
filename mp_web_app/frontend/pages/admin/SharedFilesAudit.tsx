import {useState} from "react";
import {AdminLayout} from "@/components/admin-layout";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {LoadingSpinner} from "@/components/ui/loading-spinner";
import {useToast} from "@/components/ui/use-toast";
import {useSharedFilesAudit, useRevokeShare} from "@/hooks/useFiles";
import type {ApiError} from "@/lib/errorUtils";
import {TABLE_STYLES, COLUMN_WIDTHS, DEFAULT_PAGE_SIZE} from "@/lib/tableUtils";
import {TablePagination} from "@/components/table-pagination";
import {UserX} from "lucide-react";

export default function SharedFilesAudit() {
  const {data: rawEntries = [], isLoading: loading} = useSharedFilesAudit();
  const entries = [...rawEntries].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });
  const revokeMutation = useRevokeShare();
  const {toast} = useToast();
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(entries.length / DEFAULT_PAGE_SIZE));
  const pagedEntries = entries.slice((page - 1) * DEFAULT_PAGE_SIZE, page * DEFAULT_PAGE_SIZE);

  const handleRevoke = (fileId: string, userId: string) => {
    revokeMutation.mutate(
      {fileId, userId},
      {
        onSuccess: () => {
          toast({title: "Успех", description: "Споделянето е премахнато успешно"});
        },
        onError: (err: Error) => {
          const detail = (err as ApiError).response?.data?.detail;
          toast({
            title: "Грешка",
            description: detail || "Неуспешно премахване на споделяне",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <AdminLayout title="Споделени файлове">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Споделени файлове ({entries.length})</h3>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className={TABLE_STYLES.scrollWrapper}>
            <Table className={TABLE_STYLES.tableLarge}>
              <TableHeader>
                <TableRow>
                  <TableHead className={`${TABLE_STYLES.headBase} ${COLUMN_WIDTHS.rowNumber}`}>№</TableHead>
                  <TableHead className={`${TABLE_STYLES.headBase} w-[35%] min-w-[200px]`}>Файл</TableHead>
                  <TableHead className={`${TABLE_STYLES.headBase} w-[20%]`}>Качен от</TableHead>
                  <TableHead className={`${TABLE_STYLES.headBase} w-[20%]`}>Споделен с</TableHead>
                  <TableHead className={`${TABLE_STYLES.headBase} ${COLUMN_WIDTHS.small}`}>Дата</TableHead>
                  <TableHead className={`${TABLE_STYLES.headCenter} w-[90px]`}>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedEntries.map((entry, index) => (
                  <TableRow key={`${entry.file_id}-${entry.shared_with_id}`}>
                    <TableCell className={TABLE_STYLES.rowNumberCell}>
                      {(page - 1) * DEFAULT_PAGE_SIZE + index + 1}
                    </TableCell>
                    <TableCell className="font-medium w-[35%] min-w-[200px]">
                      <span className="block truncate pr-4">{entry.file_name ?? "-"}</span>
                    </TableCell>
                    <TableCell className="w-[20%] whitespace-nowrap">
                      {entry.uploaded_by_name ?? entry.uploaded_by_id ?? "-"}
                    </TableCell>
                    <TableCell className="w-[20%] whitespace-nowrap">
                      {entry.shared_with_name ?? entry.shared_with_id}
                    </TableCell>
                    <TableCell className={TABLE_STYLES.cellBase}>
                      {entry.created_at ? new Date(entry.created_at).toLocaleDateString("bg-BG") : "-"}
                    </TableCell>
                    <TableCell className={TABLE_STYLES.cellCenter}>
                      <button
                        title="Премахни"
                        disabled={revokeMutation.isPending}
                        onClick={() => handleRevoke(entry.file_id, entry.shared_with_id)}
                        className="p-1.5 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                      >
                        <UserX className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </AdminLayout>
  );
}
