"use client";

import { useFormContext, Controller } from "react-hook-form";
import type { Block, FileUploadProps } from "@/lib/types";
import FieldWrapper from "./field-wrapper";
import { Upload, X, File } from "lucide-react";
import { useState, useRef } from "react";

export default function FileUploadInput({ block }: { block: Block }) {
  const p = block.properties as FileUploadProps;
  const { control, formState: { errors } } = useFormContext();
  const error = (errors[block.id] as { message?: string } | undefined)?.message;
  const [files, setFiles] = useState<{ name: string; size: number; base64: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <FieldWrapper label={p.label} helpText={p.helpText} required={p.required} error={error}>
      <Controller
        name={block.id}
        control={control}
        render={({ field }) => (
          <>
            <div
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:bg-muted/50 ${
                error ? "border-destructive" : "border-border hover:border-ring"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept={p.acceptedTypes?.join(",")}
                multiple={(p.maxFileSizeMb ?? 1) > 0}
                onChange={async (e) => {
                  const raw = Array.from(e.target.files ?? []);
                  const maxMb = p.maxFileSizeMb ?? 10;
                  const result: typeof files = [];
                  for (const f of raw) {
                    if (f.size > maxMb * 1024 * 1024) continue; // skip oversized
                    const base64 = await new Promise<string>((res) => {
                      const reader = new FileReader();
                      reader.onload = () => res(reader.result as string);
                      reader.readAsDataURL(f);
                    });
                    result.push({ name: f.name, size: f.size, base64 });
                  }
                  setFiles(result);
                  field.onChange(result);
                }}
              />
              <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Click to upload or drag & drop</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {p.acceptedTypes?.join(", ") || "Any file"} · Max {p.maxFileSizeMb ?? 10}MB
              </p>
            </div>

            {files.length > 0 && (
              <ul className="space-y-1.5 mt-2">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs p-2 bg-muted rounded-md">
                    <File className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="flex-1 truncate">{f.name}</span>
                    <span className="text-muted-foreground shrink-0">{(f.size / 1024).toFixed(0)}KB</span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = files.filter((_, j) => j !== i);
                        setFiles(next);
                        field.onChange(next.length > 0 ? next : null);
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      />
    </FieldWrapper>
  );
}
