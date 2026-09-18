# 2026-09-18-atlas-prompt-identifier-hygiene - Atlas Prompt Identifier Hygiene

## Release ID

`2026-09-18-atlas-prompt-identifier-hygiene`

## Status

`candidate`

## Plain-English Summary

The Tower advisor prompt tells the model not to expose raw record identifiers, source keys or internal field names to a reader — and then appended the full tool-result map as JSON under a line introducing it as being there "for exact IDs". The instruction was advisory: nothing removed the identifiers before the prompt was sent, so the model was handed them and asked not to use them.

The sanitiser that ran over that payload matched two *value shapes* — a UUID, and an `AA-BB-123` style program code. Identifiers that do not look like either passed through unchanged, which is most of the ones the read layer actually returns: record ids, signal keys, display ids and evidence references.

Identifiers are now withheld from the payload by the field they sit in rather than by what they look like, and the introducing line no longer advertises them. Business content is untouched: names, titles, amounts, dates, retrieved text and the citation block all reach the model exactly as before. Auditability is unaffected — the unredacted tool results are returned to the caller and were never sourced from the prompt copy.

One identifier is deliberately kept: a retrieved chunk's source key, which the shared citation contract asks the model to quote inline. It is withheld from the payload, where it is a duplicate, and kept in the citation block, where the answer contract needs it. A test pins both halves.

## Layer Impact

Layer 4 PRODUCTS, `global-control-lane`: Tower advisor prompt assembly only. No change to Layer 1 client intake, Layer 2 source adapters or Layer 3 canonical model — no loader, migration, adapter, projection, read model or metric is touched, and no value is computed or recomputed anywhere in this change.

## Client Applicability

- All clients: the Tower advisor prompt path.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None added.

## Changes Included

- `src/lib/atlas/llm.ts`: identifier-bearing fields in the serialized tool-result payload have their value replaced with a withheld marker before the prompt is assembled; the line introducing that payload no longer states it carries exact identifiers.
- `src/__tests__/behaviors/atlas-prompt-identifier-hygiene.test.ts`: new behavioral suite driving the real prompt assembly and reading the prompt actually handed to the audited model client.

## QA / Validation

- Passed: identical 12-case suite, unfixed **8 failed / 4 passed** → fixed **0 failed / 12 passed**. The four that pass on both sides are deliberate guardrails, not filler: one identifier the existing shape rule already handled (so the change is not credited with work already done), the citation source key still being published, the business content surviving, and the forbidding instruction still present. Without them an over-broad sanitiser would look correct.
- Passed: six mutations, five caught, one survivor reported below.
  - Identifier-key rule deleted → 7 failed.
  - Rule narrowed to a bare `id` field → 4 failed.
  - Introducing line reverted to the previous wording → 1 failed.
  - Rule widened to withhold every string value → 1 failed (the business-content guardrail caught it).
  - Sanitiser applied to the citation block as well → 1 failed (the citation guardrail caught it).
  - **Survived:** withholding by removing the field instead of replacing its value → 12 passed. That is a design choice of equal safety, not a weakening — both forms leave the prompt clean. The value is replaced so the model can still see that a record is addressable and the address was withheld, since an absent field reads as an absent record; the reason is stated in the code beside the rule.
- Passed: scope baseline, same command either side. `npx jest src/lib/atlas src/__tests__/integration/atlas` — **3 failing before / 3 after**, identical counts (283 passed, 5 skipped, 291 total) and the same three suites by name, all pre-existing.
- Passed: `npx jest src/__tests__/behaviors` — 22 suites, 242 tests, 0 failing, with the new suite included.
- Passed: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`, exit 0, with `tsconfig.tsbuildinfo` removed first and the exit code judged rather than the output filtered.
- Passed: `npx eslint` on both changed files, exit 0 (one pre-existing unused-import warning, recorded as a follow-up below rather than fixed here).
- Passed: `node scripts/release-check.mjs --base origin/main --head HEAD`.
- Not run: signed-in browser proof on the deployed revision. Owed after deploy; see Known Gaps for what it can and cannot show.

## Rollout Plan

Merge to `main` through the protected release lane. The repo-owned ACA main deploy workflow builds the image from the merge SHA and deploys it; the runtime invariant is then proven by reading the Container App template digest against the 100%-traffic revision digest.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: assigned by the workflow after merge.
- ACA runtime invariant: required after deployment.
- Worker image invariant: required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, on the Tower advisor route.

## Rollback Plan

Revert the commit through the protected `main` lane and redeploy the prior approved digest-pinned image through the repo-owned workflow. No migration, no data change, nothing to unwind in the data plane.

## Audit Evidence

The PR diff, the before/after suite runs over the identical case list, the six mutation runs with their counts, the two scope baselines run the same way on both sides, the typecheck and lint exit codes, and the release-check output.

## Known Gaps

- **Two instructions in this prompt still contradict each other.** The advisor instruction forbids exposing source keys; the shared citation contract asks the model to quote the exact source key inline, and that contract is shared with another surface. This change takes the citation contract as authoritative and pins it, but does not resolve which of the two is meant to win. Recorded as a follow-up item.
- **A neighbouring source-text gate is satisfied by a dead import.** A contract test asserts a formatter's name appears in the prompt module; the only thing making that true is an unused import, and the function is never called. Left standing here on purpose — removing the import turns a currently-green check red, and whether that check should become behavioural or be retired is its own decision. Recorded as a follow-up item.
- **This is a prompt-input control, and a signed-in check cannot fully prove it.** What reaches the model is not visible from a browser session; the proof that matters is the assembled prompt, which the new suite reads directly. A signed-in check can show the Tower advisor still answers normally, and that is what will be claimed for it — no more.
