# Document Generation Strategy

Canonical reference for the 10 patterns that govern all document generation
(XLSX, DOCX, PDF, Markdown walkers) across the platform. These patterns were
codified from the ~3,500 LOC of infrastructure in `src/lib/programs/exports/`
and are portable to any module (Source, Moves, Tower, etc.) via
`src/lib/exports-shared/`.

---

## Pattern 1 · Spec envelope

Every renderer accepts a `DeliverableSpec` envelope with a stable set of
top-level fields:

```ts
// src/lib/programs/exports/types.ts
interface DeliverableSpec {
  kind: DeliverableKind;   // discriminator
  tenantKey: string;       // broker tenant key
  programId?: string;      // optional program scope
  title: string;           // document title
  subtitle?: string;
  generatedAt?: string;    // ISO; stamps now() if omitted
  authors?: string[];
  payload: Record<string, unknown>; // kind-specific data (narrowed per renderer)
  brandSubtitle?: string;  // default: 'AbarVa · Programs'
}
```

Renderers narrow `payload` using a local interface per kind (e.g.
`ProgramCharterPayload` in `renderers/program-charter.ts`). The dispatcher
(`renderers/docx.ts`, `renderers/xlsx.ts`) does a shallow guard check before
calling the per-kind builder.

---

## Pattern 2 · Format router

A static two-map router (`src/lib/programs/exports/format-router.ts`)
separates "what is the canonical format for this kind" from "what formats does
this kind allow". The router throws on unsupported format requests so the API
layer can return 400 rather than silently handing the wrong format to the caller.

```ts
// format-router.ts
export function routeFormat(
  kind: DeliverableKind,
  requestedFormat?: DeliverableFormat,
): DeliverableFormat { ... }
```

Default formats: `program-charter → docx`, `okr-baseline → xlsx`,
`roadmap → html`. Overrides are validated against `ALLOWED_FORMATS`.

---

## Pattern 3 · Dispatcher → builder split

Each format has a dispatcher module (`docx.ts`, `xlsx.ts`) that:

1. Guards the payload shape.
2. Constructs the narrow spec (`ProgramCharterSpec`, `OkrBaselineSpec`, …).
3. Calls the per-kind builder (`buildProgramCharterDocument`, `buildOkrBaselineWorkbook`).
4. Serializes the result (Packer.toBuffer / workbook.xlsx.writeBuffer).
5. Returns a `DeliverableRenderResult`.

Per-kind builders are pure: they accept a typed spec, return a `Document`
(docx) or `Workbook` (xlsx), and perform no I/O. This keeps renderers unit-
testable without mocking the file system.

```ts
// renderers/docx.ts
case 'program-charter': {
  const doc = buildProgramCharterDocument(charterSpec);  // pure
  const buffer = await Packer.toBuffer(doc);              // I/O happens here
  ...
}
```

---

## Pattern 4 · Brand tokens (shared)

All renderers share the same brand token constants, sourced from
`src/lib/exports-shared/`:

```ts
// exports-shared/xlsx-base.ts
export const HEADER_FILL = 'FF0A0A0A';  // near-black
export const HEADER_TEXT = 'FFF5F5F0';  // near-white
export const BAND_FILL   = 'FFF8F7F4';  // warm off-white
export const ACCENT_FILL = 'FF2DD4C8';  // teal
export const MUTED_TEXT  = 'FF706D66';  // warm grey

// exports-shared/docx-base.ts
export const SERIF_HEADING_FONT = 'Georgia';
export const SANS_BODY_FONT     = 'Calibri';

// exports-shared/pdf-base.ts
export const PDF_COLORS = { ink: '#0A0A0A', accent: '#2DD4C8', ... };
```

Do not redeclare these constants in individual renderer files.

---

## Pattern 5 · Cover sheet

Every document opens with a cover sheet or cover page:

- **XLSX** — `buildCoverSheet(options)` in `exports-shared/xlsx-base.ts`.
  Adds a protected "Cover" tab with title, subtitle, metadata lines, and a
  generation timestamp. Tab color: `ACCENT_FILL`. Protected as read-only.

- **DOCX** — `titleHeading()`, `subtitleParagraph()`, `tenantKeyParagraph()`,
  `timestampParagraph()`, and `gateBannerParagraph()` in
  `exports-shared/docx-base.ts`. The banner paragraph carries the document
  class (e.g. `SIGNED PROGRAM CHARTER · P2 GATE PACKAGE`).

- **PDF** — `styles.gateBanner`, `styles.titleHeading`, and
  `styles.timestamp` in `exports-shared/pdf-base.ts`.

---

## Pattern 6 · Paragraph helpers (DOCX)

