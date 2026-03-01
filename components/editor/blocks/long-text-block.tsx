"use client";

import type { Block, LongTextProps } from "@/lib/types";
import FieldWrapper from "./field-wrapper";

interface Props { block: Block; onChange: (p: any) => void; readOnly?: boolean; }

export default function LongTextField({ block, onChange, readOnly }: Props) {
  const p = block.properties as LongTextProps;
  return (
    <FieldWrapper label={p.label} helpText={p.helpText} required={p.required}>
      <textarea
        disabled
        rows={3}
        placeholder={p.placeholder || "Long answer text"}
        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/30 text-muted-foreground cursor-default resize-none"
      />
    </FieldWrapper>
  );
}
