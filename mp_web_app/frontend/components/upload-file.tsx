import React, {useEffect, useMemo, useState} from "react";
import {API_BASE_URL} from "@/app-config";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {useNavigate} from "react-router-dom";

export default function UploadFile() {
  const navigate = useNavigate();

  // FileType options must match backend enum values
  // Adjust labels if you have localized names in the UI
  const fileTypeOptions = useMemo(
    () => [
      {value: "minutes", label: "Протоколи"},
      {value: "transcripts", label: "Стенограми"},
      {value: "accounting", label: "Счетоводни документи"},
      {value: "private_documents", label: "Лични/частни документи"},
      {value: "others", label: "Други"},
    ],
    []
  );

  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState(fileTypeOptions[0]?.value ?? "");
  const [allowedTo, setAllowedTo] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Frontend guard: only allow admins to access this page
  useEffect(() => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/login");
        return;
      }
      const payload = JSON.parse(atob(token.split(".")[1] || ""));
      if (payload?.role !== "admin") {
        navigate("/"); // or a 403 page if you have one
      }
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!file || !fileName || !fileType) {
      setError("Моля, попълнете всички задължителни полета и изберете файл.");
      return;
    }

    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append("file_name", fileName);
      fd.append("file_type", fileType);
      // allowed_to is sent as multiple form fields
      allowedTo
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((email) => fd.append("allowed_to", email));
      fd.append("file", file);

      const token = localStorage.getItem("access_token");

      const res = await fetch(`${API_BASE_URL}files/upload`, {
        method: "POST",
        headers: {
          ...(token ? {Authorization: `Bearer ${token}`} : {}),
        },
        body: fd,
        credentials: "include",
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Грешка при качване: ${res.status}`);
      }

      setSuccess("Файлът беше качен успешно.");
      setFile(null);
      setFileName("");
      setFileType(fileTypeOptions[0]?.value ?? "");
      setAllowedTo("");
    } catch (err: any) {
      setError(err?.message || "Неуспех при качване.");
    } finally {
      setSubmitting(false);
    }
  };

  const isPrivate = fileType === "private_documents";

  return (
    <div className="flex min-h-svh w-full items-start justify-center">
      <div className="w-full max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Качи документ</CardTitle>
            <CardDescription>
              Попълнете информацията за документа и изберете файл за качване.
              Полетата за тип и достъп трябва да съответстват на правилата във вашата система.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="flex flex-col gap-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md text-center">
                  {success}
                </div>
              )}

              <div className="grid gap-3">
                <Label htmlFor="file_name">Име на файл</Label>
                <Input
                  id="file_name"
                  placeholder="Пример: Годишен отчет 2025"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="file_type">Тип на документ</Label>
                <select
                  id="file_type"
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={submitting}
                  required
                >
                  {fileTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Използвайте валидна стойност според FileType в бекенда.
                </p>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="allowed_to">
                  Позволен достъп {isPrivate ? "(задължително за частни документи)" : "(по избор)"}
                </Label>
                <Input
                  id="allowed_to"
                  placeholder="email1@example.com, email2@example.com"
                  value={allowedTo}
                  onChange={(e) => setAllowedTo(e.target.value)}
                  disabled={submitting}
                  required={isPrivate}
                />
                <p className="text-xs text-muted-foreground">
                  Списък с имейли, разделени със запетая. При частни документи достъпът е задължително ограничен.
                </p>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="file">Файл</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Качване..." : "Качи"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}