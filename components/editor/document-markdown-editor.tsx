"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEditorStore } from "@/lib/store/editor";
import DocumentSlashPalette from "./document-slash-palette";
import ItemisationTableSetupModal from "./itemisation-table-setup-modal";
import type { ColumnEntry, ComputedColumn } from "./itemisation-table-setup-modal";
import { ChevronDown, ChevronRight, Settings } from "lucide-react";
import { generateDocument } from "@/lib/document/generate";
import { buildSampleData } from "@/lib/document/sample-data";
import { ensureBlockSlugs } from "@/lib/utils";
import {
  findTableAtCursor,
  findBlockBySlug,
  reconstructConfig,
  type ParsedTableBlock,
} from "@/lib/document/parse-table-markdown";
import type { Block } from "@/lib/types";

export default function DocumentMarkdownEditor() {
  const form = useEditorStore((s) => s.form);
  const updateDocumentTemplate = useEditorStore((s) => s.updateDocumentTemplate);
  const template = form.documentTemplate;

  const enabled = template?.enabled ?? false;
  const markdown = template?.markdown ?? "";
  const branding = template?.branding ?? {
    companyName: "",
    currencySymbol: "₹",
    numberFormat: "indian" as const,
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [brandingOpen, setBrandingOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);
  const [showSampleValues, setShowSampleValues] = useState(false);
  const [tableAtCursor, setTableAtCursor] = useState<ParsedTableBlock | null>(null);
  const [editingTable, setEditingTable] = useState<{
    parsed: ParsedTableBlock;
    block: Block;
    initialColumns: ColumnEntry[];
    initialComputedColumns: ComputedColumn[];
  } | null>(null);

  const previewMarkdown = useMemo(() => {
    if (!showSampleValues || !markdown) return markdown;
    const normalizedBlocks = ensureBlockSlugs(form.blocks);
    const sampleData = buildSampleData(normalizedBlocks);
    return generateDocument({ form: { ...form, blocks: normalizedBlocks }, submissionData: sampleData }).markdown;
  }, [showSampleValues, markdown, form]);

  function handleMarkdownChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    updateDocumentTemplate({ markdown: e.target.value });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "/") {
      const el = e.currentTarget;
      const pos = el.selectionStart;
      const before = el.value.slice(0, pos);
      const lastChar = before.slice(-1);
      if (before.length === 0 || lastChar === "\n" || lastChar === " " || lastChar === "\t") {
        setTimeout(() => {
          setCursorPos(el.selectionStart);
          setPaletteOpen(true);
        }, 0);
      }
    }
    if (e.key === "Escape") setPaletteOpen(false);
  }

  const insertAtCursor = useCallback((text: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const newVal = el.value.slice(0, cursorPos - 1) + text + el.value.slice(cursorPos);
    updateDocumentTemplate({ markdown: newVal });
    setTimeout(() => {
      const newPos = cursorPos - 1 + text.length;
      el.setSelectionRange(newPos, newPos);
      el.focus();
    }, 0);
    setPaletteOpen(false);
  }, [cursorPos, updateDocumentTemplate]);

  function handleCursorChange() {
    const el = textareaRef.current;
    if (!el) return;
    setTableAtCursor(findTableAtCursor(el.value, el.selectionStart));
  }

  function openTableEditor() {
    if (!tableAtCursor) return;
    const block = findBlockBySlug(form.blocks, tableAtCursor.slug);
    if (!block) return;
    const { columns, computedColumns } = reconstructConfig(tableAtCursor, block);
    setEditingTable({
      parsed: tableAtCursor,
      block,
      initialColumns: columns,
      initialComputedColumns: computedColumns,
    });
  }

  const replaceTable = useCallback(
    (text: string) => {
      if (!editingTable) return;
      const { startIndex, endIndex } = editingTable.parsed;
      const current = markdown;
      // Preserve summary lines after the generated table body
      const summaryText =
        editingTable.parsed.summaryLines.length > 0
          ? "\n" + editingTable.parsed.summaryLines.join("\n")
          : "";
      // The generated text already includes {{/table}}, so inject summaries before closing tag
      const closingTag = `{{/table ${editingTable.parsed.slug}}}`;
      const withSummary = summaryText
        ? text.replace(closingTag, summaryText + "\n" + closingTag)
        : text;
      const newVal = current.slice(0, startIndex) + withSummary + "\n" + current.slice(endIndex);
      updateDocumentTemplate({ markdown: newVal });
      setEditingTable(null);
    },
    [editingTable, markdown, updateDocumentTemplate]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Top bar: enable toggle + branding */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-border/30 bg-background shrink-0">
        {/* Enable toggle */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => updateDocumentTemplate({ enabled: !enabled })}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              enabled ? "bg-foreground" : "bg-muted"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                enabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
          <span className="text-xs text-muted-foreground">
            {enabled ? "Document generation on" : "Document generation off"}
          </span>
        </div>

        {/* Branding collapsible */}
        {enabled && (
          <div className="relative">
            <button
              onClick={() => setBrandingOpen((o) => !o)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Branding
              {brandingOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {brandingOpen && (
              <div className="absolute left-0 top-full mt-1 z-30 bg-popover border border-border rounded shadow-md p-3 w-72 space-y-2">
                <div>
                  <label className="text-xs text-muted-foreground">Company Name</label>
                  <input
                    type="text"
                    value={branding.companyName}
                    onChange={(e) =>
                      updateDocumentTemplate({ branding: { ...branding, companyName: e.target.value } })
                    }
                    className="mt-0.5 w-full text-xs border border-border rounded px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-foreground/20"
                    placeholder="Your Company Name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Currency Symbol</label>
                    <input
                      type="text"
                      value={branding.currencySymbol}
                      onChange={(e) =>
                        updateDocumentTemplate({ branding: { ...branding, currencySymbol: e.target.value } })
                      }
                      className="mt-0.5 w-full text-xs border border-border rounded px-2 py-1.5 bg-background focus:outline-none"
                      placeholder="₹"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Number Format</label>
                    <select
                      value={branding.numberFormat}
                      onChange={(e) =>
                        updateDocumentTemplate({
                          branding: {
                            ...branding,
                            numberFormat: e.target.value as "indian" | "international",
                          },
                        })
                      }
                      className="mt-0.5 w-full text-xs border border-border rounded px-2 py-1.5 bg-background focus:outline-none"
                    >
                      <option value="indian">Indian (1,23,456)</option>
                      <option value="international">International (123,456)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {enabled && (
          <span className="text-xs text-muted-foreground/60 ml-auto">
            Type <kbd className="px-1 py-0.5 text-[10px] border border-border rounded font-mono bg-muted">/</kbd> to insert variables
          </span>
        )}
      </div>

      {/* Editor + preview panes */}
      {enabled ? (
        <div className="flex flex-1 overflow-hidden">
          {/* Left: raw markdown editor */}
          <div className="relative flex flex-col w-1/2 border-r border-border/30">
            <div className="px-3 py-1.5 border-b border-border/20 bg-muted/20 shrink-0">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Markdown</span>
            </div>
            <textarea
              ref={textareaRef}
              value={markdown}
              onChange={handleMarkdownChange}
              onKeyDown={handleKeyDown}
              onClick={handleCursorChange}
              onKeyUp={handleCursorChange}
              className="flex-1 w-full px-5 py-4 text-xs font-mono bg-background focus:outline-none resize-none leading-relaxed text-foreground"
              placeholder={"# {{company_name}} Quotation\n\n**Client:** {{client_name}}\n**Date:** {{date}}\n\n{{#table items}}\n| Description | Qty | Rate | Amount |\n| {description} | {quantity} | {rate} | {= {quantity} * {rate} | currency} |\n{{summary Total = SUM({= {quantity} * {rate}}) | currency}}\n{{/table items}}"}
              spellCheck={false}
            />
            {tableAtCursor && !paletteOpen && !editingTable && (
              <button
                onClick={openTableEditor}
                className="absolute top-10 right-2 z-20 flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-muted-foreground bg-background border border-border rounded shadow-sm hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <Settings className="w-3 h-3" />
                Edit Table
              </button>
            )}
            {paletteOpen && (
              <DocumentSlashPalette
                onInsert={insertAtCursor}
                onClose={() => setPaletteOpen(false)}
              />
            )}
            {editingTable && (
              <ItemisationTableSetupModal
                block={editingTable.block}
                onInsert={replaceTable}
                onClose={() => setEditingTable(null)}
                initialColumns={editingTable.initialColumns}
                initialComputedColumns={editingTable.initialComputedColumns}
                mode="update"
              />
            )}
          </div>

          {/* Right: live markdown preview */}
          <div className="flex flex-col w-1/2 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/20 bg-muted/20 shrink-0">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Preview</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">Sample values</span>
                <button
                  onClick={() => setShowSampleValues((v) => !v)}
                  className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                    showSampleValues ? "bg-foreground" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${
                      showSampleValues ? "translate-x-3.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {markdown ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0 text-foreground">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-semibold mb-3 mt-5 text-foreground">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base font-semibold mb-2 mt-4 text-foreground">{children}</h3>,
                    p: ({ children }) => <p className="text-sm mb-3 leading-relaxed text-foreground">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    ul: ({ children }) => <ul className="list-disc list-outside pl-5 mb-3 space-y-1 text-sm text-foreground">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-outside pl-5 mb-3 space-y-1 text-sm text-foreground">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    hr: () => <hr className="my-5 border-border" />,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-border pl-4 my-3 text-sm text-muted-foreground italic">{children}</blockquote>
                    ),
                    code: ({ children, className }) => {
                      const isBlock = className?.includes("language-");
                      return isBlock ? (
                        <pre className="bg-muted rounded px-3 py-2 text-xs font-mono mb-3 overflow-x-auto"><code>{children}</code></pre>
                      ) : (
                        <code className="bg-muted rounded px-1 py-0.5 text-xs font-mono text-foreground">{children}</code>
                      );
                    },
                    table: ({ children }) => (
                      <div className="overflow-x-auto mb-4">
                        <table className="w-full text-sm border-collapse">{children}</table>
                      </div>
                    ),
                    thead: ({ children }) => <thead className="border-b border-border">{children}</thead>,
                    tbody: ({ children }) => <tbody>{children}</tbody>,
                    tr: ({ children }) => <tr className="border-b border-border/50 last:border-0">{children}</tr>,
                    th: ({ children }) => <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">{children}</th>,
                    td: ({ children }) => <td className="px-3 py-2 text-xs text-foreground">{children}</td>,
                  }}
                >
                  {previewMarkdown}
                </ReactMarkdown>
              ) : (
                <p className="text-sm text-muted-foreground/50 italic">Start typing markdown on the left…</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Enable document generation to start editing</p>
        </div>
      )}
    </div>
  );
}
