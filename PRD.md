# Formdocs — Product Requirements Document

**Version:** 1.0  
**Status:** Draft  
**Date:** February 28, 2026  
**License:** Open Source (MIT)

*A Notion-style form builder you can deploy in 60 seconds. No database. No auth provider. Just deploy and build.*

---

## 1. Executive Summary

Formdocs is an open-source, self-hostable form builder that replicates the look, feel, and interaction model of Notion. It ships as a single Next.js application designed for one-click deployment to Vercel, with zero external dependencies such as databases, authentication providers, or paid third-party services.

Forms are authored through a block-based editor with slash-command insertion, drag-and-drop reordering, and inline configuration. Each form is persisted as a JSON file within the project repository. Completed form submissions are delivered to user-configured webhook endpoints, enabling integration with automation platforms like Make.com, n8n, or Zapier.

The defining feature is the **Itemisation Block**, a repeatable-section primitive that allows form respondents to add structured, multi-field line items (products, expenses, guests, tasks) directly within a form, with support for computed fields and live totals.

---

## 2. Problem Statement

Existing form builders fall into two camps. Simple tools like Google Forms offer limited customisation, no programmatic response routing, and a rigid aesthetic. Advanced tools like Typeform, Tally, or JotForm are either SaaS-only (requiring accounts, subscriptions, and trust in a third-party data custodian) or require complex self-hosting setups with databases, caching layers, and authentication systems.

There is a gap for developers, freelancers, and small teams who want:

- A beautiful, Notion-quality editing experience for building forms.
- Full ownership of the deployment, with no vendor lock-in or recurring cost.
- Webhook-first response handling, so data flows into their existing automation stack.
- A structured line-item capability (itemisation) that most form builders lack entirely.

---

## 3. Product Vision

### 3.1 One-Line Vision

*Formdocs is the form builder that thinks it's a Notion page.*

### 3.2 Design Principles

- **Text-first authoring.** The editor opens to a blank canvas. You start typing immediately. Form fields are inserted inline, just like blocks in a document.
- **Zero infrastructure.** No database, no Redis, no auth provider. One environment variable (ADMIN_SECRET) and you are live.
- **Webhook-native.** Formdocs does not store responses. It delivers them instantly to wherever you point it. Your data, your pipeline.
- **Deploy in 60 seconds.** Clone the repo, click Deploy to Vercel, set one env var, done.
- **Open source, forkable, extendable.** MIT-licensed. Add your own block types, themes, or integrations.

### 3.3 Non-Goals

Formdocs intentionally does not aim to be:

- A SaaS product with user accounts, multi-tenancy, or billing.
- A response database or analytics dashboard.
- A full Notion clone (no databases, kanban boards, or wikis).
- A visual theme marketplace.
- A complex conditional-logic engine beyond single-level field visibility rules.

---

## 4. Target Users

| Persona | Description | Primary Need |
|---------|-------------|--------------|
| Indie Developer | Ships side projects, client work, or internal tools on Vercel/Netlify. | Self-hosted forms without SaaS overhead. |
| Freelancer / Consultant | Sends quotation requests, intake forms, and project briefs to clients. | Itemisation for line-item pricing and structured data collection. |
| Small Agency | Manages multiple client projects, needs branded forms. | Clean design, webhook integration, fast deployment per client. |
| Privacy-Conscious Team | Needs form data to never touch a third-party server. | Full data sovereignty via self-hosting and direct webhook routing. |
| Open-Source Enthusiast | Prefers tools they can audit, fork, and extend. | MIT-licensed, well-structured codebase, extensible block system. |

---

## 5. Core User Experience

### 5.1 The Editor

The editor is the heart of Formdocs. It must be indistinguishable from typing in a Notion page. When a user opens a form for editing, they see a clean, empty canvas with a faint "Untitled Form" heading and a ghosted placeholder: "Start typing, or press / for commands."

Everything in the editor is a block. Paragraphs, headings, dividers, form fields, and itemisation sections are all blocks in a flat (or nested) list that can be reordered by dragging.

Each block shows a drag handle (⋮⋮) on hover, anchored to the left. Grabbing the handle initiates a drag-and-drop operation with a blue drop-zone indicator. Blocks can be freely reordered within the document and within itemisation sections.

### 5.2 Slash Commands

