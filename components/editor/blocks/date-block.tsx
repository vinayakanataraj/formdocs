"use client";

import type { DateProps, EditorBlockProps } from "@/lib/types";
import { DISABLED_ICON_INPUT_CLASS } from "@/lib/constants";
import FieldWrapper from "./field-wrapper";
import { Calendar } from "lucide-react";

export default function DateField({ block, onChange, readOnly }: EditorBlockProps) {
  const p = block.properties as DateProps;
  return (
    <FieldWrapper label={p.label} helpText={p.helpText} required={p.required} onLabelChange={(label) => onChange({ label })} readOnly={readOnly}>
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="date"
          disabled
          className={DISABLED_ICON_INPUT_CLASS}
        />
      </div>
    </FieldWrapper>
  );
}
