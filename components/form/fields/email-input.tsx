"use client";

import { useFormContext } from "react-hook-form";
import type { Block } from "@/lib/types";
import FieldWrapper from "./field-wrapper";
import { Mail } from "lucide-react";

export default function EmailInput({ block }: { block: Block }) {
  const p = block.properties as any;
  const { register, formState: { errors } } = useFormContext();
  const error = (errors[block.id] as any)?.message;

  return (
    <FieldWrapper label={p.label} helpText={p.helpText} required={p.required} error={error}>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="email"
          {...register(block.id)}
          placeholder={p.placeholder ?? "you@example.com"}
          className={`w-full pl-9 pr-3 py-2.5 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 transition-colors ${
            error ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-ring/50"
          }`}
        />
      </div>
    </FieldWrapper>
  );
}
