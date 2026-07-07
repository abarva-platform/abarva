# Hidden Configurations, Validators, Tripwires, Scorers, And Proof Scripts Audit

## Summary

The audit found three material failure modes that could override or mis-score a
valid Home/aVa dossier answer:

1. Backend validation could rewrite sourced prose when harmless decision-related
   wording matched the broad decision regex.
2. Frontend rendering could convert any backend tripwire into `I do not see that
   in the loaded data`, even when evidence was present.
3. Proof scripts and reports did not consistently show all evidence channels, so
   a valid dossier with `factsBound = 0` could be scored as failed.

## Audited Areas

| Area | Files |
|---|---|
| Backend Home KNOW engine | `src/lib/home/know/home-know-engine.ts` |
| Dossier-to-Home response composition | `src/lib/home/know/compose-dossier-answer.ts` |
| Dossier quality gate | `src/lib/home/know/home-answer-quality-gate.ts` |
| Frontend Home answer renderer | `src/components/home/know/HomeKnowAnswerRenderer.tsx` |
| Dossier crawler | `scripts/qa/home-dossier-crawl.ts` |
| Live quality eval | `scripts/qa/eval-home-know-quality.mjs` |
| Live Home gate | `scripts/qa/home-live-gate.mjs` |

## Findings And Fixes

| Finding | Risk | Fix |
|---|---|---|
| `factsBound` was over-weighted in proof logic | Valid table/chart/graph dossiers could fail proof | Added shared evidence-channel helper and crawler reporting |
| Frontend no-data fallback was too broad | Valid sourced answers could become false no-data | Frontend no-data now requires structured `empty_dossier` status |
| Backend decision sanitizer could erase valid prose | Good synthesis became weak fallback prose | Validator preserves usable evidence and only flags empty-dossier fallback |
| Composer trace was too skinny | Debug/proof could not see citations, source coverage, charts, graphs, rollups, relationships | Expanded trace with evidence-channel counts |

## Remaining Watch Items

- Intelligence, Source, Moves, and Tower have their own validators and answer
  surfaces. This change hardens the Home/aVa dossier path and its shared proof
  scripts; the same evidence-channel standard should be adopted by other module
  answer composers as they move to dossier-style packets.
- The live Home path still uses deterministic dossier composition. A future
  consultant-grade Claude prompt should consume this evidence-channel packet
  directly.
