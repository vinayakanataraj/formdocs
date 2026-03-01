"use client";

import { useFormContext } from "react-hook-form";
import type { Block, DateProps } from "@/lib/types";
import FieldWrapper from "./field-wrapper";

export default function DateInput({ block }: { block: Block }) {
  const p = block.properties as DateProps;
  const { register, formState: { errors } } = useFormContext();
  const error = (errors[block.id] as any)?.message;

  return (
    <FieldWrapper label={p.label} helpText={p.helpText} required={p.required} error={error}>
      <input
        type="date"
        {...register(block.id)}
        min={p.minDate}
        max={p.maxDate}
        className={`w-full px-3 py-2.5 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 transition-colors ${
          error ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-ring/50"
        }`}
      />
    </FieldWrapper>
  );
}
