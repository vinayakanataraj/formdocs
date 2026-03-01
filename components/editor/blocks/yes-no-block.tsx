"use client";

import type { Block, YesNoProps } from "@/lib/types";
import FieldWrapper from "./field-wrapper";

interface Props { block: Block; onChange: (p: any) => void; readOnly?: boolean; }

export default function YesNoField({ block, onChange, readOnly }: Props) {
  const p = block.properties as YesNoProps;

  return (
    <FieldWrapper label={p.label} helpText={p.helpText} required={p.required} onLabelChange={(label) => onChange({ label })} readOnly={readOnly}>
      <div className="flex gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-default">
          <input type="radio" name={block.id} disabled className="accent-primary" />
          Yes
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-default">
          <input type="radio" name={block.id} disabled className="accent-primary" />
          No
        </label>
      </div>
    </FieldWrapper>
  );
}
