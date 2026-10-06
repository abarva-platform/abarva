# 2026-10-05-move-scoped-load-authorization — Move-scoped load authorization path

## Release ID

`2026-10-05-move-scoped-load-authorization`

## Status

`candidate`

## Plain-English Summary

Adds the authorization path for loading a dataset that is scoped to **one exact
Move** rather than to a whole tenant. The dataset-governance model already had a
`move_registry` scope (a Move-scoped manifest with no tenant pinned), and the
manifest schema's own comment promised that "Move-scoped uploads resolve tenancy
from the authenticated Move registry" — but that path was never implemented, so
`resolveLoadApproval` could never authorize such a load (it required the
manifest's `client_key` to equal the tenant being loaded, which a Move-scoped
manifest, with `client_key: null`, can never satisfy). That left Move-scoped
synthetic datasets unloadable.

This implements the Move-scoped branch, with the security boundary kept intact by
a two-part contract:

- **Approval pins the Move (this change).** A `move_registry` manifest's
  `load_approval` now carries a `move_id`. When a loader presents a binding that
  includes a `move_id`, `resolveLoadApproval` requires a `move_registry` manifest
  whose approval names that exact Move — so a Move-scoped approval cannot carry
  to any other Move (no cross-Move reuse).
- **Tenancy is authenticated by the loader (its responsibility).** For a
  Move-scoped load the loader MUST set the binding's `tenant_key` to the Move's
  **verified** tenant, resolved from the Move registry and never from the
  request — so a Move cannot be loaded into a tenant it does not belong to (no
  cross-tenant reuse). `resolveLoadApproval` documents this and does not re-pin
  the manifest to a tenant (the manifest has no tenant).

Behavior is unchanged unless a loader opts in by supplying a `move_id` binding:
every existing tenant-pinned path, and the existing guard that a `move_registry`
manifest cannot use the tenant path, are preserved exactly.

## Layer Impact

Release lane: `global-control-lane` — shared dataset-governance authorization.
This is the pure authorization contract; it introduces no data, no loader, and
no new serving capability.

- `3 CANONICAL MODEL` / governance: `resolveLoadApproval` gains a Move-scoped
  branch; `LoadApproval` gains an optional `move_id`; `LoadBinding` gains an
  optional `move_id`.

## Client Applicability

- All clients: no runtime change until a loader supplies a `move_id` binding.
- Specific clients: none.
- Internal only: authorization contract only.
- Public/demo only: No.
- Feature flag: none — additive; the new branch activates only on an explicit
  `move_id` binding.

## Changes Included

- `src/lib/governance/dataset-manifest.ts` — `LoadApprovalSchema` gains
  `move_id`; `LoadBinding` gains `move_id` (with the authenticated-tenant
  contract documented); `resolveLoadApproval` adds the Move-scoped branch
  (require a `move_registry` manifest, require the approval's `move_id` to equal
  the binding's, skip the tenant re-pin).
- `src/lib/governance/__tests__/dataset-manifest.test.ts` — Move-scoped cases:
  approves on a matching Move; refuses a different Move (no cross-Move reuse);
  refuses a `move_id` binding against a tenant-pinned manifest; refuses a
  `move_registry` approval that names no Move; and preserves the existing
  tenant-path guard when no `move_id` binding is supplied.

## QA / Validation

- `jest` (`dataset-manifest`) — **PASS**: 66/66 (61 existing + 5 new; the
  existing move_registry guard still holds).
- `tsc --noEmit` — **PASS**: 0 errors.
- `eslint` — **PASS**: 0 errors (1 pre-existing unused-variable warning in the
  test file, unrelated).

## Rollout Plan

Merge to `main` via squash PR. Ships with the next ACA web image via the
repo-owned `aca-main-deploy` workflow. No runtime behavior change until a loader
opts in with a `move_id` binding.

## Rollback Plan

Revert the PR. The change is additive (an optional field on two shapes plus a
branch that activates only on a `move_id` binding); reverting restores the prior
authorization behavior with no data or migration impact.

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy` workflow
on merge to `main`; shifts no shared traffic and touches no Container App
template, revision weight, or secret. No data is loaded by this change.

## Known Gaps

- This is the authorization contract only. The **data-plane loader** must supply
  the other half: resolve and authenticate the Move's tenant from the Move
  registry (set `binding.tenant_key` to the verified tenant), set
  `binding.move_id`, and carry a manifest whose `load_approval` names that
  `move_id` and is approved by a named person. A human still approves the load;
  nothing here loads or approves data.
- No signed-in proof (no user-visible surface changes).

## Audit Evidence

- CI: `jest`, `tsc`, `eslint`, `npm run release:check`.
- The no-cross-Move and no-cross-tenant boundaries are covered by the new
  Move-scoped cases plus the preserved tenant-path guard in
  `dataset-manifest.test.ts`.
