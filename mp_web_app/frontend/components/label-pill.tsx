import {X} from "lucide-react";

interface LabelPillProps {
  label: string;
  onRemove?: () => void;
}

export function LabelPill({label, onRemove}: LabelPillProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground">
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 hover:text-destructive transition-colors"
          aria-label={`Премахни етикет ${label}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
