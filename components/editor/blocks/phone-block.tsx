"use client";

import type { Block, PhoneProps } from "@/lib/types";
import FieldWrapper from "./field-wrapper";
import { Phone } from "lucide-react";

interface Props { block: Block; onChange: (p: any) => void; readOnly?: boolean; }

export default function PhoneField({ block, onChange, readOnly }: Props) {
  const p = block.properties as PhoneProps;
  return (
    <FieldWrapper label={p.label} helpText={p.helpText} required={p.required}>
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="tel"
          disabled
          placeholder={p.placeholder || "+1 (555) 000-0000"}
          className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md bg-muted/30 text-muted-foreground cursor-default"
        />
      </div>
    </FieldWrapper>
  );
}
