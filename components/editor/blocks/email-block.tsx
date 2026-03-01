"use client";

import type { Block, EmailProps } from "@/lib/types";
import FieldWrapper from "./field-wrapper";
import { Mail } from "lucide-react";

interface Props { block: Block; onChange: (p: any) => void; readOnly?: boolean; }

export default function EmailField({ block, onChange, readOnly }: Props) {
  const p = block.properties as EmailProps;
  return (
    <FieldWrapper label={p.label} helpText={p.helpText} required={p.required} onLabelChange={(label) => onChange({ label })} readOnly={readOnly}>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="email"
          disabled
          placeholder={p.placeholder || "email@example.com"}
          className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-[4px] bg-muted/40 text-muted-foreground cursor-default"
        />
      </div>
    </FieldWrapper>
  );
}
