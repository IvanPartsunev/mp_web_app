import {useState} from "react";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";

const NEW_CATEGORY_SENTINEL = "__new__";

interface CategoryComboFieldProps {
  value: string;
  onChange: (v: string) => void;
  existingCategories: string[];
  disabled?: boolean;
  placeholder?: string;
}

export function CategoryComboField({
  value,
  onChange,
  existingCategories,
  disabled = false,
  placeholder = "Изберете или въведете категория",
}: CategoryComboFieldProps) {
  // Determine if the current value is a known existing category
  const isExisting = existingCategories.includes(value);
  const [mode, setMode] = useState<"select" | "new">(
    value === "" || isExisting ? "select" : "new"
  );

  const handleSelectChange = (v: string) => {
    if (v === NEW_CATEGORY_SENTINEL) {
      setMode("new");
      onChange("");
    } else {
      setMode("select");
      onChange(v);
    }
  };

  if (mode === "new") {
    return (
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Въведете нова категория"
          autoComplete="off"
          autoFocus
        />
        {existingCategories.length > 0 && (
          <button
            type="button"
            disabled={disabled}
            className="shrink-0 text-xs text-muted-foreground underline hover:text-foreground"
            onClick={() => { setMode("select"); onChange(""); }}
          >
            Избери
          </button>
        )}
      </div>
    );
  }

  return (
    <Select value={value || ""} onValueChange={handleSelectChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {existingCategories.map((cat) => (
          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
        ))}
        <SelectItem value={NEW_CATEGORY_SENTINEL}>+ Нова категория</SelectItem>
      </SelectContent>
    </Select>
  );
}
