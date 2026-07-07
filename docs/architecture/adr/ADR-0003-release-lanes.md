# ADR-0003 - Release Lanes

## Status

Accepted

## Date

2026-06-01

## Context

`AGENTS.md` requires each non-trivial change to be traceable as a controlled release candidate. It defines release lanes, release-record expectations, and CI enforcement through `npm run release:check`.

The repository also contains release-control policy and templates:

- `docs/releases/RELEASE_CONTROL_POLICY.md`
- `docs/releases/templates/release-record-template.md`
- `docs/releases/records/`
- `.github/pull_request_template.md`

Release lane naming needs to be stable so PRs, release records, and CI use the same vocabulary.

## Decision

AbarVa uses the five release lanes from `AGENTS.md`:

| Lane | Meaning |
| --- | --- |
| `global-control-lane` | Shared app/control-plane behavior for all clients unless feature-gated. |
| `client-data-lane` | Client-scoped schema, RLS, seed, ingestion, retrieval, or private data-plane changes. |
| `internal-admin` | AbarVa-only operations/admin capability. |
| `public-demo` | Public route, demo path, investor/founder-facing artifact. |
| `experimental` | Feature-flagged or non-default capability. |

Short labels such as `global-control` and `client-data` may appear in prompts or UI, but release records should preserve the canonical `AGENTS.md` lane names where possible.

## Consequences

- Every release-relevant PR must declare lane, layer impact, client applicability, QA, rollout, rollback, and audit evidence.
- CI can enforce release-record presence and shape.
- Reviewers can distinguish shared-control changes from client-data changes before merge.
- Docs-only governance changes normally use `internal-admin` unless they affect public/demo behavior.

## Alternatives

- Use ad hoc lane labels per PR. Rejected because it breaks release searchability and audit consistency.
- Treat all docs-only changes as non-release changes. Rejected because governance docs affect execution controls.
- Collapse release lanes into a binary runtime/docs classification. Rejected because client-data and public-demo changes carry different risks.

## References

- `AGENTS.md`
- `docs/releases/RELEASE_CONTROL_POLICY.md`
- `docs/releases/templates/release-record-template.md`
- `docs/releases/records/`
- `.github/pull_request_template.md`
