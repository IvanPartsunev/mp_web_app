import {useState} from "react";
import {LabelPill} from "@/components/label-pill";

interface ExpandableLabelCellProps {
  labels?: string[] | null;
  collapsedLimit?: number;
}

export function ExpandableLabelCell({labels, collapsedLimit = 2}: ExpandableLabelCellProps) {
  const [expanded, setExpanded] = useState(false);

  if (!labels || labels.length === 0) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  const hasMore = labels.length > collapsedLimit;
  const visibleLabels = expanded ? labels : labels.slice(0, collapsedLimit);
  const hiddenCount = labels.length - collapsedLimit;

  return (
    <button
      type="button"
      onClick={() => setExpanded((prev) => !prev)}
      className="flex flex-wrap gap-1 text-left w-full cursor-pointer"
      title={expanded ? "Свий" : "Покажи всички"}
    >
      {visibleLabels.map((label) => (
        <LabelPill key={label} label={label} />
      ))}
      {!expanded && hasMore && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground">
          +{hiddenCount}
        </span>
      )}
    </button>
  );
}
