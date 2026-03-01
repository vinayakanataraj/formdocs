"use client";

import { useFormContext } from "react-hook-form";
import type { Block, LongTextProps } from "@/lib/types";
import FieldWrapper from "./field-wrapper";
import { useState } from "react";

export default function LongTextInput({ block }: { block: Block }) {
  const p = block.properties as LongTextProps;
  const { register, formState: { errors }, watch } = useFormContext();
  const error = (errors[block.id] as any)?.message;
  const value = watch(block.id) ?? "";

  return (
    <FieldWrapper label={p.label} helpText={p.helpText} required={p.required} error={error}>
      <textarea
        {...register(block.id)}
        placeholder={p.placeholder}
        rows={4}
        className={`w-full px-3 py-2.5 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 transition-colors resize-y ${
          error ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-ring/50"
        }`}
      />
      {p.showCharCounter && p.maxLength && (
        <p className="text-xs text-muted-foreground text-right">
          {value.length}/{p.maxLength}
        </p>
      )}
    </FieldWrapper>
  );
}
