import { z } from "zod";

// ─── Visibility Rule ───────────────────────────────────────────────────────────

export const visibilityRuleSchema = z.object({
  fieldId: z.string(),
  operator: z.enum(["equals", "not_equals", "contains", "is_empty", "is_not_empty"]),
  value: z.string(),
});

// ─── Base Field Props ──────────────────────────────────────────────────────────

const baseFieldProps = {
  label: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  helpText: z.string().optional(),
  visibilityRule: visibilityRuleSchema.optional(),
};

// ─── Block Property Schemas ────────────────────────────────────────────────────

export const shortTextPropsSchema = z.object({
  ...baseFieldProps,
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  regex: z.string().optional(),
});

export const longTextPropsSchema = z.object({
  ...baseFieldProps,
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  showCharCounter: z.boolean().optional(),
});

export const emailPropsSchema = z.object({ ...baseFieldProps });

export const phonePropsSchema = z.object({
  ...baseFieldProps,
  countryCode: z.boolean().optional(),
});

export const numberPropsSchema = z.object({
  ...baseFieldProps,
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  decimalPrecision: z.number().optional(),
});

export const currencyPropsSchema = z.object({
  ...baseFieldProps,
  currencySymbol: z.string().optional(),
  decimalPlaces: z.number().optional(),
});

export const datePropsSchema = z.object({
  ...baseFieldProps,
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
  dateFormat: z.string().optional(),
});

export const singleSelectPropsSchema = z.object({
  ...baseFieldProps,
  options: z.array(z.string()),
  display: z.enum(["dropdown", "radio"]).optional(),
});

export const multiSelectPropsSchema = z.object({
  ...baseFieldProps,
  options: z.array(z.string()),
  display: z.enum(["checkbox", "tag"]).optional(),
  maxSelections: z.number().optional(),
});

export const fileUploadPropsSchema = z.object({
  ...baseFieldProps,
  acceptedTypes: z.array(z.string()).optional(),
  maxFileSizeMb: z.number().optional(),
});

export const ratingPropsSchema = z.object({
  ...baseFieldProps,
  maxStars: z.number().min(1).max(10).optional(),
  iconStyle: z.enum(["stars", "hearts", "thumbs"]).optional(),
});

export const yesNoPropsSchema = z.object({
  ...baseFieldProps,
  defaultState: z.boolean().optional(),
});

export const headingPropsSchema = z.object({ text: z.string().optional() });
export const paragraphPropsSchema = z.object({ text: z.string().optional() });
export const bulletedListPropsSchema = z.object({ items: z.array(z.string()).optional() });
export const numberedListPropsSchema = z.object({ items: z.array(z.string()).optional() });
export const quotePropsSchema = z.object({ text: z.string().optional() });
export const calloutPropsSchema = z.object({
  text: z.string().optional(),
  emoji: z.string().optional(),
  backgroundColor: z.string().optional(),
});
export const dividerPropsSchema = z.object({});
export const columnLayoutPropsSchema = z.object({ columns: z.union([z.literal(2), z.literal(3)]).optional() });
export const spacerPropsSchema = z.object({ height: z.number().optional() });
export const pageBreakPropsSchema = z.object({ label: z.string().optional() });

export const computedFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  expression: z.string(),
});

export const summaryFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  aggregation: z.enum(["SUM", "COUNT", "AVERAGE", "MIN", "MAX"]),
  sourceFieldId: z.string(),
});

export const itemisationPropsSchema = z.object({
  addButtonLabel: z.string().optional(),
  rowLabelTemplate: z.string().optional(),
  minRows: z.number().optional(),
  maxRows: z.number().optional(),
  computedFields: z.array(computedFieldSchema).optional(),
  summaryFields: z.array(summaryFieldSchema).optional(),
});

// ─── Block Schema ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const blockSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string(),
    type: z.enum([
      "heading1", "heading2", "heading3", "paragraph",
      "bulleted_list", "numbered_list", "quote", "callout", "divider",
      "short_text", "long_text", "email", "phone", "number", "currency",
      "date", "single_select", "multi_select", "file_upload", "rating", "yes_no",
      "column_layout", "spacer", "page_break", "itemisation",
    ]),
    properties: z.record(z.string(), z.unknown()),
    children: z.array(blockSchema).optional(),
  })
);

// ─── Webhook Config Schema ─────────────────────────────────────────────────────

export const webhookHeaderSchema = z.object({
  key: z.string(),
  value: z.string(),
});

export const webhookConfigSchema = z.object({
  url: z.string().url().or(z.literal("")),
  method: z.enum(["POST", "PUT", "PATCH"]),
  headers: z.array(webhookHeaderSchema),
  payloadFormat: z.enum(["json", "form_urlencoded"]),
  retries: z.number().min(0).max(3),
  timeoutSeconds: z.number().min(1).max(60),
});

// ─── Form Meta Schema ──────────────────────────────────────────────────────────

export const formMetaSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().optional(),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  iconEmoji: z.string().optional(),
  accentColor: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  footerText: z.string().optional(),
  submitButtonText: z.string().optional(),
  successMessage: z.string().optional(),
  redirectUrl: z.string().url().optional().or(z.literal("")),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ─── Full Form Schema ──────────────────────────────────────────────────────────

export const formSchema = z.object({
  meta: formMetaSchema,
  webhook: webhookConfigSchema,
  blocks: z.array(blockSchema),
});

export type FormSchemaType = z.infer<typeof formSchema>;
