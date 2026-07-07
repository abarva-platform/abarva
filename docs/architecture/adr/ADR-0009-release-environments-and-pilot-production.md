# ADR-0009 - Release Environments and Pilot Production

## Status

Accepted

## Date

2026-06-03

## Context

AbarVa now has an explicit release-control policy, a protected `main` branch,
and a merge-queue posture for the canonical repository. The product also has a
control-plane/data-plane architecture: shared SaaS application behavior lives
in the control plane, while client-scoped facts and evidence belong behind the
Azure/Postgres data-plane adapter boundary.

The team needs one durable definition of what "pre-prod", "preview", and
"production" mean during the first client pilot and later multi-client pilots.
Without that definition, a Vercel preview, a green PR, a local Azure lab, and a
client-ready pilot environment can be confused with each other.

Verified repo facts:

- `docs/releases/RELEASE_CONTROL_POLICY.md` defines release lanes, layer impact,
  required release records, and CI release-control discipline.
- `docs/runbooks/rollback.md` defines rollback decision records, triggers, and
  post-rollback validation.
- `docs/architecture/adr/ADR-0001-control-plane-vs-data-plane.md` and
  `docs/architecture/adr/ADR-0007-vercel-control-plane-posture.md` define the
  shared control-plane and Azure client data-plane split.
- `.github/pull_request_template.md` requires release classification,
  validation, rollout, and rollback sections.
- `docs/releases/templates/release-record-template.md` defines the audit record
  shape expected for release-relevant changes.

## Decision

AbarVa uses four named release environments for pilot work:

1. Local development.
2. Pull-request preview.
3. Pilot production for one client.
4. Multi-client production.

These environments are not interchangeable.

Local development is for fast implementation, unit tests, and focused local
validation. It may use stubs, fixtures, and developer credentials. It is never
buyer-facing evidence by itself.

Pull-request preview is the pre-prod product surface for human review. It must
be produced from a PR branch, carry release classification, and pass required
checks before it can be considered a release candidate. Preview can prove UI,
route behavior, auth redirects, and smoke flows, but it does not prove a live
client data-plane load unless the release record names the exact private
data-plane evidence.

Pilot production for the first client is a real production posture for exactly
one approved client scope. It can support a signed pilot when:

- the control-plane release reached `main` through the protected PR path;
- the release record identifies the lane, layer, client applicability, rollout,
  rollback, and validation evidence;
- client-scoped data paths use the adapter boundary and preserve `client_id`;
- Clerk/SSO, role gates, client isolation, audit logging, and rollback evidence
  have been validated for that client scope;
- private data-plane setup and load evidence is attached when client data is in
  scope.

Multi-client production starts only when the same control-plane release posture
is paired with repeatable per-client data-plane provisioning, tenant isolation,
operations runbooks, and independent evidence for each client. A release that is
valid for the first client pilot is not automatically valid for a second or
third client.

The word "production" in release records must therefore identify the production
scope:

- `control-plane production`
- `single-client pilot production`
- `multi-client production`

If a record cannot name the scope, it must stay at preview or candidate status.

## Consequences

- A green PR or preview deployment is a candidate signal, not the production
  audit record.
- The first pilot can move with honest, single-client production language
  without implying multi-client readiness.
- Private data-plane evidence remains client scoped and cannot be generalized
  across clients without replay evidence.
- Release owners must keep rollback and last-known-good evidence per production
  scope.
- Vercel previews remain useful for product review while Azure data-plane
  evidence remains the authority for client data custody and loads.
- Future work can add live CI/Vercel status ingestion, but release records stay
  authoritative even when external deployment integrations are incomplete.

## Alternatives

- Treat every merge to `main` as production. Rejected because it collapses CI,
  preview, pilot, and data-plane evidence into one word.
- Treat first-client pilot production as the same as multi-client production.
  Rejected because multi-client readiness requires repeatable provisioning,
  isolation, operations, and evidence per client.
- Create a separate full-stack environment per PR. Rejected for now because PR
  previews are sufficient for control-plane review, while private data-plane
  test environments should be provisioned only when a client-data-lane release
  requires them.
- Wait for full Azure control-plane cutover before naming production states.
  Rejected because the current product needs governed pilot release semantics
  while the control plane remains on Vercel.

## References

- `docs/releases/RELEASE_CONTROL_POLICY.md`
- `docs/releases/templates/release-record-template.md`
- `docs/runbooks/rollback.md`
- `.github/pull_request_template.md`
- `docs/architecture/adr/ADR-0001-control-plane-vs-data-plane.md`
- `docs/architecture/adr/ADR-0007-vercel-control-plane-posture.md`
- `docs/architecture/ABARVA_PRIVATE_DATA_PLANE_MODEL.md`
