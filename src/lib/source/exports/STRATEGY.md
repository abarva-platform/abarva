# Source Document Generation Strategy

Canonical reference for how Source emits structured exports (xlsx, docx, html, pdf) for every artifact in its 11-stage lifecycle. Updated after the Path C migration (Slices 8.1–8.5) unified Source's pipeline on the same `DeliverableSpec` envelope as Programs.

This document is the single source of truth for any future module (Moves, Tower, etc.) that wants to add a structured export pipeline. The patterns documented below have been validated in production across 10+ artifacts × 4 formats × prod-verified rendering.

---

## 1 · Architectural overview

```
┌─────────────────────────────────────────────────────────────────────┐
│ Substrate (Postgres)                                                │
│   source_events / source_event_artifact_states / pricing            │
│   submissions / etc.                                                │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ SourceGenerationContext                                             │
│   tenant + event + artifactStates + gateCriteria + evidence         │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ buildSourceDeliverableSpec(ctx, kind, generatedAt)                  │
│   one builder per SourceDeliverableKind; reuses legacy payload      │
│   binders to preserve substrate / fallback / archetype-default      │
│   behavior from Slices 2-7                                          │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ SourceDeliverableSpec                                               │
│   { kind, tenantKey, sourceEventId, title, payload, generatedAt }   │
│   structurally identical to Programs' DeliverableSpec               │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ renderSourceDeliverable(spec, requestedFormat?)                     │
│   1. routeFormat(spec.kind, requestedFormat) → DeliverableFormat    │
│   2. switch (spec.kind) → kind-specific adapter                     │
│   3. adapter calls the legacy renderer with kind-converted payload  │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
        SourceDeliverableRenderResult
        { format, buffer, filename, contentType, sizeBytes }
                  │
                  ▼
   GET /api/v1/source/:eventId/artifacts/:code/render?format=…
        bytes + audit headers
                  │
                  ▼
        Canvas anchor (DocumentTab) — download / view
```

---

## 2 · The 11 SourceDeliverableKinds

| Kind | Artifact code | Default format | Allowed formats |
|------|---------------|:--------------:|:---------------:|
| `scope-memo` | d05_scope_memo | docx | docx · html · pdf |
| `rfp-package` | d09_rfp_pack | docx | docx · html · pdf |
| `decision-brief` | d24_decision_brief | docx | docx · html · pdf |
| `selection-memo` | d27_selection_memo | docx | docx · html · pdf |
| `app-inventory` | d04_app_inv | xlsx | xlsx · docx |
| `response-checklist` | d11_response_checklist | xlsx | xlsx · docx |
| `scorecard` | d16_scorecard | xlsx | xlsx · docx |
| `pricing-template` | d19_pricing_workbook | xlsx | xlsx |
| `pricing-comparison` | d19_pricing_workbook (variant=comparison) | xlsx | xlsx |
| `trap-log` | d20_trap_log | xlsx | xlsx |
| `bafo-question-pack` | d22_bafo_question_pack | xlsx | xlsx |

The artifact-code ↔ kind mapping is bidirectional; URLs use codes, the dispatcher uses kinds.

---

## 3 · The 10 patterns

### Pattern 1 · Spec envelope, not direct payload
Callers never pass typed payloads to the dispatcher. They pass a `SourceDeliverableSpec` envelope with a `kind` discriminator. The dispatcher narrows by kind and converts the spec's `payload: Record<string, unknown>` to the appropriate typed shape internally.

### Pattern 2 · Per-kind narrow types
Each kind has a typed alias (`ScopeMemoSpec`, `AppInventorySpec`, etc.) extending a common `BaseSourceSpec`. These are the surface that callers and tests use; the dispatcher internally accepts the wider `SourceDeliverableSpec`.

### Pattern 3 · Substrate context → spec via a single builder
`buildSourceDeliverableSpec(ctx, kind, generatedAt)` is the *only* function that knows how to pull from substrate for each kind. It internally delegates to the legacy payload binders that ship the substrate / fallback / archetype-default behavior.

### Pattern 4 · Two-tier dispatch (kind → format)
1. `routeFormat(kind, requestedFormat?)` resolves the format (kind's default if unset; throws if requested format isn't allowed for the kind).
2. `renderSourceDeliverable(spec, format?)` switches on `spec.kind` to the right adapter, which invokes the right legacy renderer.

### Pattern 5 · Adapter, not rewrite
The migration from Slices 2-7's per-format dispatchers to the unified pipeline used **adapters** that call the existing renderers underneath. No rewrites of battle-tested rendering code. The adapter cost: one converter + one switch case per kind.

### Pattern 6 · Shared infrastructure under `src/lib/exports-shared/`
Every base helper (xlsx-base, docx-base, pdf-base, structured-docx-base, the 3 markdown-to-{html,docx,pdf} walkers) lives at the canonical shared path. Source imports from there. Moves and any future module imports from there. No copy-paste.

### Pattern 7 · Defensive fallbacks at every layer
- Missing body → canonical scaffold (with warning banner)
- Missing scope memo → archetype default
- Missing vendor submissions → demo-mode synthesis (with banner)
- PDF render fails → degraded cover-only fallback
- DB unavailable → empty list (graceful UI)

### Pattern 8 · Audit headers on every emission
- `x-source-artifact-code` — canonical d-code
- `x-source-event-code` — event code
- `x-source-artifact-format` — xlsx | docx | html | pdf
- `x-source-artifact-kind` — the SourceDeliverableKind
- `x-source-artifact-variant` — template | comparison (when set)
- `x-source-pdf-degraded: true` — when the PDF fallback fired

