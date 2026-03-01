"use client";

import { useFormContext, Controller } from "react-hook-form";
import type { Block, RatingProps } from "@/lib/types";
import FieldWrapper from "./field-wrapper";
import { Star, Heart, ThumbsUp } from "lucide-react";
import { useState } from "react";

const ICONS = { stars: Star, hearts: Heart, thumbs: ThumbsUp };

export default function RatingInput({ block }: { block: Block }) {
  const p = block.properties as RatingProps;
  const { control, formState: { errors } } = useFormContext();
  const error = (errors[block.id] as any)?.message;
  const max = p.maxStars ?? 5;
  const Icon = ICONS[p.iconStyle ?? "stars"];

  return (
    <FieldWrapper label={p.label} helpText={p.helpText} required={p.required} error={error}>
      <Controller
        name={block.id}
        control={control}
        render={({ field }) => {
          const [hovered, setHovered] = useState<number | null>(null);
          const current = hovered ?? field.value ?? 0;

          return (
            <div className="flex gap-1" role="radiogroup">
              {Array.from({ length: max }).map((_, i) => {
                const val = i + 1;
                const isActive = val <= current;
                return (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={field.value === val}
                    onMouseEnter={() => setHovered(val)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => field.onChange(val)}
                    className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring rounded"
                  >
                    <Icon
                      className={`w-7 h-7 transition-colors ${
                        isActive ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          );
        }}
      />
    </FieldWrapper>
  );
}
