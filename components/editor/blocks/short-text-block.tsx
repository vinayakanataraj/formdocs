"use client";

import type { ShortTextProps, EditorBlockProps } from "@/lib/types";
import { DISABLED_INPUT_CLASS } from "@/lib/constants";
import FieldWrapper from "./field-wrapper";

export default function ShortTextField({ block, onChange, readOnly }: EditorBlockProps) {
  const p = block.properties as ShortTextProps;
  return (
    <FieldWrapper label={p.label} helpText={p.helpText} required={p.required} onLabelChange={(label) => onChange({ label })} readOnly={readOnly}>
      <input
        type="text"
        disabled
        placeholder={p.placeholder || "Short answer text"}
        className={DISABLED_INPUT_CLASS}
      />
    </FieldWrapper>
  );
}
