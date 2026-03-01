"use client";

import type { Block } from "@/lib/types";
import { useEditorStore } from "@/lib/store/editor";

// Content blocks
import HeadingBlock from "@/components/editor/blocks/heading-block";
import ParagraphBlock from "@/components/editor/blocks/paragraph-block";
import ListBlock from "@/components/editor/blocks/list-block";
import QuoteBlock from "@/components/editor/blocks/quote-block";
import CalloutBlock from "@/components/editor/blocks/callout-block";
import DividerBlock from "@/components/editor/blocks/divider-block";

// Field blocks
import ShortTextField from "@/components/editor/blocks/short-text-block";
import LongTextField from "@/components/editor/blocks/long-text-block";
import EmailField from "@/components/editor/blocks/email-block";
import PhoneField from "@/components/editor/blocks/phone-block";
import NumberField from "@/components/editor/blocks/number-block";
import CurrencyField from "@/components/editor/blocks/currency-block";
import DateField from "@/components/editor/blocks/date-block";
import SingleSelectField from "@/components/editor/blocks/single-select-block";
import MultiSelectField from "@/components/editor/blocks/multi-select-block";
import FileUploadField from "@/components/editor/blocks/file-upload-block";
import RatingField from "@/components/editor/blocks/rating-block";
import YesNoField from "@/components/editor/blocks/yes-no-block";

// Layout blocks
import ColumnLayoutBlock from "@/components/editor/blocks/column-layout-block";
import SpacerBlock from "@/components/editor/blocks/spacer-block";
import PageBreakBlock from "@/components/editor/blocks/page-break-block";

// Special
import ItemisationBlock from "@/components/editor/blocks/itemisation-block";

interface BlockRendererProps {
  block: Block;
  readOnly?: boolean;
}

export default function BlockRenderer({ block, readOnly = false }: BlockRendererProps) {
  const { updateBlock } = useEditorStore();

  const onChange = (props: Partial<Block["properties"]>) => {
    if (!readOnly) updateBlock(block.id, props);
  };

  switch (block.type) {
    // Content
    case "heading1":
    case "heading2":
    case "heading3":
      return <HeadingBlock block={block} onChange={onChange} readOnly={readOnly} />;
    case "paragraph":
      return <ParagraphBlock block={block} onChange={onChange} readOnly={readOnly} />;
    case "bulleted_list":
    case "numbered_list":
      return <ListBlock block={block} onChange={onChange} readOnly={readOnly} />;
    case "quote":
      return <QuoteBlock block={block} onChange={onChange} readOnly={readOnly} />;
    case "callout":
      return <CalloutBlock block={block} onChange={onChange} readOnly={readOnly} />;
    case "divider":
      return <DividerBlock />;

    // Fields
    case "short_text":
      return <ShortTextField block={block} onChange={onChange} readOnly={readOnly} />;
    case "long_text":
      return <LongTextField block={block} onChange={onChange} readOnly={readOnly} />;
    case "email":
      return <EmailField block={block} onChange={onChange} readOnly={readOnly} />;
    case "phone":
      return <PhoneField block={block} onChange={onChange} readOnly={readOnly} />;
    case "number":
      return <NumberField block={block} onChange={onChange} readOnly={readOnly} />;
    case "currency":
      return <CurrencyField block={block} onChange={onChange} readOnly={readOnly} />;
    case "date":
      return <DateField block={block} onChange={onChange} readOnly={readOnly} />;
    case "single_select":
      return <SingleSelectField block={block} onChange={onChange} readOnly={readOnly} />;
    case "multi_select":
      return <MultiSelectField block={block} onChange={onChange} readOnly={readOnly} />;
    case "file_upload":
      return <FileUploadField block={block} onChange={onChange} readOnly={readOnly} />;
    case "rating":
      return <RatingField block={block} onChange={onChange} readOnly={readOnly} />;
    case "yes_no":
      return <YesNoField block={block} onChange={onChange} readOnly={readOnly} />;

    // Layout
    case "column_layout":
      return <ColumnLayoutBlock block={block} onChange={onChange} readOnly={readOnly} />;
    case "spacer":
      return <SpacerBlock block={block} />;
    case "page_break":
      return <PageBreakBlock block={block} onChange={onChange} readOnly={readOnly} />;

    // Special
    case "itemisation":
      return <ItemisationBlock block={block} onChange={onChange} readOnly={readOnly} />;

    default:
      return (
        <div className="p-3 border border-dashed border-border rounded text-sm text-muted-foreground">
          Unknown block type: {(block as any).type}
        </div>
      );
  }
}
