# 2026-09-19-model-facing-route-claim-quoting — Model-facing examples stay resolvable and tenant-neutral

## Release ID

`2026-09-19-model-facing-route-claim-quoting`

## Status

`candidate`

## Plain-English Summary

Agent tool descriptions are handed to the model as instructions. Existing checks validate quoted
route claims against both the navigation handler and the App Router, but an unquoted route could
escape those checks. A separate worked example also named an active fixture tenant, biasing a
shared instruction toward one tenant. This change makes route quoting an enforced contract and
requires shared model-facing examples to remain tenant-neutral.

The guard is deliberately narrow. A census of all 97 model-facing prose fields found 38
slash-shaped tokens. Most are ordinary phrases such as `approve/sign` or lifecycle value lists,
not routes. The new check only recognizes a slash-led path token, preserving those legitimate
phrases while ensuring every actual route claim reaches the existing resolvers.

## Layer Impact

Release lane: `global-control-lane`.

- **Products (layer 4):** model-facing tool descriptions and their registry-level behavioral test.
- **Canonical model (layer 3):** unchanged.
- **Source adapters (layer 2) / Client intake (layer 1):** unchanged.

## Client Applicability

All clients use the shared agent tool registry. No tenant data, authorization boundary, route, or
rendered product copy changes.

## Changes Included

- Require route-like claims in model-facing tool prose to be double-quoted.
- Quote the existing route claims in the program commit and navigation tool descriptions.
- Bring both documented nonexistent sub-routes into the handler-refusal assertion.
- Derive active tenant identities from the canonical tenant registry, reject them in model-facing
  prose, and replace the one tenant-specific person-lookup example with generic wording.

## QA / Validation

- Failing first: the route guard identified 14 unquoted route claims and ignored ordinary slash
  phrases; the tenant-neutrality guard identified the one active-tenant example.
- Focused registry suite: 8 tests pass after the prose repairs.
- Mutation proof: adding an unquoted `/missing-route` claim makes the route guard fail; adding an
  active canonical tenant key makes the tenant-neutrality guard fail. Both name the exact tool and
  prose field.
- TypeScript, scoped ESLint, the surrounding agent tool suites, and release check are required
  before merge.

## Rollout Plan

Merge through the protected PR lane. The repo-owned ACA workflow deploys the resulting image.
There is no migration, data build, feature flag, or manual runtime mutation.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutation outside that workflow: none.
- Live signed-in proof required: no. The change is a model-instruction formatting contract and a
  test; no user-visible page or data read path changes.

## Rollback Plan

Revert the merge commit. No persisted state is created or changed.

## Audit Evidence

The PR, CI output for the model-facing schema-subject suite, the failing-first output, mutation
output, release check, and post-merge ACA digest readback.

## Known Gaps

- Runtime navigation remains owned by the existing `navigate_to` handler and App Router checks.
- Pattern-key validation remains a separate behavior decision; this release does not silently
  choose whether an unresolved key should be refused or persisted with an unresolved state.
