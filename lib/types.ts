// ─── Block Type Identifiers ───────────────────────────────────────────────────

export type ContentBlockType =
  | "heading1"
  | "heading2"
  | "heading3"
  | "paragraph"
  | "bulleted_list"
  | "numbered_list"
  | "quote"
  | "callout"
  | "divider";

export type FieldBlockType =
  | "short_text"
  | "long_text"
  | "email"
  | "phone"
  | "number"
  | "currency"
  | "date"
  | "single_select"
  | "multi_select"
  | "file_upload"
  | "rating"
  | "yes_no";

export type LayoutBlockType = "column_layout" | "spacer" | "page_break";

export type BlockType =
  | ContentBlockType
  | FieldBlockType
  | LayoutBlockType
  | "itemisation";

// ─── Conditional Visibility Rule ──────────────────────────────────────────────

export interface VisibilityRule {
  fieldId: string;
  operator: "equals" | "not_equals" | "contains" | "is_empty" | "is_not_empty";
  value: string;
}

// ─── Block Properties (per type) ──────────────────────────────────────────────

export interface BaseBlockProps {
  label?: string;
  slug?: string;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  visibilityRule?: VisibilityRule;
}

export interface ShortTextProps extends BaseBlockProps {
  minLength?: number;
  maxLength?: number;
  regex?: string;
}

export interface LongTextProps extends BaseBlockProps {
  minLength?: number;
  maxLength?: number;
  showCharCounter?: boolean;
}

export type EmailProps = BaseBlockProps;

export interface PhoneProps extends BaseBlockProps {
  countryCode?: boolean;
}

export interface NumberProps extends BaseBlockProps {
  min?: number;
  max?: number;
  step?: number;
  decimalPrecision?: number;
}

export interface CurrencyProps extends BaseBlockProps {
  currencySymbol?: string;
  decimalPlaces?: number;
}

export interface DateProps extends BaseBlockProps {
  minDate?: string;
  maxDate?: string;
  dateFormat?: string;
}

export interface SingleSelectProps extends BaseBlockProps {
  options: string[];
  display?: "dropdown" | "radio";
}

export interface MultiSelectProps extends BaseBlockProps {
  options: string[];
  display?: "checkbox" | "tag";
  maxSelections?: number;
}

export interface FileUploadProps extends BaseBlockProps {
  acceptedTypes?: string[];
  maxFileSizeMb?: number;
}

export interface RatingProps extends BaseBlockProps {
  maxStars?: number;
  iconStyle?: "stars" | "hearts" | "thumbs";
}

export interface YesNoProps extends BaseBlockProps {
  defaultState?: boolean;
}

export interface HeadingProps {
  text?: string;
}

export interface ParagraphProps {
  text?: string;
}

export interface BulletedListProps {
  items?: string[];
}

export interface NumberedListProps {
  items?: string[];
}

export interface QuoteProps {
  text?: string;
}

export interface CalloutProps {
  text?: string;
  emoji?: string;
  backgroundColor?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DividerProps {}

export interface ColumnLayoutProps {
  columns?: 2 | 3;
}

export interface SpacerProps {
  height?: number; // px
}

export interface PageBreakProps {
  label?: string;
}

export interface ComputedField {
  id: string;
  label: string;
  expression: string; // e.g. "{Quantity} * {Unit Price}"
  format?: "number" | "currency";
  currencySymbol?: string;
  decimalPlaces?: number;
}

export interface SummaryField {
  id: string;
  label: string;
  aggregation: "SUM" | "COUNT" | "AVERAGE" | "MIN" | "MAX";
  sourceFieldId: string;
  format?: "number" | "currency";
  currencySymbol?: string;
  decimalPlaces?: number;
}

export interface ItemisationProps {
  label?: string;
  slug?: string;
  addButtonLabel?: string;
  rowLabelTemplate?: string;
  minRows?: number;
  maxRows?: number;
  computedFields?: ComputedField[];
  summaryFields?: SummaryField[];
}

export type BlockProperties =
  | ShortTextProps
  | LongTextProps
  | EmailProps
  | PhoneProps
  | NumberProps
  | CurrencyProps
  | DateProps
  | SingleSelectProps
  | MultiSelectProps
  | FileUploadProps
  | RatingProps
  | YesNoProps
  | HeadingProps
  | ParagraphProps
  | BulletedListProps
  | NumberedListProps
  | QuoteProps
  | CalloutProps
  | DividerProps
  | ColumnLayoutProps
  | SpacerProps
  | PageBreakProps
  | ItemisationProps;

// ─── Block ────────────────────────────────────────────────────────────────────

export interface Block {
  id: string;
  type: BlockType;
  properties: BlockProperties;
  children?: Block[]; // for itemisation template rows and column layout columns
}

// ─── Webhook Config ────────────────────────────────────────────────────────────

export interface WebhookHeader {
  key: string;
  value: string;
}

export interface WebhookConfig {
  url: string;
  method: "POST" | "PUT" | "PATCH";
  headers: WebhookHeader[];
  payloadFormat: "json" | "form_urlencoded";
  retries: number; // 0–3
  timeoutSeconds: number;
  waitForResponse?: boolean;
}

// ─── Form Meta ─────────────────────────────────────────────────────────────────

export interface FormMeta {
  title: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
  iconEmoji?: string;
  accentColor?: string;
  logoUrl?: string;
  footerText?: string;
  submitButtonText?: string;
  successMessage?: string;
  redirectUrl?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// ─── Form (the full JSON file) ─────────────────────────────────────────────────

export interface Form {
  meta: FormMeta;
  webhook: WebhookConfig;
  blocks: Block[];
}

// ─── Webhook Payload (sent on submission) ─────────────────────────────────────

export interface WebhookPayload {
  meta: {
    slug: string;
    title: string;
    submittedAt: string;
    userAgent?: string;
    ip?: string;
  };
  data: Record<string, unknown>;
}

// ─── Editor Block Props ────────────────────────────────────────────────────────

export interface EditorBlockProps {
  block: Block;
  onChange: (props: Partial<Block["properties"]>) => void;
  readOnly?: boolean;
}

// ─── Editor State Types ────────────────────────────────────────────────────────

export type EditorMode = "editor" | "preview";

export interface EditorState {
  form: Form;
  selectedBlockId: string | null;
  mode: EditorMode;
  isDirty: boolean;
  isSaving: boolean;
}

// ─── Admin Auth ────────────────────────────────────────────────────────────────

export interface AdminSession {
  authenticated: boolean;
  expiresAt: number;
}
