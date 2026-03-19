---
name: formdocs-form-composer
description: Compose valid Formdocs form JSON from scratch or add/edit fields and blocks. Use when a user wants to create a form, build a form, generate form JSON, add fields to a form, or configure a Formdocs form programmatically.
---

# Formdocs Form Composer

You are an expert at composing valid Formdocs form JSON. Use this skill to generate, edit, or explain Formdocs form JSON structures.

## Form Storage

Forms are plain JSON files stored at `data/forms/<slug>.json`. You can:
- Write directly to `data/forms/<slug>.json`
- Use the API: `PUT /api/forms/<slug>` with the form JSON as the request body (requires admin auth cookie)

## Top-Level Structure

Every form JSON has exactly three top-level keys:

```json
{
  "meta": { ... },
  "webhook": { ... },
  "blocks": [ ... ]
}
```

---

## `meta` — Form Metadata

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `title` | `string` | **yes** | — | Display title of the form |
| `slug` | `string` | **yes** | — | URL-safe ID: lowercase alphanumeric + hyphens only (`/^[a-z0-9-]+$/`) |
| `description` | `string` | no | `""` | Subtitle shown on the form |
| `coverImageUrl` | `string` | no | `""` | URL of a cover image |
| `iconEmoji` | `string` | no | `""` | Emoji icon shown with the title |
| `accentColor` | `string` | no | `"#0f172a"` | Hex color for buttons and accents |
| `logoUrl` | `string` | no | `""` | URL of a logo image |
| `footerText` | `string` | no | `""` | Footer text below the form |
| `submitButtonText` | `string` | no | `"Submit"` | Label on the submit button |
| `successMessage` | `string` | no | `"Thank you! Your response has been submitted."` | Shown after successful submission |
| `redirectUrl` | `string` | no | `""` | URL to redirect to after submission (overrides successMessage) |
| `createdAt` | `string` | **yes** | — | ISO 8601 datetime, e.g. `"2024-01-15T10:00:00.000Z"` |
| `updatedAt` | `string` | **yes** | — | ISO 8601 datetime |

---

## `webhook` — Submission Delivery

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `url` | `string` | **yes** | `""` | Webhook endpoint URL (or empty string for no webhook) |
| `method` | `"POST" \| "PUT" \| "PATCH"` | **yes** | `"POST"` | HTTP method |
| `headers` | `WebhookHeader[]` | **yes** | `[{"key":"Content-Type","value":"application/json"}]` | Array of `{key, value}` objects |
| `payloadFormat` | `"json" \| "form_urlencoded"` | **yes** | `"json"` | Payload encoding |
| `retries` | `number` | **yes** | `2` | Retry count on failure (0–3) |
| `timeoutSeconds` | `number` | **yes** | `10` | Request timeout (1–60 seconds) |
| `waitForResponse` | `boolean` | no | `false` | If true, show webhook response to user after submit |

---

## `blocks` — Form Content

An ordered array of block objects. Blocks render top-to-bottom in the form.

### Block shape

```json
{
  "id": "<unique string>",
  "type": "<block type>",
  "properties": { ... },
  "children": [ ... ]
}
```

- `id`: Any unique string. Use nanoid (`nanoid()`) or any UUID/random string.
- `type`: One of the 26 block types listed below.
- `properties`: Type-specific object (see details below or `references/block-properties.md`).
- `children`: Only present for `itemisation` and `itemisation_advanced`. Array of child field blocks (defines columns of each row).

---

## Block Types

### Content (9 types)

| Type | Key property | Description |
|---|---|---|
| `heading1` | `text: string` | Large section heading |
| `heading2` | `text: string` | Medium section heading |
| `heading3` | `text: string` | Small section heading |
| `paragraph` | `text: string` | Body text |
| `bulleted_list` | `items: string[]` | Unordered bullet list |
| `numbered_list` | `items: string[]` | Numbered ordered list |
| `quote` | `text: string` | Indented blockquote |
| `callout` | `text`, `emoji`, `backgroundColor` | Highlighted info box |
| `divider` | _(none)_ | Horizontal separator line |

### Field Blocks (12 types)

All field blocks share **base field properties**:

| Property | Type | Default |
|---|---|---|
| `label` | `string` | Block type name |
| `slug` | `string` | Auto-derived from label |
| `placeholder` | `string` | `""` |
| `required` | `boolean` | `false` |
| `helpText` | `string` | — |
| `visibilityRule` | `VisibilityRule` | — |