Typing `/` at the start of a new line or after a space opens a floating command palette. The palette is filterable: typing `/em` narrows results to "Email." Navigation uses arrow keys, Enter inserts the selected block, and Escape dismisses the palette. The UX must match Notion's slash command behaviour exactly, including debounced filtering, category grouping, and keyboard accessibility.

### 5.3 Block Types

All available block types are listed below, grouped by category.

#### 5.3.1 Content Blocks

Content blocks serve as the descriptive tissue between form fields. They provide context, instructions, section introductions, and legal text.

| Block | Description |
|-------|-------------|
| Heading 1 | Primary section heading. Large, bold. |
| Heading 2 | Secondary heading. Medium, bold. |
| Heading 3 | Tertiary heading. Small, bold. |
| Paragraph | Standard body text. |
| Bulleted List | Unordered list with bullet markers. |
| Numbered List | Ordered list with sequential numbering. |
| Quote | Indented blockquote with left border accent. |
| Callout | Highlighted info box with emoji icon and background colour. |
| Divider | Horizontal rule to visually separate sections. |

#### 5.3.2 Field Blocks

Field blocks are interactive form elements that respondents fill in. Each field block has inline configuration accessible via a subtle toolbar on click or focus.

| Field Type | Configuration Options |
|------------|----------------------|
| Short Text | Label, placeholder, required, min/max length, regex validation. |
| Long Text | Label, placeholder, required, min/max length, character counter. |
| Email | Label, placeholder, required, auto-validated format. |
| Phone | Label, placeholder, required, country code prefix option. |
| Number | Label, placeholder, required, min/max value, step, decimal precision. |
| Currency | Label, placeholder, required, currency symbol, decimal places. |
| Date | Label, required, min/max date, date format. |
| Single Select | Label, required, options list, dropdown or radio display. |
| Multi Select | Label, required, options list, checkbox or tag display, max selections. |
| File Upload | Label, required, accepted types, max file size. |
| Rating | Label, required, max stars (1–10), icon style (stars, hearts, thumbs). |
| Yes/No Toggle | Label, required, default state. |

#### 5.3.3 Layout Blocks

| Block | Description |
|-------|-------------|
| Column Layout | Split the page into 2 or 3 columns. Fields and content blocks can be placed inside each column. |
| Spacer | Adjustable vertical whitespace between blocks. |
| Page Break | Splits the form into multiple pages/steps with a progress indicator. |

#### 5.3.4 The Itemisation Block

This is the signature feature of Formdocs and is detailed in Section 6.

### 5.4 Field Configuration

Every field block exposes a minimal inline configuration toolbar when selected. Configuration includes:

- Label and placeholder text.
- Required/optional toggle.
- Validation rules (type-specific, e.g., min/max for numbers, regex for text).
- Conditional visibility: show this block only if another field has a specified value. This is a single-level rule, not a full logic engine.
- Help text: a small description rendered below the field for additional context.

---

## 6. Itemisation Block (Signature Feature)

### 6.1 Overview

The Itemisation Block is a repeatable section that allows form respondents to add structured, multi-field line items within a form. It functions as a container block: the form creator defines a "template row" of fields, and the respondent can duplicate that row as many times as needed.

### 6.2 Creator Experience

When the creator inserts an Itemisation Block via the `/itemisation` slash command, a bordered section appears on the canvas. Inside this section, the creator defines the template row by adding standard field blocks (Short Text, Number, Currency, Date, Single Select, etc.). These fields represent the columns of each line item.

The creator can also configure:

- **Computed fields.** Define fields whose values are calculated from other fields in the same row. Expressions use a simple syntax: `{Quantity} * {Unit Price}`. Supported operators include +, -, *, /, and parenthetical grouping.
- **Summary fields.** Aggregate values across all rows. For example, a Grand Total that sums all Line Total computed fields. Supported aggregations: SUM, COUNT, AVERAGE, MIN, MAX.
- **Row constraints.** Minimum and maximum number of items (e.g., at least 1, at most 50).
- **Add button label.** Customisable text for the "Add another" button (e.g., "+ Add Line Item", "+ Add Guest").
- **Row label template.** Optional dynamic label for each row (e.g., "Item {n}" where {n} is the row number).

### 6.3 Respondent Experience

Respondents see a clean, card-based or table-like section. One row is displayed by default (or the configured minimum). Each row contains the template fields laid out horizontally or in a responsive grid. A "+ Add Line Item" button at the bottom adds a new row. Each row has a subtle delete icon (trash or X) in the corner. Computed fields update live as the respondent types. Summary fields (totals, counts) update in real time below the item list.

