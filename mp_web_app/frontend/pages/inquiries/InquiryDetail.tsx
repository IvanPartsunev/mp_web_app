import {useState} from "react";
import {useParams, useNavigate} from "react-router-dom";
import {
  useInquiry,
  useAssignEntryNumber,
  useCloseInquiry,
  useDeleteInquiry,
  useUpdateInquiry,
  useAddInquiryFiles,
  STATUS_BG,
  INQUIRY_TYPES,
} from "@/hooks/useInquiries";
import {useUsersList} from "@/hooks/useUsers";
import {useAuth} from "@/context/AuthContext";
import {getAccessToken} from "@/context/tokenStore";
import {getUserRole} from "@/context/jwt";
import {useToast} from "@/components/ui/use-toast";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Label} from "@/components/ui/label";
import {Badge} from "@/components/ui/badge";
import {Checkbox} from "@/components/ui/checkbox";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
import apiClient from "@/context/apiClient";
import {Trash2, Pencil} from "lucide-react";

const SCOPE_BG: Record<string, string> = {
  admin: "Администрация",
  board: "Управителен съвет",
  control: "Контролен съвет",
};

const STATUS_CLASS: Record<string, string> = {
  sent: "border border-gray-400 text-gray-500 bg-transparent",
  accepted: "border border-blue-500 text-blue-600 bg-transparent",
  in_progress: "border border-amber-600 text-amber-700 bg-transparent",
  closed: "border border-gray-600 text-gray-700 bg-transparent",
  finished: "border border-green-600 text-green-700 bg-transparent",
  failed: "border border-red-500 text-red-600 bg-transparent",
};

const FINAL_STATUSES = [
  {value: "closed", label: "Затворено"},
  {value: "finished", label: "Приключено"},
  {value: "failed", label: "Неуспешно"},
];

