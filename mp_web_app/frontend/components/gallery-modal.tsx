import {useEffect, useRef, useState} from "react";
import {Dialog, DialogContent, DialogTitle} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {ChevronLeft, ChevronRight, X} from "lucide-react";

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageName: string;
  currentIndex: number;
  totalImages: number;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

export function GalleryModal({
  isOpen,
  onClose,
  imageUrl,
  imageName,
  currentIndex,
  totalImages,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
}: GalleryModalProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && hasNext) {
        onNext();
      } else if (e.key === "ArrowLeft" && hasPrevious) {
        onPrevious();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, hasNext, hasPrevious, onNext, onPrevious, onClose]);

  // Touch gesture handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && hasNext) {
      onNext();
    } else if (isRightSwipe && hasPrevious) {
      onPrevious();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="!max-w-[100vw] !w-[100vw] h-[90vh] p-0 border-0 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md md:!max-w-[85vw] md:!w-[85vw] md:h-[90vh]"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">{imageName}</DialogTitle>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-50 text-foreground hover:shadow-lg active:shadow-xl active:scale-[0.98] transition-all duration-150 rounded-full w-9 h-9 p-1.5 flex items-center justify-center focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 !outline-none !ring-0"
          onClick={onClose}
          aria-label="Затвори"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Image counter - hidden on mobile */}
        <div className="hidden md:block absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-white/70 text-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg">
          {currentIndex} / {totalImages}
        </div>

        {/* Previous button - hidden on mobile, use swipe instead */}
        {hasPrevious && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-50 text-foreground hover:shadow-lg active:shadow-xl active:scale-[0.98] transition-all duration-150 rounded-full w-14 h-14 items-center justify-center"
            onClick={onPrevious}
            aria-label="Предишна снимка"
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>
        )}

        {/* Next button - hidden on mobile, use swipe instead */}
        {hasNext && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-50 text-foreground hover:shadow-lg active:shadow-xl active:scale-[0.98] transition-all duration-150 rounded-full w-14 h-14 items-center justify-center"
            onClick={onNext}
            aria-label="Следваща снимка"
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
        )}

        {/* Image container with touch gestures */}
        <div
          className="relative w-full h-full flex items-center justify-center overflow-hidden p-0 md:px-24 md:py-16"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              ref={imageRef}
              src={imageUrl}
              alt={imageName}
              className="max-w-full max-h-full w-auto h-auto object-contain select-none transition-opacity duration-300"
              draggable={false}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