### 6.4 Use Cases

| Use Case | Template Fields | Computed / Summary |
|----------|----------------|--------------------|
| Quotation / Invoice | Item Description, Quantity, Unit Price | Line Total = Qty × Price; Grand Total = SUM(Line Totals) |
| Expense Report | Date, Category (dropdown), Description, Amount | Total Expenses = SUM(Amount) |
| Event Guest List | Guest Name, Email, Dietary Preference (dropdown), Plus-Ones (number) | Total Guests = SUM(Plus-Ones) + COUNT(rows) |
| Order Form | Product (dropdown), Size (dropdown), Quantity, Unit Price | Line Total; Order Total |
| Material Requisition | Material Name, Specification, Quantity, Unit, Urgency (dropdown) | Item Count = COUNT(rows) |

### 6.5 Data Schema

In the form JSON, an Itemisation Block is represented as a block with `type: "itemisation"` and a `children` array defining the template fields. Respondent data for an itemisation is a nested array of objects, each object representing one row with field IDs as keys.

---

## 7. Form Storage Architecture

### 7.1 No-Database Philosophy

Formdocs stores each form as a standalone JSON file at `/data/forms/[slug].json` within the project repository. There is no database, no ORM, and no migration system. The filesystem is the database.

### 7.2 Form JSON Schema

Each form JSON file contains three top-level objects:

- **meta:** Title, slug, description, optional cover image URL, optional emoji icon, timestamps (createdAt, updatedAt), and form settings (accent colour, logo URL, submit button text, success message, redirect URL).
- **webhook:** URL, HTTP method, headers (key-value pairs), payload format, and retry policy. Detailed in Section 9.
- **blocks:** An ordered array of block definitions. Each block has an `id` (UUID), `type`, `properties` (label, placeholder, validation rules, etc.), and optional `children` (for Itemisation and Column Layout blocks).

### 7.3 Admin Interface

The app exposes an admin dashboard at `/admin`, protected by a single environment variable `ADMIN_SECRET`. Accessing `/admin` requires passing the secret as a query parameter or via a login prompt that validates against the env var.

The admin dashboard displays all forms as cards (read from `/data/forms/`) with options to create, duplicate, edit, preview, archive, and delete forms.

### 7.4 Persistence Strategy

When a form is saved in the editor, the application writes the updated JSON file. On Vercel's serverless infrastructure, direct filesystem writes do not persist across deployments. The recommended strategies, in order of simplicity, are:

1. **Git commit via GitHub API.** The app commits the updated JSON back to the repository via the GitHub API, triggering an automatic rebuild. Requires a `GITHUB_TOKEN` environment variable. This is the default and recommended path.
2. **Vercel Blob (optional).** If the user enables Vercel Blob storage, forms are read from and written to blob storage instead of the filesystem. This avoids rebuilds but introduces a mild dependency.
3. **Local development.** In local dev mode, JSON files are written directly to the filesystem and persist normally.

---

## 8. Public Form Experience (Respondent)

### 8.1 URL Structure

Each published form is accessible at `/f/[slug]`, where slug is a URL-safe identifier set by the creator (e.g., `/f/project-quotation`). Forms are rendered server-side at request time (SSR) or statically generated (SSG) depending on the persistence strategy.

### 8.2 Visual Design

The respondent-facing form page follows the same Notion-inspired aesthetic as the editor: a centered content column (max-width 720px), clean typography (system sans-serif stack), generous whitespace, and smooth transitions. All content and form fields render as a single scrolling page by default. If Page Break blocks are present, the form splits into a multi-step flow with a top progress bar.

### 8.3 Interaction Features

- Progress indicator: a subtle bar at the top showing the percentage of required fields completed.
- Inline validation: fields validate in real-time on blur, showing errors below the field with a red accent.
- Keyboard navigation: Tab moves between fields, Enter submits dropdowns, arrow keys navigate selects.
- Autosave to session: partially completed forms are saved to sessionStorage, restored on page reload.
- Mobile responsive: fields stack vertically, itemisation rows become cards, touch-friendly tap targets.
- Dark mode: follows the respondent's system preference automatically, with a manual toggle.

### 8.4 Branding & Customisation

Form creators can configure the following visual properties per form:

- Accent colour: applied to buttons, focus rings, and progress indicators.
- Logo: displayed at the top of the form page.
- Cover image: optional hero image below the form title.
- Footer text: custom text at the bottom (e.g., "Powered by Formdocs" or company name).
- Submit button text: customisable (default: "Submit").
- Success message: displayed after successful submission, or a redirect URL.

