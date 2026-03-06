# Formdocs

A Notion-style, self-hostable, open-source form builder. Create and publish forms with a rich block-based editor, collect submissions via webhook, and host it all yourself — no database required.

## Features

- **Block-based editor** — 25 block types across content, fields, layout, and special categories
- **Multi-page forms** — split long forms into steps with Page Break blocks
- **Itemisation** — repeatable line-item tables with computed totals and expression-based fields (great for invoices, order forms)
- **Column layouts** — arrange blocks in 2- or 3-column grids
- **Webhook delivery** — submissions are proxied server-side so your webhook URL and secrets never reach the browser
- **Configurable webhooks** — custom headers, JSON or `application/x-www-form-urlencoded` payload formats, retry logic, timeouts
- **Per-form settings** — accent color, logo, cover image, icon emoji, redirect URL, custom success message, submit button text
- **Autosave** — editor debounces saves every 2 seconds; respondent in-progress answers are preserved in sessionStorage
- **No database** — forms are stored as JSON files on disk; easy to back up, version control, or migrate

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS v4 + shadcn/base-ui |
| Editor state | Zustand |
| Drag-and-drop | @dnd-kit/core + @dnd-kit/sortable |
| Form validation | React Hook Form + Zod v4 + @hookform/resolvers |
| Auth | jose (JWT HS256, httpOnly cookie) |
| Expressions | expr-eval (sandboxed computed fields) |
| Icons | lucide-react |
| IDs | nanoid |
| Storage | Filesystem JSON (local) or Vercel Blob (production) |

## Getting Started

### Prerequisites

- Node.js 18+
- npm / yarn / pnpm / bun

### 1. Clone and install

```bash
git clone https://github.com/your-org/formdocs.git
cd formdocs
npm install
```

### 2. Set environment variables

Create a `.env.local` file:

```env
# Required — the password used to log in to the admin panel
ADMIN_SECRET=your-strong-secret-here

# Optional — path where form JSON files are stored (default: ./data/forms)
# DATA_DIR=/var/formdocs/data

# Optional — Vercel Blob storage (recommended for Vercel deployments; omit to use filesystem)
# BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxxxxxxxxxxxxxxxxx

# Optional — base URL for generating shareable form links
# NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

> **Note:** `ADMIN_SECRET` is required. The app signs JWTs using `ADMIN_SECRET` directly via HMAC — no separate `JWT_SECRET` is needed.

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000/admin](http://localhost:3000/admin) and log in with your `ADMIN_SECRET`.

Public forms are served at `/f/<slug>`.

### 4. Build for production

```bash
npm run build
npm run start
```

## Deploying to Vercel

1. **Import the repo** — go to [vercel.com/new](https://vercel.com/new), select your fork, and keep the default Next.js settings.
2. **Create a Blob store** — in the Vercel dashboard, go to **Storage → Create Database → Blob**. Name it (e.g. `formdocs-storage`) and click **Connect to Project** — this auto-injects `BLOB_READ_WRITE_TOKEN`.
3. **Set environment variables** in Project Settings → Environment Variables:

   | Variable | Value |
   |---|---|
   | `ADMIN_SECRET` | A strong password (min 16 chars) |
   | `BLOB_READ_WRITE_TOKEN` | Auto-set if you connected the Blob store |
   | `NEXT_PUBLIC_BASE_URL` | Your deployment URL, e.g. `https://yourapp.vercel.app` |

4. **Deploy** — click Deploy (or push to `main` for automatic deploys).
5. **Verify** — visit `/admin/login`, log in, create and save a form. Check the Blob store dashboard to confirm a `forms/<slug>.json` file was created.

### Local development with Blob

```bash
npm i -g vercel
vercel link          # link to your Vercel project
vercel env pull      # writes BLOB_READ_WRITE_TOKEN into .env.local
npm run dev          # now uses the same Blob store as production
```

Omit `BLOB_READ_WRITE_TOKEN` from `.env.local` to fall back to local filesystem storage.

## Project Structure

