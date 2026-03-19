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
    short_text: { label: "Short Text", slug: "short_text", placeholder: "", required: false },
    long_text: { label: "Long Text", slug: "long_text", placeholder: "", required: false, showCharCounter: false },
    email: { label: "Email", slug: "email", placeholder: "you@example.com", required: false },
    phone: { label: "Phone", slug: "phone", placeholder: "", required: false, countryCode: false },
    number: { label: "Number", slug: "number", placeholder: "", required: false, step: 1, decimalPrecision: 0 },
    currency: { label: "Currency", slug: "currency", placeholder: "", required: false, currencySymbol: "$", decimalPlaces: 2 },
    date: { label: "Date", slug: "date", required: false, dateFormat: "YYYY-MM-DD" },
    single_select: { label: "Single Select", slug: "single_select", required: false, options: ["Option 1", "Option 2"], display: "dropdown" },
    multi_select: { label: "Multi Select", slug: "multi_select", required: false, options: ["Option 1", "Option 2"], display: "checkbox" },
    file_upload: { label: "File Upload", slug: "file_upload", required: false, acceptedTypes: [], maxFileSizeMb: 10 },
    rating: { label: "Rating", slug: "rating", required: false, maxStars: 5, iconStyle: "stars" },
    yes_no: { label: "Yes / No", slug: "yes_no", required: false, defaultState: false },

    // Layout
    column_layout: {
      columnDefs: [
        { id: nanoid(), span: 6, blocks: [] },
        { id: nanoid(), span: 6, blocks: [] },
      ],
    },
    spacer: { height: 32 },
    page_break: { label: "Next" },

    // Special
    itemisation: {
      label: "Itemisation",
      slug: "itemisation",
      addButtonLabel: "+ Add Item",
      rowLabelTemplate: "Item {n}",
      minRows: 1,
      maxRows: 50,
      computedFields: [],
      summaryFields: [],
    },
    itemisation_advanced: {
      label: "Itemisation (Advanced)",
      slug: "itemisation_advanced",
      addButtonLabel: "+ Add Item",
      rowLabelTemplate: "Item {n}",
      minRows: 1,
      maxRows: 50,
      computedFields: [],
      summaryFields: [],
      defaultItems: [],
    },
  };

  return {
    id,
    type,
    properties: defaultProperties[type] ?? {},
    children: (type === "itemisation" || type === "itemisation_advanced") ? [] : undefined,
    ...overrides,
  };
}
