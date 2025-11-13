// pages/UploadFile.tsx
import React, {useEffect, useMemo, useState} from "react";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {useNavigate} from "react-router-dom";
import apiClient from "@/context/apiClient";

type User = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  // other fields not used here
};

export default function UploadFile() {
  const navigate = useNavigate();

  // FileType options must match backend enum values
  const fileTypeOptions = useMemo(
    () => [
      {value: "governing_documents", label: "Нормативни документи"},
      {value: "forms", label: "Бланки"},
      {value: "minutes", label: "Протоколи"},
      {value: "transcript", label: "Стенограми"},
      {value: "accounting", label: "Счетоводни документи"},
      {value: "private_documents", label: "Лични/частни документи"},
      {value: "others", label: "Други"},
    ],
    []
  );

  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState(fileTypeOptions[0]?.value ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string>("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Frontend guard: only allow admins to access this page (keep your current logic if you prefer)
  useEffect(() => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/login");
        return;
      }
      const base64Url = token.split(".")[1];
      const base64 = base64Url
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .padEnd(Math.ceil(base64Url.length / 4) * 4, "=");
      const payload = JSON.parse(atob(base64));
      if (String(payload?.role ?? "").toUpperCase() !== "ADMIN") {
        navigate("/");
      }
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  // Fetch all users to populate dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      setUsersError("");
      try {
        const res = await apiClient.get<User[]>(`users/list`, {
          withCredentials: true,
        });
        setUsers(Array.isArray(res.data) ? res.data : []);
      } catch (e: any) {
        const msg = e?.response?.data?.detail || e?.message || "Неуспех при зареждане на потребителите.";
        setUsersError(msg);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const isPrivate = fileType === "private_documents";
    if (!file || !fileName || !fileType) {
      setError("Моля, попълнете всички задължителни полета и изберете файл.");
      return;
    }
    if (isPrivate && selectedUserIds.length === 0) {
      setError("При частни документи трябва да изберете поне един потребител.");
      return;
    }

    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append("file_name", fileName);
      fd.append("file_type", fileType);
      selectedUserIds.forEach((id) => fd.append("allowed_to", id));
      fd.append("file", file);

      await apiClient.post(`files/create`, fd, {
        // Let axios set multipart/form-data with boundary automatically
        withCredentials: true,
      });

      setSuccess("Файлът беше качен успешно.");
      setFile(null);
      setFileName("");
      setFileType(fileTypeOptions[0]?.value ?? "");
      setSelectedUserIds([]);
      setTimeout(() => {
        setSuccess("");
        navigate("/upload", {replace: true});
      }, 1200);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || "Неуспех при качване.";
      setError(msg);
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
              Попълнете информацията за документа и изберете файл за качване. Полетата за тип и достъп трябва да
              съответстват на правилата във вашата система.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="flex flex-col gap-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>
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
                <p className="text-xs text-muted-foreground">Използвайте валидна стойност според FileType в бекенда.</p>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="allowed_to_select">
                  Позволен достъп {isPrivate ? "(задължително за частни документи)" : "(по избор)"}
                </Label>

                <div
                  id="allowed_to_select"
                  className="h-40 rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 overflow-auto"
                >
                  <div className="min-w-full">
                    {users.map((u) => {
                      const full = `${u.first_name} ${u.last_name} (${u.email})`;
                      const checked = selectedUserIds.includes(u.id);
                      return (
                        <label
                          key={u.id}
                          className="flex items-center gap-2 px-2 py-1 w-max whitespace-nowrap cursor-pointer"
                          title={full}
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={checked}
                            onChange={(e) => {
                              setSelectedUserIds((prev) =>
                                e.target.checked ? [...prev, u.id] : prev.filter((id) => id !== u.id)
                              );
                            }}
                          />
                          <span className="text-sm">{full}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {loadingUsers && <p className="text-xs text-muted-foreground">Зареждане на потребители...</p>}
                {usersError && <p className="text-xs text-red-600">{usersError}</p>}
                <p className="text-xs text-muted-foreground">
                  Използвай скрол за да видиш дълги имена. При частни документи е нужно да избереш поне един.
                </p>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="file">Файл</Label>
                <input
                  id="file"
                  type="file"
                  className="sr-only"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={submitting}
                  required
                />
                <div className="flex items-center gap-3">
                  <Button asChild variant="secondary" disabled={submitting}>
                    <label htmlFor="file">Избери файл</label>
                  </Button>
                </div>
                <span
                  className="text-sm text-muted-foreground truncate"
                  title={file?.name || "Няма избран файл"}
                  style={{maxWidth: "calc(100% - 140px)"}}
                >
                  {file?.name || "Няма избран файл"}
                </span>
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
