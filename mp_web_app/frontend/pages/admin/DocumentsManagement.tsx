import {useEffect, useState} from "react";
import {AdminLayout} from "@/components/admin-layout";
import {Button} from "@/components/ui/button";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Checkbox} from "@/components/ui/checkbox";
import {ConfirmDialog} from "@/components/confirm-dialog";
import {useToast} from "@/components/ui/use-toast";
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
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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
    // Clear selection when filter changes
    setSelectedFiles(new Set());
  }, [selectedFileType, files]);

  const toggleFileSelection = (fileId: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map((f) => f.id)));
    }
  };

  const handleDelete = async () => {
    try {
      const filesToDelete = files.filter((f) => selectedFiles.has(f.id));

      // Delete each file (backend will delete both S3 file and DynamoDB metadata)
      for (const file of filesToDelete) {
        await apiClient.delete(`files/delete/${file.id}`);
      }

      toast({
        title: "Успех",
        description: `${filesToDelete.length} документа са изтрити успешно`,
      });
      setDeleteDialogOpen(false);
      setSelectedFiles(new Set());
      fetchFiles();
    } catch (err: any) {
      toast({
        title: "Грешка",
        description: err.response?.data?.detail || "Неуспешно изтриване на документите",
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
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            <h3 className="text-lg font-semibold">Списък с документи</h3>
            <Select value={selectedFileType} onValueChange={setSelectedFileType}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Изберете тип документ" />
              </SelectTrigger>
              <SelectContent>
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
          {selectedFiles.size > 0 && (
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              Изтрий избраните ({selectedFiles.size})
            </Button>
          )}
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Зареждане...</p>
        ) : filteredFiles.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Няма налични документи{selectedFileType !== "all" ? " от този тип" : ""}
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
                      onCheckedChange={toggleAllSelection}
                    />
                  </TableHead>
                  <TableHead>Име на файл</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Качен от</TableHead>
                  <TableHead>Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedFiles.has(file.id)}
                        onCheckedChange={() => toggleFileSelection(file.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{file.file_name}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{getFileTypeLabel(file.file_type)}</span>
                    </TableCell>
                    <TableCell>{file.uploaded_by}</TableCell>
                    <TableCell>{new Date(file.created_at).toLocaleDateString("bg-BG")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Изтриване на документи"
          description={`Сигурни ли сте, че искате да изтриете ${selectedFiles.size} ${selectedFiles.size === 1 ? "документ" : "документа"}? Файловете ще бъдат изтрити от S3 и базата данни. Това действие не може да бъде отменено.`}
          onConfirm={handleDelete}
          confirmText="Изтрий"
          variant="destructive"
        />
      </div>
    </AdminLayout>
  );
}