### 8.5 Submission Flow

When the respondent clicks Submit, the form performs a final validation pass. If all required fields are complete and valid, the payload is sent to the configured webhook endpoint. The respondent sees a loading state during the request. On success, the configured success message is displayed or the respondent is redirected. On failure, a friendly error message is shown with a "Retry" button. No response data is stored on the server at any point.

---

## 9. Webhook Configuration

### 9.1 Settings Panel

The webhook settings panel is accessible from a sidebar in the form editor. It provides the following configuration options:

| Setting | Description | Default |
|---------|-------------|---------|
| URL | The endpoint to which form responses are sent. | (required) |
| HTTP Method | POST, PUT, or PATCH. | POST |
| Headers | Key-value pairs for custom headers (e.g., Authorization, X-Form-Secret). | Content-Type: application/json |
| Payload Format | JSON body or application/x-www-form-urlencoded. | JSON |
| Retry Policy | Number of retries on failure (0–3) with exponential backoff. | 2 retries |
| Timeout | Maximum wait time for a response from the webhook endpoint. | 10 seconds |

### 9.2 Integration Presets

To reduce setup friction, the webhook panel offers one-click presets for common automation platforms:

- Zapier: pre-fills the URL pattern and sets recommended headers.
- Make.com: pre-fills the URL pattern with the Make webhook module format.
- n8n: pre-fills the URL pattern for n8n webhook trigger nodes.
- Custom: blank fields for any arbitrary endpoint.

### 9.3 Test Button

A "Test Webhook" button sends a dummy payload with sample data for all fields (including a sample itemisation row) to the configured URL. The result (HTTP status code and response body) is displayed in the panel so the creator can verify the integration before publishing the form.

### 9.4 Payload Structure

The webhook payload is a JSON object containing:

- **meta:** Form slug, form title, submission timestamp (ISO 8601), respondent user-agent, respondent IP (if available).
- **fields:** An object keyed by field ID, each containing the field label and submitted value.
- **itemisations:** An object keyed by itemisation block ID, containing an array of row objects. Each row object contains field IDs with their labels and values, plus any computed field results.

---

## 10. Technical Architecture

### 10.1 Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 14+ (App Router) | Industry standard for React SSR/SSG, native Vercel support. |
| Styling | Tailwind CSS | Rapid iteration on Notion-precise spacing, colours, and typography. |
| Editor State | Zustand | Lightweight, minimal boilerplate state management for the block editor. |
| Drag & Drop | @dnd-kit/core | Accessible, performant block reordering with keyboard support. |
| Form Validation | React Hook Form + Zod | Performant respondent-side validation with schema-based rules. |
| Slash Command | Custom floating portal | Triggered on / keypress, fuzzy-filtered, keyboard navigable. |
| ID Generation | nanoid | Compact, collision-resistant unique IDs for blocks and fields. |
| Deployment | Vercel | Zero-config deployment, environment variables, edge functions. |

### 10.2 Project Structure

The application follows the Next.js App Router conventions:

- `/app/page.tsx` — Landing page or redirect to admin.
- `/app/admin/` — Admin dashboard and form editor routes, protected by ADMIN_SECRET.
- `/app/f/[slug]/` — Public form rendering route (SSR or SSG).
- `/app/api/submit/` — Server-side API route that receives the respondent's submission and proxies it to the configured webhook.
- `/app/api/forms/` — CRUD API routes for form JSON management (protected).
- `/data/forms/` — JSON files for each form.
- `/components/editor/` — Block editor components (slash command, drag handle, block renderer).
- `/components/form/` — Respondent-facing form field components.
- `/lib/blocks/` — Block type definitions, schemas, and default configurations.

### 10.3 Rendering Strategy

Public form pages (`/f/[slug]`) use Incremental Static Regeneration (ISR) with a revalidation period when using the Git-commit persistence strategy, or Server-Side Rendering (SSR) when using Vercel Blob. The admin interface is always server-rendered and protected.

### 10.4 Security Considerations

- Admin routes are gated behind the ADMIN_SECRET environment variable. All admin API calls require this secret in the Authorization header.
- The submission API route (`/api/submit`) proxies webhook calls server-side, preventing the webhook URL and headers from being exposed to the client.
- CSRF protection is applied to the submission endpoint.
- File uploads (if enabled) are size-limited, type-restricted, and base64-encoded for inclusion in the webhook payload. No files are stored on the server.
- Rate limiting is applied to the submission endpoint to prevent abuse (configurable per form).

