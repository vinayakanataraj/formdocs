"use client";

import { ReactNode } from "react";

interface FieldWrapperProps {
  label?: string;
  helpText?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export default function FieldWrapper({ label, helpText, required, children, className }: FieldWrapperProps) {
  return (
    <div className={`space-y-1.5 py-1 ${className ?? ""}`}>
      {label !== undefined && (
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium">{label || "Field label"}</span>
          {required && <span className="text-destructive text-sm">*</span>}
        </div>
      )}
      {children}
      {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
    </div>
  );
}
