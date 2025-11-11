import React, {useState} from "react";
import {Card} from "@/components/ui/card";
import {Dialog, DialogContent, DialogTitle} from "@/components/ui/dialog";

interface GalleryImageCardProps {
  imageUrl: string;
  imageName: string;
}

export function GalleryImageCard({imageUrl, imageName}: GalleryImageCardProps) {
  const [isOpen, setIsOpen] = useState(false);
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
    <>
      <Card
        className={`overflow-hidden cursor-pointer hover:shadow-lg transition-shadow p-0 ${
          aspectRatio === "portrait" ? "row-span-2" : ""
        }`}
        onClick={() => setIsOpen(true)}
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
            className={`w-full h-full object-cover transition-opacity ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            loading="lazy"
            onLoad={handleImageLoad}
          />
        </div>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogTitle className="sr-only">{imageName}</DialogTitle>
          <img src={imageUrl} alt={imageName} className="w-full h-auto max-h-[80vh] object-contain" />
        </DialogContent>
      </Dialog>
    </>
  );
}
