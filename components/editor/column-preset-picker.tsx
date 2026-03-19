"use client";

import { useState } from "react";
import { COLUMN_PRESETS } from "@/lib/blocks/column-presets";
import { LayoutGrid } from "lucide-react";

interface Props {
  currentSpans: number[];
  onSelect: (spans: number[]) => void;
}

export default function ColumnPresetPicker({ currentSpans, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const currentPreset = COLUMN_PRESETS.find(
    (p) => p.spans.join("-") === currentSpans.join("-")
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted/50"
        title="Change layout preset"
      >
        <LayoutGrid className="w-3 h-3" />
        <span>{currentPreset?.label ?? "Custom"}</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 z-50 bg-background border border-border rounded-lg shadow-lg p-3 w-56">
            <p className="text-xs font-medium text-muted-foreground mb-2">Layout preset</p>
            <div className="space-y-1">
              {COLUMN_PRESETS.map((preset) => {
                const isActive = preset.spans.join("-") === currentSpans.join("-");
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      onSelect(preset.spans);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-2 py-1.5 rounded text-xs hover:bg-muted transition-colors ${isActive ? "bg-muted" : ""}`}
                  >
                    {/* Visual preview */}
                    <div className="flex gap-0.5 w-16 h-4 shrink-0">
                      {preset.spans.map((span, i) => (
                        <div
                          key={i}
                          className="h-full rounded-sm bg-muted-foreground/30"
                          style={{ flex: span }}
                        />
                      ))}
                    </div>
                    <span className="text-left">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
