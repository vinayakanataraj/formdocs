import { nanoid } from "nanoid";
import type { Block, BlockType } from "@/lib/types";

export function createBlock(type: BlockType, overrides: Partial<Block> = {}): Block {
  const id = nanoid();

  const defaultProperties: Record<BlockType, Block["properties"]> = {
    // Content
    heading1: { text: "" },
    heading2: { text: "" },
    heading3: { text: "" },
    paragraph: { text: "" },
    bulleted_list: { items: [""] },
    numbered_list: { items: [""] },
    quote: { text: "" },
    callout: { text: "", emoji: "💡", backgroundColor: "yellow" },
    divider: {},

    // Fields
    short_text: { label: "Short Text", placeholder: "", required: false },
    long_text: { label: "Long Text", placeholder: "", required: false, showCharCounter: false },
    email: { label: "Email", placeholder: "you@example.com", required: false },
    phone: { label: "Phone", placeholder: "", required: false, countryCode: false },
    number: { label: "Number", placeholder: "", required: false, step: 1, decimalPrecision: 0 },
    currency: { label: "Currency", placeholder: "", required: false, currencySymbol: "$", decimalPlaces: 2 },
    date: { label: "Date", required: false, dateFormat: "YYYY-MM-DD" },
    single_select: { label: "Single Select", required: false, options: ["Option 1", "Option 2"], display: "dropdown" },
    multi_select: { label: "Multi Select", required: false, options: ["Option 1", "Option 2"], display: "checkbox" },
    file_upload: { label: "File Upload", required: false, acceptedTypes: [], maxFileSizeMb: 10 },
    rating: { label: "Rating", required: false, maxStars: 5, iconStyle: "stars" },
    yes_no: { label: "Yes / No", required: false, defaultState: false },

    // Layout
    column_layout: { columns: 2 },
    spacer: { height: 32 },
    page_break: { label: "Next" },

    // Special
    itemisation: {
      addButtonLabel: "+ Add Item",
      rowLabelTemplate: "Item {n}",
      minRows: 1,
      maxRows: 50,
      computedFields: [],
      summaryFields: [],
    },
  };

  return {
    id,
    type,
    properties: defaultProperties[type] ?? {},
    children: type === "itemisation" || type === "column_layout" ? [] : undefined,
    ...overrides,
  };
}
