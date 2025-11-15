import {useEffect, useState} from "react";
import {AdminLayout} from "@/components/admin-layout";
import {Button} from "@/components/ui/button";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {ConfirmDialog} from "@/components/confirm-dialog";
import {useToast} from "@/components/ui/use-toast";
import {LoadingSpinner} from "@/components/ui/loading-spinner";
import apiClient from "@/context/apiClient";

interface FileMetadata {
  id: string;
  file_name: string;
  file_type: string;
  uploaded_by: string;
  created_at: string;
}

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

export default function DocumentsManagement() {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileMetadata | null>(null);
  const [selectedFileType, setSelectedFileType] = useState("all");

  const {toast} = useToast();

  const fetchFiles = async () => {
    try {
      setLoading(true);
      // Fetch files from all file types
      const fileTypes = [
        "governing_documents",
        "forms",
        "minutes",
        "transcripts",
        "accounting",
        "private_documents",
        "others",
      ];

      const allFiles: FileMetadata[] = [];
      for (const type of fileTypes) {
        try {
          const response = await apiClient.get(`files/list`, {
            params: {file_type: type},
          });
          if (response.data) {
            allFiles.push(...response.data);
          }
        } catch (err) {
          console.error(`Failed to fetch ${type}:`, err);
        }
      }

      setFiles(allFiles);
      setFilteredFiles(allFiles);
    } catch (err) {
      toast({
        title: "Грешка",
        description: "Неуспешно зареждане на документите",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    // Filter files based on selected type
    if (selectedFileType === "all") {
      setFilteredFiles(files);
    } else {
      setFilteredFiles(files.filter((f) => f.file_type === selectedFileType));
    }
  }, [selectedFileType, files]);

  const openDeleteDialog = (file: FileMetadata) => {
    setSelectedFile(file);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedFile) return;

    try {
      await apiClient.delete(`files/delete/${selectedFile.id}`);

      toast({
        title: "Успех",
        description: "Документът е изтрит успешно",
      });
      setDeleteDialogOpen(false);
      setSelectedFile(null);
      fetchFiles();
    } catch (err: any) {
      toast({
        title: "Грешка",
        description: err.response?.data?.detail || "Неуспешно изтриване на документа",
        variant: "destructive",
      });
    }
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
          <Select value={selectedFileType} onValueChange={setSelectedFileType}>
            <SelectTrigger className="w-[280px]">
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Име на файл</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Качен от</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFiles.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="font-medium">{file.file_name}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{getFileTypeLabel(file.file_type)}</span>
                  </TableCell>
                  <TableCell>{file.uploaded_by}</TableCell>
                  <TableCell>{new Date(file.created_at).toLocaleDateString("bg-BG")}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openDeleteDialog(file)}
                    >
                      Изтрий
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

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
      </div>
    </AdminLayout>
  );
}
