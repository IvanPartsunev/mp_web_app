import {useState} from "react";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {LabelPill} from "@/components/label-pill";

const NEW_LABEL_SENTINEL = "__new__";

interface LabelsComboFieldProps {
  value: string[];
  onChange: (labels: string[]) => void;
  existingLabels: string[];
  disabled?: boolean;
  placeholder?: string;
}

export function LabelsComboField({
  value,
  onChange,
  existingLabels,
  disabled = false,
  placeholder = "Изберете или въведете етикет",
}: LabelsComboFieldProps) {
  const [mode, setMode] = useState<"select" | "new">("select");
  const [inputValue, setInputValue] = useState("");

  const addLabel = (label: string) => {
    const trimmed = label.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
  };

  const removeLabel = (label: string) => {
    onChange(value.filter((l) => l !== label));
  };

  const handleSelectChange = (v: string) => {
    if (v === NEW_LABEL_SENTINEL) {
      setMode("new");
      setInputValue("");
    } else {
      addLabel(v);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addLabel(inputValue);
      setInputValue("");
    }
  };

  const handleInputBlur = () => {
    if (inputValue.trim()) {
      addLabel(inputValue);
      setInputValue("");
    }
  };

  // Available labels to show in the select (exclude already selected ones)
  const availableLabels = existingLabels.filter((l) => !value.includes(l));

  return (
    <div className="space-y-2">
      {/* Current labels as removable pills */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((label) => (
            <LabelPill key={label} label={label} onRemove={disabled ? undefined : () => removeLabel(label)} />
          ))}
        </div>
      )}

      {/* Input to add new labels */}
      {mode === "new" ? (
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            onBlur={handleInputBlur}
            disabled={disabled}
            placeholder="Въведете нов етикет и натиснете Enter"
            autoComplete="off"
            autoFocus
          />
          {availableLabels.length > 0 && (
            <button
              type="button"
              disabled={disabled}
              className="shrink-0 text-xs text-muted-foreground underline hover:text-foreground"
              onClick={() => {
                setMode("select");
                setInputValue("");
              }}
            >
              Избери
            </button>
          )}
        </div>
      ) : (
        <Select value="" onValueChange={handleSelectChange} disabled={disabled}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {availableLabels.map((lbl) => (
              <SelectItem key={lbl} value={lbl}>
                {lbl}
              </SelectItem>
            ))}
            <SelectItem value={NEW_LABEL_SENTINEL}>+ Нов етикет</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
