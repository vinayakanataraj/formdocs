"use client";

import type { Block, CurrencyProps } from "@/lib/types";
import FieldWrapper from "./field-wrapper";

interface Props { block: Block; onChange: (p: any) => void; readOnly?: boolean; }

export default function CurrencyField({ block, onChange, readOnly }: Props) {
  const p = block.properties as CurrencyProps;
  const symbol = p.currencySymbol ?? "$";
  return (
    <FieldWrapper label={p.label} helpText={p.helpText} required={p.required}>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{symbol}</span>
        <input
          type="number"
          disabled
          placeholder={`0.${"0".repeat(p.decimalPlaces ?? 2)}`}
          step={Math.pow(10, -(p.decimalPlaces ?? 2))}
          className="w-full pl-7 pr-3 py-2 text-sm border border-border rounded-md bg-muted/30 text-muted-foreground cursor-default"
        />
      </div>
    </FieldWrapper>
  );
}