---

## 11. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| ADMIN_SECRET | Yes | Secret key to access the admin dashboard and API. Set during Vercel deployment. |
| GITHUB_TOKEN | Conditional | Required if using the Git-commit persistence strategy. A GitHub Personal Access Token with repo write permissions. |
| GITHUB_REPO | Conditional | Required with GITHUB_TOKEN. The repository in owner/repo format. |
| VERCEL_BLOB_TOKEN | No | If set, enables Vercel Blob as the storage backend instead of Git commits. |
| NEXT_PUBLIC_BASE_URL | No | The base URL for generating shareable form links. Defaults to the Vercel deployment URL. |

---

## 12. Key User Flows

### 12.1 First-Time Setup

1. User clicks "Deploy to Vercel" button in the GitHub repository README.
2. Vercel prompts for environment variables. User sets ADMIN_SECRET (and optionally GITHUB_TOKEN).
3. Deployment completes in under 60 seconds. User visits their-app.vercel.app/admin.
4. User is prompted for the admin secret. Upon validation, the admin dashboard loads.

### 12.2 Creating a Form

1. User clicks "New Form" in the admin dashboard.
2. A blank editor canvas opens. User types a title and starts adding content and field blocks.
3. User configures each field inline (label, validation, required status).
4. User opens the webhook settings sidebar and configures the endpoint.
5. User clicks "Test Webhook" to verify the integration.
6. User saves the form. The JSON is committed to the repo (or written to Blob). A shareable link is generated.

### 12.3 Respondent Fills a Form

1. Respondent opens the shared link (`/f/[slug]`).
2. The form renders with all content blocks, field blocks, and itemisation sections.
3. Respondent fills in fields. Validation occurs inline on blur.
4. For itemisation sections, respondent adds/removes rows and sees computed fields update live.
5. Respondent clicks Submit. The payload is sent to the webhook. A success message (or redirect) is shown.

---

## 13. Development Milestones

| Phase | Scope | Outcome |
|-------|-------|---------|
| Phase 1: Foundation | Next.js project scaffolding, Tailwind configuration, basic admin auth, form JSON CRUD, file-based storage. | Admin can create, list, edit, and delete form JSON files. |
| Phase 2: Block Editor | Block-based editor with slash commands, drag-and-drop, and inline configuration for all content and field blocks. | Fully functional Notion-style editor producing valid form JSON. |
| Phase 3: Form Renderer | Public form rendering at /f/[slug] with validation, mobile responsiveness, dark mode, and progress indicator. | Respondents can fill and submit forms. |
| Phase 4: Webhook Engine | Webhook configuration panel, preset templates, test button, server-side proxy, retry logic. | Form submissions delivered reliably to configured endpoints. |
| Phase 5: Itemisation | Itemisation block (creator and respondent sides), computed fields, summary fields, row constraints. | Signature feature complete and production-ready. |
| Phase 6: Polish & Launch | Deploy-to-Vercel button, README documentation, persistence strategy selection, branding options, edge cases, accessibility audit. | Open-source release ready. |

---

## 14. Success Metrics

As an open-source project, success is measured by community adoption and contribution rather than traditional product metrics:

- GitHub stars and forks within the first 3 months post-launch.
- Number of Deploy-to-Vercel clicks (tracked via the Vercel deploy button analytics).
- Community-contributed block types or integrations (PRs merged).
- Presence in curated lists (Awesome Next.js, Awesome Self-Hosted, etc.).
- Positive reception on Hacker News, Product Hunt, or relevant developer communities.

---

## 15. Open Questions & Future Considerations

- Should Formdocs support form versioning (keeping a history of form JSON edits)?
- Should there be a form template gallery (pre-built forms for common use cases)?
- Should Formdocs support multiple webhook endpoints per form (e.g., send to both Zapier and a Slack webhook)?
- Should the computed field expression language support conditional logic (IF/THEN) or remain arithmetic-only?
- Should there be an optional embedded mode (rendering a form inside an iframe on another site)?
- What is the strategy for form analytics (view counts, completion rates) without a database? Can this be achieved via a lightweight analytics webhook?
- Should there be an export option (PDF, CSV) for the form structure itself (not responses)?

---

*— End of Document —*
