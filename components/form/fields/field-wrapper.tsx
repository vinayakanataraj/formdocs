"use client";

import { ReactNode } from "react";

interface FieldWrapperProps {
  label?: string;
  helpText?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}

export default function FieldWrapper({ label, helpText, required, error, children }: FieldWrapperProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center gap-1">
          <label className="text-sm font-medium">{label}</label>
          {required && <span className="text-destructive text-sm" aria-label="required">*</span>}
        </div>
      )}
      {children}
      {helpText && !error && <p className="text-xs text-muted-foreground">{helpText}</p>}
      {error && <p className="text-xs text-destructive animate-in slide-in-from-top-1">{error}</p>}
    </div>
  );
}
