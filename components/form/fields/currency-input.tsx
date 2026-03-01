"use client";

import { useFormContext } from "react-hook-form";
import type { Block, CurrencyProps } from "@/lib/types";
import FieldWrapper from "./field-wrapper";

export default function CurrencyInput({ block }: { block: Block }) {
  const p = block.properties as CurrencyProps;
  const { register, formState: { errors } } = useFormContext();
  const error = (errors[block.id] as any)?.message;
  const symbol = p.currencySymbol ?? "$";

  return (
    <FieldWrapper label={p.label} helpText={p.helpText} required={p.required} error={error}>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{symbol}</span>
        <input
          type="number"
          {...register(block.id, { valueAsNumber: true })}
          placeholder={`0.${"0".repeat(p.decimalPlaces ?? 2)}`}
          step={Math.pow(10, -(p.decimalPlaces ?? 2))}
          className={`w-full pl-7 pr-3 py-2.5 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 transition-colors ${
            error ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-ring/50"
          }`}
        />
      </div>
    </FieldWrapper>
  );
}
