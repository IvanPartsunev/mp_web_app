import React, {useEffect, useState, useRef} from "react";
import {AdminLayout} from "@/components/admin-layout";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Card} from "@/components/ui/card";
import {ConfirmDialog} from "@/components/confirm-dialog";
import {useToast} from "@/components/ui/use-toast";
import apiClient from "@/context/apiClient";
import {X} from "lucide-react";

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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {toast} = useToast();

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("gallery/list");
      const galleryImages = response.data || [];
      setImages(galleryImages);

      // Fetch presigned URLs for each image
      const urls: Record<string, string> = {};
      for (const image of galleryImages) {
        try {
          const urlResponse = await apiClient.get(`gallery/image/${image.id}`);
          urls[image.id] = urlResponse.data.url;
        } catch {
          // Silently skip images that fail to load
        }
      }
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
      
      await apiClient.post("gallery/upload", formData, {
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
      await apiClient.delete(`gallery/delete?image_id=${selectedImage.id}`);
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
            <div>
              <label className="text-sm font-medium">Избери снимка</label>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </div>
            
            {selectedFile && (
              <div>
                <label className="text-sm font-medium">Име на снимката (опционално)</label>
                <Input
                  value={imageName}
                  onChange={(e) => setImageName(e.target.value)}
                  placeholder="Въведете име"
                  disabled={uploading}
                />
              </div>
            )}
            
            <Button
              type="submit"
              disabled={uploading || !selectedFile}
              className="w-full"
            >
              {uploading ? "Качване..." : "Качи снимка"}
            </Button>
          </form>
        </Card>

        {/* Gallery Grid */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Галерия ({images.length} снимки)
          </h3>
          
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
                    <img
                      src={imageUrls[image.id]}
                      alt={image.image_name}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => openDeleteDialog(image)}
                    >
                      <X className="h-4 w-4" />
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
