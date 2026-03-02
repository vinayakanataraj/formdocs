"use client";

import type { CurrencyProps, EditorBlockProps } from "@/lib/types";
import FieldWrapper from "./field-wrapper";

export default function CurrencyField({ block, onChange, readOnly }: EditorBlockProps) {
  const p = block.properties as CurrencyProps;
  const symbol = p.currencySymbol ?? "$";
  return (
    <FieldWrapper label={p.label} helpText={p.helpText} required={p.required} onLabelChange={(label) => onChange({ label })} readOnly={readOnly}>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{symbol}</span>
        <input
          type="number"
          disabled
          placeholder={`0.${"0".repeat(p.decimalPlaces ?? 2)}`}
          step={Math.pow(10, -(p.decimalPlaces ?? 2))}
          className="w-full pl-7 pr-3 py-2 text-sm border border-border rounded-[4px] bg-muted/40 text-muted-foreground cursor-default"
        />
      </div>
    </FieldWrapper>
  );
}
