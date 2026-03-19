"use client";

import type { Block, BaseBlockProps } from "@/lib/types";

// Respondent field components
import ShortTextInput from "@/components/form/fields/short-text-input";
import LongTextInput from "@/components/form/fields/long-text-input";
import EmailInput from "@/components/form/fields/email-input";
import PhoneInput from "@/components/form/fields/phone-input";
import NumberInput from "@/components/form/fields/number-input";
import CurrencyInput from "@/components/form/fields/currency-input";
import DateInput from "@/components/form/fields/date-input";
import SingleSelectInput from "@/components/form/fields/single-select-input";
import MultiSelectInput from "@/components/form/fields/multi-select-input";
import FileUploadInput from "@/components/form/fields/file-upload-input";
import RatingInput from "@/components/form/fields/rating-input";
import YesNoInput from "@/components/form/fields/yes-no-input";
import ItemisationRenderer from "@/components/form/itemisation-renderer";

interface Props {
  block: Block;
  allValues: Record<string, unknown>;
}

// Evaluate a visibility rule
function isVisible(block: Block, values: Record<string, unknown>): boolean {
  const rule = (block.properties as BaseBlockProps)?.visibilityRule;
  if (!rule) return true;

  const refValue = values[rule.fieldId];
  switch (rule.operator) {
    case "equals": return String(refValue) === String(rule.value);
    case "not_equals": return String(refValue) !== String(rule.value);
    case "contains": return String(refValue).includes(String(rule.value));
    case "is_empty": return refValue === undefined || refValue === null || refValue === "";
    case "is_not_empty": return refValue !== undefined && refValue !== null && refValue !== "";
    default: return true;
  }
}

export default function FormBlockRenderer({ block, allValues }: Props) {
  if (!isVisible(block, allValues)) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = block.properties as any;

  switch (block.type) {
    // Content blocks (read-only)
    case "heading1": return <h1 className="text-[30px] font-bold">{p.text}</h1>;
    case "heading2": return <h2 className="text-[24px] font-semibold">{p.text}</h2>;
    case "heading3": return <h3 className="text-[20px] font-semibold">{p.text}</h3>;
    case "paragraph": return <p className="text-base text-foreground/90 leading-[1.5]">{p.text}</p>;
    case "bulleted_list":
      return <ul className="list-disc pl-5 space-y-1">{(p.items ?? []).map((item: string, i: number) => <li key={i}>{item}</li>)}</ul>;
    case "numbered_list":
      return <ol className="list-decimal pl-5 space-y-1">{(p.items ?? []).map((item: string, i: number) => <li key={i}>{item}</li>)}</ol>;
    case "quote":
      return <blockquote className="border-l-[3px] border-foreground pl-4 py-1 text-muted-foreground">{p.text}</blockquote>;
    case "callout":
      return (
        <div className="flex gap-3 p-4 rounded-[3px] bg-sidebar border-none">
          {p.emoji && <span className="text-lg">{p.emoji}</span>}
          <p className="text-sm">{p.text}</p>
        </div>
      );
    case "divider": return <hr className="border-border" />;
    case "spacer": return <div style={{ height: `${p.height ?? 32}px` }} aria-hidden />;
    case "page_break": return null; // handled by form renderer pagination

    // Layout
    case "column_layout": {
      const columnDefs = (p.columnDefs ?? []) as Array<{ id: string; span: number; blocks: Block[] }>;
      return (
        <div className="column-layout-grid grid gap-4" style={{ gridTemplateColumns: "repeat(12, 1fr)" }}>
          {columnDefs.map((col) => (
            <div
              key={col.id}
              className="space-y-4"
              style={{ gridColumn: `span ${col.span} / span ${col.span}` }}
            >
              {col.blocks.map((child) => (
                <FormBlockRenderer key={child.id} block={child} allValues={allValues} />
              ))}
            </div>
          ))}
        </div>
      );
    }

    // Field inputs
    case "short_text": return <ShortTextInput block={block} />;
    case "long_text": return <LongTextInput block={block} />;
    case "email": return <EmailInput block={block} />;
    case "phone": return <PhoneInput block={block} />;
    case "number": return <NumberInput block={block} />;
    case "currency": return <CurrencyInput block={block} />;
    case "date": return <DateInput block={block} />;
    case "single_select": return <SingleSelectInput block={block} />;
    case "multi_select": return <MultiSelectInput block={block} />;
    case "file_upload": return <FileUploadInput block={block} />;
    case "rating": return <RatingInput block={block} />;
    case "yes_no": return <YesNoInput block={block} />;
    case "itemisation": return <ItemisationRenderer block={block} allValues={allValues} />;

    default:
      return null;
  }
}
