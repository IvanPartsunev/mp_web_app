import {useState, useMemo} from "react";
import {AdminLayout} from "@/components/admin-layout";
import {Input} from "@/components/ui/input";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {LoadingSpinner} from "@/components/ui/loading-spinner";
import {useToast} from "@/components/ui/use-toast";
import {useSharedFilesAudit, useRevokeShare, SharedFileAuditEntry} from "@/hooks/useFiles";
import type {ApiError} from "@/lib/errorUtils";
import {TABLE_STYLES, COLUMN_WIDTHS, DEFAULT_PAGE_SIZE} from "@/lib/tableUtils";
import {TablePagination} from "@/components/table-pagination";
import {ExpandableLabelCell} from "@/components/expandable-label-cell";
import {ExpandableNameCell} from "@/components/expandable-name-cell";
import {UserX, Search} from "lucide-react";

function matchesSearch(entry: SharedFileAuditEntry, query: string): boolean {
  if (!query.trim()) return true;
  const terms = query.trim().toLowerCase().split(/\s+/);
  return terms.every(
    (term) =>
      (entry.file_name ?? "").toLowerCase().includes(term) ||
      (entry.labels ?? []).some((lbl) => lbl.toLowerCase().includes(term)) ||
      (entry.shared_with_name ?? "").toLowerCase().includes(term)
  );
}

export default function SharedFilesAudit() {
  const {data: rawEntries = [], isLoading: loading} = useSharedFilesAudit();
  const revokeMutation = useRevokeShare();
  const {toast} = useToast();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const entries = useMemo(() => {
    const sorted = [...rawEntries].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
    return sorted.filter((e) => matchesSearch(e, searchQuery));
  }, [rawEntries, searchQuery]);

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
        <div className="flex flex-wrap items-center gap-4">
          <h3 className="text-lg font-semibold">Споделени файлове ({entries.length})</h3>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Търсене по име, етикет или споделен с..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-8"
            />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className={TABLE_STYLES.scrollWrapper}>
            <Table className={TABLE_STYLES.tableLarge}>
              <TableHeader>
                <TableRow>
                  <TableHead className={`${TABLE_STYLES.headBase} ${COLUMN_WIDTHS.rowNumber}`}>№</TableHead>
                  <TableHead className={`${TABLE_STYLES.headBase} w-[25%] min-w-[160px]`}>Файл</TableHead>
                  <TableHead className={`${TABLE_STYLES.headBase} w-[160px]`}>Етикети</TableHead>
                  <TableHead className={`${TABLE_STYLES.headBase} w-[15%]`}>Качен от</TableHead>
                  <TableHead className={`${TABLE_STYLES.headBase} w-[15%]`}>Споделен с</TableHead>
                  <TableHead className={`${TABLE_STYLES.headBase} ${COLUMN_WIDTHS.small}`}>Дата</TableHead>
                  <TableHead className={`${TABLE_STYLES.headCenter} w-[90px]`}>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {searchQuery ? "Няма намерени резултати." : "Няма споделени файлове."}
                    </TableCell>
                  </TableRow>
                )}
                {pagedEntries.map((entry, index) => (
                  <TableRow key={`${entry.file_id}-${entry.shared_with_id}`}>
                    <TableCell className={TABLE_STYLES.rowNumberCell}>
                      {(page - 1) * DEFAULT_PAGE_SIZE + index + 1}
                    </TableCell>
                    <TableCell className="font-medium w-[25%] min-w-[160px]">
                      <ExpandableNameCell name={entry.file_name} />
                    </TableCell>
                    <TableCell className="w-[160px] min-w-[160px] max-w-[160px] py-2">
                      <ExpandableLabelCell labels={entry.labels} />
                    </TableCell>
                    <TableCell className="w-[15%] whitespace-nowrap">
                      {entry.uploaded_by_name ?? entry.uploaded_by_id ?? "-"}
                    </TableCell>
                    <TableCell className="w-[15%] whitespace-nowrap">
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
