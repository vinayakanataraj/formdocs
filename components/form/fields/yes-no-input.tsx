"use client";

import { useFormContext, Controller } from "react-hook-form";
import type { Block, YesNoProps } from "@/lib/types";
import FieldWrapper from "./field-wrapper";

export default function YesNoInput({ block }: { block: Block }) {
  const p = block.properties as YesNoProps;
  const { control, formState: { errors } } = useFormContext();
  const error = (errors[block.id] as { message?: string } | undefined)?.message;

  return (
    <FieldWrapper label={p.label} helpText={p.helpText} required={p.required} error={error}>
      <Controller
        name={block.id}
        control={control}
        render={({ field }) => (
          <div className="flex gap-3">
            {[
              { label: "Yes", value: true },
              { label: "No", value: false },
            ].map(({ label, value }) => (
              <button
                key={label}
                type="button"
                onClick={() => field.onChange(value)}
                className={`px-5 py-2 text-sm rounded-lg border transition-colors ${
                  field.value === value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      />
    </FieldWrapper>
  );
}
