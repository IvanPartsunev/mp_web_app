import {useMemo, useState} from "react";
import {GalleryModal} from "@/components/gallery-modal";
import {LoadingSpinner} from "@/components/ui/loading-spinner";
import {useGallery, GalleryImage} from "@/hooks/useGallery";
import {HERO_STYLES} from "@/lib/styles";

const FALLBACK_CATEGORY = "Други";

function groupByCategory(images: GalleryImage[]): [string, GalleryImage[]][] {
  const map: Record<string, GalleryImage[]> = {};
  for (const img of images) {
    const key = img.category?.trim() || FALLBACK_CATEGORY;
    if (!map[key]) map[key] = [];
    map[key].push(img);
  }

  const entries = Object.entries(map);
  // Named groups alphabetically, fallback last
  entries.sort(([a], [b]) => {
    if (a === FALLBACK_CATEGORY) return 1;
    if (b === FALLBACK_CATEGORY) return -1;
    return a.localeCompare(b, "bg");
  });

  return entries;
}

export default function Gallery() {
  const {data: images = [], isLoading: loading, error: queryError} = useGallery();
  const error = queryError ? "Неуспешно зареждане на галерията" : null;

  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const groups = useMemo(() => groupByCategory(images.filter((img) => !!img.url)), [images]);

  const activeGroupImages = useMemo(() => {
    if (!selectedGroup) return [];
    return groups.find(([cat]) => cat === selectedGroup)?.[1] ?? [];
  }, [selectedGroup, groups]);

  const openModal = (groupName: string, index: number) => {
    setSelectedGroup(groupName);
    setSelectedIndex(index);
  };

  const closeModal = () => {
    setSelectedGroup(null);
    setSelectedIndex(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Hero Section */}
      <section className={HERO_STYLES.section}>
        <div className={HERO_STYLES.overlay} />
        <div className={HERO_STYLES.container}>
          <div className={HERO_STYLES.content}>
            <h1 className={HERO_STYLES.title}>Галерия</h1>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 space-y-12">
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

        {!loading && !error && groups.length > 0 &&
          groups.map(([categoryName, groupImages]) => (
            <section key={categoryName}>
              <h2
                className="text-2xl font-bold mb-4 pb-2 border-b bg-clip-text text-transparent"
                style={{backgroundImage: "linear-gradient(to right, oklch(0.42 0.15 154.56), oklch(0.65 0.18 154.56), oklch(0.42 0.15 154.56))"}}
              >
                {categoryName}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {groupImages.map((image, index) => (
                  <div
                    key={image.id}
                    className="aspect-square overflow-hidden rounded-lg bg-muted cursor-pointer group shadow hover:shadow-lg transition-all duration-300"
                    onClick={() => openModal(categoryName, index)}
                  >
                    <img
                      src={image.url!}
                      alt={image.image_name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
      </section>

      <GalleryModal
        isOpen={selectedGroup !== null && selectedIndex !== null}
        onClose={closeModal}
        imageUrl={selectedIndex !== null ? activeGroupImages[selectedIndex]?.url ?? "" : ""}
        imageName={selectedIndex !== null ? activeGroupImages[selectedIndex]?.image_name ?? "" : ""}
        currentIndex={selectedIndex !== null ? selectedIndex + 1 : 0}
        totalImages={activeGroupImages.length}
        onNext={() => {
          if (selectedIndex !== null && selectedIndex < activeGroupImages.length - 1) {
            setSelectedIndex(selectedIndex + 1);
          }
        }}
        onPrevious={() => {
          if (selectedIndex !== null && selectedIndex > 0) {
            setSelectedIndex(selectedIndex - 1);
          }
        }}
        hasNext={selectedIndex !== null && selectedIndex < activeGroupImages.length - 1}
        hasPrevious={selectedIndex !== null && selectedIndex > 0}
      />
    </div>
  );
}