Seven reusable paragraph factories in `exports-shared/docx-base.ts`:

| Helper | Purpose |
|---|---|
| `titleHeading(text)` | H1 serif bold 44pt |
| `sectionHeading(text)` | H2 serif bold 30pt |
| `subsectionHeading(text)` | H3 serif bold 24pt |
| `bodyParagraph(text)` | 22pt Calibri |
| `italicParagraph(text)` | 22pt Calibri italic |
| `bulletParagraph(text)` | bullet level 0 |
| `labeledLine(label, value)` | bold label + plain value |
| `bodyParagraphRich(runs)` | mixed bold/italic/color runs |

These replace the 7-copy-paste block that existed in every renderer prior to
the journey-kit-phase3 extraction.

---

## Pattern 7 · Table primitives (DOCX)

Two table primitives in `exports-shared/structured-docx-base.ts`:

```ts
// Two-column key/value table:
buildKeyValueTable(entries: [string, string][]): Table

// N-column table with configurable headers:
buildMultiColumnTable(
  columnSpecs: ColumnSpec[],
  rows: string[][],
  opts?: { boldFirstColumn?: boolean },
): Table
```

Lower-level: `makeHeaderCell(text, opts?)` and `makeDataCell(text, opts?)`
for renderers that need non-standard table shapes.

---

## Pattern 8 · Formula injection guard (XLSX)

All string values written to XLSX cells are passed through `safeCell()` from
`exports-shared/xlsx-base.ts`. This prefixes values starting with `=`, `+`,
`-`, or `@` with a single quote to prevent formula injection.

```ts
// exports-shared/xlsx-base.ts
export function safeCell(value: string): string {
  const first = value.charAt(0);
  if (['=', '+', '-', '@'].includes(first)) return `'${value}`;
  return value;
}
```

Never write raw user-controlled strings directly to `cell.value`.

---

## Pattern 9 · Markdown walker

Three walkers in `exports-shared/` that share the `MdastNode` type:

| Module | Output |
|---|---|
| `markdown-to-html.ts` | `mdastToHtml(root): string` |
| `markdown-to-docx.ts` | `mdastToDocxChildren(root): (Paragraph | Table)[]` |
| `markdown-to-pdf.tsx` | `<MdastToPdf root={root} />` (React component) |

All three are pure — no I/O, no browser APIs. Callers parse with
`mdast-util-from-markdown` + `micromark-extension-gfm` + `mdast-util-gfm`
and pass the root node.

Jest mocks for all three packages live in `exports-shared/__mocks__/` and
are wired in `jest.config.ts` as `moduleNameMapper` entries.

---

## Pattern 10 · Audit trail

Every export attempt is recorded to `program_export_log` via
`recordExportAudit()` in `src/lib/programs/exports/audit.ts`. The audit
record captures: `programId`, `tenantKey`, `kind`, `format`, `sizeBytes`,
`userId`, `success`, and an optional `errorMessage`. The API route
(`EXPORT-4`) calls this even on failure so the log is complete.

This pattern applies to Moves exports too: `src/lib/moves/exports/` renderers
must call an equivalent `recordExportAudit` before returning.

---

## Reuse map

| Module | Portable to Moves | Notes |
|---|---|---|
| `exports-shared/xlsx-base.ts` | Yes | Zero product coupling |
| `exports-shared/docx-base.ts` | Yes | Zero product coupling |
| `exports-shared/pdf-base.ts` | Yes | Zero product coupling |
| `exports-shared/structured-docx-base.ts` | Yes | Depends on docx-base only |
| `exports-shared/markdown-to-html.ts` | Yes | Pure, no deps |
| `exports-shared/markdown-to-docx.ts` | Yes | Depends on docx-base + structured-docx-base |
| `exports-shared/markdown-to-pdf.tsx` | Yes | Depends on pdf-base |
| `exports-shared/__mocks__/` | Yes | Jest config wires per-project |
| `programs/exports/types.ts` (DeliverableSpec) | Needs Move equivalent | `DeliverableKind` is programs-scoped; Moves needs its own `MoveDocumentKind` + `MoveDocumentSpec` |
| `programs/exports/format-router.ts` | Needs Move equivalent | Moves has different kind→format defaults |
| `programs/exports/audit.ts` | Needs Move equivalent | Same shape; reference `program_export_log` becomes `move_export_log` |
| `programs/exports/renderers/docx.ts` (dispatcher) | Needs Move equivalent | Per-kind guard + dispatch; Moves writes its own |
| `programs/exports/renderers/xlsx.ts` (dispatcher) | Needs Move equivalent | Same as above |
| Per-kind builders (program-charter.ts, etc.) | No | Programs-specific payload types |
