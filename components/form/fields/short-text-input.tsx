"use client";

import { useFormContext } from "react-hook-form";
import type { Block, ShortTextProps } from "@/lib/types";
import FieldWrapper from "./field-wrapper";

export default function ShortTextInput({ block }: { block: Block }) {
  const p = block.properties as ShortTextProps;
  const { register, formState: { errors } } = useFormContext();
  const error = (errors[block.id] as { message?: string } | undefined)?.message;

  return (
    <FieldWrapper label={p.label} helpText={p.helpText} required={p.required} error={error}>
      <input
        type="text"
        {...register(block.id)}
        placeholder={p.placeholder}
        className={`w-full px-3 py-2.5 text-sm border rounded-[4px] bg-background focus:outline-none focus:ring-2 transition-colors ${
          error ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-ring/50"
        }`}
      />
    </FieldWrapper>
  );
}
