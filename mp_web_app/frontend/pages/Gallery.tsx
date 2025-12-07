import {useEffect, useState, useRef} from "react";
import {GalleryModal} from "@/components/gallery-modal";
import {API_BASE_URL} from "@/app-config";
import {LoadingSpinner} from "@/components/ui/loading-spinner";

interface GalleryImage {
  id: string;
  image_name: string;
  s3_key: string;
  s3_bucket: string;
  uploaded_by: string;
  created_at: string;
  url?: string;
}

export default function Gallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}gallery/list`);
      if (!response.ok) {
        throw new Error("Failed to fetch gallery");
      }
      const galleryImages = await response.json();
      setImages(galleryImages || []);
      setError(null);
    } catch (err: any) {
      setError("Неуспешно зареждане на галерията");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  // Lazy loading with Intersection Observer
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src && !loadedImages.has(src)) {
              img.src = src;
              setLoadedImages((prev) => new Set(prev).add(src));
              observerRef.current?.unobserve(img);
            }
          }
        });
      },
      {rootMargin: "50px"}
    );

    return () => observerRef.current?.disconnect();
  }, [loadedImages]);

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
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

      <section className="container mx-auto px-4 py-12">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <LoadingSpinner />
            <p className="text-muted-foreground mt-4">Зареждане на галерията...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <p className="text-destructive text-lg">{error}</p>
          </div>
        )}

        {!loading && !error && images.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">Няма налични снимки</p>
          </div>
        )}

        {!loading && !error && images.length > 0 && (
          <>
            {/* Masonry Grid */}
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
              {images.map((image, index) =>
                image.url ? (
                  <div
                    key={image.id}
                    className="break-inside-avoid group cursor-pointer"
                    onClick={() => handleImageClick(index)}
                  >
                    <div className="relative overflow-hidden rounded-xl bg-muted shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
                      <img
                        data-src={image.url}
                        alt={image.image_name}
                        className="w-full h-auto object-cover transition-all duration-500 group-hover:scale-110"
                        loading="lazy"
                        ref={(el) => {
                          if (el && observerRef.current) {
                            observerRef.current.observe(el);
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <p className="text-white font-medium text-sm truncate">{image.image_name}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null
              )}
            </div>

            <GalleryModal
              isOpen={selectedImageIndex !== null}
              onClose={() => setSelectedImageIndex(null)}
              imageUrl={selectedImageIndex !== null ? images[selectedImageIndex]?.url || "" : ""}
              imageName={selectedImageIndex !== null ? images[selectedImageIndex]?.image_name || "" : ""}
              currentIndex={selectedImageIndex !== null ? selectedImageIndex + 1 : 0}
              totalImages={images.length}
              onNext={() => {
                if (selectedImageIndex !== null && selectedImageIndex < images.length - 1) {
                  setSelectedImageIndex(selectedImageIndex + 1);
                }
              }}
              onPrevious={() => {
                if (selectedImageIndex !== null && selectedImageIndex > 0) {
                  setSelectedImageIndex(selectedImageIndex - 1);
                }
              }}
              hasNext={selectedImageIndex !== null && selectedImageIndex < images.length - 1}
              hasPrevious={selectedImageIndex !== null && selectedImageIndex > 0}
            />
          </>
        )}
      </section>
    </div>
  );
}
