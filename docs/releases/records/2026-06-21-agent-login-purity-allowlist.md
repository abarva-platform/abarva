# 2026-06-21-agent-login-purity-allowlist — Control-plane purity allowlist for agent login registry

## Release ID

`2026-06-21-agent-login-purity-allowlist`

## Status

`candidate`

## Plain-English Summary

The control-plane tenant purity gate correctly blocks hardcoded tenant names unless a file is an approved tenant-scoped registry. The new non-human agent login registry is intentionally tenant-scoped, like the existing CXO persona registry, but the gate did not know that yet. This release adds that one file to the allowlist so CI continues to block accidental tenant drift while allowing the canonical crawl/proof agent registry.

## Layer Impact

- **internal-admin lane:** CI/audit tooling only. The change affects the control-plane purity scanner allowlist and does not change runtime behavior, client data, authentication policy, routes, feature flags, or deploy infrastructure.

## Client Applicability

- All clients: No runtime change.
- Specific clients: None.
- Internal only: Yes — CI/release audit behavior only.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/audit/control-plane-tenant-purity.mjs` allowlist now includes `src/lib/auth/agent-client-logins.ts` with a scoped justification.

## QA / Validation

- Pass: `npm run audit:control-plane-purity:check` — scanner baseline remained unchanged at 1063 tenant references and the new agent-login registry is listed only as an intentional canonical registry allowlist entry.
- Pass: `npm run release:check`

## Rollout Plan

Merge to `main`. No runtime rollout required; the next CI run uses the updated audit allowlist.

## Deployment Authority

Not applicable — CI/audit tooling only, no runtime deploy mutation.

- Repo-owned deploy workflow: n/a
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: n/a
- Worker image invariant: n/a
- Feature/env flag update path: n/a
- Live signed-in proof required: No.

## Rollback Plan

Revert the PR. The scanner will again reject tenant names in `src/lib/auth/agent-client-logins.ts`.

## Audit Evidence

- Local control-plane purity audit output.
- Local release check output.
- PR CI.

## Known Gaps

No product runtime, data-plane, auth-policy, live-user, or deployment behavior is changed by this release. This only repairs the CI audit classification for the already-merged canonical non-human agent-login registry. Live crawl proof still depends on the normal post-deploy crawl running against the provisioned agent storage states.
