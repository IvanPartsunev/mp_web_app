import React, {useState} from "react";
import {Card} from "@/components/ui/card";

interface GalleryImageCardProps {
  imageUrl: string;
  imageName: string;
  onClick?: () => void;
}

export function GalleryImageCard({imageUrl, imageName, onClick}: GalleryImageCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<"portrait" | "landscape" | "square">("square");

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const ratio = img.naturalWidth / img.naturalHeight;

    // More accurate aspect ratio detection
    if (ratio > 1.15) {
      setAspectRatio("landscape");
    } else if (ratio < 0.85) {
      setAspectRatio("portrait");
    } else {
      setAspectRatio("square");
    }

    setImageLoaded(true);
  };

  return (
    <Card
      className={`overflow-hidden cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 p-0 ${
        aspectRatio === "portrait" ? "row-span-2" : ""
      }`}
      onClick={onClick}
    >
      <div className="relative w-full h-full bg-muted">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Зареждане...</p>
          </div>
        )}
        <img
          src={imageUrl}
          alt={imageName}
          className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
          loading="lazy"
          onLoad={handleImageLoad}
        />
      </div>
    </Card>
  );
}
