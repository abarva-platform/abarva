# 2026-10-01 — Deck Sentence Fit and Source Language

## Release ID

`2026-10-01-deck-sentence-fit-and-source-language`

## Status

`candidate`

## Plain-English Summary

Follow-up to `2026-10-01-deck-whole-claims-and-readiness-rules`, from inspecting a deck generated on the deployed runtime after that change.

Three things the first change did not get right:

1. Authored slide points are usually a short lead statement followed by its support. The first change treated the whole point as one claim, so a point that was too long was held off the slide entirely and a summary slide could show only some of its findings. A point is now shortened at a sentence end first — the lead statement stays on the slide, whole — and only then at a semicolon.
2. The rule for paragraph labels listed the label words that had been seen. The next generated deck opened a paragraph with a new one, which became a slide headline. The rule now matches the shape (the word "Section" or "Slide", one word, a terminator) in both the renderer and the sign-off scan.
3. A raw source field compared to a raw value was still written into the generated prose. The sign-off scan blocks it, but nothing told the author not to write it. The authoring instructions now say to translate source fields and coded values into plain language, and to start text with the claim rather than a label.

## Layer Impact

**Release lane: `global-control-lane`.** Shared deliverable generation, rendering, and sign-off scan behavior for every client; not behind a feature flag.

- **Product layer — deliverable generation:** Two authoring rules added to the system instructions. No change to evidence admission, citation, or numeric rules.
- **Product layer — deliverable rendering:** Sentence-first fitting of slide points; shape-based label stripping.
- **Product layer — sign-off readiness scan:** The scaffold-label rule matches a shape instead of a word list. This widens what the existing blocker catches; nothing is relaxed.
- **Canonical model:** No schema, tenant data, or stored artifact changes.

## Client Applicability

- All clients generating deliverables or signing off generated artifacts receive the behavior after deployment.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/deliverables/orchestrator/slide-text.ts`: `fitWholeClaim` keeps leading whole sentences, then a semicolon clause; structural label pattern generalised; numbered references excluded.
- `src/lib/deliverables/shared/client-readiness-scan.ts`: `authoring_scaffold_label` generalised; numbered references exempt.
- `src/lib/deliverables/orchestrator/prompt-builder.ts`: two authoring rules.
- Tests for each, including that every shortened form is a prefix of the original ending at a sentence or clause end.

## QA / Validation

- Targeted Jest: pass — `103 suites, 1221 tests` under the deliverables library.
- Targeted ESLint and Prettier on changed files: pass.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: pass.
- Typecheck: deferred to CI (the local compiler run is not reliable on this machine).
- Deployed-runtime inspection of the prior change: done, and is what produced this follow-up — the regenerated deck had no cut statements and a corrected cover, and showed the three gaps above.
- Signed-in runtime verification of this change: pending deployment.

## Rollout Plan

Merge through a reviewed PR. Deploy only through the repository-owned ACA main deploy workflow. After the exact merge SHA is live, regenerate the deck on a synthetic workflow and confirm: no label headline, no raw field comparison in the prose, and summary points present with their lead statements.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the deploy workflow.
- Approved image digest: Pending exact-SHA deployment.
- ACA runtime invariant: Pending exact-SHA verification.
- Worker image invariant: Pending exact-SHA verification.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, on a synthetic workflow.

## Rollback Plan

Use the repo-owned ACA main deploy workflow to redeploy the prior approved digest, or revert this change. No database migration or data mutation is included.

## Audit Evidence

- PR and exact-SHA CI checks: pending.
- Targeted test output: recorded in the PR.
- Exact-SHA ACA deployment, digest invariants, and signed-in proof: pending.

## Known Gaps

- The authoring rules are instructions to a model, not a guarantee. The sign-off scan remains the control; the rules reduce how often it has to fire.
- A raw coded value that is not column-shaped and is not compared to anything (a bare status word in snake_case) is still not caught by the scan.
- When a section's opening statement is too long for a headline and is a single sentence, the slide headline falls back to the section title and the statement is carried in the notes.
- A two-word sentence beginning with "Section" or "Slide" that is real prose would be treated as a label.
