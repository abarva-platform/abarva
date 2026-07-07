# 2026-06-05-post-deploy-crawl-ticket-auth — Post-Deploy Crawl Ticket Auth

## Release ID

`2026-06-05-post-deploy-crawl-ticket-auth`

## Status

`candidate`

## Plain-English Summary

The post-deploy crawl workflow now exposes the Clerk secret already used by the
browser smoke workflows. This lets the crawl harness use server-minted Clerk
sign-in tickets for each persona instead of falling back to the more fragile
demo-code sign-in form during long multi-persona production crawls.

## Layer Impact

- `global-control-lane`: Production post-deploy crawl authentication becomes
  more reliable across Meridian, Apex, SkyHarbor, First Capital, and future
  personas.
- No product runtime code, data-plane schema, or tenant data changes.

## Client Applicability

- All clients covered by the post-deploy crawl harness.
- Specific trigger: Meridian CDAO crawl bootstrap after the latest production
  deploy.
- Internal only: CI/deploy verification workflow.

## Changes Included

- `.github/workflows/post-deploy-crawl.yml` passes `CLERK_SECRET_KEY` from
  `secrets.CLERK_SECRET_KEY || secrets.AZURE_LAB_CLERK_SECRET_KEY`.
- The existing crawl harness already prefers Clerk ticket auth when the secret
  is present; no runtime code change is required.

## QA / Validation

- PASS: inspected failed post-deploy crawl log; failure occurred at
  `crawl_sign_in_failed` for `meridian-cdao` after `meridian-cdio` completed.
- PASS: direct Meridian CDAO production crawl succeeded separately using Clerk
  ticket auth: 12/12 HTTP 200, zero gate screens, zero console errors, zero
  captured network errors.
- Pending: next GitHub post-deploy crawl should prove the workflow-level secret
  wiring in CI.

## Rollout Plan

Merge to main. The next `main` push or manual `workflow_dispatch` run of
Post-deploy crawl will use ticket auth automatically when the secret exists.

## Rollback Plan

Revert this PR. The workflow will fall back to demo-code sign-in as before.

## Audit Evidence

- Failed run: `27035597253`, `crawl_sign_in_failed: unknown sign-in error`.
- Direct screenshot pack:
  `docs/build/meridian-demo-walkthrough/meridian-demo-crawl-2026-06-05T19-21-realapp/`.

## Known Gaps

If neither `CLERK_SECRET_KEY` nor `AZURE_LAB_CLERK_SECRET_KEY` is configured in
repository secrets, the crawl continues to use demo-code sign-in and may remain
susceptible to long-run sign-in-state flakes.
