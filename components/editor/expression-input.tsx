"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AVAILABLE_FUNCTIONS } from "@/lib/itemisation/expression";

interface ExpressionInputProps {
  value: string;
  onChange: (v: string) => void;
  allColumnLabels: string[];
  placeholder?: string;
  itemisationLabels?: string[];
  itemisationChildLabels?: Record<string, string[]>;
}

export default function ExpressionInput({
  value,
  onChange,
  allColumnLabels,
  placeholder = "{Length} * {Breadth}",
  itemisationLabels,
  itemisationChildLabels,
}: ExpressionInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<
    { label: string; detail: string; insert: string }[]
  >([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [triggerStart, setTriggerStart] = useState(0);
  const [triggerType, setTriggerType] = useState<"field" | "function">("field");

  const computeSuggestions = useCallback(
    (text: string, cursor: number) => {
      // Check for unmatched `{` → field mode
      let bracePos = -1;
      for (let i = cursor - 1; i >= 0; i--) {
        if (text[i] === "}") break;
        if (text[i] === "{") {
          // Make sure it's not `{=` (computed expression prefix)
          if (text[i + 1] === "=") break;
          bracePos = i;
          break;
        }
      }

      if (bracePos >= 0) {
        const query = text.slice(bracePos + 1, cursor).toLowerCase();

        // Detect if we're inside an ITEM_*( call for context-aware suggestions
        let contextLabels: string[] | null = null;
        if (itemisationLabels && itemisationChildLabels) {
          const before = text.slice(0, bracePos);
          const itemCallMatch = before.match(/ITEM_(?:SUM|COUNT|AVG|MIN|MAX)\(\s*$/);
          if (itemCallMatch) {
            // First argument position → suggest itemisation labels
            contextLabels = itemisationLabels;
          } else {
            const secondArgMatch = before.match(/ITEM_(?:SUM|COUNT|AVG|MIN|MAX)\(\{([^}]+)\},\s*$/);
            if (secondArgMatch) {
              // Second argument position → suggest child labels for matched itemisation
              const parentLabel = secondArgMatch[1].trim();
              contextLabels = itemisationChildLabels[parentLabel] ?? [];
            }
          }
        }

        const labels = contextLabels ?? allColumnLabels;
        const items = labels
          .filter((l) => l.toLowerCase().includes(query))
          .map((l) => ({ label: l, detail: contextLabels ? "itemisation" : "field", insert: `{${l}}` }));
        if (items.length > 0) {
          setTriggerType("field");
          setTriggerStart(bracePos);
          setSuggestions(items);
          setSelectedIdx(0);
          setShowSuggestions(true);
          return;
        }
      }

      // Function mode: extract current word before cursor (optional `/` trigger)
      const before = text.slice(0, cursor);
      const wordMatch = before.match(/(\/?[a-zA-Z]+)$/);
      if (wordMatch) {
        const raw = wordMatch[1];
        const word = raw.replace(/^\//, "").toUpperCase();
        const items = AVAILABLE_FUNCTIONS.filter((f) =>
          f.name.startsWith(word)
        ).map((f) => ({
          label: `${f.name}(${f.args})`,
          detail: f.description,
          insert: `${f.name}(`,
        }));
        if (items.length > 0) {
          setTriggerType("function");
          setTriggerStart(cursor - raw.length);
          setSuggestions(items);
          setSelectedIdx(0);
          setShowSuggestions(true);
          return;
        }
      }

      setShowSuggestions(false);
    },
    [allColumnLabels, itemisationLabels, itemisationChildLabels]
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newVal = e.target.value;
    onChange(newVal);
    const cursor = e.target.selectionStart ?? newVal.length;
    computeSuggestions(newVal, cursor);
  }

  function applySuggestion(item: { insert: string }) {
    const input = inputRef.current;
    if (!input) return;

    const cursor = input.selectionStart ?? value.length;
    const newVal = value.slice(0, triggerStart) + item.insert + value.slice(cursor);
    const newCursor = triggerStart + item.insert.length;

    onChange(newVal);
    setShowSuggestions(false);

    requestAnimationFrame(() => {
      input.setSelectionRange(newCursor, newCursor);
      input.focus();
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSuggestions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      applySuggestion(suggestions[selectedIdx]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  // Close suggestions on outside click
  useEffect(() => {
    if (!showSuggestions) return;
    function handleClick(e: MouseEvent) {
      if (inputRef.current && !inputRef.current.parentElement?.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSuggestions]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Delay to allow click on suggestion
          setTimeout(() => setShowSuggestions(false), 150);
        }}
        placeholder={placeholder}
        className="w-full text-xs font-mono bg-muted/50 border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-foreground/20"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 top-full mt-1 z-50 w-full max-h-40 overflow-y-auto bg-background border border-border rounded-[4px] shadow-lg">
          {suggestions.map((item, i) => (
            <button
              key={item.label}
              type="button"
              className={`w-full text-left px-2 py-1.5 text-xs flex items-center justify-between gap-2 hover:bg-muted/50 ${
                i === selectedIdx ? "bg-muted/70" : ""
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                applySuggestion(item);
              }}
            >
              <span className="font-mono text-foreground truncate">{item.label}</span>
              <span className="text-[10px] text-muted-foreground shrink-0">{item.detail}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
