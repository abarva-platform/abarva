# Moves — Deterministic Feed-Forward Inputs Pack (increment 6 implementation report)

**Date:** 2026-07-04 · **Slice:** make "a phase never starts blank" real by deriving the next-phase Inputs Pack from actual move state — deterministic, read-only, no Claude, no DB, no fixture on the live page.

## 1. Executive verdict

The phase workspace now shows a **"Prepared for [next phase]"** card built entirely from the move's **real** current-state intelligence. It is transition-aware (P2→P3, P3→P4, P4→P5, P5→Tower), read-only, and honest: any section without real data shows **"Needs confirmation"**, never a fabricated value. This is **Level 1** feed-forward — the safe, correct foundation. **Level 2** (persisting an *approved* pack as the next phase's source of truth) is deliberately deferred until the client-final/approval path is wired.

## 2. Acceptance criteria — met

| Requirement | Result |
|---|---|
| Uses real move state | ✅ reads maturity, readiness, gaps, missing evidence, open gate criteria |
| No Claude dependency | ✅ pure deterministic adapter (`buildFeedForwardPack`) |
| No DB migration | ✅ read-only generated pack |
| No fixture on live page | ✅ live page uses actual Lakeshore move state (fixture only in the render proof/tests) |
| Works with chat off | ✅ pure props; chat-decoupling contract test still green |
| Shows next phase clearly | ✅ "Prepared for P3 / P4 / P5 / Tower" headline |
| Explains what carries forward | ✅ carry-forward bullets + Design inputs / Evidence gaps / Risks / Recommended focus |
| Tests cover mapping | ✅ P2→P3, P3→P4, P4→P5, P5→Tower + "missing → Needs confirmation" |

## 3. What the card shows (P2 → P3, live)

- **Headline:** "Prepared for P3 — Choose the Approach".
- **AbarVa will carry forward:** current-state gaps · readiness constraints · evidence still missing · control constraints · open questions for solution design.
- **Sections:** Design inputs (gaps + readiness constraints + controls) · Evidence gaps (missing evidence + soft gaps) · Risks to consider (severe gaps + "do not over-automate high-control decisions") · Recommended P3 focus (compare process-first vs. embedded assist vs. orchestration).

## 4. Mapping model (transition-aware)

`buildFeedForwardPack(fromPhase, nextPhaseLabel, signals)`:
- **P2→P3:** Design inputs · Evidence gaps · Risks · Recommended focus.
- **P3→P4:** Selected approach · Workstream candidates · Constraints & controls · Recommended focus.
- **P4→P5:** Workstreams & owners · Launch readiness · Risks · Recommended focus.
- **P5→Tower:** Metrics to track · Metric owners · Risks (overclaiming) · Recommended focus.
Each section is `ready` (real items) or `needs_confirmation` (no data yet → shown as "Needs confirmation"). Gaps ordered most-severe first; lists de-duplicated and bounded.

## 5. Real data sources (from `StrategicMovePhaseClient` props)

`recommendation.maturity` (scored dimensions), `recommendation.gaps` (capability + severity), `recommendation.whereToStart`, `readiness.hardGaps/softGaps/coverageScore`, `evidenceNeedPackets` (status missing/partial → evidence gaps), `move.gateCriteria` (not completed → open questions). Passed only for the current phase.

## 6. Files changed

New: `feed-forward.ts`, `NextPhaseFeedForwardCard.tsx`, `__tests__/feed-forward.test.ts`. Edited: `MovePhaseWorkspacePanel.tsx`, `index.ts`, `StrategicMovePhaseClient.tsx`, `__tests__/phase-workspace.test.tsx`. Proof: `proof/moves-phase-feedforward-2026-07-04/phase-feedforward-p2-render.html`.

## 7. Tests / validation

- Jest **49/49** (4 transition mappings + "missing → Needs confirmation" + card/panel render).
- esbuild parse of the edited client — exit 0. Scoped strict `tsc` — exit 0. ESLint — exit 0.
- Render proof screenshotted; live Lakeshore proof post-deploy.

## 8. Known gaps / non-claims

- **Level 2 (persisted approved pack) is out of scope** — comes after the client-final/approval path (needs DB + governance).
- Downstream-decision sections show "Needs confirmation" until later phases produce them.
- Full-project `tsc --noEmit` red from an unrelated merge; does not block build/deploy.

## 9. Next backlog (per direction)

7. Template download placeholders / sample docs. 8. Real upload → `classifyUpload` → UploadMappingSummaryCard. 9. Client-final upload → What Changed → impacted next-phase pack. 10. Persist approved Inputs Packs (Level 2). 11. RBAC/RLS + enterprise-promotion guardrail. 12. Pattern Assembly / Claude insights. 13. Tier 2 grounded chat.