**The `slug` is the key used in the webhook payload.** Make it descriptive: `"full_name"`, `"company_email"`, etc.

| Type | Extra properties | Notable defaults |
|---|---|---|
| `short_text` | `minLength`, `maxLength`, `regex` | — |
| `long_text` | `minLength`, `maxLength`, `showCharCounter` | `showCharCounter: false` |
| `email` | _(none beyond base)_ | Format-validated automatically |
| `phone` | `countryCode: boolean` | `countryCode: false` |
| `number` | `min`, `max`, `step`, `decimalPrecision` | `step: 1`, `decimalPrecision: 0` |
| `currency` | `currencySymbol`, `decimalPlaces` | `"$"`, `2` |
| `date` | `minDate`, `maxDate`, `dateFormat` | `dateFormat: "YYYY-MM-DD"` |
| `single_select` | `options: string[]` (**required**), `display` | `display: "dropdown"` |
| `multi_select` | `options: string[]` (**required**), `display`, `maxSelections` | `display: "checkbox"` |
| `file_upload` | `acceptedTypes: string[]`, `maxFileSizeMb` | `[]` (all types), `10` MB |
| `rating` | `maxStars` (1–10), `iconStyle` | `5`, `"stars"` |
| `yes_no` | `defaultState: boolean` | `false` |

### Layout Blocks (3 types)

| Type | Properties | Notes |
|---|---|---|
| `column_layout` | `columnDefs: ColumnDef[]` | Array of column definitions (spans must sum to 12); blocks go inside each column's `blocks` array — not in the top-level `children` field |
| `spacer` | `height: number` (px) | Default `32` |
| `page_break` | `label: string` | Default `"Next"` — splits form into pages |

#### ColumnDef object

```json
{ "id": "<unique string>", "span": 6, "blocks": [ ... ] }
```

| Property | Type | Notes |
|---|---|---|
| `id` | `string` | Unique ID for this column (nanoid recommended) |
| `span` | `number` | Width on a 12-grid: 1–12. All spans in a `column_layout` must sum to 12. |
| `blocks` | `Block[]` | Blocks inside this column. Cannot contain `column_layout`, `itemisation`, or `page_break`. |

**Preset span combinations** (all sum to 12):

| Label | Spans |
|---|---|
| 1/2 + 1/2 | `[6, 6]` |
| 1/3 × 3 | `[4, 4, 4]` |
| 1/4 × 4 | `[3, 3, 3, 3]` |
| 2/3 + 1/3 | `[8, 4]` |
| 1/3 + 2/3 | `[4, 8]` |
| 3/4 + 1/4 | `[9, 3]` |
| 1/4 + 3/4 | `[3, 9]` |
| 1/4 + 1/2 + 1/4 | `[3, 6, 3]` |
| 1/2 + 1/4 + 1/4 | `[6, 3, 3]` |
| 1/4 + 1/4 + 1/2 | `[3, 3, 6]` |

### Special (2 types)

| Type | Notes |
|---|---|
| `itemisation` | Repeatable row table. `children` defines the column fields. Supports `computedFields` (per-row expressions) and `summaryFields` (cross-row aggregations). |
| `itemisation_advanced` | Same as `itemisation`, plus a `defaultItems` array that pre-populates rows when the form first loads. Form fillers see these rows already filled in and can edit, remove, or add more. |

---

## Slug System

- Every field block should have a `slug` — the key used in the webhook JSON payload.
- Slugs are **lowercase alphanumeric + underscores** (no hyphens, no spaces).
- Auto-generate from label: lowercase, replace spaces with `_`, strip special characters.
- Examples: `"Full Name"` → `"full_name"`, `"Company Email"` → `"company_email"`
- Slugs **do not need to be unique** across the form, but duplicates will overwrite each other in the payload — keep them unique.

---

## Visibility Rules

Show or hide a block conditionally based on another field's value:

```json
"visibilityRule": {
  "fieldId": "<id of the controlling block>",
  "operator": "equals",
  "value": "Yes"
}
```

Operators: `equals`, `not_equals`, `contains`, `is_empty`, `is_not_empty`.

Use `fieldId` = the `id` of another block (not the slug). `value` is always a string.

---

## `itemisation_advanced` — Default Items

