import {useState, useRef, useMemo, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {useAuth} from "@/context/AuthContext";
import {useCreateInquiry, INQUIRY_TYPES} from "@/hooks/useInquiries";
import {useUsersList} from "@/hooks/useUsers";
import {useToast} from "@/components/ui/use-toast";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Label} from "@/components/ui/label";
import {Checkbox} from "@/components/ui/checkbox";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";

const MAX_TOTAL_BYTES = 5 * 1024 * 1024;

export default function CreateInquiry() {
  const {isLoggedIn} = useAuth();
  const navigate = useNavigate();
  const {toast} = useToast();
  const {mutateAsync: createInquiry, isPending} = useCreateInquiry();
  const {data: users = []} = useUsersList();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [inquiryType, setInquiryType] = useState("");
  const [scopeBoard, setScopeBoard] = useState(false);
  const [scopeControl, setScopeControl] = useState(false);
  const [coAuthors, setCoAuthors] = useState<string[]>([]);
  const [coAuthorSearch, setCoAuthorSearch] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoggedIn) navigate("/login");
  }, [isLoggedIn, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    addFiles(selected);
  };

  const addFiles = (selected: File[]) => {
    const merged = [...files, ...selected];
    const total = merged.reduce((sum, f) => sum + f.size, 0);
    if (total > MAX_TOTAL_BYTES) {
      setFileError(`Общият размер надвишава 5 MB (${(total / 1024 / 1024).toFixed(1)} MB)`);
    } else {
      setFileError(null);
      setFiles(merged);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) addFiles(Array.from(e.dataTransfer.files));
  };

  const toggleCoAuthor = (userId: string) => {
    setCoAuthors((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  };

  const filteredCoAuthorUsers = useMemo(() => {
    const q = coAuthorSearch.toLowerCase();
    return users.filter((u) => `${u.first_name ?? ""} ${u.last_name ?? ""} ${u.email}`.toLowerCase().includes(q));
  }, [users, coAuthorSearch]);

  if (!isLoggedIn) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !inquiryType) return;
    if (fileError) return;

    const scope = ["admin"];
    if (scopeBoard) scope.push("board");
    if (scopeControl) scope.push("control");

    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("description", description.trim());
    fd.append("inquiry_type", inquiryType);
    fd.append("scope", JSON.stringify(scope));
    fd.append("co_authors", JSON.stringify(coAuthors));
    files.forEach((f) => fd.append("files", f));

    try {
      await createInquiry(fd);
      toast({title: "Запитването е изпратено успешно"});
      navigate("/inquiries/mine");
    } catch (err) {
      const apiErr = err as {response?: {data?: {detail?: string}}};
      toast({
        title: "Грешка",
        description: apiErr?.response?.data?.detail ?? "Възникна грешка при създаване на запитването.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-svh w-full items-start justify-center p-4">
      <div className="w-full max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Ново запитване</CardTitle>
            <CardDescription>Попълнете информацията и изпратете запитването.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* Title */}
              <div className="space-y-1">
                <Label htmlFor="title">Заглавие *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Въведете заглавие"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label htmlFor="description">Описание *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Опишете запитването..."
                  rows={5}
                  required
                  className="bg-background"
                />
              </div>

              {/* Type */}
              <div className="space-y-1">
                <Label>Вид *</Label>
                <Select value={inquiryType} onValueChange={setInquiryType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Изберете вид" />
                  </SelectTrigger>
                  <SelectContent>
                    {INQUIRY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Scope */}
              <div className="space-y-2">
                <Label>Адресирано до (освен Администрацията)</Label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={scopeBoard} onCheckedChange={(v) => setScopeBoard(!!v)} id="scope-board" />
                    <span>Управителен съвет</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={scopeControl} onCheckedChange={(v) => setScopeControl(!!v)} id="scope-control" />
                    <span>Контролен съвет</span>
                  </label>
                </div>
              </div>

              {/* Co-authors */}
              {users.length > 0 && (
                <div className="space-y-2">
                  <Label>Съавтори / Следящи</Label>
                  <Input
                    placeholder="Търси по име или имейл..."
                    value={coAuthorSearch}
                    onChange={(e) => setCoAuthorSearch(e.target.value)}
                  />
                  <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
                    {filteredCoAuthorUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground px-1 py-0.5">Няма намерени потребители.</p>
                    ) : (
                      filteredCoAuthorUsers.map((u) => (
                        <label
                          key={u.id}
                          className="flex items-center gap-2 cursor-pointer px-1 py-0.5 hover:bg-accent rounded"
                        >
                          <Checkbox
                            checked={coAuthors.includes(u.id!)}
                            onCheckedChange={() => toggleCoAuthor(u.id!)}
                            id={`co-${u.id}`}
                          />
                          <span className="text-sm">
                            {u.first_name} {u.last_name}
                          </span>
                          <span className="text-xs text-muted-foreground">({u.email})</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Files */}
              <div className="grid gap-3">
                <Label htmlFor="inquiry-file">Прикачени файлове (макс. 5 MB общо)</Label>
                <input
                  ref={fileInputRef}
                  id="inquiry-file"
                  type="file"
                  multiple
                  className="sr-only"
                  onChange={handleFileChange}
                  disabled={isPending}
                />
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                    isDragging
                      ? "border-primary bg-primary/5 scale-[1.02]"
                      : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50"
                  } ${isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !isPending && fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="w-12 h-12 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    {files.length > 0 ? (
                      <div className="space-y-1 w-full">
                        {files.map((f, i) => (
                          <div key={i} className="flex items-center justify-between px-2 py-0.5">
                            <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                            <button
                              type="button"
                              className="ml-2 text-xs text-destructive hover:underline shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFiles((prev) => prev.filter((_, idx) => idx !== i));
                                setFileError(null);
                              }}
                            >
                              Премахни
                            </button>
                          </div>
                        ))}
                        <p className="text-xs text-primary pt-1">Кликни или пусни файлове за добавяне</p>
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-foreground">
                        {isDragging ? "Пусни файловете тук" : "Кликни или пусни файлове"}
                      </p>
                    )}
                  </div>
                </div>
                {fileError && <p className="text-sm text-destructive">{fileError}</p>}
              </div>

              <Button
                type="submit"
                disabled={isPending || !title.trim() || !description.trim() || !inquiryType || !!fileError}
                className="w-full"
              >
                {isPending ? "Изпращане..." : "Изпрати запитването"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
