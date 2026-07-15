# 2026-07-15-home-knowledge-tenant-alias-resolution — Home Knowledge Tenant Alias Resolution

## Release ID

`2026-07-15-home-knowledge-tenant-alias-resolution`

## Status

`candidate`

## Plain-English Summary

Home was cut over to the Enterprise Knowledge module-context supplier, but the
live Airline Demo persona could still resolve through an app-client or DB row
alias while the active Knowledge access record is keyed as `skyharbor-air`. This
change canonicalizes requested-client, active-client, and display-name aliases
before Home requests active Knowledge context, so signed-in personas can resolve
the active context records that were already packaged and promoted through the
data-layer runway.

## Layer Impact

- global-control-lane: fixes tenant alias normalization in the shared Home
  Knowledge route before calling the module-context supplier.
- public-demo: affects browser-visible Home behavior for signed-in demo/client
  personas whose app client key differs from the canonical Knowledge tenant key.

## Client Applicability

- All clients: applies to the shared Home Knowledge route alias normalization.
- Specific clients: immediately fixes Airline Demo / SkyHarbor and keeps
  Lakeshore Holdings aligned with its active Knowledge tenant key.
- Internal only: no.
- Public/demo only: no, but the immediate proof is through demo personas.
- Feature flag: none; this is default Home route normalization.

## Changes Included

- `src/app/(maestro)/home/page.tsx`: maps requested-client, active-client, and
  display-name aliases such as `skyharbor`, `Airline Demo`, and `lakeshore`
  before `getModuleContext`.
- `scripts/audit/build-home-knowledge-cutover-proof.ts`: adds a SkyHarbor
  active-context proof scenario and fails if app-client aliases are not
  canonicalized before active Knowledge reads.
- `reports/enterprise-knowledge-layer/home-cutover-proof/*`: regenerated proof
  outputs showing SkyHarbor active context resolution.

## QA / Validation

- Pass: `npm run audit:home-knowledge-cutover`
- Pass: `npm run release:check`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false`
- Pass: `git diff --check`
- Required post-deploy proof: signed-in browser proof for Airline Demo Home
  must show active Knowledge context with non-zero records and no missing Active
  Tenant Access fallback.

## Rollout Plan

Merge through a PR to `main`. The approved ACA main deploy workflow builds the
digest-pinned image, updates the web Container App and worker jobs, shifts 100%
traffic to the new revision, verifies the ACA runtime invariant, and runs health
checks. Then run the focused signed-in Home proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: only the repo-owned ACA main deploy workflow
- Approved image digest: captured by the deploy evidence bundle after merge
- ACA runtime invariant: required before live proof is claimed
- Worker image invariant: required by the deploy workflow
- Feature/env flag update path: none
- Live signed-in proof required: yes

## Rollback Plan

Revert this PR and redeploy the previous approved ACA main revision. No tenant
data repair is required because this change does not mutate tenant data,
candidate data, production tables, or Active Tenant Access pointers.

## Audit Evidence

- PR URL: captured after PR creation
- Deploy workflow run: captured after merge
- `reports/enterprise-knowledge-layer/home-cutover-proof/summary.json`
- `reports/enterprise-knowledge-layer/home-cutover-proof/summary.md`
- Signed-in browser proof bundle under `/tmp/pr21-home-knowledge-live-proof/`

## Known Gaps

Home/aVa chat summaries are not moved to a new Claude generation path in this
release. This release fixes active Knowledge context resolution for Home; it does
not perform the broader legacy V-named dataset archive/purge.