`itemisation_advanced` accepts all the same properties and `children` as `itemisation`, plus a `defaultItems` array:

```json
"defaultItems": [
  {
    "id": "<unique string>",
    "values": [
      { "fieldId": "<child block id>", "value": "Widget A" },
      { "fieldId": "<child block id>", "value": 3 },
      { "fieldId": "<child block id>", "value": 9.99 }
    ]
  }
]
```

- Each entry in `defaultItems` is a pre-filled row.
- `values` is a sparse array — you only need entries for fields you want to pre-fill; unset fields default to empty.
- `fieldId` must match the `id` of a block in `children`.
- `value` type must match the field type: `string` for text/select/date, `number` for number/currency, `boolean` for yes_no.
- If the form is resumed from autosave, the saved rows are used instead (the guard prevents double-population).

---

## Computed & Summary Fields (Itemisation)

### ComputedField

A read-only column in each row computed from an expression:

```json
{
  "id": "comp_abc123",
  "label": "Line Total",
  "expression": "{Quantity} * {Unit Price}",
  "format": "currency",
  "currencySymbol": "$",
  "decimalPlaces": 2
}
```

Reference fields by their `label` (the `label` property of the child block), wrapped in `{}`. Supported operators: `+`, `-`, `*`, `/`, `^`, `%`, parentheses.

### SummaryField

An aggregation shown below the table:

```json
{
  "id": "sum_abc123",
  "label": "Grand Total",
  "aggregation": "SUM",
  "sourceFieldId": "<id of computed field or child field>",
  "format": "currency",
  "currencySymbol": "$",
  "decimalPlaces": 2
}
```

Aggregations: `SUM`, `COUNT`, `AVERAGE`, `MIN`, `MAX`.

---

## Examples

### Minimal valid form

```json
{
  "meta": {
    "title": "Simple Form",
    "slug": "simple-form",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  "webhook": {
    "url": "",
    "method": "POST",
    "headers": [{ "key": "Content-Type", "value": "application/json" }],
    "payloadFormat": "json",
    "retries": 2,
    "timeoutSeconds": 10
  },
  "blocks": [
    {
      "id": "block_01",
      "type": "short_text",
      "properties": {
        "label": "Your Name",
        "slug": "your_name",
        "required": true
      }
    }
  ]
}
```

---

### Contact form (realistic multi-field example)

```json
{
  "meta": {
    "title": "Contact Us",
    "slug": "contact-us",
    "description": "We'll get back to you within 24 hours.",
    "iconEmoji": "📬",
    "accentColor": "#2563eb",
    "submitButtonText": "Send Message",
    "successMessage": "Thanks! We'll be in touch soon.",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  "webhook": {
    "url": "https://hooks.example.com/contact",
    "method": "POST",
    "headers": [
      { "key": "Content-Type", "value": "application/json" },
      { "key": "X-API-Key", "value": "your-secret-key" }
    ],
    "payloadFormat": "json",
    "retries": 2,
    "timeoutSeconds": 15
  },
  "blocks": [
    {
      "id": "blk_h1",
      "type": "heading2",
      "properties": { "text": "Get in touch" }
    },
    {
      "id": "blk_name",
      "type": "short_text",
      "properties": {
        "label": "Full Name",
        "slug": "full_name",
        "placeholder": "Jane Smith",
        "required": true
      }
    },
    {
      "id": "blk_email",
      "type": "email",
      "properties": {
        "label": "Email Address",
        "slug": "email",
        "placeholder": "jane@example.com",
        "required": true
      }
    },
    {
      "id": "blk_subject",
      "type": "single_select",
      "properties": {
        "label": "Subject",
        "slug": "subject",
        "options": ["General Enquiry", "Support", "Sales", "Other"],
        "display": "dropdown",
        "required": true
      }
    },
    {
      "id": "blk_msg",
      "type": "long_text",
      "properties": {
        "label": "Message",
        "slug": "message",
        "placeholder": "Tell us how we can help...",
        "required": true,
        "minLength": 20,
        "showCharCounter": true
      }
    },
    {
      "id": "blk_attach",
      "type": "file_upload",
      "properties": {
        "label": "Attachment (optional)",
        "slug": "attachment",
        "acceptedTypes": ["image/png", "image/jpeg", "application/pdf"],
        "maxFileSizeMb": 5
      }
    }
  ]
}
```

---

### Multi-page form (using page_break)

