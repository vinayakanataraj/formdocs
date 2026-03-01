"use client";

import type { Block, LongTextProps } from "@/lib/types";
import FieldWrapper from "./field-wrapper";

interface Props { block: Block; onChange: (p: any) => void; readOnly?: boolean; }

export default function LongTextField({ block, onChange, readOnly }: Props) {
  const p = block.properties as LongTextProps;
  return (
    <FieldWrapper label={p.label} helpText={p.helpText} required={p.required} onLabelChange={(label) => onChange({ label })} readOnly={readOnly}>
      <textarea
        disabled
        rows={3}
        placeholder={p.placeholder || "Long answer text"}
        className="w-full px-3 py-2 text-sm border border-border rounded-[4px] bg-muted/40 text-muted-foreground cursor-default resize-none"
      />
    </FieldWrapper>
  );
}
