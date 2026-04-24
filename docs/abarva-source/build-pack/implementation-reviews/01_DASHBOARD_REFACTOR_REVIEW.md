# Dashboard Refactor Review

Date: 2026-04-24

This review packet covers the dashboard refactor slice as present in the working tree. Important context: the Source implementation files are currently untracked, so this is a static working-tree review rather than a tracked `git diff` review.

## 1. Scope Summary

The intended slice was to refactor `AbarVaSourceDashboard` into a cleaner orchestration component while keeping the broader Source product surface stable.

Intended changes:

- Refactor `AbarVaSourceDashboard` so it owns dashboard-level composition: portfolio summary, KPI cards, Nexus portfolio read, decisions-needed panel, and event table placement.
- Move event table display logic into `SourcingEventTable`.
- Move Nexus alert and decision rendering into `SourceAlertPanel`.
- Use Source-specific canonical constants and types for stage labels, lifecycle labels, stage states, golden event IDs, golden values, and shared Source data contracts.
- Keep event canvas, scorecard UI, artifact drawer, value ledger UI, vendor response flow, and AI generation untouched at feature depth.

The slice does appear to preserve the intended boundary. Some adjacent components changed only to consume shared Source lifecycle helpers or formatting, not to expand their workflows.

## 2. Files Changed

| File | Why it changed | Scope | New behavior | Keep in slice? |
| --- | --- | --- | --- | --- |
| `src/components/source/AbarVaSourceDashboard.tsx` | Reduced to dashboard orchestration: description, KPI cards, Nexus summary, alert panel mount, and event table mount. | In scope. | Yes. It now delegates event table rendering and alert rendering to child components. | Yes. This is the center of the refactor. |
| `src/components/source/SourcingEventTable.tsx` | Extracted live event table logic from the dashboard into a dedicated table component. | In scope. | Yes. It owns event row display for archetype, rigor, workflow status, owner, aging, blocker, value, next action, and open-event links. | Yes. This is the main decomposition target. |
| `src/components/source/SourceAlertPanel.tsx` | Centralized Source/Nexus alert rendering with severity labels, owner/status metadata, empty state, and event action links. | In scope. | Yes. Alert rendering is reusable for dashboard decisions and event-level Nexus panels. | Yes. This is the alert decomposition target. |
| `src/components/source/EventLifecycleStatusBadge.tsx` | Added/standardized lifecycle badge rendering from lifecycle status helpers. | In scope support. | Yes. Lifecycle statuses now map to consistent visual tones and labels. | Yes. It prevents duplicated status styling across Source event surfaces. |
| `src/components/source/SourceActiveStageWorkspace.tsx` | Uses lifecycle helpers for active stage and stage state label. | Incidental support. | Minimal. It keeps the active-stage workspace deterministic and label-driven. | Yes, if this slice includes shared lifecycle cleanup; otherwise it can be considered harmless support work. |
| `src/components/source/SourceJourneyTracker.tsx` | Uses `SOURCE_STAGE_ORDER` and `getStageStateLabel` to keep journey display aligned with canonical stages. | Incidental support. | Minimal. It does not expand the journey tracker beyond seeded stage display. | Yes, because it aligns static stage display with canonical constants. |
| `src/components/source/SourcingEventCard.tsx` | Uses shared lifecycle badge and value formatting for card-style event display. | Incidental support. | Minimal. It normalizes card status/value rendering but does not add a new flow. | Yes, as consistency support for event display. |
| `src/lib/source/constants.ts` | Defines Source product labels, routes, stage order, lifecycle labels, stage state labels, artifact/scorecard labels, golden event IDs, golden values, total value, foundations, reuse map, and avoid list. | In scope. | Yes. Centralizes values that were otherwise likely to drift. | Yes. This is the canonical Source constant boundary. |
| `src/lib/source/types.ts` | Defines Source route, rigor, lifecycle, stage, alert, artifact, scorecard, value ledger, event, and dashboard data contracts. | In scope. | Yes. Dashboard/table/panel props now use typed Source contracts. | Yes. Needed for clean orchestration. |
| `src/lib/source/mock-seed.ts` | Seeds the three golden demo events, dashboard metrics, attention items, artifacts, scorecard state, and value ledger data using canonical IDs, labels, and values. | In scope for deterministic dashboard data. | Yes. The dashboard now renders golden values and attention rows from Source seed data. | Yes. Required until real data is wired. |
| `src/lib/source/lifecycle.ts` | Adds lifecycle helper functions for status tone, status labels, stage state labels, active stage selection, operational stage checks, journey summaries, and stage index. | In scope support. | Yes. Centralizes status/stage interpretation. | Yes. It supports the table, badges, and tracker without expanding UI. |
| `src/lib/source/value-ledger.ts` | Adds ledger rollups and `formatUsd`. | In scope support. | Yes. Money formatting is now shared by dashboard, table, cards, and ledger. | Yes. Needed for consistent golden value rendering. |

