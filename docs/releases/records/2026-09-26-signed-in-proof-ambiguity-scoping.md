# Signed-In Proof Reconciliation Reads Per Proof

## Release ID

`2026-09-26-signed-in-proof-ambiguity-scoping`

## Status

`candidate`

## Plain-English Summary

The tool that compares a release record's account of its signed-in proof against the execution register used to return `ambiguous` — a refusal to answer — for 61 rows. Reading all 61 showed they were not 61 judgements: two phrasings carried 44 of them, and in both the tool was attributing a word to the wrong proof. `DEPLOY VERIFIED, SIGNED-IN ACCEPTANCE OWED` was read as a line contradicting itself, when it plainly says the deploy was verified and the signed-in acceptance is still owed. `Not live-proven — signed-in check owed` was read the same way, because the tool had no way to see that `proven` was negated.

The reader now takes a word as describing the signed-in proof only when it sits in the clause that names that proof, and reads a negation across the whole sentence. 29 rows resolve, one becomes a genuine disagreement that was hidden inside the refusal, and 32 stay `ambiguous` because they really are mixed. No marker was made easier to match; every change narrows the scope a marker is read in.

## Layer Impact

- Release lane: `internal-admin`.
- Layer 3, canonical model: no change. This reads documents, not tenant data.
- Layer 4, products: none. No route, component, surface or product behavior changes.

## Client Applicability

- All clients: no.
- Specific clients: none.
- Internal only: yes — an operator reconciliation tool and its behavioral suite.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/exec/signed-in-proof-reconcile.mjs`
- `scripts/exec/signed-in-proof-reconcile.test.mjs`
- No migration, no data build, no product code.

## QA / Validation

- Baseline on `origin/main` `92f5836b3`: `scripts/exec/signed-in-proof-reconcile.test.mjs` 41 passed, 0 failed.
- Red first: the six new cases were added before any fix; 42 passed, 5 failed. The sixth case is a negative control and passed from the start, deliberately — without it, the scoping cases would pass equally well against a reader that had stopped reading obtained markers at all.
- Green after the fix, with two further cases pinning design decisions that survived mutation: 49 passed, 0 failed.
- Mutation proof — each rule was broken deliberately and the suite failed on the intended case:
  - obtained-side negation disabled → case 35 fails (48/1).
  - clause scope replaced by whole-sentence scope → cases 33 and 36 fail (47/2).
  - `signedInScope` widened to return the sentence → cases 33 and 36 fail (47/2).
  - record-side perfect-tense negation removed → case 38 fails (48/1).
  - negation read from the clause instead of the sentence → case 39 fails (48/1).
  - owed marker scoped to the sentence instead of the clause → case 40 fails (48/1).
- A seventh rule was written, measured and DELETED rather than kept: a sentence boundary that survives markdown emphasis. It changed zero rows on the live corpus once clause scoping was in place and no mutation of it failed any test, so it was a guard that could not be shown to do anything. This file has retired an unprovable guard once before for the same reason.
- Effect on the live corpus, same scope before and after (`--since 2026-09-19T00:00:00Z`, population 213 records both times): `ambiguous` 61 → 32, `agree` 60 → 88, `disagree` 9 → 10, `no-register-line` 83 → 83. 31 rows change verdict: 29 `ambiguous`→`agree`, 1 `ambiguous`→`disagree`, 1 `agree`→`ambiguous`.
- The residual 32 were read, not rounded off. 21 have a record saying `not-run` and 11 say nothing; they are genuinely mixed lines and stay `ambiguous` on purpose.
- Whole `scripts/exec` toolchain, 14 suites: no regression attributable to this change.
- TypeScript `--noEmit` exit 0 and scoped ESLint exit 0, both judged by exit code rather than by grepping output.
- CI and signed-in runtime proof: not run before PR creation. No signed-in proof is required by this change and none is claimed — it alters an operator script that renders no surface and reaches no tenant data.

## Rollout Plan

Squash-merge after applicable CI and review. The repo-owned ACA main workflow builds and deploys the exact main commit. Nothing in this change reaches the running application, so the deploy carries it only incidentally.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: verify after deployment.
- ACA runtime invariant: verify template and sole 100%-traffic revision match the approved digest.
- Worker image invariant: verify required worker jobs match the approved digest.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no. This change alters an operator-side reader only; it renders nothing and reaches no tenant data.

## Rollback Plan

Revert through a new PR and the repo-owned main deploy workflow. No schema or data rollback is involved. Reverting restores the previous reader, which reports 61 refusals instead of 32 and reads a negated `proven` as a proof obtained.

## Audit Evidence

- Red-first, green and mutation counts above, reproducible with `node scripts/exec/signed-in-proof-reconcile.test.mjs`.
- Before/after corpus counts reproducible with `node scripts/exec/signed-in-proof-reconcile.mjs --register <register> --since 2026-09-19T00:00:00Z --json`. The register is operator-owned and outside this repository, so CI cannot reproduce that half; every sentence quoted in a test case is quoted from it and attributed in the case that uses it.
- PR, CI, deployment run and digest evidence to be recorded after execution.

## Known Gaps

- 32 rows remain `ambiguous` and this change does not pretend otherwise. Two residual phrasings are named in the item's backlog note: an adjective describing the KIND of proof owed (`a positive signed-in readback remains owed`), and a line saying a proof is NOT owed, which the owed vocabulary has no way to express and so reports as owed. The second is a polarity gap in the vocabulary, not a scoping gap, and is filed rather than fixed here.
- One local suite in the same directory, `id-collision.test.mjs`, has a failing case that asserts the composition of the live operator register. It fails on `origin/main` for the same reason, is unrelated to these files, and skips in CI where no operator root exists (60 passed, 0 failed, 3 skipped). Filed, not fixed here.
