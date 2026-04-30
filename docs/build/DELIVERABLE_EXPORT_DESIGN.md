# Format-Aware Deliverable Export — Design

**Slice family:** EXPORT-1 .. EXPORT-4 (EXPORT-5 deferred)
**Status:** Design (no code in this slice)
**Author:** Programs / Maestro deliverable layer
**Founder direction (2026-04-30):** *"ability to generate data — say html (for architecture or roadmap) or excel or word depending on the output type."*

---

## 1. Premise

The platform's promise is that agents **generate deliverables** — charters, roadmaps, financial baselines, BAFO scoreboards, decision memos, meeting notes — and the user can take those deliverables and use them. "Use them" means: open them in Word, in Excel, in a browser; share them by email; sign them; staple them to a board pack.

That only works if the **format matches the deliverable's nature**. A program charter is a narrative, signed document — it belongs in Word. An OKR baseline is a multi-sheet workbook with formulas and source links — it belongs in Excel. An architecture sketch is a structural diagram with embedded SVG — it belongs as HTML. Forcing every deliverable through one format defeats the promise.

**Today's state.** Only one format (HTML) is wired, and only for one deliverable (the Phase 0 archetype primer, OV2-3c). The contract module `src/lib/programs/deliverable-export-contract.ts` already encodes the *intent* — it knows there are deliverables that want PDF / DOCX / PPTX and marks them `deferred`. The renderer side of that contract does not exist beyond HTML.

**Why it matters at pilot.** During pilot, the deliverables are the *receipts* the user shows their leadership: the charter they signed, the baseline they captured, the BAFO scoreboard that drove the vendor decision. If we hand them a half-rendered HTML page when their CFO expects an Excel workbook, the trust signal collapses. Format-aware export is the smallest piece of infrastructure that makes the agent's outputs durable artefacts rather than screen-only renderings.

---

## 2. The DeliverableKind taxonomy

A typed enum tagging each kind of deliverable the Programs module can produce, paired with its **canonical format(s)**. Authored from the existing `compose_artifact` outputs in the phase packs (P2/P3/P5/P6) plus the worked-example tables in `PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md`.

| DeliverableKind | Canonical format(s) | Nature | Notes |
|---|---|---|---|
| `archetype-primer` | HTML | Visual / structural | Already shipped (OV2-3c). First worked example. |
| `program-charter` | DOCX (primary), HTML (alt) | Narrative, signed | Section structure: scope, sponsor, success criteria, governance |
| `discovery-report` | DOCX (primary) | Narrative | P1 output; embedded tables OK |
| `okr-baseline` | XLSX | Tabular, multi-sheet | Sheets: current / target / source / method |
| `stakeholder-map` | XLSX (primary), HTML (alt) | Tabular w/ visual variant | Excel for filter/sort, HTML for the influence-map view |
| `synthesis-options-table` | XLSX | Tabular | Options × criteria scoring matrix |
| `architecture-sketch` | HTML | Visual / structural | SVG inline; the format **is** the deliverable |
| `execution-plan` | XLSX (primary), DOCX (cover) | Sequenced workbook + narrative | Workbook for the plan, optional cover memo |
| `pilot-result-report` | DOCX | Narrative w/ embedded tables | P5 output |
| `outcome-report` | DOCX (primary), HTML (shareable web) | Narrative + tables | P6 capstone; HTML variant for in-tenant share |
| `bafo-scoreboard` | XLSX | Tabular weighted matrix | Vendor × criteria with weights & totals |
| `meeting-notes` | DOCX | Narrative | Decisions / actions / parked items |
| `decision-log` | DOCX or XLSX | Either has merit | Default DOCX (one row = one decision page); XLSX on request |
| `roadmap` | HTML (timeline), XLSX (Gantt rows) | Visual or tabular | Default HTML — visual is the reason to look at it |
| `financial-baseline` | XLSX | Tabular, formula-bearing | Run-rate, target, delta — formulas matter |

**Picking the default.** A deliverable is **tabular** if its primary value is rows × columns the user wants to filter, sort, or compute on (XLSX). It is **narrative** if its primary value is prose with structure — headings, paragraphs, sign-off — that the user reads and signs (DOCX). It is **visual / structural** if the value is the layout itself — a diagram, a timeline, a card view — and re-flowing it into Excel destroys it (HTML).

**Multi-format support.** Some kinds (`stakeholder-map`, `decision-log`, `roadmap`, `outcome-report`, `program-charter`) legitimately want both narrative and tabular renderings. The router supports a per-kind set; one is canonical, the rest are `requestedFormat` overrides. PDF is *every* kind's eventual second format but is deferred for v1.

---

## 3. Architecture

A new module: `src/lib/programs/exports/`. Strict server-only, no client bundle impact.

