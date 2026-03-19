import type { BlockType } from "@/lib/types";

export type BlockCategory = "content" | "fields" | "layout" | "special";

export interface BlockDefinition {
  type: BlockType;
  label: string;
  description: string;
  category: BlockCategory;
  icon: string; // lucide icon name
  keywords: string[]; // for slash-command search
}

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  // ── Content ──────────────────────────────────────────────────────────────
  {
    type: "heading1",
    label: "Heading 1",
    description: "Large section heading",
    category: "content",
    icon: "Heading1",
    keywords: ["h1", "heading", "title", "large"],
  },
  {
    type: "heading2",
    label: "Heading 2",
    description: "Medium section heading",
    category: "content",
    icon: "Heading2",
    keywords: ["h2", "heading", "subtitle", "medium"],
  },
  {
    type: "heading3",
    label: "Heading 3",
    description: "Small section heading",
    category: "content",
    icon: "Heading3",
    keywords: ["h3", "heading", "small"],
  },
  {
    type: "paragraph",
    label: "Paragraph",
    description: "Plain body text",
    category: "content",
    icon: "AlignLeft",
    keywords: ["text", "paragraph", "body", "p"],
  },
  {
    type: "bulleted_list",
    label: "Bulleted List",
    description: "Unordered list with bullet markers",
    category: "content",
    icon: "List",
    keywords: ["bullet", "list", "unordered", "ul"],
  },
  {
    type: "numbered_list",
    label: "Numbered List",
    description: "Ordered list with sequential numbering",
    category: "content",
    icon: "ListOrdered",
    keywords: ["numbered", "ordered", "list", "ol"],
  },
  {
    type: "quote",
    label: "Quote",
    description: "Indented blockquote with left border",
    category: "content",
    icon: "Quote",
    keywords: ["quote", "blockquote", "callout"],
  },
  {
    type: "callout",
    label: "Callout",
    description: "Highlighted info box with emoji",
    category: "content",
    icon: "MessageSquare",
    keywords: ["callout", "info", "note", "warning", "tip"],
  },
  {
    type: "divider",
    label: "Divider",
    description: "Horizontal rule to separate sections",
    category: "content",
    icon: "Minus",
    keywords: ["divider", "separator", "hr", "line", "rule"],
  },

  // ── Fields ────────────────────────────────────────────────────────────────
  {
    type: "short_text",
    label: "Short Text",
    description: "Single-line text input",
    category: "fields",
    icon: "Type",
    keywords: ["text", "short", "input", "string", "name"],
  },
  {
    type: "long_text",
    label: "Long Text",
    description: "Multi-line textarea",
    category: "fields",
    icon: "AlignJustify",
    keywords: ["long", "text", "textarea", "multiline", "description", "message"],
  },
  {
    type: "email",
    label: "Email",
    description: "Email address field with format validation",
    category: "fields",
    icon: "Mail",
    keywords: ["email", "e-mail", "mail"],
  },
  {
    type: "phone",
    label: "Phone",
    description: "Phone number field",
    category: "fields",
    icon: "Phone",
    keywords: ["phone", "tel", "telephone", "mobile"],
  },
  {
    type: "number",
    label: "Number",
    description: "Numeric input with min/max/step",
    category: "fields",
    icon: "Hash",
    keywords: ["number", "num", "integer", "float", "quantity"],
  },
  {
    type: "currency",
    label: "Currency",
    description: "Monetary amount with currency symbol",
    category: "fields",
    icon: "DollarSign",
    keywords: ["currency", "money", "price", "amount", "dollar", "cost"],
  },
  {
    type: "date",
    label: "Date",
    description: "Date picker with min/max constraints",
    category: "fields",
    icon: "Calendar",
    keywords: ["date", "calendar", "day", "time"],
  },
  {
    type: "single_select",
    label: "Single Select",
    description: "Dropdown or radio button group",
    category: "fields",
    icon: "ChevronDown",
    keywords: ["select", "dropdown", "radio", "choice", "option", "single"],
  },
  {
    type: "multi_select",
    label: "Multi Select",
    description: "Checkboxes or tag selection",
    category: "fields",
    icon: "CheckSquare",
    keywords: ["multi", "select", "checkbox", "tag", "multiple"],
  },
  {
    type: "file_upload",
    label: "File Upload",
    description: "Upload files (base64-encoded to webhook)",
    category: "fields",
    icon: "Upload",
    keywords: ["file", "upload", "attachment", "document"],
  },
  {
    type: "rating",
    label: "Rating",
    description: "Star/heart/thumbs rating scale",
    category: "fields",
    icon: "Star",
    keywords: ["rating", "star", "review", "score", "nps"],
  },
  {
    type: "yes_no",
    label: "Yes / No",
    description: "Boolean toggle",
    category: "fields",
    icon: "ToggleLeft",
    keywords: ["yes", "no", "boolean", "toggle", "true", "false"],
  },

  // ── Layout ────────────────────────────────────────────────────────────────
  {
    type: "column_layout",
    label: "Columns",
    description: "Flexible multi-column layout with drag-and-drop",
    category: "layout",
    icon: "Columns2",
    keywords: ["column", "columns", "layout", "grid", "side", "section", "two", "three", "four"],
  },
  {
    type: "spacer",
    label: "Spacer",
    description: "Adjustable vertical whitespace",
    category: "layout",
    icon: "ArrowUpDown",
    keywords: ["space", "spacer", "gap", "padding", "blank"],
  },
  {
    type: "page_break",
    label: "Page Break",
    description: "Split form into multiple steps",
    category: "layout",
    icon: "SquareSplitVertical",
    keywords: ["page", "break", "step", "multi", "next"],
  },

  // ── Special ───────────────────────────────────────────────────────────────
  {
    type: "itemisation",
    label: "Itemisation",
    description: "Repeatable multi-field line items with computed totals",
    category: "special",
    icon: "Table",
    keywords: ["item", "itemisation", "itemization", "line", "table", "repeat", "rows", "invoice", "order"],
  },
];

export const CONTENT_BLOCKS = BLOCK_DEFINITIONS.filter((b) => b.category === "content");
export const FIELD_BLOCKS = BLOCK_DEFINITIONS.filter((b) => b.category === "fields");
export const LAYOUT_BLOCKS = BLOCK_DEFINITIONS.filter((b) => b.category === "layout");
export const SPECIAL_BLOCKS = BLOCK_DEFINITIONS.filter((b) => b.category === "special");

export function getBlockDefinition(type: BlockType): BlockDefinition | undefined {
  return BLOCK_DEFINITIONS.find((b) => b.type === type);
}

export function searchBlocks(query: string): BlockDefinition[] {
  const q = query.toLowerCase().trim();
  if (!q) return BLOCK_DEFINITIONS;
  return BLOCK_DEFINITIONS.filter(
    (b) =>
      b.label.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q) ||
      b.keywords.some((k) => k.includes(q))
  );
}
