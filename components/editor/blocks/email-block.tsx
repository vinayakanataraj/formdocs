"use client";

import type { EmailProps, EditorBlockProps } from "@/lib/types";
import { DISABLED_ICON_INPUT_CLASS } from "@/lib/constants";
import FieldWrapper from "./field-wrapper";
import { Mail } from "lucide-react";

export default function EmailField({ block, onChange, readOnly }: EditorBlockProps) {
  const p = block.properties as EmailProps;
  return (
    <FieldWrapper label={p.label} helpText={p.helpText} required={p.required} onLabelChange={(label) => onChange({ label })} readOnly={readOnly}>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="email"
          disabled
          placeholder={p.placeholder || "email@example.com"}
          className={DISABLED_ICON_INPUT_CLASS}
        />
      </div>
    </FieldWrapper>
  );
}
