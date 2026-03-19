# Block Properties Reference

Exhaustive property tables for every Formdocs block type. Values are JSON-serializable. All properties are optional unless marked **required**.

---

## Base Field Properties

Applies to all field blocks (`short_text`, `long_text`, `email`, `phone`, `number`, `currency`, `date`, `single_select`, `multi_select`, `file_upload`, `rating`, `yes_no`).

| Property | Type | Default | Notes |
|---|---|---|---|
| `label` | `string` | `"<BlockType>"` | Display label shown above the input |
| `slug` | `string` | derived from label | Webhook payload key. Lowercase, alphanumeric + underscores. Auto-generated from label if omitted. |
| `placeholder` | `string` | `""` | Input placeholder text |
| `required` | `boolean` | `false` | Fails submission if empty |
| `helpText` | `string` | — | Helper text shown below the field |
| `visibilityRule` | `VisibilityRule` | — | Conditionally show/hide this block |

### VisibilityRule object

```json
{
  "fieldId": "<id of another block>",
  "operator": "equals",
  "value": "yes"
}
```

| `operator` | Behaviour |
|---|---|
| `equals` | show if field value equals `value` |
| `not_equals` | show if field value does not equal `value` |
| `contains` | show if field value contains `value` (substring) |
| `is_empty` | show if field has no value (ignore `value`) |
| `is_not_empty` | show if field has any value (ignore `value`) |

---

## Content Blocks

### `heading1` / `heading2` / `heading3`

| Property | Type | Default |
|---|---|---|
| `text` | `string` | `""` |

### `paragraph`

| Property | Type | Default |
|---|---|---|
| `text` | `string` | `""` |

### `bulleted_list` / `numbered_list`

| Property | Type | Default |
|---|---|---|
| `items` | `string[]` | `[""]` |

### `quote`

| Property | Type | Default |
|---|---|---|
| `text` | `string` | `""` |

### `callout`

| Property | Type | Default |
|---|---|---|
| `text` | `string` | `""` |
| `emoji` | `string` | `"💡"` |
| `backgroundColor` | `string` | `"yellow"` |

### `divider`

No properties. Use `"properties": {}`.

---

## Field Blocks

### `short_text`

Inherits base field props, plus:

| Property | Type | Default | Constraint |
|---|---|---|---|
| `minLength` | `number` | — | — |
| `maxLength` | `number` | — | — |
| `regex` | `string` | — | JS regex pattern string |

### `long_text`

Inherits base field props, plus:

| Property | Type | Default |
|---|---|---|
| `minLength` | `number` | — |
| `maxLength` | `number` | — |
| `showCharCounter` | `boolean` | `false` |

### `email`

Base field props only. Email format is validated automatically.

### `phone`

Inherits base field props, plus:

| Property | Type | Default |
|---|---|---|
| `countryCode` | `boolean` | `false` |

### `number`

Inherits base field props, plus:

| Property | Type | Default |
|---|---|---|
| `min` | `number` | — |
| `max` | `number` | — |
| `step` | `number` | `1` |
| `decimalPrecision` | `number` | `0` |

### `currency`

Inherits base field props, plus:

| Property | Type | Default |
|---|---|---|
| `currencySymbol` | `string` | `"$"` |
| `decimalPlaces` | `number` | `2` |

### `date`

Inherits base field props, plus:

| Property | Type | Default | Notes |
|---|---|---|---|
| `minDate` | `string` | — | ISO 8601 date string, e.g. `"2024-01-01"` |
| `maxDate` | `string` | — | ISO 8601 date string |
| `dateFormat` | `string` | `"YYYY-MM-DD"` | Display format token string |

### `single_select`

Inherits base field props, plus:

| Property | Type | Default | Constraint |
|---|---|---|---|
| `options` | `string[]` | `["Option 1", "Option 2"]` | **Required** — must have at least one item |
| `display` | `"dropdown" \| "radio"` | `"dropdown"` | — |

### `multi_select`

Inherits base field props, plus:

| Property | Type | Default | Constraint |
|---|---|---|---|
| `options` | `string[]` | `["Option 1", "Option 2"]` | **Required** — must have at least one item |
| `display` | `"checkbox" \| "tag"` | `"checkbox"` | — |
| `maxSelections` | `number` | — | Max number of choices |

### `file_upload`

Inherits base field props, plus:

| Property | Type | Default | Notes |
|---|---|---|---|
| `acceptedTypes` | `string[]` | `[]` (all) | MIME types, e.g. `["image/png", "application/pdf"]` |
| `maxFileSizeMb` | `number` | `10` | Max file size in megabytes |

Files are base64-encoded in the webhook payload.