export default function InquiryDetail() {
  const {id} = useParams<{id: string}>();
  const navigate = useNavigate();
  const {isLoggedIn, user} = useAuth();
  const {toast} = useToast();

  const {data: inquiry, isLoading, error} = useInquiry(id ?? "");
  const {data: allUsers = []} = useUsersList();
  const {mutateAsync: assignNumber, isPending: assigningNumber} = useAssignEntryNumber();
  const {mutateAsync: closeInquiry, isPending: closing} = useCloseInquiry();
  const {mutateAsync: deleteInquiry, isPending: deleting} = useDeleteInquiry();
  const {mutateAsync: updateInquiry, isPending: updating} = useUpdateInquiry();
  const {mutateAsync: addFiles, isPending: addingFiles} = useAddInquiryFiles();

  // Role info
  const role = getUserRole(getAccessToken());
  const userId = user?.id ?? "";
  const isAdmin = role === "admin";

  // Close dialog state
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [finalStatus, setFinalStatus] = useState("closed");
  const [closeReason, setCloseReason] = useState("");
  const [closePdf, setClosePdf] = useState<File | null>(null);

  // Delete confirm state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Assign entry number state
  const [entryInput, setEntryInput] = useState("");

  // Edit form state
  const [showEditForm, setShowEditForm] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editType, setEditType] = useState("");
  const [editScopeBoard, setEditScopeBoard] = useState(false);
  const [editScopeControl, setEditScopeControl] = useState(false);
  const [editCoAuthors, setEditCoAuthors] = useState<string[]>([]);

  // Add files state
  const [showAddFiles, setShowAddFiles] = useState(false);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newFilesError, setNewFilesError] = useState<string | null>(null);

  if (!isLoggedIn) {
    navigate("/login");
    return null;
  }

  if (isLoading)
    return (
      <div className="flex min-h-svh w-full items-start justify-center p-4">
        <div className="w-full max-w-3xl text-muted-foreground pt-10">Зареждане...</div>
      </div>
    );
  if (error || !inquiry)
    return (
      <div className="flex min-h-svh w-full items-start justify-center p-4">
        <div className="w-full max-w-3xl text-destructive pt-10">Запитването не е намерено.</div>
      </div>
    );

  const isAuthor = inquiry.author_id === userId;
  const isCoAuthor = inquiry.co_authors.includes(userId);
  const isScopeUser = role ? inquiry.scope.includes(role) : false;
  const canClose = isAdmin || isAuthor || isCoAuthor || isScopeUser;
  const canDelete = isAdmin || isAuthor;
  const isSent = inquiry.status === "sent";
  const isInProgress = inquiry.status === "in_progress";
  const isFinalStatus = ["closed", "finished", "failed"].includes(inquiry.status);
  const isPastSent = !isSent;
  const canAddFiles = (isAuthor || isCoAuthor || isScopeUser || isAdmin) && (isSent || isInProgress);

  const openEditForm = () => {
    setEditTitle(inquiry.title);
    setEditDescription(inquiry.description);
    setEditType(inquiry.inquiry_type);
    setEditScopeBoard(inquiry.scope.includes("board"));
    setEditScopeControl(inquiry.scope.includes("control"));
    setEditCoAuthors([...inquiry.co_authors]);
    setShowEditForm(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const scope = ["admin"];
    if (editScopeBoard) scope.push("board");
    if (editScopeControl) scope.push("control");

    const fd = new FormData();
    if (editTitle !== inquiry.title) fd.append("title", editTitle);
    if (editDescription !== inquiry.description) fd.append("description", editDescription);
    if (editType !== inquiry.inquiry_type) fd.append("inquiry_type", editType);
    fd.append("scope", JSON.stringify(scope));
    fd.append("co_authors", JSON.stringify(editCoAuthors));

    try {
      await updateInquiry({id: inquiry.id, formData: fd});
      toast({title: "Запитването е обновено"});
      setShowEditForm(false);
    } catch (err: any) {
      toast({
        title: "Грешка",
        description: err?.response?.data?.detail ?? "Грешка при обновяване.",
        variant: "destructive",
      });
    }
  };

  const handleAddFiles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFiles.length || newFilesError) return;
    const fd = new FormData();
    newFiles.forEach((f) => fd.append("files", f));
    try {
      await addFiles({id: inquiry.id, formData: fd});
      toast({title: "Файловете са добавени"});
      setShowAddFiles(false);
      setNewFiles([]);
    } catch (err: any) {
      toast({
        title: "Грешка",
        description: err?.response?.data?.detail ?? "Грешка при качване.",
        variant: "destructive",
      });
    }
  };

  const handleAssignNumber = async () => {
    if (!entryInput.trim()) return;
    try {
      await assignNumber({id: inquiry.id, entry_number: entryInput.trim()});
      toast({title: `Входящ номер ${entryInput} присвоен`});
      setEntryInput("");
    } catch (err: any) {
      toast({
        title: "Грешка",
        description: err?.response?.data?.detail ?? "Грешка при присвояване.",
        variant: "destructive",
      });
    }
  };

  const handleClose = async () => {
    if (!closeReason.trim()) return;
    const fd = new FormData();
    fd.append("final_status", finalStatus);
    fd.append("reason", closeReason.trim());
    if (closePdf) fd.append("pdf_file", closePdf);
    try {
      await closeInquiry({id: inquiry.id, formData: fd});
      toast({title: "Запитването е затворено"});
      setShowCloseDialog(false);
    } catch (err: any) {
      toast({
        title: "Грешка",
        description: err?.response?.data?.detail ?? "Грешка при затваряне.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteInquiry(inquiry.id);
      toast({title: "Запитването е изтрито"});
      navigate("/inquiries/mine");
    } catch (err: any) {
      toast({
        title: "Грешка",
        description: err?.response?.data?.detail ?? "Грешка при изтриване.",
        variant: "destructive",
      });
    }
  };

  const handlePdfExport = async () => {
    try {
      const res = await apiClient.get(`inquiries/${inquiry.id}/pdf`, {responseType: "blob"});
      const url = URL.createObjectURL(new Blob([res.data], {type: "application/pdf"}));
      const a = document.createElement("a");
      a.href = url;
      a.download = `inquiry-${inquiry.entry_number ?? inquiry.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({title: "Грешка", description: "Неуспешно изтегляне на PDF.", variant: "destructive"});
    }
  };

  const toggleEditCoAuthor = (uid: string) => {
    setEditCoAuthors((prev) => (prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]));
  };

  return (
    <div className="flex min-h-svh w-full items-start justify-center p-4">
      <div className="w-full max-w-3xl">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 flex-wrap pb-4">
            <div>
              <CardTitle className="text-2xl">{inquiry.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1 uppercase">{inquiry.inquiry_type}</p>
            </div>
            <Badge
              className={`text-sm px-3 py-1 rounded-sm ${STATUS_CLASS[inquiry.status] ?? "border border-gray-400 text-gray-500 bg-transparent"}`}
            >
              {STATUS_BG[inquiry.status] ?? inquiry.status}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-6">
            <hr className="border-border" />

            {/* Meta */}
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Входящ номер</dt>
                <dd className="font-mono font-medium">{inquiry.entry_number ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Дата</dt>
                <dd>{inquiry.created_at?.slice(0, 10)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Подател</dt>
                <dd>{inquiry.author_name ?? inquiry.author_id}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Съавтори</dt>
                <dd>{inquiry.co_author_names.length ? inquiry.co_author_names.join(", ") : "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Адресирано до</dt>
                <dd>{inquiry.scope.map((s) => SCOPE_BG[s] ?? s).join(", ")}</dd>
              </div>
            </dl>

            <hr className="border-border" />

            {/* Description */}
            <div>
              <h2 className="text-base font-semibold mb-2">Описание</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{inquiry.description}</p>
            </div>

            {/* Files */}
            {inquiry.file_s3_keys.length > 0 && (
              <div>
                <h2 className="text-base font-semibold mb-2">Прикачени файлове</h2>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  {inquiry.file_s3_keys.map((k) => {
                    const segment = k.split("/").pop() ?? k;
                    // Strip the UUID prefix (everything before and including the first "_")
                    const displayName = segment.includes("_") ? segment.split("_").slice(1).join("_") : segment;
                    const fileKey = segment;
                    return (
                      <li key={k}>
                        <button
                          className="text-primary underline underline-offset-2 hover:text-primary/80 text-left"
                          onClick={async () => {
                            try {
                              const res = await apiClient.get(`inquiries/${inquiry.id}/files/${fileKey}`, {
                                responseType: "blob",
                              });
                              const url = URL.createObjectURL(new Blob([res.data]));
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = displayName;
                              a.click();
                              URL.revokeObjectURL(url);
                            } catch (err: any) {
                              const detail =
                                err?.response?.data?.detail ?? err?.message ?? "Неуспешно изтегляне на файла.";
                              toast({
                                title: "Грешка при изтегляне",
                                description: String(detail),
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          {displayName}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Closing record */}
            {inquiry.closing_record && (
              <div className="rounded-md border p-4 space-y-2 bg-muted/30">
                <h2 className="text-base font-semibold">Запис за затваряне</h2>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Затворено от</dt>
                    <dd>{inquiry.closing_record.closed_by_name}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Дата</dt>
                    <dd>{inquiry.closing_record.closed_at?.slice(0, 10)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Финален статус</dt>
                    <dd>{STATUS_BG[inquiry.closing_record.final_status] ?? inquiry.closing_record.final_status}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Причина</dt>
                    <dd className="whitespace-pre-wrap">{inquiry.closing_record.reason}</dd>
                  </div>
                  {inquiry.closing_record.pdf_s3_key &&
                    (() => {
                      const segment = inquiry.closing_record.pdf_s3_key.split("/").pop() ?? "";
                      const displayName = segment.includes("_") ? segment.split("_").slice(1).join("_") : segment;
                      const fileKey = segment;
                      return (
                        <div className="col-span-2">
                          <dt className="text-muted-foreground mb-1">Прикачен файл</dt>
                          <dd>
                            <button
                              className="text-primary underline underline-offset-2 hover:text-primary/80 text-left text-sm"
                              onClick={async () => {
                                try {
                                  const res = await apiClient.get(`inquiries/${inquiry.id}/files/${fileKey}`, {
                                    responseType: "blob",
                                  });
                                  const url = URL.createObjectURL(new Blob([res.data]));
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = displayName;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                } catch (err: any) {
                                  const detail =
                                    err?.response?.data?.detail ?? err?.message ?? "Неуспешно изтегляне на файла.";
                                  toast({
                                    title: "Грешка при изтегляне",
                                    description: String(detail),
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              {displayName}
                            </button>
                          </dd>
                        </div>
                      );
                    })()}
                </dl>
              </div>
            )}

            <hr className="border-border" />

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
              {canAddFiles && (
                <Button variant="outline" onClick={() => setShowAddFiles(true)}>
                  Добави файлове
                </Button>
              )}
              {canClose && !isFinalStatus && (
                <Button variant="outline" onClick={() => setShowCloseDialog(true)}>
                  Затвори
                </Button>
              )}
              {isAdmin && isSent && (
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="Вх. номер"
                    value={entryInput}
                    onChange={(e) => setEntryInput(e.target.value)}
                    className="w-32"
                  />
                  <Button
                    variant="outline-blue"
                    onClick={handleAssignNumber}
                    disabled={!entryInput.trim() || assigningNumber}
                  >
                    Регистрирай
                  </Button>
                </div>
              )}
              {isPastSent && canClose && (
                <Button variant="outline" onClick={handlePdfExport}>
                  Изтегли PDF
                </Button>
              )}
              {isAdmin && isInProgress && inquiry.entry_number && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const params = new URLSearchParams({
                      label: inquiry.entry_number!,
                      allowed_to: [inquiry.author_id, ...inquiry.co_authors].join(","),
                    });
                    navigate(`/upload?${params.toString()}`);
                  }}
                >
                  Изпрати файл
                </Button>
              )}
              {/* Icon buttons grouped together */}
              {(isAuthor && isSent) || canDelete ? (
                <div className="flex items-center gap-1">
                  {isAuthor && isSent && (
                    <button
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      onClick={openEditForm}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      className="p-1.5 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit form dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Редактирай запитване</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>Заглавие</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Описание</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Вид</Label>
              <Select value={editType} onValueChange={setEditType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INQUIRY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Адресирано до</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={editScopeBoard} onCheckedChange={(v) => setEditScopeBoard(!!v)} />
                  <span>УС</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={editScopeControl} onCheckedChange={(v) => setEditScopeControl(!!v)} />
                  <span>КС</span>
                </label>
              </div>
            </div>
            {allUsers.length > 0 && (
              <div className="space-y-1">
                <Label>Съавтори</Label>
                <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                  {allUsers.map((u) => (
                    <label
                      key={u.id}
                      className="flex items-center gap-2 cursor-pointer px-1 py-0.5 hover:bg-accent rounded"
                    >
                      <Checkbox
                        checked={editCoAuthors.includes(u.id!)}
                        onCheckedChange={() => toggleEditCoAuthor(u.id!)}
                      />
                      <span className="text-sm">
                        {u.first_name} {u.last_name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditForm(false)}>
                Отказ
              </Button>
              <Button variant="outline-primary" type="submit" disabled={updating}>
                Запази
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add files dialog */}
      <Dialog open={showAddFiles} onOpenChange={setShowAddFiles}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добави файлове</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddFiles} className="space-y-4 mt-2">
            <Input
              type="file"
              multiple
              onChange={(e) => {
                const selected = Array.from(e.target.files ?? []);
                const total = selected.reduce((s, f) => s + f.size, 0);
                if (total > 5 * 1024 * 1024) {
                  setNewFilesError(`Надвишава 5 MB (${(total / 1024 / 1024).toFixed(1)} MB)`);
                  setNewFiles([]);
                } else {
                  setNewFilesError(null);
                  setNewFiles(selected);
                }
              }}
            />
            {newFilesError && <p className="text-sm text-destructive">{newFilesError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddFiles(false)}>
                Отказ
              </Button>
              <Button
                variant="outline-primary"
                type="submit"
                disabled={!newFiles.length || !!newFilesError || addingFiles}
              >
                Качи
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Close dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Затвори запитване</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>Финален статус *</Label>
              <Select value={finalStatus} onValueChange={setFinalStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FINAL_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Причина *</Label>
              <Textarea
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                placeholder="Задължително поле..."
                rows={3}
              />
            </div>
            <div className="space-y-1">
              <Label>Прикачен PDF (по желание)</Label>
              <Input type="file" accept=".pdf" onChange={(e) => setClosePdf(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>
              Отказ
            </Button>
            <Button onClick={handleClose} disabled={!closeReason.trim() || closing}>
              Затвори
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изтрий запитване</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Сигурни ли сте? Това действие е необратимо и ще изтрие и всички прикачени файлове.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Отказ
            </Button>
            <Button variant="outline-red" onClick={handleDelete} disabled={deleting}>
              Изтрий
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
