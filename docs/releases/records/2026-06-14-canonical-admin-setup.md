# 2026-06-14-canonical-admin-setup — Canonical Admin Setup Experience

## Release ID

`2026-06-14-canonical-admin-setup`

## Status

`candidate`

## Plain-English Summary

Replaces the fragmented Admin / Setup landing and data-load routes with one Stripe-like setup experience at `/admin`. The page gives operators a single setup checklist, a simple left navigation, and an in-page data workflow for loading, confirming, connecting, and proving tenant context.

## Layer Impact

- `global-control-lane`: changes the shared Admin / Setup browser experience and redirects legacy `/admin/*` UI routes back to the canonical `/admin` surface.
- `internal-admin`: simplifies the Steward setup workflow and keeps data loading, user access, governance, operations, and readiness in one operator workspace.

## Client Applicability

- All clients: yes, for signed-in users with Admin / Setup access.
- Specific clients: none.
- Internal only: Admin / Setup operators only.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `/admin` now renders the canonical setup experience inspired by the reviewed `AbarVa Admin Setup.html` prototype.
- `/admin/setup` remains an alias to `/admin`.
- Legacy `/admin/*` UI subroutes and stale `/home/*` setup aliases redirect back to `/admin`.
- The existing governed CSV upload connector remains available, but now as a pane inside the canonical setup surface rather than a separate competing page.

## QA / Validation

- `git diff --check` — pass.
- `npx eslint 'src/app/(maestro)/admin/page.tsx' src/components/admin/AdminSetupExperience.tsx src/proxy.ts` — pass.
- `npm run release:check -- --base origin/main --head HEAD` — pass.
- Local redirect proof on `http://localhost:3017` — pass:
  - `/admin/setup` returns `301 Location: /admin`.
  - `/admin/context-layer/uploads` returns `301 Location: /admin?from=/admin/context-layer/uploads`.
  - `/setup/files` returns `301 Location: /admin`.
- `npx tsc --noEmit --pretty false` — not completed locally; repo-wide TypeScript stayed active without output beyond the useful validation window.
- `npm run build` — blocked locally by a Turbopack hang after dependency install; no code error was emitted. ACA image build remains the rollout validation gate before traffic shift.

## Rollout Plan

Merge through PR, build the Azure Container Apps image from the merged SHA, deploy to `ca-abarva-web-lab-eastus`, wait for the new revision and replica to be healthy, then shift 100% traffic to the new revision. Verify the serving revision image tag matches the merged SHA.

## Rollback Plan

Shift Azure Container Apps traffic back to the prior healthy revision. No schema or data migration is included in this release.

## Audit Evidence

- PR URL and CI run after opening the release PR.
- ACA serving revision and image tag after deploy.
- Browser screenshots for `/admin` and redirect verification.

## Known Gaps

This release sunsets the old Admin UI routes at the routing layer, but does not physically delete every retired page file. Physical deletion should be handled as a follow-up cleanup once no internal tooling depends on those files.
