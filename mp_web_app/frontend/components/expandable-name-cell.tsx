import {useState} from "react";

interface ExpandableNameCellProps {
  name?: string | null;
}

export function ExpandableNameCell({name}: ExpandableNameCellProps) {
  const [expanded, setExpanded] = useState(false);

  if (!name) return <span className="text-muted-foreground">-</span>;

  return (
    <button
      type="button"
      onClick={() => setExpanded((prev) => !prev)}
      className="text-left w-full cursor-pointer"
      title={expanded ? undefined : name}
    >
      <span className={expanded ? "break-all whitespace-normal" : "block truncate"}>{name}</span>
    </button>
  );
}
