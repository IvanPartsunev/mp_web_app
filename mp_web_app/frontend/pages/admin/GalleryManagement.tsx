import React, {useState, useRef, useMemo} from "react";
import {AdminLayout} from "@/components/admin-layout";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from "@/components/ui/dialog";
import {ConfirmDialog} from "@/components/confirm-dialog";
import {CategoryComboField} from "@/components/category-combofield";
import {useToast} from "@/components/ui/use-toast";
import {Pencil, Trash2} from "lucide-react";
import {extractApiErrorDetails} from "@/lib/errorUtils";
import type {ApiError} from "@/lib/errorUtils";
import {
  useAdminGallery,
  useCreateGalleryImage,
  useDeleteGalleryImage,
  useUpdateGalleryImage,
  GalleryImage,
} from "@/hooks/useGallery";

const FALLBACK_CATEGORY = "Други";

function groupByCategory(images: GalleryImage[]): [string, GalleryImage[]][] {
  const map: Record<string, GalleryImage[]> = {};
  for (const img of images) {
    const key = img.category?.trim() || FALLBACK_CATEGORY;
    if (!map[key]) map[key] = [];
    map[key].push(img);
  }
  const entries = Object.entries(map);
  entries.sort(([a], [b]) => {
    if (a === FALLBACK_CATEGORY) return 1;
    if (b === FALLBACK_CATEGORY) return -1;
    return a.localeCompare(b, "bg");
  });
  return entries;
}

