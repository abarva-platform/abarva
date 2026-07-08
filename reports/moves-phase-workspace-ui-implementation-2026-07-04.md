# Moves — Phase Workspace UI cards (increment 2 implementation report)

**Date:** 2026-07-04 · **Slice:** the nine client-facing phase-workspace cards that render the typed phase-template layer (increment 1, PR #4557), driven by the Lakeshore Legal fixture. Target UX: `Moves Phase Workspace · standalone (1).html` (Claude Design).

## 1. Executive verdict

Delivered the **nine presentational cards** + a **demo composition** that renders the Lakeshore Legal fixture through them, matching the approved Claude Design standalone (cream `#f7f5f1`, Georgia serif headings, blue kickers, status/lane chips, human-attestation gate). Components are **pure functions of the typed layer** — no app state, no data fetching, no `@/` imports — so they render identically in the app and in a static server-render. Because `main` is red from an unrelated merge (the Next app won't boot), I verified by **server-rendering the real components with the real fixture to static HTML and screenshotting it in a browser** — not by running the dev server. All nine cards render faithfully; every governance cue is visible.

Wiring the cards into the live `StrategicMovePhaseClient` behind a flag (increment 3) remains deferred until `main` is green, because that step can only be honestly proven against a booting app.

## 2. What was implemented

New module `src/components/strategic-moves/phase-workspace/`:
- `styles.tsx` — self-contained token + utility stylesheet (mirrors the standalone's CSS variables); no Tailwind dependency.
- `primitives.tsx` — `Card`, `Chip`, `Lane`, `KeyValue`, `statusMeta`, `confidenceTone`.
- `cards.tsx` — the nine cards.
- `PhaseWorkspaceComposition.tsx` — demo composition binding the fixture.
- `index.ts` — public surface.
- `__tests__/phase-workspace.test.tsx` — 12 server-render tests.

The nine cards (client-facing names → what they render):
1. **PhaseCompletionGuideCard** — "How to complete this phase": steps, recommended session count, template count.
2. **PhaseTemplatesAndSessionsCard** — "Templates & deliverables": each template with session type + format.
3. **CurrentStateAssessmentMap** — "Current-state assessment": dimensions with status chips (Evidence-backed / Partial / Gap / Needs confirmation) + lane labels.
4. **BuildingBlockLaneCanvas** — "Recommended solution building blocks … not one label"; the selected blocks + the amber "Not recommended yet" guardrail.
5. **SolutionOptionsCanvas** — "Solution options": A/B/C with the recommended one highlighted + what is deferred.
6. **BlockToWorkstreamPreview** — "Each block becomes a workstream": lanes → owner / risk / metric table.
7. **UploadMappingSummaryCard** — "What AbarVa found — and where it went": plain-English mapping, parsed outputs with lanes, "Move-scoped only", "Not added to enterprise context yet."
8. **NextPhaseReadinessPackCard** — "Ready to start: Build the Plan … the next phase never starts blank": the feed-forward Inputs Pack.
9. **ClientFinalReviewCard** — "What changed vs. the AbarVa draft" + the black human-attestation gate ("Advance the gate — attest to the findings" / "Approve & advance →").

## 3. UX changes

The cards reproduce the approved design's structure and voice. Verified in-browser: serif headings, blue uppercase kickers, cream cards, green/amber/red status chips, blue lane chips, the recommended-option green highlight, and the dark gate bar. Nothing is wired into a live app route in this increment — the composition is a standalone preview.

## 4. Data / intelligence layer changes

None. Increment 2 is pure presentation over increment 1's typed layer. Every value on screen comes from `LAKESHORE_LEGAL_DEMO_FIXTURE` or `PHASE_TEMPLATE_CATALOG`; no numbers or facts are authored in the components.

## 5. Governance held (verified on screen)

- **Client-friendly only:** raw block keys (`process_redesign`, …) and dev/schema terms never reach the DOM — asserted by test and confirmed visually (chips read "Process redesign", "Human-in-the-loop agent", etc.).
- **Move-scoped by default:** the upload card shows "Move-scoped only" and "Not added to enterprise context yet."
- **Ambition ≤ readiness:** the "Not recommended yet" guardrail (fully autonomous review, auto-approval of non-standard terms) renders prominently in both the block canvas and the options canvas.
- **Human attestation:** the gate is a "set of human attestations", not an auto-advance.

## 6. Files changed

New: `src/components/strategic-moves/phase-workspace/{styles,primitives,cards,PhaseWorkspaceComposition}.tsx`, `index.ts`, `__tests__/phase-workspace.test.tsx`. Proof: `proof/moves-phase-workspace-ui-2026-07-04/phase-workspace-lakeshore-render.html`. Docs: this report + the release record.

## 7. Tests / validation run

- **Jest — 12/12 pass** (`npx jest src/components/strategic-moves/phase-workspace`): each card renders its fixture content; friendly labels not raw keys; Move-scoped + no-auto-promotion note present; guardrails present; full composition renders every card with no dev/schema terms.
- **Scoped strict `tsc --noEmit`** (components + lib, `jsx: react-jsx`) — **exit 0**.
- **ESLint** on the new dir — **exit 0**.
- **Server-render proof**: the real components + real fixture → static HTML (all 9 content self-checks pass), served over HTTP and screenshotted in-browser across the full scroll. Every card confirmed visually.
- Full-project build **not** run: `main` is red from an unrelated merge; the module is self-contained so this does not affect it.

## 8. Screenshots / proof

`proof/moves-phase-workspace-ui-2026-07-04/phase-workspace-lakeshore-render.html` (openable directly). In-browser screenshots of the header, assessment map, building-block + options canvas, upload-mapping, readiness pack, workstream table, and gate were captured during verification.

## 9. Known gaps / non-claims

- **Not wired into the live phase page.** No app route renders these yet; increment 3 mounts them into `StrategicMovePhaseClient` behind a flag and requires `main` green for live proof.
- **Presentational only.** The gate button and template rows are styled, not interactive; upload→classify and template download are increment 3.
- Verified via server-render + browser screenshot, **not** the running Next app (blocked by broken `main`).

## 10. Recommended next backlog

1. Increment 3: mount the composition inside `StrategicMovePhaseClient` behind `moves_phase_workspace_v2` (off), additive to the existing upload/review flow; live signed-in Lakeshore proof once `main` is green.
2. Wire real upload → `classifyUpload` and "Download template".
3. Increment 4: live Pattern Assembly loop (`buildPatternAssemblyPacket` → governed Claude → `validateAssembledResponse`) rendering the validation labels.
