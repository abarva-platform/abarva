# Azure Container Apps Cutover - PR #3240 Merge and Image Checkpoint

Date: 2026-06-07
Status: BLOCKED FOR MERGED-MAIN IMAGE; CANDIDATE IMAGE MAY BE BUILT FROM PR HEAD

## Requested sequence

1. Wait for PR #3240 checks to finish.
2. Merge #3240 if green.
3. Rebuild/push the ACR image from merged `main`.
4. Refresh Azure Container Apps/runtime/operator jobs to use the new image.

## PR #3240 status

Captured after Azure credential refresh.

| Field       | Value                                                 |
| ----------- | ----------------------------------------------------- |
| PR          | `#3240`                                               |
| URL         | `https://github.com/abarva-platform/abarva/pull/3240` |
| Head branch | `cursor/context-corpus-agent-visibility-audit-a092`   |
| Base        | `main`                                                |
| Checks      | All observed checks completed with `SUCCESS`          |
| Mergeable   | `MERGEABLE`                                           |
| Merge state | `CLEAN`                                               |
| Draft       | `true`                                                |

## Merge blocker

This environment can inspect GitHub with `gh`, but current agent rules restrict
`gh` to read-only operations. No available tool can mark a draft PR ready or
merge it. Therefore PR #3240 could not be merged from this agent even though its
checks are green.

## Candidate-image checkpoint

To keep the cutover moving without claiming merged-main status, an ACR image may
be built from the green PR #3240 head branch and recorded as a **candidate**.
That image must not be represented as a merged-main image. DNS cutover, Vercel
removal, Supabase pause, and Supabase deletion remain blocked until the normal
QA/soak gates pass.

| Candidate image   | Value                                                                                |
| ----------------- | ------------------------------------------------------------------------------------ |
| Tag               | `acrabarvalab001.azurecr.io/abarva/web:cutover-pr3240-20260607-7c0f682d-manifestfix` |
| Source commit     | `7c0f682d0bbd65acfe62277f390b12b68a6a4454`                                           |
| Build result      | PASS after Docker context manifest exception                                         |
| Deployment result | PASS to Azure Container Apps candidate revision `ca-abarva-web-lab-eastus--0000050`  |

## Build notes

The first ACR build from PR #3240 failed at `next build` because Docker context
excluded `docs/enterprise-context/templates/*/manifest.json`, which is imported
by `src/lib/admin/setup-data-load-center.ts`. A narrow `.dockerignore` exception
was added and the candidate image build then succeeded.