```
src/lib/programs/exports/
  types.ts                — DeliverableKind, DeliverableFormat, DeliverableSpec, DeliverableRenderResult
  format-router.ts        — routeFormat(kind, requestedFormat?) → DeliverableFormat
  index.ts                — renderDeliverable(spec): Promise<DeliverableRenderResult>
  renderers/
    html.ts               — extends archetype-primer pattern; takes DeliverableSpec instead of ArchetypePrimer
    xlsx.ts               — exceljs-based; typed cells, styling, multi-sheet
    docx.ts               — docx-package-based; sectioned narrative + embedded tables
    pdf.ts                — DEFERRED in v1; documented in EXPORT-5
```

**Public surface.**

```ts
type DeliverableFormat = 'html' | 'xlsx' | 'docx' | 'pdf';

type DeliverableKind = /* the union from §2 */;

interface DeliverableSpec {
  programId: string;
  kind: DeliverableKind;
  // Structured payload — discriminated union per kind. e.g. for okr-baseline:
  //   { kind: 'okr-baseline'; sheets: BaselineSheet[]; ... }
  payload: DeliverablePayload;
  meta: { tenantKey: string; generatedAt: string; actorId: string };
}

interface DeliverableRenderResult {
  buffer: Buffer;
  contentType: string;            // matches DeliverableFormat
  suggestedFilename: string;      // RFC 6266-safe ASCII, kind + programId stem
  byteLength: number;             // for size-budget checks
  format: DeliverableFormat;
}

routeFormat(kind, requestedFormat?): DeliverableFormat
renderDeliverable(spec): Promise<DeliverableRenderResult>
```

**API surface.** A single new route, threaded through the same `requireTenancy` auth gate the primer-html route uses today:

```
POST /api/programs/[id]/deliverables/[kind]/export?format=<format>
```

- Body: either `{ deliverableId }` (look up the stored spec) or `{ inlineSpec: DeliverableSpec }` (compose-then-export in one call).
- Response: binary with `Content-Type` matching the format and `Content-Disposition: attachment; filename="…"`.
- Auth: `requireTenancy()` — 401 unauthenticated, 403 wrong tenant.
- The existing `/api/programs/[id]/primer-html` route stays as-is; the new generic route covers everything else and the primer migration to it is a no-op follow-up.

**Agent integration.** The `compose_artifact` step doctrine (already present on phase packs P2/P3/P5/P6 — see `phase-packs/types.ts:64`) extends as follows: when the agent finishes composing a deliverable, it emits a new artifact type `deliverable-ready` carrying `{ kind, format, downloadUrl, byteLength, generatedAt }`. The reactive panel renders this as a download chip ("Download charter (.docx, 47 KB)"). Existing artifact emissions (`anti-pattern-flag`, `evidence-trace`, etc.) stay untouched.

---

## 4. Library picks + dependency budget

| Library | Purpose | Size (server) | Status today |
|---|---|---|---|
| **`exceljs` ^4.4** | XLSX renderer | ~200 KB min | **Already in `package.json`** (used by `src/scripts/templates/generate-xlsx.ts`) |
| **`docx` ^9.x** | DOCX renderer | ~400 KB min | **New dep** (added in EXPORT-3) |
| (none) | HTML renderer | 0 KB | Pure string concat; pattern already in `archetype-primers/render-html.ts` |
| (deferred) | PDF renderer | — | EXPORT-5 |

**Total bundle delta:** ~400 KB (docx only — exceljs is already pulled). Both libraries are pure-JS, server-only, no native deps, no client bundle impact.

**Why `exceljs` over `xlsx` (SheetJS):** the codebase already uses `exceljs`; it has typed cell access (`worksheet.getCell('A1').value = 42`), real styling (font, fill, border), data validation, frozen panes, and merged cells with a clean API. SheetJS is similarly sized but its typed access is weaker and the styling story requires the paid Pro tier for full fidelity.

**Why `docx` (the npm package) for DOCX:** it's the de-facto JS library for programmatic Word documents — `Document` / `Paragraph` / `Table` / `HeadingLevel` constructors, sectioning, headers/footers, page numbering. No headless Office, no native bindings. Used widely in production server pipelines. Output opens cleanly in Word, Pages, Google Docs, LibreOffice.

**PDF path (deferred):** the cheapest path is HTML → PDF via a server-side headless rendering service (Puppeteer, Playwright, or a hosted endpoint such as Browserless / DocRaptor). Adding Chromium to the build is a heavy step we don't take in v1. EXPORT-5 picks this up after the other three formats are proven in pilot.

---

## 5. Pilot-readiness floor

Every renderer must land with these in place — not as polish, as the floor:

