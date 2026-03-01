"use client";

import type { Block, ShortTextProps } from "@/lib/types";
import FieldWrapper from "./field-wrapper";

interface Props { block: Block; onChange: (p: any) => void; readOnly?: boolean; }

export default function ShortTextField({ block, onChange, readOnly }: Props) {
  const p = block.properties as ShortTextProps;
  return (
    <FieldWrapper label={p.label} helpText={p.helpText} required={p.required}>
      <input
        type="text"
        disabled
        placeholder={p.placeholder || "Short answer text"}
        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/30 text-muted-foreground cursor-default"
      />
    </FieldWrapper>
  );
}
