import {useState} from "react";
import {AdminLayout} from "@/components/admin-layout";
import {Button} from "@/components/ui/button";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Checkbox} from "@/components/ui/checkbox";
import {ConfirmDialog} from "@/components/confirm-dialog";
import {useToast} from "@/components/ui/use-toast";
import {useAllFiles, useDeleteFile, FileMetadata} from "@/hooks/useFiles";

export default function FileManagement() {
  const {data: files = [], isLoading: loading} = useAllFiles();
  const deleteMutation = useDeleteFile();

  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const {toast} = useToast();

  const toggleFileSelection = (fileId: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
  };

  const handleDelete = async () => {
    const filesToDelete = files.filter((f) => f.id && selectedFiles.has(f.id));
    let deletedCount = 0;

    for (const file of filesToDelete) {
      if (!file.id) continue;
      try {
        await deleteMutation.mutateAsync(file.id);
        deletedCount++;
      } catch (err: any) {
        toast({
          title: "Грешка",
          description: err.message || "Неуспешно изтриване на файл",
          variant: "destructive",
        });
      }
    }

    if (deletedCount > 0) {
      toast({title: "Успех", description: `${deletedCount} файла са изтрити успешно`});
    }
    setDeleteDialogOpen(false);
    setSelectedFiles(new Set());
  };

  const groupedFiles = files.reduce(
    (acc, file) => {
      if (!acc[file.file_type]) {
        acc[file.file_type] = [];
      }
      acc[file.file_type].push(file);
      return acc;
    },
    {} as Record<string, FileMetadata[]>
  );

  return (
    <AdminLayout title="Управление на файлове">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Списък с файлове ({files.length} общо)</h3>
          {selectedFiles.size > 0 && (
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              Изтрий избраните ({selectedFiles.size})
            </Button>
          )}
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Зареждане...</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedFiles).map(([fileType, typeFiles]) => (
              <div key={fileType}>
                <h4 className="text-md font-semibold mb-2 capitalize">
                  {fileType.replace(/_/g, " ")} ({typeFiles.length})
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={typeFiles.every((f) => f.id && selectedFiles.has(f.id))}
                          onCheckedChange={(checked) => {
                            const newSelection = new Set(selectedFiles);
                            typeFiles.forEach((f) => {
                              if (!f.id) return;
                              if (checked) {
                                newSelection.add(f.id);
                              } else {
                                newSelection.delete(f.id);
                              }
                            });
                            setSelectedFiles(newSelection);
                          }}
                        />
                      </TableHead>
                      <TableHead>Име на файл</TableHead>
                      <TableHead>Качен от</TableHead>
                      <TableHead>Дата</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {typeFiles.map((file) => (
                      <TableRow key={file.id ?? file.file_name}>
                        <TableCell>
                          <Checkbox
                            checked={file.id ? selectedFiles.has(file.id) : false}
                            onCheckedChange={() => file.id && toggleFileSelection(file.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{file.file_name}</TableCell>
                        <TableCell>{file.uploaded_by || "-"}</TableCell>
                        <TableCell>
                          {file.created_at ? new Date(file.created_at).toLocaleDateString("bg-BG") : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Изтриване на файлове"
          description={`Сигурни ли сте, че искате да изтриете ${selectedFiles.size} файла? Това действие не може да бъде отменено.`}
          onConfirm={handleDelete}
          confirmText="Изтрий"
          variant="destructive"
        />
      </div>
    </AdminLayout>
  );
}
