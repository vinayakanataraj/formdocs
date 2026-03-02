"use client";

import type { LongTextProps, EditorBlockProps } from "@/lib/types";
import { DISABLED_INPUT_CLASS } from "@/lib/constants";
import FieldWrapper from "./field-wrapper";

export default function LongTextField({ block, onChange, readOnly }: EditorBlockProps) {
  const p = block.properties as LongTextProps;
  return (
    <FieldWrapper label={p.label} helpText={p.helpText} required={p.required} onLabelChange={(label) => onChange({ label })} readOnly={readOnly}>
      <textarea
        disabled
        rows={3}
        placeholder={p.placeholder || "Long answer text"}
        className={`${DISABLED_INPUT_CLASS} resize-none`}
      />
    </FieldWrapper>
  );
}
