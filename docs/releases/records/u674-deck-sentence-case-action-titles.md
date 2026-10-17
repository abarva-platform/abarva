# u674 — Reference-deck words: sentence case, action titles, recorded text mid-sentence

## Release ID

`2026-10-17-moves-deck-sentence-case-action-titles`

## Status

`candidate`

## Plain-English Summary

The live walk's decks show three language defects the reference standard does not have:

1. **Mixed case.** Some drafted titles came back in Title Case ("Active Assumptions Carry Open Items That Must Be Resolved Before Design Proceeds") beside sentence-case ones.
2. **Topic titles.** Several validation titles describe the slide instead of stating what it shows ("What this review is asking you to decide right now", "How work moves through the process today"). The reference decks use action titles.
3. **Capital letters mid-sentence.** The contents slide inserted the Move's problem statement mid-sentence without lowering its first letter ("The problem is A governed data foundation…").

The words request now asks for sentence case and for each title to be a finding: a declarative sentence stating what the evidence shows or what remains unconfirmed. The title requirements sent with every slide carry `case: "sentence case"`. Neither is a rejection rule, so neither can add a fallback slide. Recorded text placed mid-sentence now has its first letter lowered unless the first word is an acronym.

## Layer Impact

Release lane: `global-control-lane`, behind the existing `moves_reference_deck_v1` flag.

- **Layer 4, products (reference-deck words and edition):** prompt wording and one text helper. No schema, data or route change.

## Client Applicability

- **All clients:** yes, where the reference deck preview is enabled.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** `moves_reference_deck_v1` (existing).

## Changes Included

- `src/lib/deliverables/orchestrator/reference-deck-words.ts`: sentence-case and action-title instructions; `case` in the title requirements.
- `src/lib/deliverables/orchestrator/reference-deck-edition.ts`: `midSentence` for the contents row's problem statement.
- Tests in the words and edition suites.

## QA / Validation

- Words suite: pass, 47 / 47. Edition suite: pass, 44 / 44, including three mid-sentence cases (an article, a plain noun, an acronym). `npm run typecheck`: pass.

## Rollout Plan

Ships in the next repo-owned ACA main deploy after u667, u669 and u673.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: set by the main deploy.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: the post-deploy walk's deck titles.

## Rollback Plan

Revert the squash commit and redeploy.

## Known Gaps

- **Guidance, not a rule.** A model that still writes a topic title or Title Case is not rejected, which keeps fallbacks from rising.

## Audit Evidence

- PR URL and CI run.
