"use client";

import type { Block, SingleSelectProps } from "@/lib/types";
import FieldWrapper from "./field-wrapper";

interface Props { block: Block; onChange: (p: any) => void; readOnly?: boolean; }

export default function SingleSelectField({ block, onChange, readOnly }: Props) {
  const p = block.properties as SingleSelectProps;
  const options = p.options ?? [];
  const isRadio = p.display === "radio";

  return (
    <FieldWrapper label={p.label} helpText={p.helpText} required={p.required} onLabelChange={(label) => onChange({ label })} readOnly={readOnly}>
      {isRadio ? (
        <div className="space-y-1.5">
          {options.map((opt, i) => (
            <label key={i} className="flex items-center gap-2 text-sm text-muted-foreground cursor-default">
              <input type="radio" disabled className="accent-primary" />
              {opt}
            </label>
          ))}
          {options.length === 0 && <p className="text-xs text-muted-foreground">No options added yet</p>}
        </div>
      ) : (
        <select
          disabled
          className="w-full px-3 py-2 text-sm border border-border rounded-[4px] bg-muted/40 text-muted-foreground cursor-default"
        >
          <option value="">{p.placeholder || "Select an option…"}</option>
          {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
        </select>
      )}
    </FieldWrapper>
  );
}