```json
{
  "meta": {
    "title": "Job Application",
    "slug": "job-application",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  "webhook": {
    "url": "https://hooks.example.com/jobs",
    "method": "POST",
    "headers": [{ "key": "Content-Type", "value": "application/json" }],
    "payloadFormat": "json",
    "retries": 2,
    "timeoutSeconds": 10
  },
  "blocks": [
    {
      "id": "blk_h1",
      "type": "heading1",
      "properties": { "text": "Personal Details" }
    },
    {
      "id": "blk_name",
      "type": "short_text",
      "properties": { "label": "Full Name", "slug": "full_name", "required": true }
    },
    {
      "id": "blk_email",
      "type": "email",
      "properties": { "label": "Email", "slug": "email", "required": true }
    },
    {
      "id": "blk_pb1",
      "type": "page_break",
      "properties": { "label": "Continue to Experience" }
    },
    {
      "id": "blk_h2",
      "type": "heading1",
      "properties": { "text": "Work Experience" }
    },
    {
      "id": "blk_role",
      "type": "short_text",
      "properties": { "label": "Current Role", "slug": "current_role" }
    },
    {
      "id": "blk_exp",
      "type": "single_select",
      "properties": {
        "label": "Years of Experience",
        "slug": "years_experience",
        "options": ["0–1", "1–3", "3–5", "5–10", "10+"],
        "required": true
      }
    },
    {
      "id": "blk_cv",
      "type": "file_upload",
      "properties": {
        "label": "Upload CV",
        "slug": "cv",
        "acceptedTypes": ["application/pdf"],
        "maxFileSizeMb": 5,
        "required": true
      }
    }
  ]
}
```

---

### Itemisation form (invoice / order with totals)

```json
{
  "meta": {
    "title": "Purchase Order",
    "slug": "purchase-order",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  "webhook": {
    "url": "https://hooks.example.com/orders",
    "method": "POST",
    "headers": [{ "key": "Content-Type", "value": "application/json" }],
    "payloadFormat": "json",
    "retries": 2,
    "timeoutSeconds": 10
  },
  "blocks": [
    {
      "id": "blk_name",
      "type": "short_text",
      "properties": { "label": "Requester Name", "slug": "requester_name", "required": true }
    },
    {
      "id": "blk_items",
      "type": "itemisation",
      "properties": {
        "label": "Line Items",
        "slug": "line_items",
        "addButtonLabel": "+ Add Item",
        "rowLabelTemplate": "Item {n}",
        "minRows": 1,
        "maxRows": 20,
        "computedFields": [
          {
            "id": "comp_total",
            "label": "Line Total",
            "expression": "{Quantity} * {Unit Price}",
            "format": "currency",
            "currencySymbol": "$",
            "decimalPlaces": 2
          }
        ],
        "summaryFields": [
          {
            "id": "sum_grand",
            "label": "Grand Total",
            "aggregation": "SUM",
            "sourceFieldId": "comp_total",
            "format": "currency",
            "currencySymbol": "$",
            "decimalPlaces": 2
          }
        ]
      },
      "children": [
        {
          "id": "col_desc",
          "type": "short_text",
          "properties": { "label": "Description", "slug": "description", "required": true }
        },
        {
          "id": "col_qty",
          "type": "number",
          "properties": {
            "label": "Quantity",
            "slug": "quantity",
            "required": true,
            "min": 1,
            "step": 1,
            "decimalPrecision": 0
          }
        },
        {
          "id": "col_price",
          "type": "currency",
          "properties": {
            "label": "Unit Price",
            "slug": "unit_price",
            "required": true,
            "currencySymbol": "$",
            "decimalPlaces": 2
          }
        }
      ]
    }
  ]
}
```

---

### Itemisation Advanced (invoice with pre-filled default rows)