```
formdocs/
├── app/
│   ├── admin/                  # Admin UI (login, dashboard, editor)
│   │   ├── login/page.tsx
│   │   ├── page.tsx            # Form list / dashboard
│   │   └── forms/
│   │       ├── new/page.tsx    # Create form
│   │       └── [slug]/page.tsx # Editor shell
│   ├── api/
│   │   ├── admin/auth/route.ts # POST (login) / DELETE (logout)
│   │   ├── forms/
│   │   │   ├── route.ts        # GET (list) / POST (create)
│   │   │   └── [slug]/route.ts # GET / PUT (update) / DELETE
│   │   └── submit/
│   │       └── [slug]/route.ts # POST (public submit) / PUT (test webhook)
│   └── f/
│       └── [slug]/page.tsx     # Public respondent view
├── components/
│   ├── admin/                  # Dashboard, form cards, webhook settings panel
│   ├── editor/                 # Editor shell, block list, sidebar, slash command palette
│   └── form/                   # Form renderer, block renderer, progress bar, field components
├── lib/
│   ├── auth.ts                 # JWT creation/verification, cookie options
│   ├── forms.ts                # Filesystem CRUD (read, write, list, delete)
│   ├── types.ts                # All TypeScript interfaces (Form, Block, etc.)
│   ├── utils.ts                # cn() utility
│   ├── blocks/
│   │   ├── definitions.ts      # BLOCK_DEFINITIONS array + search helper
│   │   ├── defaults.ts         # createBlock() factory with sensible defaults
│   │   └── schemas.ts          # Zod schema for Block (used in form JSON validation)
│   ├── itemisation/
│   │   └── expression.ts       # expr-eval wrapper for computed field expressions
│   ├── store/
│   │   └── editor.ts           # Zustand editor store
│   └── validation/
│       └── form-schema.ts      # Dynamic Zod schema builder from form blocks
├── middleware.ts               # Edge JWT guard — protects /admin/* routes
└── data/
    └── forms/                  # JSON form files (auto-created on first save)
```

## Architecture

### Storage

Formdocs supports two storage backends, selected automatically by the presence of `BLOB_READ_WRITE_TOKEN`:

| Backend | When active | Form location |
|---|---|---|
| Filesystem (`lib/forms-fs.ts`) | `BLOB_READ_WRITE_TOKEN` not set (default) | `data/forms/<slug>.json` |
| Vercel Blob (`lib/forms-blob.ts`) | `BLOB_READ_WRITE_TOKEN` is set | `forms/<slug>.json` in your Blob store |

Both backends expose the same API (`listForms`, `getForm`, `saveForm`, `deleteForm`, `formExists`). The router in `lib/forms.ts` selects the backend at startup.

For filesystem storage, writes are atomic: the file is written to `<slug>.json.tmp` then renamed over the destination, so a crash mid-write cannot corrupt an existing form. The `DATA_DIR` environment variable lets you point to a different directory.

Slugs are validated against `/^[a-z0-9-]+$/` before any storage operation to prevent path traversal.

### Authentication

Authentication uses a single shared secret (`ADMIN_SECRET`). On successful login, a JWT signed with `ADMIN_SECRET` (HS256) is set as an httpOnly, SameSite=Strict session cookie. The cookie is verified on every admin API call via `isAdminRequestValid(req)` — this function is async and **must always be awaited**.

Route protection is split into two layers:

- **Edge middleware** (`middleware.ts`) — guards all `/admin/*` page routes with a fast JWT check before the request reaches the server
- **API route guard** — each admin API handler calls `isAdminRequestValid(req)` for defence-in-depth

### Webhook Submission

When a respondent submits a form, the browser POSTs to `/api/submit/<slug>`. The server:

1. Loads the form from disk
2. Validates the submission against a dynamically built Zod schema
3. Checks the webhook URL against an SSRF blocklist (no loopback, private RFC-1918 ranges, `169.254.169.254` cloud metadata, `.internal`/`.local` hostnames)
4. Forwards the submission to the configured webhook URL with the configured headers, format, and timeout
5. Retries on transient failures using exponential backoff

This architecture means webhook URLs, secrets, and Authorization headers are never exposed to form respondents.

The webhook payload shape:

```jsonc
{
  "meta": {
    "slug": "my-form",
    "title": "My Form",
    "submittedAt": "2024-01-01T00:00:00.000Z",
    "userAgent": "Mozilla/5.0 ...",
    "ip": "1.2.3.4"
  },
  "fields": {
    "<blockId>": { "label": "Field Label", "value": "<submitted value>" }
  },
  "itemisations": {
    "<blockId>": [
      { "<columnId>": "<value>", ... }
    ]
  }
}
```

### Editor

The editor is a Zustand store (`lib/store/editor.ts`) that holds the entire form state in memory. Changes trigger a 2-second debounced autosave via `PUT /api/forms/<slug>`. The editor supports:

