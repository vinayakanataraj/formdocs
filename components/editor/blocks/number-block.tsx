"use client";

import type { NumberProps, EditorBlockProps } from "@/lib/types";
import { DISABLED_INPUT_CLASS } from "@/lib/constants";
import FieldWrapper from "./field-wrapper";

export default function NumberField({ block, onChange, readOnly }: EditorBlockProps) {
  const p = block.properties as NumberProps;
  return (
    <FieldWrapper label={p.label} helpText={p.helpText} required={p.required} onLabelChange={(label) => onChange({ label })} readOnly={readOnly}>
      <input
        type="number"
        disabled
        placeholder={p.placeholder || "0"}
        min={p.min}
        max={p.max}
        step={p.step ?? 1}
        className={DISABLED_INPUT_CLASS}
      />
    </FieldWrapper>
  );
}
