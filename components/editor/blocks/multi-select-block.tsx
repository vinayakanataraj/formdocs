"use client";

import type { MultiSelectProps, EditorBlockProps } from "@/lib/types";
import FieldWrapper from "./field-wrapper";

export default function MultiSelectField({ block, onChange, readOnly }: EditorBlockProps) {
  const p = block.properties as MultiSelectProps;
  const options = p.options ?? [];

  return (
    <FieldWrapper label={p.label} helpText={p.helpText} required={p.required} onLabelChange={(label) => onChange({ label })} readOnly={readOnly}>
      <div className="space-y-1.5">
        {options.map((opt, i) => (
          <label key={i} className="flex items-center gap-2 text-sm text-muted-foreground cursor-default">
            <input type="checkbox" disabled className="accent-primary" />
            {opt}
          </label>
        ))}
        {options.length === 0 && <p className="text-xs text-muted-foreground">No options added yet</p>}
      </div>
    </FieldWrapper>
  );
}
