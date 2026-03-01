"use client";

import type { Block, DateProps } from "@/lib/types";
import FieldWrapper from "./field-wrapper";
import { Calendar } from "lucide-react";

interface Props { block: Block; onChange: (p: any) => void; readOnly?: boolean; }

export default function DateField({ block, onChange, readOnly }: Props) {
  const p = block.properties as DateProps;
  return (
    <FieldWrapper label={p.label} helpText={p.helpText} required={p.required}>
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="date"
          disabled
          className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md bg-muted/30 text-muted-foreground cursor-default"
        />
      </div>
    </FieldWrapper>
  );
}
