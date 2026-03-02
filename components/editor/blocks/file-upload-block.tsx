"use client";

import type { FileUploadProps, EditorBlockProps } from "@/lib/types";
import FieldWrapper from "./field-wrapper";
import { Upload } from "lucide-react";

export default function FileUploadField({ block, onChange, readOnly }: EditorBlockProps) {
  const p = block.properties as FileUploadProps;
  const maxMb = p.maxFileSizeMb ?? 10;
  const types = p.acceptedTypes?.join(", ") || "Any file type";

  return (
    <FieldWrapper label={p.label} helpText={p.helpText} required={p.required} onLabelChange={(label) => onChange({ label })} readOnly={readOnly}>
      <div className="border-2 border-dashed border-border rounded-[4px] p-6 text-center space-y-1">
        <Upload className="w-6 h-6 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
        <p className="text-xs text-muted-foreground/60">{types} · Max {maxMb}MB</p>
      </div>
    </FieldWrapper>
  );
}
