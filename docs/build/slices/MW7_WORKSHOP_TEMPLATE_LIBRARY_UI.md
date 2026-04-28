# MW7 · Workshop Template Library UI

Slice ID: MW7
Slice name: Workshop Template Library UI
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Code (sole)

Catalog of AbarVa workshop templates spanning the canonical Maestro
arc — discovery, framing, value, governance, architecture, adoption,
and executive review. Each template names the purpose, the prerequisite
inputs the room must bring, the deterministic agenda, the decision
the workshop is meant to land, and the artifacts the room will produce.
**No model calls, no calendar/booking integration, no live agenda
generation, no migrations, no auth.**

## What changed

- New module
  [src/lib/programs/workshop-template-library.ts](../../../src/lib/programs/workshop-template-library.ts):
  - Public types: `WorkshopTemplateCategory`, `WorkshopTemplateAgenda`,
    `WorkshopTemplateInputs`, `WorkshopTemplate`,
    `WorkshopTemplateLibrarySummary`.
  - Public helpers:
    - `listWorkshopTemplateCategories()` — canonical category list,
      in display order.
    - `buildWorkshopTemplateLibrary()` — emits the deterministic
      catalog of workshop templates. At least one template per
      canonical category and seven or more templates total.
    - `summarizeWorkshopTemplateLibrary(templates)` — aggregates
      `byCategory`, `totalDurationMinutes`, and `uniqueCategories`
      that reconcile to `totalCount`.
    - `getTemplatesByCategory(category)` — filter the library by
      category.
  - `createdFrom: 'deterministic_workshop_template_library_seed'`.

- New component
  [src/components/programs/WorkshopTemplateLibrary.tsx](../../../src/components/programs/WorkshopTemplateLibrary.tsx):
  - **Server Component** (no `'use client'`, no React hooks).
  - Props: `templates?`, `summary?` — accepts an explicit template
    list and/or a summary; defaults to the deterministic library.
  - Renders templates grouped by canonical category with a hairline
    grid: per-template title, duration, purpose, decision-to-land,
    required + optional inputs, agenda steps with intent and per-step
    duration, outputs, and facilitator notes.
  - Eyebrow: `WORKSHOP TEMPLATE LIBRARY · MW7`.
  - Future-only `Open template` actions are rendered as `disabled`
    buttons with `aria-disabled="true"` and a `Future action · not
    wired` caption — the deferred path is visible but never reachable.
  - Caption: `Source · deterministic workshop template library seed
    · open-template action deferred`.
  - Reads color and font tokens from `@/lib/design/abarva-theme`
    only — no local hex literals, no local DM Sans font-family
    literal.

- New tests
  [src/__tests__/integration/programs/workshop-template-library.test.ts](../../../src/__tests__/integration/programs/workshop-template-library.test.ts):
  Deterministic tests covering determinism, all seven canonical
  categories present, ≥7 templates total, unique template ids,
  required field set per template, agenda step ordering and duration
  reconciliation (sum of step durations equals the template
  duration), no-fabrication invariants (no dollar amounts, no real
  `E-###` citations), summary reconciliation across category and
  duration, module hygiene on the `.ts` source (no Source UI /
  Sentinel / Atlas / Nexus / Agent runtime / auth / supabase /
  programs mock imports, no `Date.now` / `Math.random` / `new Date`
  / `fetch`, no Claude / OpenAI / Pinecone runtime references), and
  canon hygiene on the `.tsx` source (theme import present, no local
  hex literals, no local DM Sans font-family literal, no `'use
  client'`, no React hooks).

## Workshop template categories and seed templates

| Category | Template id | Title |
|---|---|---|
| discovery | `wstpl:discovery:current_state_walk` | Current-state operating walk |
| discovery | `wstpl:discovery:opportunity_map` | Opportunity and pain mapping |
| framing | `wstpl:framing:use_case_prioritization` | Use-case prioritization rubric |
| value | `wstpl:value:baseline_and_target` | Baseline anchor and target framing |
| governance | `wstpl:governance:risk_review` | Governance and responsible-AI risk review |
| architecture | `wstpl:architecture:solution_design` | Target architecture and integration boundary |
| adoption | `wstpl:adoption:change_readiness` | Adoption and change-readiness rubric |
| executive_review | `wstpl:executive_review:decision_review` | Executive decision review |

## Deterministic invariants (test enforced)

- Same input → identical output across repeated calls.
- Canonical category list is stable: `discovery`, `framing`, `value`,
  `governance`, `architecture`, `adoption`, `executive_review`.
- ≥1 template per canonical category and ≥7 templates total.
- Template ids are unique.
- Every template carries a non-empty `title`, `purpose`,
  `decisionToLand`, ≥1 required input, ≥3 agenda steps with
  contiguous step numbers, each step has a positive duration and a
  non-empty intent, ≥1 output, and the deterministic source.
- Agenda step durations sum to the template duration.
- No string field invents a dollar amount or claims a real
  `E-###` evidence citation.
- `byCategory` summary counts reconcile to `totalCount`;
  `totalDurationMinutes` reconciles to the sum of every template's
  duration; `uniqueCategories` enumerates exactly the represented
  categories in canonical order.

## Canon hygiene (test enforced)

- Component imports tokens from `@/lib/design/abarva-theme` only.
- No local hex literals, no local DM Sans font-family literal.
- No `'use client'`, no React hooks
  (`useState`/`useEffect`/`useMemo`/`useReducer`/`useCallback`).
- No `Date.now` / `Math.random` / `new Date` / `fetch`.
- No imports from Source UI, Sentinel / Atlas / Nexus / Agent
  runtime, legacy `/programs` routes, `programs/mock`, auth, or
  supabase.
- No Claude / OpenAI / Pinecone runtime references.

## What is NOT yet wired

- **No live agenda generation.** Agendas are fixed deterministic
  seeds; the room cannot edit a template in this slice.
- **No booking / scheduling.** The library does not place a workshop
  on a calendar.
- **No `Open template` action.** Per-template actions render as
  disabled `Future action · not wired` controls so the deferred path
  is visible without being reachable.
- **No tenant-specific template overrides.** The library is global;
  per-tenant overrides land with the workshop-mode persistence path.
- **No persistence.** The component reads the deterministic seed on
  every render.

## What is deferred

- **Live agenda editor.** Lets the Maestro tailor the deterministic
  seed in the room.
- **Workshop scheduling and booking integration.** Wires the
  `Open template` action to the workshop-mode flow.
- **Per-tenant template library.** Renders the tenant-specific
  template overrides alongside the canonical seed.

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/programs/workshop-template-library.test.ts` — pass
- `npx eslint --max-warnings=0 src/lib/programs/workshop-template-library.ts src/components/programs/WorkshopTemplateLibrary.tsx src/__tests__/integration/programs/workshop-template-library.test.ts` — pass
- `npm run build` — pass (symlink panic on Vercel-style symlinks is acceptable in worktree)

## Status

Code complete. Pending founder review.
