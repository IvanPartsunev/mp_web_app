import {useState, useMemo} from "react";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Badge} from "@/components/ui/badge";
import {useToast} from "@/components/ui/use-toast";
import {useUsersList} from "@/hooks/useUsers";
import {useShareFile, type FileMetadata} from "@/hooks/useFiles";
import type {ApiError} from "@/lib/errorUtils";

interface ShareFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileMetadata | null;
}

export function ShareFileDialog({open, onOpenChange, file}: ShareFileDialogProps) {
  const {data: users = [], isLoading: loadingUsers} = useUsersList();
  const shareMutation = useShareFile();
  const {toast} = useToast();

  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const currentAllowedTo = useMemo(() => new Set(file?.allowed_to ?? []), [file]);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      const name = `${u.first_name ?? ""} ${u.last_name ?? ""} ${u.email}`.toLowerCase();
      return name.includes(q);
    });
  }, [users, search]);

  const toggleUser = (id: string) => {
    if (currentAllowedTo.has(id)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    if (!file?.id) return;
    const newIds = [...selectedIds].filter((id) => !currentAllowedTo.has(id));
    if (newIds.length === 0) {
      toast({title: "Информация", description: "Потребителите вече имат достъп до този файл."});
      return;
    }
    shareMutation.mutate(
      {fileId: file.id, userIds: newIds},
      {
        onSuccess: () => {
          toast({title: "Успех", description: "Файлът беше споделен успешно."});
          setSelectedIds(new Set());
          setSearch("");
          onOpenChange(false);
        },
        onError: (err) => {
          const detail = (err as ApiError).response?.data?.detail;
          toast({
            title: "Грешка",
            description: detail || "Неуспешно споделяне на файл.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setSelectedIds(new Set());
      setSearch("");
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Сподели файл</DialogTitle>
          {file?.file_name && <p className="text-sm text-muted-foreground truncate">{file.file_name}</p>}
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <div className="grid gap-3">
            <Label htmlFor="user_search">Търси потребител</Label>
            <Input
              id="user_search"
              placeholder="Въведи име или имейл..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="users_select">
              Избери потребители
              {selectedIds.size > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({selectedIds.size} избран{selectedIds.size === 1 ? "" : "и"})
                </span>
              )}
            </Label>
            <div
              id="users_select"
              className="h-40 rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 overflow-auto"
            >
              <div className="min-w-full">
                {loadingUsers ? (
                  <p className="p-3 text-sm text-muted-foreground">Зареждане на потребители...</p>
                ) : filteredUsers.length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground">Няма намерени потребители.</p>
                ) : (
                  filteredUsers.map((u) => {
                    const id = u.id ?? "";
                    const alreadyShared = currentAllowedTo.has(id);
                    const selected = selectedIds.has(id);
                    const full = `${u.first_name ?? ""} ${u.last_name ?? ""} (${u.email})`;
                    return (
                      <label
                        key={id}
                        className={`flex items-center gap-2 px-2 py-1 w-max whitespace-nowrap cursor-pointer ${alreadyShared ? "opacity-60 cursor-default" : ""}`}
                        title={full}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={alreadyShared || selected}
                          disabled={alreadyShared}
                          onChange={() => toggleUser(id)}
                        />
                        <span className="text-sm">{full}</span>
                        {alreadyShared && (
                          <Badge variant="secondary" className="text-xs ml-1">
                            Вече споделен
                          </Badge>
                        )}
                      </label>
                    );
                  })
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Използвай скрол за да видиш дълги имена.</p>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={handleConfirm} disabled={shareMutation.isPending || selectedIds.size === 0}>
              {shareMutation.isPending ? "Споделяне..." : "Сподели"}
            </Button>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Отказ
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