- **HTML escaping discipline.** User-authored content (titles, descriptions, decision text) must be escaped before interpolation in HTML; sanitised before being written into DOCX runs / XLSX cells. Reuse the `escapeHtml` helper from `archetype-primers/render-html.ts` for the HTML path; equivalent helpers per renderer for DOCX/XLSX (no formula injection — `=` prefix gets quoted).
- **Audit-stamped.** Every export call writes one row to `program_export_log` (new table, EXPORT-1 migration): `program_id`, `kind`, `format`, `actor_id`, `tenant_key`, `byte_length`, `created_at`. Required for compliance review of "what did we hand them and when."
- **Authentication.** Every export route gated through `requireTenancy()`. No anonymous downloads. Programs in tenant X return 403 to actors in tenant Y.
- **Content size limits.** Hard cap per format: HTML ≤ 1 MB, XLSX ≤ 10 MB, DOCX ≤ 5 MB. A renderer that would exceed the cap returns `413 Payload Too Large` with a structured error explaining which sheet / section blew the budget.
- **Filename sanitization.** RFC 6266 fallback only — strip everything outside `A-Za-z0-9_.-` from `programId` and `kind` before composing the filename. Pattern already proven in the primer-html route (`route.ts:99`).
- **Telemetry.** One PostHog event per export (`programs.deliverable.export`) with `kind`, `format`, `success`, `byteLength`, `durationMs`. Lets us see which formats users actually pick and which renderers are slow.

---

## 6. Slice plan

| Slice | Scope | Pilot-readiness floor (in slice) |
|---|---|---|
| **EXPORT-1** | `DeliverableKind` enum, `DeliverableSpec` discriminated union, `DeliverableFormat` type, `routeFormat()` + tests, `program_export_log` migration, contract docs | Audit-log table migration; type discipline |
| **EXPORT-2** | `renderers/xlsx.ts` (exceljs) + `okr-baseline` as worked example + tests | Mime + size limit, formula-injection guard |
| **EXPORT-3** | `renderers/docx.ts` (docx package) + `program-charter` as worked example + tests | HTML/string escaping; section structure |
| **EXPORT-4** | `POST /api/programs/[id]/deliverables/[kind]/export` route, `deliverable-ready` artifact emission from `compose_artifact`, reactive-panel download chip, agent doctrine extension | Auth + audit row + telemetry event |
| **EXPORT-5** *(future)* | PDF renderer (HTML→PDF pipeline); chart/SVG embedding in DOCX/XLSX; localization | Out of scope v1 |

Each slice ships independently and leaves `main` greener than it found it.

---

## 7. Open questions

1. **Multi-format per kind.** Should `program-charter` support DOCX *and* HTML, with the user picking, or always default to one? **Lean: support multi, router picks default, `?format=` overrides.** The user paying for the agent's output deserves the flexibility; the cost is one extra renderer call.
2. **Per-tenant brand application.** Should the renderer apply tenant logos / colors, or always render in AbarVa default brand? **Lean: AbarVa default in v1; tenant brand is a post-pilot follow-up.** Brand customization is real work (logo storage, color tokens per tenant, sign-off block customization) and is not on the critical path for the pilot.
3. **Live editing vs. snapshot.** Does each export regenerate from current program state (snapshot at request time), or do we persist exported binaries and show "export history"? **Lean: snapshot at request time, persist via the audit log row only (no binary in DB).** Iteration happens in-app, not in re-downloaded files.
4. **Inbound→outbound symmetry.** When a user uploads a meeting-notes DOCX (OV2-4c) and the agent regenerates a richer version, should we re-export immediately? **Lean: not in v1.** The user explicitly clicks "export" when ready.

---

## 8. Reviewer instructions

**How to read this doc.** Skim §1 (premise) → §2 (the taxonomy table) → §6 (slice plan). That's the spine; the rest is detail you can consult when the slice you're reviewing touches it.

**The two questions that decide whether the slicing is right.**

1. **Does EXPORT-1 stand alone?** A reviewer should be able to land EXPORT-1, leave EXPORT-2/3/4 unmerged, and the type contract + audit-log table + format router are independently useful (e.g. the `deliverable-export-contract.ts` manifest can already cite them). If EXPORT-1 needs EXPORT-2 to compile or be tested, the slicing is wrong — push the renderer dependency out.
2. **Is EXPORT-4 the only slice that touches the agent and the API surface?** Renderers (EXPORT-2, EXPORT-3) must be testable as pure functions — `(spec) → buffer` — without spinning up the API or the agent. If they reach into route handlers or compose-artifact emission, the seam is wrong. The agent / API integration belongs in one place: EXPORT-4.

If both answers are yes, ship in order. If not, re-cut before EXPORT-1 lands.
