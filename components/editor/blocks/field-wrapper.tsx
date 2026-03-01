"use client";

import { ReactNode, useEffect, useRef } from "react";

interface FieldWrapperProps {
  label?: string;
  helpText?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  onLabelChange?: (label: string) => void;
  readOnly?: boolean;
}

export default function FieldWrapper({ label, helpText, required, children, className, onLabelChange, readOnly }: FieldWrapperProps) {
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (labelRef.current && document.activeElement !== labelRef.current) {
      labelRef.current.innerHTML = label ?? "";
    }
  }, [label]);

  return (
    <div className={`space-y-1.5 py-1 ${className ?? ""}`}>
      {label !== undefined && (
        <div className="flex items-center gap-1">
          {onLabelChange && !readOnly ? (
            <div
              ref={labelRef}
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => onLabelChange((e.target as HTMLDivElement).innerText)}
              data-placeholder="Field label"
              className="text-sm font-normal outline-none min-w-[1px] empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40"
            />
          ) : (
            <span className="text-sm font-normal">{label || "Field label"}</span>
          )}
          {required && <span className="text-muted-foreground text-sm">*</span>}
        </div>
      )}
      {children}
      {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
    </div>
  );
}