export default function GalleryManagement() {
  const {data: images = [], isLoading: loading} = useAdminGallery();
  const createMutation = useCreateGalleryImage();
  const deleteMutation = useDeleteGalleryImage();
  const updateMutation = useUpdateGalleryImage();

  // Upload form state
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit / delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [editForm, setEditForm] = useState({image_name: "", category: ""});

  const {toast} = useToast();

  const existingCategories = useMemo(
    () => [...new Set(images.map((img) => img.category?.trim()).filter(Boolean))] as string[],
    [images]
  );

  const groups = useMemo(() => groupByCategory(images), [images]);

  // ── file validation ────────────────────────────────────────────────────────

  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  const MAX_SIZE = 15 * 1024 * 1024;

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) return "Невалиден формат. Разрешени: JPG, PNG, GIF, WEBP";
    if (file.size > MAX_SIZE) return `Файлът е твърде голям (макс. 15 MB): ${(file.size / 1024 / 1024).toFixed(2)} MB`;
    return null;
  };

  const addFiles = (incoming: File[]) => {
    for (const file of incoming) {
      const err = validateFile(file);
      if (err) {
        toast({title: "Грешка", description: err, variant: "destructive"});
        return;
      }
    }
    setFiles((prev) => [...prev, ...incoming]);
  };

  // ── drag & drop ────────────────────────────────────────────────────────────

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
    if (e.dataTransfer.files.length) addFiles(Array.from(e.dataTransfer.files));
  };

  // ── upload ─────────────────────────────────────────────────────────────────

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.length) {
      toast({title: "Грешка", description: "Моля изберете поне един файл", variant: "destructive"});
      return;
    }

    setUploading(true);
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    formData.append("category", category);

    createMutation.mutate(formData, {
      onSuccess: () => {
        toast({title: "Успех", description: "Снимките са качени успешно"});
        setFiles([]);
        setCategory("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        setUploading(false);
      },
      onError: (err: Error) => {
        const msg = extractApiErrorDetails((err as ApiError).response?.data || err);
        toast({title: "Грешка при качване", description: msg || "Неуспешно качване", variant: "destructive"});
        setUploading(false);
      },
    });
  };

  // ── edit ───────────────────────────────────────────────────────────────────

  const openEditDialog = (image: GalleryImage) => {
    setSelectedImage(image);
    setEditForm({image_name: image.image_name, category: image.category ?? ""});
    setEditDialogOpen(true);
  };

  const handleEdit = () => {
    if (!selectedImage) return;
    updateMutation.mutate(
      {id: selectedImage.id, image_name: editForm.image_name, category: editForm.category},
      {
        onSuccess: () => {
          toast({title: "Успех", description: "Снимката е обновена успешно"});
          setEditDialogOpen(false);
          setSelectedImage(null);
        },
        onError: (err: Error) => {
          const msg = extractApiErrorDetails((err as ApiError).response?.data || err);
          toast({title: "Грешка", description: msg || "Неуспешно обновяване", variant: "destructive"});
        },
      }
    );
  };

  // ── delete ─────────────────────────────────────────────────────────────────

  const openDeleteDialog = (image: GalleryImage) => {
    setSelectedImage(image);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!selectedImage) return;
    deleteMutation.mutate(selectedImage.id, {
      onSuccess: () => {
        toast({title: "Успех", description: "Снимката е изтрита успешно"});
        setDeleteDialogOpen(false);
        setSelectedImage(null);
      },
      onError: (err: Error) => {
        const msg = extractApiErrorDetails((err as ApiError).response?.data || err);
        toast({title: "Грешка", description: msg || "Неуспешно изтриване", variant: "destructive"});
      },
    });
  };

  return (
    <AdminLayout title="Управление на галерия">
      <div className="space-y-8">
        {/* ── Upload Card ────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Качи снимки</CardTitle>
            <CardDescription>
              Изберете категория и добавете снимки чрез кликане или плъзгане. Разрешени формати: JPG, PNG, GIF, WEBP до
              15 MB.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="flex flex-col gap-6">
              {/* Category */}
              <div className="grid gap-2">
                <Label htmlFor="gallery-category">Категория</Label>
                <CategoryComboField
                  value={category}
                  onChange={setCategory}
                  existingCategories={existingCategories}
                  disabled={uploading}
                  placeholder="Изберете или въведете нова категория"
                />
              </div>

              {/* File picker */}
              <div className="grid gap-2">
                <Label>Снимки</Label>
                <input
                  ref={fileInputRef}
                  id="gallery-file-input"
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  disabled={uploading}
                  onChange={(e) => {
                    if (e.target.files) addFiles(Array.from(e.target.files));
                  }}
                />

                {/* Drag & drop zone */}
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                    isDragging
                      ? "border-primary bg-primary/5 scale-[1.02]"
                      : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50"
                  } ${uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !uploading && fileInputRef.current?.click()}
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
                              }}
                            >
                              Премахни
                            </button>
                          </div>
                        ))}
                        <p className="text-xs text-primary pt-1">Кликни или пусни снимки за добавяне</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          {isDragging ? "Пусни снимките тук" : "Кликни или пусни снимки"}
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF до 15 MB</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <Button type="submit" className="w-2/5" disabled={uploading || !files.length}>
                  {uploading ? "Качване..." : "Качи"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ── Image list grouped by category ─────────────────────────────── */}
        <div className="space-y-8">
          <h3 className="text-lg font-semibold">Галерия ({images.length} снимки)</h3>

          {loading ? (
            <p className="text-center text-muted-foreground">Зареждане...</p>
          ) : images.length === 0 ? (
            <p className="text-center text-muted-foreground">Няма налични снимки</p>
          ) : (
            groups.map(([categoryName, groupImages]) => (
              <section key={categoryName} className="space-y-3">
                <h4 className="text-base font-medium text-muted-foreground border-b pb-1">
                  {categoryName} ({groupImages.length})
                </h4>
                <div className="flex flex-wrap gap-3">
                  {groupImages.map((image) => {
                    if (!image.url) return null;
                    return (
                      <div
                        key={image.id}
                        className="flex items-stretch border rounded-lg overflow-hidden bg-card shadow-sm"
                      >
                        {/* Padded thumbnail — padding = mat/border effect */}
                        <div className="p-2">
                          <img
                            src={image.url}
                            alt={image.image_name}
                            className="w-20 h-20 object-cover rounded"
                            loading="lazy"
                          />
                        </div>
                        {/* Action column */}
                        <div className="flex flex-col justify-between p-2 border-l">
                          <button
                            title="Редактирай"
                            onClick={() => openEditDialog(image)}
                            className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            title="Изтрий"
                            onClick={() => openDeleteDialog(image)}
                            className="p-1 text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>

        {/* ── Edit Dialog ────────────────────────────────────────────────── */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Редактирай снимка</DialogTitle>
              <DialogDescription>Променете името или категорията на снимката</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Име на снимката</Label>
                <Input
                  value={editForm.image_name}
                  onChange={(e) => setEditForm({...editForm, image_name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Категория</Label>
                <CategoryComboField
                  value={editForm.category}
                  onChange={(v) => setEditForm({...editForm, category: v})}
                  existingCategories={existingCategories}
                  disabled={updateMutation.isPending}
                />
              </div>
              <Button onClick={handleEdit} className="w-full" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Запазване..." : "Запази"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Delete Confirmation ────────────────────────────────────────── */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Изтриване на снимка"
          description="Сигурни ли сте, че искате да изтриете тази снимка? Това действие не може да бъде отменено."
          onConfirm={handleDelete}
          confirmText="Изтрий"
          variant="destructive"
        />
      </div>
    </AdminLayout>
  );
}
