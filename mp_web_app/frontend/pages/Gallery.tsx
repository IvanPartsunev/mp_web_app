import {useEffect, useState} from "react";
import {GalleryImageCard} from "@/components/gallery-image-card";
import {GalleryModal} from "@/components/gallery-modal";
import {API_BASE_URL} from "@/app-config";

interface GalleryImage {
  id: string;
  image_name: string;
  s3_key: string;
  s3_bucket: string;
  uploaded_by: string;
  created_at: string;
  url?: string;  // CloudFront or S3 presigned URL
}

export default function Gallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        setLoading(true);
        // Fetch gallery images with URLs included
        const response = await fetch(`${API_BASE_URL}gallery/list`);
        if (!response.ok) {
          throw new Error("Failed to fetch gallery");
        }
        const galleryImages = await response.json();
        setImages(galleryImages || []);
      } catch (err: any) {
        setError("Неуспешно зареждане на галерията");
      } finally {
        setLoading(false);
      }
    };

    fetchGallery();
  }, []);

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handleCloseModal = () => {
    setSelectedImageIndex(null);
  };

  const handleNextImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const handlePreviousImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-primary/10 dark:from-gray-900 dark:via-gray-800 dark:to-primary/5 border-b border-gray-200/50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 py-12 md:py-16 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-primary to-gray-900 dark:from-white dark:via-primary dark:to-white bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-1000">
              Галерия
            </h1>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        {loading && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Зареждане на галерията...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {!loading && !error && images.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Няма налични снимки</p>
          </div>
        )}

        {!loading && !error && images.length > 0 && (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-[200px] gap-4">
            {images.map((image, index) =>
              image.url ? (
                <GalleryImageCard
                  key={image.id}
                  imageUrl={image.url}
                  imageName={image.image_name}
                  onClick={() => handleImageClick(index)}
                />
              ) : null
            )}
          </div>

          <GalleryModal
            isOpen={selectedImageIndex !== null}
            onClose={handleCloseModal}
            imageUrl={selectedImageIndex !== null ? images[selectedImageIndex]?.url || "" : ""}
            imageName={selectedImageIndex !== null ? images[selectedImageIndex]?.image_name || "" : ""}
            currentIndex={selectedImageIndex !== null ? selectedImageIndex + 1 : 0}
            totalImages={images.length}
            onNext={handleNextImage}
            onPrevious={handlePreviousImage}
            hasNext={selectedImageIndex !== null && selectedImageIndex < images.length - 1}
            hasPrevious={selectedImageIndex !== null && selectedImageIndex > 0}
          />
          </>
        )}
      </section>
    </div>
  );
}
