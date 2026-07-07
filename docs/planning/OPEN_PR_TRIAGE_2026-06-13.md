# Open PR Triage — 2026-06-13

Purpose: reduce backlog noise before the product-development Azure environment split. This is a read-only triage of open GitHub PRs after the ENV execution packet work and the setup-node v6 cleanup.

Scope note: this report does not merge or close anything by itself. It separates safe candidates from stale/high-risk branches so only clean, intentional work moves into the new subscription baseline.

## Executive Summary

As of 2026-06-13, there are 25 open PRs.

- 10 are non-draft and mergeable by GitHub, but several still fail required release/governance gates.
- 10 are draft PRs, mostly stale and/or conflicting.
- 12 are either conflicting or draft-conflicting and should not be merged as-is.
- The dependency PR cleanup has started: Dependabot #2903 was superseded by #3485 and closed after #3485 merged cleanly.

The highest-value next step is not bulk merging. It is controlled cleanup:

1. Repair or supersede small doc-only PRs that only fail release-record checks.
2. Re-author sensitive data/runtime work from current `main` instead of merging stale branches.
3. Close clearly superseded draft PRs only after the useful content is captured in a current tracker or replacement branch.

## Merge / Repair Candidates

|    PR | Status                      | Why It Is Candidate                                           | Required Before Merge                                                                          |
| ----: | --------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| #3443 | Mergeable, 1 failing check  | Workspace Explorer build brief; likely current planning work. | Add/fix release impact note, verify whether it supersedes #3440.                               |
| #3440 | Mergeable, 1 failing check  | Workspace Explorer design doc.                                | Likely close if #3443 includes the same design plus build brief; otherwise add release record. |
| #3327 | Mergeable, green            | Meridian evidence-quality report.                             | Quick content review, then merge if still relevant.                                            |
| #3277 | Mergeable, green            | Context/corpus/reasoning HTML report.                         | Quick content review, then merge if not superseded by later governance reports.                |
| #3392 | Mergeable, 2 failing checks | Trade-secret register/sample marking.                         | Fix release record and context-governance gate before merge.                                   |

## Do Not Merge As-Is

|    PR | Reason                                                                                                                                                                      |
| ----: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #3385 | High-impact context-layer remediation. Mergeable but failing release/governance checks. Rebase/re-author from current `main` and prove Azure/VNet evidence if still needed. |
| #3331 | Production dependency group bump. Mergeable but failing release/architecture/license gates. Needs a controlled dependency PR with release record and focused validation.    |
| #3286 | Development dependency group bump. Mergeable but failing release/architecture/ESLint gates and includes higher-risk tooling changes. Re-author in smaller slices.           |
| #3311 | Conflicting Intelligence substrate fix. Needs rebase and product QA; do not merge stale.                                                                                    |
| #3015 | Mergeable but stale home/admin redirect fix with failing canonical-tenant check. Re-test against current app before reviving.                                               |

## Draft / Stale Archive Candidates

These PRs are draft and/or conflicting. They should not be merged into the new baseline without deliberate re-authoring:

|    PR | Status                           | Recommendation                                                                                                                              |
| ----: | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| #3276 | Draft, conflicting               | Keep only if Supabase retirement evidence is still needed; otherwise archive after capturing useful notes.                                  |
| #3264 | Draft, conflicting               | Re-author Lakeshore QA work from current governed context framework if still needed.                                                        |
| #3263 | Draft, mergeable                 | Review whether Supabase deletion proof is obsolete; likely archive after note capture.                                                      |
| #3260 | Draft, conflicting               | Re-author Meridian golden question work from current context layer.                                                                         |
| #3257 | Draft, conflicting               | Re-author Anthropic routing work only if it is still a roadmap item.                                                                        |
| #3253 | Draft, mergeable                 | Review env-secret proof; likely convert to docs/evidence or archive.                                                                        |
| #3249 | Draft, conflicting               | P0 gate behavior has moved; re-author only if still relevant.                                                                               |
| #3248 | Draft, mergeable                 | Meridian persona coverage needs current tenant/privacy review before merge.                                                                 |
| #3246 | Draft, conflicting               | Anthropic provider QA cutover should not merge stale.                                                                                       |
| #3241 | Draft, conflicting               | Supabase sunset proof should be reconciled with current Azure-only posture.                                                                 |
| #3224 | Draft, mergeable, failing checks | Lakeshore load work is data-sensitive; re-author through governed Admin bulk path, not stale branch merge.                                  |
| #3220 | Draft, conflicting               | Demo/Moves package likely superseded by later Moves work.                                                                                   |
| #3214 | Draft, conflicting               | Rich document ingestion is directly relevant to future uploads, but must be rebuilt from current `main` under the ingestion truth standard. |
| #3029 | Draft, mergeable                 | Healthcare hardening inventory; likely docs-only but stale.                                                                                 |
| #2393 | Draft, mergeable                 | Old Packet 32 audit; likely historical only.                                                                                                |

## Recommended Cleanup Sequence

1. Repair #3443 or close #3440 as superseded by #3443 after content comparison.
2. Merge green docs PRs #3327 and #3277 only if not superseded.
3. Create replacement dependency PRs for #3331 and #3286 in smaller controlled slices instead of merging the current grouped PRs.
4. Rebuild #3214-style rich ingestion from current `main` only after the upload/process architecture is locked, because that path is central to future pilot data loads.
5. Archive stale draft PRs in batches, with one comment each pointing to this report and any replacement tracker.

## Guardrails

- No stale product/runtime/data PR should be merged just because GitHub says it is mergeable.
- Any context ingestion, loader, Azure data-plane, search, or agent-ready work must follow the context ingestion truth standard and produce source-to-retrieval evidence.
- Any dependency PR must include release-control evidence and pass architecture/license gates.
- Any Supabase-related PR must be reviewed through the current Azure-only posture and should not reintroduce runtime Supabase dependencies.