### `rating`

Inherits base field props, plus:

| Property | Type | Default | Constraint |
|---|---|---|---|
| `maxStars` | `number` | `5` | 1–10 |
| `iconStyle` | `"stars" \| "hearts" \| "thumbs"` | `"stars"` | — |

### `yes_no`

Inherits base field props, plus:

| Property | Type | Default |
|---|---|---|
| `defaultState` | `boolean` | `false` |

---

## Layout Blocks

### `column_layout`

| Property | Type | Default | Notes |
|---|---|---|---|
| `columnDefs` | `ColumnDef[]` | two `span:6` columns | Array of column definitions. All spans must sum to 12. |

`children` is **not used** for `column_layout`. Blocks go inside each `ColumnDef`'s `blocks` array.

#### ColumnDef object

| Property | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | Unique column ID (nanoid recommended) |
| `span` | `number` | yes | Grid width (1–12). All spans in the layout must sum to 12. |
| `blocks` | `Block[]` | yes | Blocks rendered inside this column. Cannot contain `column_layout`, `itemisation`, or `page_break`. |

**Preset span combinations:**

| Preset | Spans | Description |
|---|---|---|
| 1/2 + 1/2 | `[6, 6]` | Two equal columns |
| 1/3 × 3 | `[4, 4, 4]` | Three equal columns |
| 1/4 × 4 | `[3, 3, 3, 3]` | Four equal columns |
| 2/3 + 1/3 | `[8, 4]` | Wide left |
| 1/3 + 2/3 | `[4, 8]` | Wide right |
| 3/4 + 1/4 | `[9, 3]` | Extra wide left |
| 1/4 + 3/4 | `[3, 9]` | Extra wide right |
| 1/4 + 1/2 + 1/4 | `[3, 6, 3]` | Wide center |
| 1/2 + 1/4 + 1/4 | `[6, 3, 3]` | Wide left, two narrow right |
| 1/4 + 1/4 + 1/2 | `[3, 3, 6]` | Two narrow left, wide right |

**Example — two equal columns:**

```json
{
  "id": "blk_cols",
  "type": "column_layout",
  "properties": {
    "columnDefs": [
      {
        "id": "col_a",
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
        "id": "col_b",
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

### `spacer`

| Property | Type | Default | Notes |
|---|---|---|---|
| `height` | `number` | `32` | Height in pixels |

### `page_break`

| Property | Type | Default | Notes |
|---|---|---|---|
| `label` | `string` | `"Next"` | Button label on "next page" button |

---

## Special: `itemisation`

The itemisation block renders a repeatable table of rows. Each row contains the fields defined in `children`. It supports computed fields (per-row expressions) and summary fields (cross-row aggregations).

### itemisation properties

| Property | Type | Default |
|---|---|---|
| `label` | `string` | `"Itemisation"` |
| `slug` | `string` | `"itemisation"` |
| `addButtonLabel` | `string` | `"+ Add Item"` |
| `rowLabelTemplate` | `string` | `"Item {n}"` |
| `minRows` | `number` | `1` |
| `maxRows` | `number` | `50` |
| `computedFields` | `ComputedField[]` | `[]` |
| `summaryFields` | `SummaryField[]` | `[]` |

`children` **required** — array of field blocks that define the columns of each row. Use standard field block types (`short_text`, `number`, `currency`, etc.).

### ComputedField object

Computed fields appear as a read-only column in each row, calculated from an expression.

| Property | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | Unique ID (nanoid or similar) |
| `label` | `string` | yes | Column header label |
| `expression` | `string` | yes | Expression using `{Field Label}` tokens, e.g. `"{Quantity} * {Unit Price}"` |
| `format` | `"number" \| "currency"` | no | Display format |
| `currencySymbol` | `string` | no | Used when `format: "currency"` |
| `decimalPlaces` | `number` | no | Decimal precision |

**Expression operators**: `+`, `-`, `*`, `/`, `^`, `%`, parentheses, and numeric literals.

Reference fields by their `label` wrapped in curly braces: `{Quantity}`, `{Unit Price}`.

### SummaryField object

Summary fields appear below the itemisation table as aggregated totals.

| Property | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | Unique ID |
| `label` | `string` | yes | Display label |
| `aggregation` | `"SUM" \| "COUNT" \| "AVERAGE" \| "MIN" \| "MAX"` | yes | Aggregation type |
| `sourceFieldId` | `string` | yes | `id` of the child field or computed field to aggregate |
| `format` | `"number" \| "currency"` | no | Display format |
| `currencySymbol` | `string` | no | Used when `format: "currency"` |
| `decimalPlaces` | `number` | no | Decimal precision |