```json
{
  "meta": {
    "title": "Service Invoice",
    "slug": "service-invoice",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  "webhook": {
    "url": "https://hooks.example.com/invoices",
    "method": "POST",
    "headers": [{ "key": "Content-Type", "value": "application/json" }],
    "payloadFormat": "json",
    "retries": 2,
    "timeoutSeconds": 10
  },
  "blocks": [
    {
      "id": "blk_client",
      "type": "short_text",
      "properties": { "label": "Client Name", "slug": "client_name", "required": true }
    },
    {
      "id": "blk_items",
      "type": "itemisation_advanced",
      "properties": {
        "label": "Services",
        "slug": "services",
        "addButtonLabel": "+ Add Service",
        "rowLabelTemplate": "Service {n}",
        "minRows": 1,
        "maxRows": 20,
        "defaultItems": [
          {
            "id": "default_item_1",
            "values": [
              { "fieldId": "col_desc", "value": "Consulting" },
              { "fieldId": "col_qty",  "value": 1 },
              { "fieldId": "col_rate", "value": 150 }
            ]
          },
          {
            "id": "default_item_2",
            "values": [
              { "fieldId": "col_desc", "value": "Project Management" },
              { "fieldId": "col_qty",  "value": 2 },
              { "fieldId": "col_rate", "value": 100 }
            ]
          }
        ],
        "computedFields": [
          {
            "id": "comp_line",
            "label": "Line Total",
            "expression": "{Quantity} * {Rate}",
            "format": "currency",
            "currencySymbol": "$",
            "decimalPlaces": 2
          }
        ],
        "summaryFields": [
          {
            "id": "sum_total",
            "label": "Total Due",
            "aggregation": "SUM",
            "sourceFieldId": "comp_line",
            "format": "currency",
            "currencySymbol": "$",
            "decimalPlaces": 2
          }
        ]
      },
      "children": [
        {
          "id": "col_desc",
          "type": "short_text",
          "properties": { "label": "Description", "slug": "description", "required": true }
        },
        {
          "id": "col_qty",
          "type": "number",
          "properties": { "label": "Quantity", "slug": "quantity", "required": true, "min": 1, "step": 1, "decimalPrecision": 0 }
        },
        {
          "id": "col_rate",
          "type": "currency",
          "properties": { "label": "Rate", "slug": "rate", "required": true, "currencySymbol": "$", "decimalPlaces": 2 }
        }
      ]
    }
  ]
}
```

> **Key rule:** Every `fieldId` in `defaultItems[].values` must match the `id` of a block in `children`. Use `itemisation_advanced` instead of `itemisation` whenever you want rows pre-populated. Both block types support the same `computedFields`, `summaryFields`, and `children` structure.

---

### Column layout (two-column name + email side by side)

```json
{
  "id": "blk_cols",
  "type": "column_layout",
  "properties": {
    "columnDefs": [
      {
        "id": "col_left",
        "span": 6,
        "blocks": [
          {
            "id": "blk_first",
            "type": "short_text",
            "properties": { "label": "First Name", "slug": "first_name", "required": true }
          }
        ]
      },
      {
        "id": "col_right",
        "span": 6,
        "blocks": [
          {
            "id": "blk_last",
            "type": "short_text",
            "properties": { "label": "Last Name", "slug": "last_name", "required": true }
          }
        ]
      }
    ]
  }
}
```

> Spans must sum to 12. Use `[8,4]` for a wide-left layout, `[4,4,4]` for three equal columns, `[3,3,3,3]` for four, etc. Cannot nest `column_layout`, `itemisation`, or `page_break` inside a column.

---

## Step-by-Step Composition Guide

1. **Start with `meta`**: set `title`, `slug` (kebab-case), `createdAt`/`updatedAt` (current ISO datetime).
2. **Configure `webhook`**: set `url` (or `""` if no webhook), keep `method: "POST"`, `payloadFormat: "json"`, `retries: 2`, `timeoutSeconds: 10`.
3. **Build `blocks` array** top-to-bottom:
   - Add heading/paragraph blocks for section titles and instructions.
   - Add field blocks with meaningful `label` and `slug` values.
   - Use `page_break` to split into multiple steps.
   - Use `column_layout` to place fields side by side (put blocks in each column's `blocks` array, not top-level `children`).
   - Use `itemisation` for repeatable rows with computed totals; use `itemisation_advanced` when you want rows pre-populated via `defaultItems`.
4. **IDs**: Every block needs a unique `id`. Any unique string works: `"blk_01"`, `"V1StGXR8_Z5jdHi6B"`, etc.
5. **Slugs**: Use `lowercase_with_underscores`. These become the keys in the webhook payload.
6. **Required fields**: `single_select` and `multi_select` must have an `options` array.

## Reference

For exhaustive per-block property tables, see `references/block-properties.md` in this skill directory.

For default property values, see `lib/blocks/defaults.ts` in the Formdocs repo.
