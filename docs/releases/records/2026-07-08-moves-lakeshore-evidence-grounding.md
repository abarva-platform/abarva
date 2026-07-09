# 2026-07-08-moves-lakeshore-evidence-grounding — Moves Uploaded Evidence Grounding

## Release ID

2026-07-08-moves-lakeshore-evidence-grounding

## Status

candidate

## Plain-English Summary

This release threads the Move-local evidence ledger into Programs/Moves free-text context and makes the deterministic fallback safer when uploaded evidence is present. The trigger was a live Lakeshore legal contract intake crawl where uploaded CSV evidence persisted correctly, but case-specific questions still received generic or unrelated pattern answers.

## Layer Impact

- `global-control-lane`: Changes the shared Programs Nexus free-text answer path for all clients by adding uploaded evidence to the program context bundle and returned sources.
- `user-facing answer behavior`: Lets the composer answer from uploaded evidence text, while the deterministic fallback copies relevant uploaded evidence snippets and rejects unsupported numeric claims instead of substituting canned figures.
- `quality/eval`: Adds regression coverage that prevents hardcoded Lakeshore legal rate-card claims from re-entering the fallback path.

## Client Applicability

- All clients: Yes, for the evidence-ledger context wiring and source reporting.
- Specific clients: Lakeshore Holdings receives the immediate demo-case benefit for the legal contract intake Move.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/nexus.ts`: Loads `program_evidence_items` into `ProgramContextBundle` through the existing evidence prompt helper.
- `src/lib/programs/nexus-free-text.ts`: Adds evidence-ledger source reporting, includes evidence in Claude/canonical query context, runs the product-truth gate against evidence grounding for composer output, and uses a generic evidence-snippet fallback that copies relevant uploaded evidence lines and rejects unsupported numeric claims.
- `src/__tests__/integration/programs-nexus-free-text.test.ts`: Adds regression tests proving uploaded evidence is surfaced as a client-fact source, stale hardcoded rate-card numbers are not emitted, canonical query terms use uploaded evidence values, and the same Moves-style prompts return a different Move's different uploaded numbers.
- `proof/moves-e2e-lakeshore-legal-case-study-live-20260708T224155Z/README.md`: Captures the live crawl evidence and the pre-fix product-truth failures.

## QA / Validation

- Pass: `npx jest src/__tests__/integration/programs-nexus-free-text.test.ts --runInBand`
- Pass: `npx eslint src/lib/programs/nexus.ts src/lib/programs/nexus-free-text.ts src/__tests__/integration/programs-nexus-free-text.test.ts`
- Pass: `rg -n "Lakeshore|lakeshore|legal|\$[0-9]" src/lib/programs/nexus-free-text.ts || true` returned no matches.
- Pass: Test coverage invokes `checkTenantEvidenceClaims` against the answer and the same turn's evidence grounding text.
- Not run: Full integration suite.
- Not run: Live ACA signed-in browser re-crawl after deployment.

## Rollout Plan

Merge through PR review to `main`. The repo-owned ACA main deploy workflow must build and deploy the new image. After deployment, rerun the signed-in Lakeshore Moves crawl against `RETAIL-LEGAL-2026` and confirm the uploaded evidence appears in context-aware answers for the phase plan, solution architecture, and rate-card/value-model questions without unsupported tenant-specific numeric claims.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared ACA runtime rollout.
- Shared runtime mutators: None in this release candidate.
- Approved image digest: Pending ACA main deploy workflow.
- ACA runtime invariant: Pending deploy proof.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, before claiming live-proven.

## Rollback Plan

Revert the merge commit and redeploy through the ACA main deploy workflow. This returns Programs Nexus free-text answers to the prior pattern-first behavior and removes the evidence-ledger source, evidence-grounded composer prompt, and evidence-present fallback from the response path.

## Audit Evidence

- Local focused test output for `src/__tests__/integration/programs-nexus-free-text.test.ts`.
- Local ESLint output for the changed Programs files and test.
- Live pre-fix crawl proof in `proof/moves-e2e-lakeshore-legal-case-study-live-20260708T224155Z/README.md`.

## Known Gaps

- The live crawl uploaded five CSVs and observed that `06_demo_golden_questions.csv` contains 10 rows, not the 11 described in the prompt.
- This release extracts answer snippets from the parsed evidence text, not structured CSV rows; live acceptance still depends on the composer using the uploaded evidence text and the product-truth gate for richer prose.
- Board business-case traceability and Home/Intelligence answer grounding remain pending separate fixes.
- Live ACA signed-in browser proof is still required after merge and deployment.
