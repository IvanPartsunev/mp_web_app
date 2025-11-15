import React, {useEffect, useState, useRef} from "react";
import {AdminLayout} from "@/components/admin-layout";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Card} from "@/components/ui/card";
import {ConfirmDialog} from "@/components/confirm-dialog";
import {useToast} from "@/components/ui/use-toast";
import apiClient from "@/context/apiClient";
import {Trash2} from "lucide-react";

interface GalleryImage {
  id: string;
  image_name: string;
  s3_key: string;
  s3_bucket: string;
  uploaded_by: string;
  created_at: string;
}

export default function GalleryManagement() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageName, setImageName] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const {toast} = useToast();

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("gallery/list");
      const galleryImages = response.data || [];
      setImages(galleryImages);

      // URLs now come with the response
      const urls: Record<string, string> = {};
      galleryImages.forEach((image: any) => {
        if (image.url) {
          urls[image.id] = image.url;
        }
      });
      setImageUrls(urls);
    } catch (err: any) {
      toast({
        title: "Грешка",
        description: err.response?.data?.detail || "Неуспешно зареждане на галерията",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImageName(file.name.split(".")[0]);
    }
  };

  // Drag and drop handlers
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

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        setImageName(file.name.split(".")[0]);
      } else {
        toast({
          title: "Грешка",
          description: "Моля изберете файл със снимка",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Грешка",
        description: "Моля изберете файл",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", selectedFile);
      if (imageName) {
        formData.append("image_name", imageName);
      }

      await apiClient.post("gallery/create", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast({
        title: "Успех",
        description: "Снимката е качена успешно",
      });

      // Reset form
      setSelectedFile(null);
      setImageName("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      fetchGallery();
    } catch (err: any) {
      toast({
        title: "Грешка",
        description: err.response?.data?.detail || "Неуспешно качване на снимката",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const openDeleteDialog = (image: GalleryImage) => {
    setSelectedImage(image);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedImage) return;

    try {
      await apiClient.delete(`gallery/delete/${selectedImage.id}`);
      toast({
        title: "Успех",
        description: "Снимката е изтрита успешно",
      });
      setDeleteDialogOpen(false);
      setSelectedImage(null);
      fetchGallery();
    } catch (err: any) {
      toast({
        title: "Грешка",
        description: err.response?.data?.detail || "Неуспешно изтриване на снимката",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout title="Управление на галерия">
      <div className="space-y-6">
        {/* Upload Section */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Качи нова снимка</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUpload();
            }}
            className="space-y-4"
          >
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
              className="sr-only"
            />

            {/* Drag and drop zone */}
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
                {selectedFile ? (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <p className="text-xs text-primary">Кликни или пусни снимка за промяна</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {isDragging ? "Пусни снимката тук" : "Кликни или пусни снимка"}
                    </p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF до 10MB</p>
                  </div>
                )}
              </div>
            </div>

            {selectedFile && (
              <div>
                <label className="text-sm font-medium">Име на снимката (опционално)</label>
                <Input
                  value={imageName}
                  onChange={(e) => setImageName(e.target.value)}
                  placeholder="Въведете име"
                  disabled={uploading}
                  className="mt-2"
                />
              </div>
            )}

            <Button type="submit" disabled={uploading || !selectedFile} className="w-full">
              {uploading ? "Качване..." : "Качи снимка"}
            </Button>
          </form>
        </Card>

        {/* Gallery Grid */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Галерия ({images.length} снимки)</h3>

          {loading ? (
            <p className="text-center text-muted-foreground">Зареждане...</p>
          ) : images.length === 0 ? (
            <p className="text-center text-muted-foreground">Няма налични снимки</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-[250px] gap-4">
              {images.map((image) => {
                if (!imageUrls[image.id]) return null;

                return (
                  <Card key={image.id} className="overflow-hidden relative group p-0">
                    <img src={imageUrls[image.id]} alt={image.image_name} className="w-full h-full object-cover" />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => openDeleteDialog(image)}
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </Button>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Delete Confirmation */}
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
