"use client";

import { useFormContext } from "react-hook-form";
import type { Block, MultiSelectProps } from "@/lib/types";
import FieldWrapper from "./field-wrapper";

export default function MultiSelectInput({ block }: { block: Block }) {
  const p = block.properties as MultiSelectProps;
  const { register, formState: { errors } } = useFormContext();
  const error = (errors[block.id] as { message?: string } | undefined)?.message;
  const options = p.options ?? [];

  return (
    <FieldWrapper label={p.label} helpText={p.helpText} required={p.required} error={error}>
      <div className="space-y-2">
        {options.map((opt, i) => (
          <label key={i} className="flex items-center gap-3 text-sm cursor-pointer group">
            <input
              type="checkbox"
              value={opt}
              {...register(block.id)}
              className="accent-primary w-4 h-4 rounded"
            />
            <span className="group-hover:text-foreground transition-colors">{opt}</span>
          </label>
        ))}
      </div>
    </FieldWrapper>
  );
}