Review note: the working tree contains additional untracked Source route/component/lib files beyond this list. They are outside this packet's requested file list, but they affect commit hygiene because `/source` will not render from the listed files alone.

## 3. Dashboard Component Architecture

`AbarVaSourceDashboard` responsibilities:

- Owns top-level dashboard layout inside the Source shell.
- Renders portfolio description and KPI cards.
- Renders the Nexus portfolio read block and value-ledger call to action.
- Mounts `SourceAlertPanel` for dashboard-level decisions needed.
- Mounts `SourcingEventTable` for the live event portfolio.

`SourcingEventTable` responsibilities:

- Owns table layout and row-level event data display.
- Displays event identity, account, blocker, archetype, rigor, stage, lifecycle badge, risk pill, owner, aging, value at stake, next action, next decision, and open-event link.
- Uses `EventLifecycleStatusBadge` and `formatUsd`.

`SourceAlertPanel` responsibilities:

- Owns alert/decision rendering.
- Maps alert severity to display label and color.
- Displays owner or status metadata.
- Provides empty state and optional event action link.

`EventLifecycleStatusBadge` responsibilities:

- Owns lifecycle badge display only.
- Converts `SourceLifecycleStatus` into a tone through `getLifecycleTone`.
- Uses canonical lifecycle labels when a caller does not provide a label.

Ownership split:

- Layout owner: `AbarVaSourceDashboard` owns dashboard layout; `SourcingEventTable` owns internal table layout; `SourceAlertPanel` owns internal alert-list layout.
- Data display owner: KPI/summary data stays in `AbarVaSourceDashboard`; event rows live in `SourcingEventTable`; alert rows live in `SourceAlertPanel`.
- Alert rendering owner: `SourceAlertPanel`.
- Static/deterministic behavior: all displayed dashboard data currently comes from `src/lib/source/mock-seed.ts` through Source query helpers. There is no AI generation, mutation, live vendor flow, or dynamic scoring in this slice.

## 4. Design Quality Check

| Bar | Assessment |
| --- | --- |
| Premium enterprise feel | Pass on static inspection. The dashboard uses the existing design-system colors, cards, typography, restrained risk treatments, and operating-language copy. Needs authenticated visual QA before final signoff. |
| Calm density | Pass. Four KPI cards, one Nexus summary/decision section, and one dense table is a reasonable operating-dashboard density. |
| Clear value at stake | Pass. The dashboard KPI shows total value at stake, and each event row shows projected sourcing value. |
| Clear next action | Pass. Each event row has a next action and next decision; alerts also carry action labels. |
| Clear event status | Pass. Lifecycle badge plus optional at-risk pill makes status visible. |
| Clear owner/aging/blocker | Pass. Owner, aging, and blocker/no-blocker state are explicit in the event table. |
| No card spam | Pass. The dashboard avoids repeated decorative cards and uses the table as the main event surface. |
| No generic chatbot feel | Pass. There is no chat input or transcript pattern; Nexus reads as operating guidance. |
| No procurement portal feel | Pass. It uses a table, but not procurement-grid chrome. The copy stays focused on sourcing decisions, readiness, value, and blockers. |
| No fake AI | Pass. The Nexus summary and alerts are deterministic seeded data, not simulated generation. |
| No overbuilt charts | Pass. No charting was added. |

## 5. Data / Constants Check

| Requirement | Status |
| --- | --- |
| Stages | Confirmed. `SOURCE_STAGE_ORDER` and `SOURCE_STAGE_LABELS` exist in `src/lib/source/constants.ts`. |
| Lifecycle statuses | Confirmed. `SOURCE_LIFECYCLE_STATUS_LABELS` and `SOURCE_WAITING_LIFECYCLE_STATUSES` exist. |
| Rigor levels | Partial. `SourceRigorLevel` is a canonical type, but labels are still formatted locally in `SourcingEventTable`. There is no exported `SOURCE_RIGOR_LEVEL_LABELS` constant yet. |
| Archetypes | Partial. `SOURCE_DEFAULT_SCORECARD_ARCHETYPE_IDS` exists, and event summaries carry an `archetype` field, but dashboard archetype display labels are still seeded strings. There is no exported canonical archetype label map yet. |
| Stage states | Confirmed. `SOURCE_STAGE_STATE_LABELS` exists and is used by lifecycle helpers. |
| Value formatting | Confirmed as a canonical helper. `formatUsd` exists in `src/lib/source/value-ledger.ts` and is used by dashboard/table/card/ledger displays. |
| Golden demo event IDs | Confirmed. `SOURCE_GOLDEN_EVENT_IDS` exists and seeds the three golden events. |

Golden value rendering is consistent through `SOURCE_GOLDEN_EVENT_VALUES_USD`, `SOURCE_TOTAL_VALUE_AT_STAKE_USD`, and `formatUsd`:

