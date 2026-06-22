# 2026-06-21-crawl-agent-personas — Align post-deploy crawl roster to per-client agent logins

## Release ID

`2026-06-21-crawl-agent-personas`

## Status

`candidate`

## Plain-English Summary

The post-deploy crawl kept its own persona roster (`CRAWL_PERSONAS`) wired to the deleted human CXO emails (`cio@apex-retail…`, `cdao@meridian-health…`), so the automated crawl/gauntlet went access-stale after those users were removed. This repoints `CRAWL_PERSONAS` to **derive** from the durable per-client agent roster (`AGENT_CLIENT_LOGINS`, the `<clientKey>-agent@abarva.example.com` automation accounts) — one crawl persona per client — so the crawl runs on the password-less agent logins (single source of truth, matching how `prime-agent-client-auth-states.ts` already derives its personas). Tests are updated to assert the new roster.

## Layer Impact

- **internal-admin lane:** automation/test tooling only — `src/lib/crawl/persona-switcher.ts` (`CRAWL_PERSONAS` now derived from `AGENT_CLIENT_LOGINS`; added a `storageFile: agent-<clientKey>.json` field) + its two tests. No product runtime, no schema, no client data plane.

## Client Applicability

- All clients: No runtime change.
- Specific clients: None.
- Internal only: Yes — post-deploy crawl / gauntlet tooling.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/crawl/persona-switcher.ts` (CRAWL_PERSONAS derived from AGENT_CLIENT_LOGINS; +storageFile)
- `src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts` (assertions → agent roster)
- `scripts/smoke/p21-post-deploy-crawl.spec.ts` (assertions → agent roster)

## QA / Validation

Validation: Pass. `tsc --noEmit` clean over `persona-switcher.ts` (with `types:["node"]`; the bare-include `process` diagnostics are a node-types scoping artifact, not a real error). `post-deploy-crawl-guard.test.ts` → 7/7 pass. `p21-post-deploy-crawl.spec.ts` is an `assert`-based `tsx` script (0 `describe/it` blocks — pre-existing, runs via `npx tsx`, not jest) → passes ("P21 smoke passed: personas, surface count, hard questions").

## Rollout Plan

Merge to `main`. No runtime rollout — tooling only. The crawl/gauntlet then authenticates via the agent `.auth/agent-<clientKey>.json` storage states once the operator has run `provision-cxo-personas.ts --agents --apply`.

## Deployment Authority

Not applicable — internal tooling, no default-on runtime call sites.

- Repo-owned deploy workflow: n/a
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: n/a
- Worker image invariant: n/a
- Feature/env flag update path: n/a
- Live signed-in proof required: No (depends on operator provisioning the agent accounts).

## Rollback Plan

Revert the PR — tooling only, no migration, no runtime call sites.

## Audit Evidence

- `post-deploy-crawl-guard.test.ts` 7/7 pass on the new roster.
- `p21` smoke passes via `npx tsx`.
- `CRAWL_PERSONAS` derives 6 personas (one per client) from `AGENT_CLIENT_LOGINS`.

## Known Gaps

- The crawl only exercises the agent logins end-to-end once the operator provisions them (`--agents --apply` in the secret env); not live-proven in this PR.