### Pattern 9 · One unified route, format as query param
```
GET /api/v1/source/:eventId/artifacts/:artifactCode/render?format=docx
GET /api/v1/source/:eventId/artifacts/:artifactCode/render?format=xlsx&variant=comparison
```

The legacy `/render-{xlsx,docx,html,pdf}` routes still exist during the transition. They continue to work but new code should use the unified route.

### Pattern 10 · Vertical slicing
Each PR ships **one artifact × one format** end-to-end (renderer + binder + dispatcher case + tests + prod verification). NOT "all renderers first, all UIs second."

---

## 4 · Reuse map for future modules (Moves, Tower, …)

To add a structured export pipeline to a new module, follow this checklist:

1. **Define the module's deliverable kind union** (`MoveDeliverableKind = 'm01-charter' | 'm02-…'`) in `src/lib/<module>/exports/types.ts`. Mirror the `SourceDeliverableKind` shape.

2. **Define the per-module spec interface** extending Programs' `DeliverableSpec` envelope (or copying its shape). One spec interface per kind (narrow type alias).

3. **Build the format router** (`src/lib/<module>/exports/format-router.ts`) with `DEFAULT_FORMAT` + `ALLOWED_FORMATS` maps + `routeFormat(kind, requested?)`.

4. **Build the spec-builder** (`src/lib/<module>/exports/spec-builder.ts`) with `buildModuleDeliverableSpec(ctx, kind, generatedAt)`. Internally call legacy payload binders (or skip if you're starting fresh).

5. **Build the dispatcher** (`src/lib/<module>/exports/dispatch.ts`) with `renderModuleDeliverable(spec, format?)`. Use the adapter pattern — one switch case per kind, each calling the right renderer with the right payload converter.

6. **Wire the unified route** at `/api/v1/<module>/.../:artifactCode/render?format=…&variant=…` matching Source's shape exactly.

7. **Use shared infrastructure from `src/lib/exports-shared/`** — don't duplicate the bases or the markdown walkers.

8. **Wire canvas anchors** to point at the unified route with the right `format` and (where applicable) `variant` query params.

9. **Add tests at every layer** — format-router, dispatcher per kind, spec-builder, route.

10. **Verify on prod** end-to-end by downloading the generated artifact + opening it in the target application (Word, Excel, browser, PDF viewer).

---

## 5 · Why this strategy

- **Single envelope across modules** — Programs and Source both use `DeliverableSpec`. Future modules drop in seamlessly. A future "Universal AbarVa Export" library could swap in any module's dispatcher with the same call shape.
- **Kind-based dispatch is testable + debuggable** — the switch at the top of `renderSourceDeliverable` is the single place where format × kind decisions happen. New kinds add one case; new formats add one branch.
- **Adapter-first migration kept Slices 2-7's investment** — 10+ artifacts × 4 formats × 576 tests × prod verification all preserved without renderer rewrites.
- **Shared infrastructure stops drift** — every module shares the same docx-base, the same markdown-to-html walker, the same v3 typography. No fork divergence.
- **Vertical slicing made the multi-day migration shippable** — Slice 8.1 → 8.5 each landed independently with prod-green tests at every step.

---

## 6 · Path C migration changelog (Slices 8.1–8.5)

| Slice | What | Commit |
|-------|------|--------|
| 8.1 | Foundations — `SourceDeliverableKind`, `SourceDeliverableSpec`, `format-router.ts` | `ef38f2d9` |
| 8.1.1 | Hotfix — duplicate Jest mocks at `src/lib/exports-shared/__mocks__/` were silently overriding the canonical `src/__tests__/__mocks__/` via haste-map | `05b5ba3f` |
| 8.1.2 | Bases extraction — `exports-shared/` replaced with Source's v3 versions; m01-charter rewritten to match | `96806047` |
| 8.2 | First adapter — d05 scope-memo dispatched end-to-end | `799aae56` |
| 8.3 | Remaining 10 kinds wired through `dispatch.ts` | `226ce7bb` |
| 8.4 | Unified `/render?format=…` route + `spec-builder.ts` | `a05cd016` |
| 8.5 | Canvas anchors repointed at unified route + this STRATEGY.md update | _this PR_ |

After 8.5: the legacy per-format routes (`/render-xlsx` / `/render-docx` / `/render-html` / `/render-pdf` / `/render-comparison-xlsx`) still exist for backward compatibility with any external consumer that might hit them. Schedule for deletion: when no traffic has hit them for 2+ weeks, or in a future cleanup slice.

---

## 7 · Open questions / future work

- **Programs convergence on this strategy** — Programs has its own pipeline at `src/lib/programs/exports/` with the same `DeliverableSpec` envelope shape. The two pipelines are conceptually unified but physically separate; a future slice can deduplicate by extracting the dispatcher pattern into `src/lib/exports-shared/` itself.
- **PDF font registration** — PDFs still use built-in Helvetica + Times-Roman + Courier as approximations of v3 typography. A future slice (formerly Slice 7.2) registers actual woff2 font files via `@react-pdf/renderer`'s `Font.register` API.
- **Vendor upload-back UI for d19c** — the upload pipeline shipped (Slice 2c.2) but the migration to apply has not been run on prod Supabase. Until then, the pricing-comparison stays in demo mode (still useful synthetic data).
- **Moves transport** — the m01-charter stub is in place using the shared infrastructure. The Moves canonical spec catalog + substrate schema + per-kind narrow types remain to be defined before m01 can ship as a real artifact.
