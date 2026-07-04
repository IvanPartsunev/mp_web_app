import {useState, useRef} from "react";
import {useNavigate} from "react-router-dom";
import {useAuth} from "@/context/AuthContext";
import {useCreateInquiry, INQUIRY_TYPES} from "@/hooks/useInquiries";
import {useUsersList} from "@/hooks/useUsers";
import {useToast} from "@/hooks/use-toast";
import {Button} from "@/components/ui/button";
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
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isLoggedIn) {
    navigate("/login");
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const total = selected.reduce((sum, f) => sum + f.size, 0);
    if (total > MAX_TOTAL_BYTES) {
      setFileError(`Общият размер надвишава 5 MB (${(total / 1024 / 1024).toFixed(1)} MB)`);
      setFiles([]);
    } else {
      setFileError(null);
      setFiles(selected);
    }
  };

  const toggleCoAuthor = (userId: string) => {
    setCoAuthors((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  };

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
    } catch (err: any) {
      toast({
        title: "Грешка",
        description: err?.response?.data?.detail ?? "Възникна грешка при създаване на запитването.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Ново запитване</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
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
            <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
              {users.map((u) => (
                <label key={u.id} className="flex items-center gap-2 cursor-pointer px-1 py-0.5 hover:bg-accent rounded">
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
              ))}
            </div>
          </div>
        )}

        {/* Files */}
        <div className="space-y-1">
          <Label>Прикачени файлове (макс. 5 MB общо)</Label>
          <Input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="cursor-pointer"
          />
          {fileError && <p className="text-sm text-destructive">{fileError}</p>}
          {files.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {files.length} файл(а), {(files.reduce((s, f) => s + f.size, 0) / 1024).toFixed(0)} KB
            </p>
          )}
        </div>

        <Button type="submit" disabled={isPending || !title.trim() || !description.trim() || !inquiryType || !!fileError} className="w-full">
          {isPending ? "Изпращане..." : "Изпрати запитването"}
        </Button>
      </form>
    </div>
  );
}
