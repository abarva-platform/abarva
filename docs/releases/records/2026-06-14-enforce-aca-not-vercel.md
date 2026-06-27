# 2026-06-14-enforce-aca-not-vercel — Strengthen the kernel rule that production is ACA, not Vercel

## Release ID
`2026-06-14-enforce-aca-not-vercel`

## Status
`candidate`

## Plain-English Summary
Multiple agent sessions keep "discovering" the dead Vercel `nexus` project and wrongly concluding `app.abarva.ai` is served by Vercel — then getting confused when a GitHub merge doesn't update the live page. The kernel already forbade Vercel (AGENTS.md), but the rule lost to two empirical traps: a green "Post-deploy crawl" after a merge (which only proves the OLD live page is healthy, since it crawls app.abarva.ai), and `vercel project ls` still showing a project. This sharpens the AGENTS.md rule with the exact operational facts — `dig` proof, "a merge does NOT deploy", the explicit ACA deploy recipe, "crawl-green ≠ shipped", and "work from clean origin/main, not a stale codex branch" — and removes the leftover `public/vercel.svg`. (Companion operational step, outside the repo: deleting the dead Vercel `nexus` project so it can no longer be found.)

## Layer Impact
- `internal-admin`: agent/operator guidance + repo hygiene. Docs-only change to `AGENTS.md` (the kernel every agent reads) plus removal of an unused Vercel logo asset. No runtime, data-plane, schema, or auth change.

## Client Applicability
- All clients: indirect (reduces the risk of a confused agent deploying to the wrong place or believing a change shipped when it didn't). No client-facing surface changes.
- Feature flag: none.

## Changes Included
- `AGENTS.md` — expanded the production-runtime rule: ACA `ca-abarva-web-lab-eastus` serves `app.abarva.ai`, verify with `dig`; `vercel project ls` is not the prod target; a merge does not deploy; the manual ACA deploy recipe (acr build → containerapp update → health-gate → traffic shift); crawl-green ≠ shipped; work from clean `origin/main`.
- Removed `public/vercel.svg` (unused).

## QA / Validation
- `audit:architecture-rules`: **pass** (0 violations).
- `release:check`: **pass** (this record).
- Docs-only; no tests applicable. Verified the claim against live infra: `dig +short app.abarva.ai` resolves to the ACA app, and Vercel holds no abarva domain.

## Rollout Plan
Merge to main (squash). Docs change — no deploy needed; takes effect as soon as agents read the updated `AGENTS.md` from `origin/main`.

## Rollback Plan
Revert the squash commit. No runtime impact.

## Audit Evidence
PR URL + CI run. The diff is the audit surface; the `dig` result and `vercel domains ls` (empty for abarva) are the supporting evidence that the rule states the truth.

## Known Gaps
- The dead Vercel `nexus` project / `nexus-vert-kappa.vercel.app` is deleted via the Vercel CLI as a companion step (not a repo change).
- `/api/cron/notifications-tick` was a Vercel cron (in the already-removed `vercel.ts`) and is not firing on ACA; re-homing it as an ACA scheduled job is tracked separately.
