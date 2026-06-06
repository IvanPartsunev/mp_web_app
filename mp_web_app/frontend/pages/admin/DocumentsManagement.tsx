import {useState, useMemo} from "react";
import {AdminLayout} from "@/components/admin-layout";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from "@/components/ui/dialog";
import {ConfirmDialog} from "@/components/confirm-dialog";
import {ShareFileDialog} from "@/components/share-file-dialog";
import {useToast} from "@/components/ui/use-toast";
import {LoadingSpinner} from "@/components/ui/loading-spinner";
import {TABLE_STYLES, COLUMN_WIDTHS, DEFAULT_PAGE_SIZE} from "@/lib/tableUtils";
import {useAllFiles, useDeleteFile, useUpdateFileMetadata, FileMetadata, FileType} from "@/hooks/useFiles";
import type {ApiError} from "@/lib/errorUtils";
import {TablePagination} from "@/components/table-pagination";
import {Pencil, Trash2, Forward} from "lucide-react";

const FILE_TYPES = [
  {value: "all", label: "Всички документи"},
  {value: "governing_documents", label: "Нормативни документи"},
  {value: "forms", label: "Бланки"},
  {value: "minutes", label: "Протоколи"},
  {value: "transcripts", label: "Стенограми"},
  {value: "accounting", label: "Счетоводни документи"},
  {value: "private_documents", label: "Лични/частни документи"},
  {value: "others", label: "Други"},
];

const EDITABLE_FILE_TYPES = FILE_TYPES.filter((t) => t.value !== "all");

