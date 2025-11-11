import React, {useEffect, useState} from "react";
import {GalleryImageCard} from "@/components/gallery-image-card";
import {API_BASE_URL} from "@/app-config";

interface GalleryImage {
  id: string;
  image_name: string;
  s3_key: string;
  s3_bucket: string;
  uploaded_by: string;
  created_at: string;
}

export default function Gallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        setLoading(true);
        // Use fetch for public endpoints to avoid auth issues
        const response = await fetch(`${API_BASE_URL}gallery/list`);
        if (!response.ok) {
          throw new Error("Failed to fetch gallery");
        }
        const galleryImages = await response.json();
        setImages(galleryImages || []);

        // Fetch presigned URLs for each image
        const urls: Record<string, string> = {};
        for (const image of galleryImages) {
          try {
            const urlResponse = await fetch(`${API_BASE_URL}gallery/image/${image.id}`);
            if (urlResponse.ok) {
              const data = await urlResponse.json();
              urls[image.id] = data.url;
            }
          } catch {
            // Silently skip images that fail to load
          }
        }
        setImageUrls(urls);
      } catch (err: any) {
        setError("Неуспешно зареждане на галерията");
      } finally {
        setLoading(false);
      }
    };

    fetchGallery();
  }, []);

  return (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-[200px] gap-4">
          {images.map(
            (image) =>
              imageUrls[image.id] && (
                <GalleryImageCard key={image.id} imageUrl={imageUrls[image.id]} imageName={image.image_name} />
              )
          )}
        </div>
      )}
    </section>
  );
}