- Slash command palette (`/`) to insert any block type
- Drag-and-drop reordering via @dnd-kit
- Block duplication (deep clone with new IDs)
- Right sidebar panels: block configuration, webhook settings, form settings

### Form Renderer

Public forms use React Hook Form with a Zod schema built dynamically from the form's blocks (`lib/validation/form-schema.ts`). Multi-page forms split at `page_break` blocks. On page transition, all field blocks on the current page are validated (not just required ones) before advancing. Autosave to sessionStorage preserves answers across tab refreshes.

## Block Types

### Content
| Block | Description |
|---|---|
| Heading 1 / 2 / 3 | Section headings at three sizes |
| Paragraph | Body text |
| Bulleted List | Unordered bullet list |
| Numbered List | Ordered numbered list |
| Quote | Indented blockquote with left border |
| Callout | Highlighted info box with emoji |
| Divider | Horizontal rule |

### Fields
| Block | Description |
|---|---|
| Short Text | Single-line text input |
| Long Text | Multi-line textarea |
| Email | Email address with format validation |
| Phone | Phone number |
| Number | Numeric input with min / max / step |
| Currency | Monetary amount with symbol |
| Date | Date picker with min / max |
| Single Select | Dropdown or radio group |
| Multi Select | Checkboxes or tag selection |
| File Upload | File attachment (base64-encoded to webhook) |
| Rating | Star / heart / thumbs scale |
| Yes / No | Boolean toggle |

### Layout
| Block | Description |
|---|---|
| Columns | 2- or 3-column grid |
| Spacer | Adjustable vertical whitespace |
| Page Break | Splits form into multi-step pages |

### Special
| Block | Description |
|---|---|
| Itemisation | Repeatable line-item table with computed and summary fields |

## Extending the Block System

Adding a new block type involves four files:

1. **`lib/types.ts`** — add the new type string to the `BlockType` union and define its `properties` interface
2. **`lib/blocks/definitions.ts`** — add a `BlockDefinition` entry (label, description, icon, keywords, category)
3. **`lib/blocks/defaults.ts`** — add a `createBlock()` case with sensible default properties
4. **`components/form/form-block-renderer.tsx`** — add a render case for the respondent view
5. **`components/editor/`** — add an editor configuration component if the block has configurable properties
6. **`lib/validation/form-schema.ts`** — add a Zod validation case if the block is a field

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `ADMIN_SECRET` | Yes | — | Password for the admin panel login; also used to sign session JWTs |
| `BLOB_READ_WRITE_TOKEN` | No* | — | Vercel Blob read-write token. When set, forms are stored in Blob instead of the filesystem. Auto-injected by Vercel when you connect a Blob store to your project |
| `DATA_DIR` | No | `./data/forms` | Directory for filesystem form storage (ignored when `BLOB_READ_WRITE_TOKEN` is set) |
| `NEXT_PUBLIC_BASE_URL` | No | — | Base URL used to generate shareable form links (e.g. `https://yourapp.vercel.app`) |

\* Required when deploying to Vercel or any environment where the filesystem is read-only.

## Security Notes

- **Timing-safe comparison** — admin secret is compared using an HMAC-based approach to prevent timing attacks
- **SSRF protection** — webhook URLs are checked against an IP/hostname blocklist before any outbound request
- **Path traversal** — form slugs are sanitised with a strict regex before any filesystem operation
- **Atomic writes** — form saves use write-then-rename to prevent partial writes corrupting stored forms
- **JWT scope** — session tokens are short-lived (24h), httpOnly, SameSite=Strict
- **Server-side validation** — submissions are validated against the form's Zod schema on the server before being forwarded to the webhook

## Contributing

Contributions are welcome. Please open an issue to discuss significant changes before submitting a pull request.

### Development workflow

```bash
# Install dependencies
npm install

# Start dev server with hot reload
npm run dev

# Type-check
npx tsc --noEmit

# Lint
npm run lint
```

### Pull request guidelines

- Keep PRs focused on a single concern
- TypeScript strict mode is enforced — no `any` in new code unless clearly necessary and commented
- Test your changes with `npm run build` before submitting — the build must pass cleanly
- For new block types, include both the editor config panel and the respondent renderer
- Security-sensitive changes (auth, webhook proxy, file I/O) will receive extra scrutiny

## License

MIT
