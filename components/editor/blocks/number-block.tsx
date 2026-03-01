"use client";

import type { Block, NumberProps } from "@/lib/types";
import FieldWrapper from "./field-wrapper";

interface Props { block: Block; onChange: (p: any) => void; readOnly?: boolean; }

export default function NumberField({ block, onChange, readOnly }: Props) {
  const p = block.properties as NumberProps;
  return (
    <FieldWrapper label={p.label} helpText={p.helpText} required={p.required}>
      <input
        type="number"
        disabled
        placeholder={p.placeholder || "0"}
        min={p.min}
        max={p.max}
        step={p.step ?? 1}
        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/30 text-muted-foreground cursor-default"
      />
    </FieldWrapper>
  );
}
