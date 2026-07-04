import {useState} from "react";
import type {ProductSize} from "@/hooks/useProducts";

interface ExpandableSizeCellProps {
  sizes?: ProductSize[] | null;
  collapsedLimit?: number;
}

function SizePill({size}: {size: ProductSize}) {
  const dims = [
    size.width != null ? `Ш:${size.width}` : null,
    size.height != null ? `В:${size.height}` : null,
    size.length != null ? `Д:${size.length}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground whitespace-nowrap">
      <span className="font-semibold">{size.label}</span>
      {dims && <span className="opacity-70">{dims}</span>}
    </span>
  );
}

export function ExpandableSizeCell({sizes, collapsedLimit = 2}: ExpandableSizeCellProps) {
  const [expanded, setExpanded] = useState(false);

  if (!sizes || sizes.length === 0) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  const hasMore = sizes.length > collapsedLimit;
  const visible = expanded ? sizes : sizes.slice(0, collapsedLimit);
  const hiddenCount = sizes.length - collapsedLimit;

  return (
    <button
      type="button"
      onClick={() => setExpanded((prev) => !prev)}
      className="flex flex-wrap gap-1 text-left w-full cursor-pointer"
      title={expanded ? "Свий" : "Покажи всички"}
    >
      {visible.map((s, i) => (
        <SizePill key={i} size={s} />
      ))}
      {!expanded && hasMore && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground">
          +{hiddenCount}
        </span>
      )}
    </button>
  );
}
