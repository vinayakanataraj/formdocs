"use client";

import { useFormContext } from "react-hook-form";
import type { Block, SingleSelectProps } from "@/lib/types";
import FieldWrapper from "./field-wrapper";

export default function SingleSelectInput({ block }: { block: Block }) {
  const p = block.properties as SingleSelectProps;
  const { register, formState: { errors } } = useFormContext();
  const error = (errors[block.id] as { message?: string } | undefined)?.message;
  const options = p.options ?? [];

  if (p.display === "radio" || options.length <= 8) {
    if (p.display === "radio") {
      return (
        <FieldWrapper label={p.label} helpText={p.helpText} required={p.required} error={error}>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <label key={i} className="flex items-center gap-3 text-sm cursor-pointer group">
                <input
                  type="radio"
                  value={opt}
                  {...register(block.id)}
                  className="accent-primary w-4 h-4"
                />
                <span className="group-hover:text-foreground transition-colors">{opt}</span>
              </label>
            ))}
          </div>
        </FieldWrapper>
      );
    }
  }

  return (
    <FieldWrapper label={p.label} helpText={p.helpText} required={p.required} error={error}>
      <select
        {...register(block.id)}
        className={`w-full px-3 py-2.5 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 transition-colors ${
          error ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-ring/50"
        }`}
      >
        <option value="">{p.placeholder ?? "Select an option…"}</option>
        {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
      </select>
    </FieldWrapper>
  );
}