export default function DocumentsManagement() {
  const {data: files = [], isLoading: loading} = useAllFiles();
  const deleteMutation = useDeleteFile();
  const updateMutation = useUpdateFileMetadata();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileMetadata | null>(null);
  const [editForm, setEditForm] = useState({file_name: "", file_type: "" as FileType});
  const [shareTarget, setShareTarget] = useState<FileMetadata | null>(null);
  const [selectedFileType, setSelectedFileType] = useState("all");
  const [page, setPage] = useState(1);

  const {toast} = useToast();

  const filteredFiles = useMemo(() => {
    const sorted = [...files].sort((a, b) => {
      if (!a.created_at) return 1;
      if (!b.created_at) return -1;
      const dateDiff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (dateDiff !== 0) return dateDiff;
      // Secondary sort by id for stability when created_at values are equal
      return (a.id ?? "").localeCompare(b.id ?? "");
    });
    if (selectedFileType === "all") return sorted;
    return sorted.filter((f) => f.file_type === selectedFileType);
  }, [selectedFileType, files]);

  const totalPages = Math.max(1, Math.ceil(filteredFiles.length / DEFAULT_PAGE_SIZE));
  const pagedFiles = filteredFiles.slice((page - 1) * DEFAULT_PAGE_SIZE, page * DEFAULT_PAGE_SIZE);

  const openDeleteDialog = (file: FileMetadata) => {
    setSelectedFile(file);
    setDeleteDialogOpen(true);
  };

  const openEditDialog = (file: FileMetadata) => {
    setSelectedFile(file);
    setEditForm({file_name: file.file_name ?? "", file_type: file.file_type as FileType});
    setEditDialogOpen(true);
  };

  const handleEdit = () => {
    if (!selectedFile?.id) return;
    updateMutation.mutate(
      {id: selectedFile.id, file_name: editForm.file_name, file_type: editForm.file_type},
      {
        onSuccess: () => {
          toast({title: "Успех", description: "Документът е обновен успешно"});
          setEditDialogOpen(false);
          setSelectedFile(null);
        },
        onError: (err: Error) => {
          const detail = (err as ApiError).response?.data?.detail;
          toast({title: "Грешка", description: detail || "Неуспешно обновяване на документа", variant: "destructive"});
        },
      }
    );
  };

  const handleDelete = async () => {
    if (!selectedFile?.id) return;

    deleteMutation.mutate(selectedFile.id, {
      onSuccess: () => {
        toast({title: "Успех", description: "Документът е изтрит успешно"});
        setDeleteDialogOpen(false);
        setSelectedFile(null);
      },
      onError: (err: Error) => {
        const detail = (err as ApiError).response?.data?.detail;
        toast({
          title: "Грешка",
          description: detail || "Неуспешно изтриване на документа",
          variant: "destructive",
        });
      },
    });
  };

  const getFileTypeLabel = (fileType: string): string => {
    const type = FILE_TYPES.find((t) => t.value === fileType);
    return type?.label || fileType;
  };

  return (
    <AdminLayout title="Управление на документи">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Списък с документи</h3>
          <Select
            value={selectedFileType}
            onValueChange={(v) => {
              setSelectedFileType(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[320px]">
              <SelectValue placeholder="Изберете тип документ" />
            </SelectTrigger>
            <SelectContent sideOffset={5}>
              {FILE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            ({filteredFiles.length} {filteredFiles.length === 1 ? "документ" : "документа"})
          </span>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : filteredFiles.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Няма налични документи{selectedFileType !== "all" ? " от този тип" : ""}
          </p>
        ) : (
          <div className={TABLE_STYLES.scrollWrapper}>
            <Table className={TABLE_STYLES.tableLarge}>
              <TableHeader>
                <TableRow>
                  <TableHead className={`${TABLE_STYLES.headBase} ${COLUMN_WIDTHS.rowNumber}`}>№</TableHead>
                  <TableHead className={`${TABLE_STYLES.headBase} w-[320px]`}>Файл</TableHead>
                  <TableHead className={`${TABLE_STYLES.headBase} w-[120px]`}>Тип</TableHead>
                  <TableHead className={`${TABLE_STYLES.headCenter} w-[210px]`}>Качен от</TableHead>
                  <TableHead className={`${TABLE_STYLES.headBase} w-[120px]`}>Дата</TableHead>
                  <TableHead className={`${TABLE_STYLES.headCenter} w-[90px]`}>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedFiles.map((file, index) => (
                  <TableRow key={file.id}>
                    <TableCell className={TABLE_STYLES.rowNumberCell}>
                      {(page - 1) * DEFAULT_PAGE_SIZE + index + 1}
                    </TableCell>
                    <TableCell className={`${TABLE_STYLES.cellBase} font-medium w-[320px] min-w-[200px]`}>
                      <span className="block truncate pr-4">{file.file_name}</span>
                    </TableCell>
                    <TableCell className={TABLE_STYLES.cellBase}>
                      <span className="text-sm text-muted-foreground">{getFileTypeLabel(file.file_type)}</span>
                    </TableCell>
                    <TableCell className={TABLE_STYLES.cellCenter}>
                      {file.uploaded_by_name || file.uploaded_by || "-"}
                    </TableCell>
                    <TableCell className={TABLE_STYLES.cellBase}>
                      {file.created_at
                        ? new Date(file.created_at).toLocaleDateString("bg-BG", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })
                        : "-"}
                    </TableCell>
                    <TableCell className={TABLE_STYLES.cellCenter}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          title="Редактирай"
                          onClick={() => openEditDialog(file)}
                          className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          title="Сподели"
                          onClick={() => setShareTarget(file)}
                          className="p-1.5 rounded-md text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                        >
                          <Forward className="h-4 w-4" />
                        </button>
                        <button
                          title="Изтрий"
                          onClick={() => openDeleteDialog(file)}
                          className="p-1.5 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Редактирай документ</DialogTitle>
              <DialogDescription>Променете името или типа на документа</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Име на файл</label>
                <Input
                  value={editForm.file_name}
                  onChange={(e) => setEditForm({...editForm, file_name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Тип на документ</label>
                <Select
                  value={editForm.file_type}
                  onValueChange={(v) => setEditForm({...editForm, file_type: v as FileType})}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EDITABLE_FILE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleEdit} className="w-full" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Запазване..." : "Запази"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Изтриване на документ"
          description={`Сигурни ли сте, че искате да изтриете "${selectedFile?.file_name}"? Файлът ще бъде изтрит от S3 и базата данни. Това действие не може да бъде отменено.`}
          onConfirm={handleDelete}
          confirmText="Изтрий"
          variant="destructive"
        />

        {/* Share Dialog */}
        <ShareFileDialog
          open={!!shareTarget}
          onOpenChange={(val: boolean) => !val && setShareTarget(null)}
          file={shareTarget}
        />
      </div>
    </AdminLayout>
  );
}
