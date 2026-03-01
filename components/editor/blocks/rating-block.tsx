"use client";

import type { Block, RatingProps } from "@/lib/types";
import FieldWrapper from "./field-wrapper";
import { Star, Heart, ThumbsUp } from "lucide-react";

interface Props { block: Block; onChange: (p: any) => void; readOnly?: boolean; }

const ICON_MAP = { stars: Star, hearts: Heart, thumbs: ThumbsUp };

export default function RatingField({ block, onChange, readOnly }: Props) {
  const p = block.properties as RatingProps;
  const max = p.maxStars ?? 5;
  const Icon = ICON_MAP[p.iconStyle ?? "stars"];

  return (
    <FieldWrapper label={p.label} helpText={p.helpText} required={p.required}>
      <div className="flex gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <Icon key={i} className="w-6 h-6 text-muted-foreground/40" />
        ))}
      </div>
    </FieldWrapper>
  );
}