- `18_500_000` renders as `$18.5M`
- `42_000_000` renders as `$42.0M`
- `2_800_000` renders as `$2.8M`
- `63_300_000` renders as `$63.3M`

## 6. Regression / Boundary Check

Static search and file review indicate this slice did not:

- Build event canvas further.
- Build scorecard UI further.
- Build artifact drawer further.
- Build value ledger UI further.
- Build vendor response flow.
- Wire AI generation.
- Touch `/programs` implementation.
- Touch `/preview` implementation.
- Touch `/demo` implementation.
- Use `ProgramSurface`.
- Use `src/lib/programs/mock.ts`.

Boundary nuance: `SourceAlertPanel` is reusable by event-level Source surfaces, but that is shared alert rendering, not an expansion of the event canvas workflow. The Source constants file also contains an avoid list naming `/programs`, `/preview`, `/demo`, `ProgramSurface`, and `src/lib/programs/mock.ts`; that is a guardrail, not a dependency.

## 7. Visual Review Request

Screenshot status: no trustworthy screenshot captured from this session.

Local preview check:

- Started `npm run dev -- -p 3000`.
- Requested `http://localhost:3000/source`.
- Result was blocked by Clerk protection: `HTTP/1.1 404 Not Found`, `x-clerk-auth-reason: protect-rewrite, dev-browser-missing`, `x-clerk-auth-status: signed-out`, with middleware rewrite to `/clerk_1777051154070`.

Static render notes:

- Route: `/source`
- Expected first screen: Source shell header, portfolio description, four KPI cards, Nexus Portfolio Read section, Decisions Needed alert panel, and Live Sourcing Events table.
- The event table should show event name/code/account, blocker state, archetype/rigor, lifecycle status, at-risk state, owner, aging, value at stake, next action, next decision, and Open event link.
- Manual visual inspection should use an authenticated local browser session at `/source`.

## 8. Validation

| Command | Result |
| --- | --- |
| `npm run lint` | Inconclusive. The plain repo lint command started scanning generated nested worktree artifacts under `.claude/worktrees/engagement-v2/.next/**` and emitted repeated Babel deoptimization notices. It was stopped after it did not reach a useful endpoint. |
| `npx eslint 'src/app/(maestro)/source' src/components/source src/lib/source --max-warnings=0` | Passed with exit code 0. |
| `npx tsc --noEmit` | Passed with exit code 0. |
| `npm run build` | Passed with exit code 0 on Next.js 16.2.2 Turbopack. Build output includes `/source`, `/source/events`, `/source/events/[eventId]`, `/source/events/[eventId]/artifacts/[artifactId]`, `/source/events/[eventId]/scorecard`, and `/source/value`. |

## 9. Commit Recommendation

Recommendation: hold commit due to repo state.

Reasoning:

- The Source slice itself passes TypeScript, production build, and Source-scoped ESLint.
- The plain repo-wide lint command is currently not a clean validation signal because `.claude/worktrees/**` is not ignored and generated `.next` output is being scanned.
- At review start, git status matched the expected caution state: `main...origin/main [ahead 1, behind 16]`.
- A final sanity check reported a different current branch, `code/cycle3-w1-fm03-d01-integration`, with tracked non-Source modifications present. That branch/status drift should be resolved before committing this slice.
- Source files are untracked, and there are additional untracked docs, reports, and temporary files in the working tree.
- Two canonical-constant items are still partial: rigor labels and archetype display labels. If the Build Pack requires literal canonical constants for these, revise constants/types in a follow-up micro-slice before the dashboard refactor commit.

## 10. Git State Note

Current git state observed:

- Initial status at review start: `main...origin/main [ahead 1, behind 16]`.
- Final status check after validation: branch `code/cycle3-w1-fm03-d01-integration`.
- Final status check also showed tracked non-Source modifications in:
  - `package-lock.json`
  - `package.json`
  - `src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/deliverables/[deliverableCode]/page.tsx`
  - `src/app/api/programs/phase-gate/route.ts`
  - `src/components/deliverables/DeliverableTierRenderer.tsx`
- Source files are untracked.
- Additional untracked docs, reports, and `tmp_verify_cycle1_live.ts` are present.

Recommended safe next git steps before commit:

- Do not commit until the branch/status drift is understood.
- If returning to `main`, confirm whether it is still ahead 1 / behind 16 before committing.
- Fetch and inspect upstream changes before deciding whether to rebase, merge, or branch from the current working tree.
- Create a dedicated branch such as `codex/source-dashboard-refactor-review` before staging.
- Decide whether the broader untracked Source route family is part of the same commit. The twelve reviewed files alone are not the full `/source` route surface.
- Stage only intentional files. Leave unrelated docs, reports, zip files, and temporary verification files unstaged unless they are explicitly part of the commit.
- Re-run validation after git hygiene is resolved, especially repo-wide lint after excluding or removing generated nested worktree artifacts from the lint target.
