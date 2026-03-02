"use client";

import type { PhoneProps, EditorBlockProps } from "@/lib/types";
import { DISABLED_ICON_INPUT_CLASS } from "@/lib/constants";
import FieldWrapper from "./field-wrapper";
import { Phone } from "lucide-react";

export default function PhoneField({ block, onChange, readOnly }: EditorBlockProps) {
  const p = block.properties as PhoneProps;
  return (
    <FieldWrapper label={p.label} helpText={p.helpText} required={p.required} onLabelChange={(label) => onChange({ label })} readOnly={readOnly}>
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="tel"
          disabled
          placeholder={p.placeholder || "+1 (555) 000-0000"}
          className={DISABLED_ICON_INPUT_CLASS}
        />
      </div>
    </FieldWrapper>
  );
}
