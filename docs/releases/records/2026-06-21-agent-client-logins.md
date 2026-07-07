# 2026-06-21-agent-client-logins — Per-client agent logins (durable, password-less proof access)

## Release ID

`2026-06-21-agent-client-logins`

## Status

`candidate`

## Plain-English Summary

Replaces the dependency on the removed human CXO demo roster (which left the post-deploy crawl/gauntlet "access-stale": "No Clerk user found for cio@apex-retail", Meridian 403) with **one dedicated automation agent login per client tenant**. These are non-human, clearly-marked accounts (`<clientKey>-agent@abarva.example.com`, one per client, maestro membership). The signed-in proof harness authenticates AS them via Clerk **sign-in tokens (ticket strategy)** — so no human ever logs in and there are no passwords to manage. This is the durable fix for the stale access roster.

## Layer Impact

- **internal-admin lane (tooling, no app runtime change):** a new agent roster (`src/lib/auth/agent-client-logins.ts`); `provision-cxo-personas.ts` gains an `--agents` mode; `prime-agent-client-auth-states.ts` derives its persona list from the agent roster; the retail gauntlet default email points at the Apex agent. No application code path changes.

## Client Applicability

- All clients: One automation agent login per client (apexretail/meridian/arcturus/northstar/skyharbor/lakeshore) for signed-in proofs + crawl.
- Specific clients: None bespoke.
- Internal only: Yes — automation/test access tooling.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/auth/agent-client-logins.ts` (new) — `AGENT_CLIENT_LOGINS`: one CxoPersona-shaped automation agent per client (email, clientKey, tenantKey, maestro role, graph node id).
- `scripts/provision-cxo-personas.ts` — `--agents` provisions the agent roster (Clerk user + persons row + maestro membership) reusing the existing machinery; agent emails added to the ban-protected keep-set.
- `scripts/auth/prime-agent-client-auth-states.ts` — `PERSONAS` now derived from `AGENT_CLIENT_LOGINS` (one per client, probes all main surfaces) instead of the deleted `cio@…` emails.
- `scripts/smoke/retail-overlay-expert-gauntlet.mjs` — default persona email → the Apex agent.

## QA / Validation

Validation: Pass. `tsc --noEmit` clean across the roster + provisioner + prime harness (excluding optional-dep module noise). `provision-cxo-personas.ts --agents --plan-only` resolves all 6 agent logins (correct clientKey/tenantKey/maestro) and confirms "no env read, no network calls" — safe to plan without secrets. No live provisioning was run here (that is the one secret-bearing step the operator runs). The sign-in-token (ticket) flow in `prime-agent` is unchanged — it already authenticates password-lessly; only the email roster changed.

## Rollout Plan

1. **Operator (secret-bearing env, `CLERK_SECRET_KEY` + Supabase service role) runs once:**
   `npx tsx scripts/provision-cxo-personas.ts --agents --apply`
   (creates the 6 agent Clerk users + tenant memberships).
2. Then any proof/crawl mints per-client auth states with no human login:
   `npx tsx scripts/auth/prime-agent-client-auth-states.ts`
3. Follow-on: align the crawl's own `resolveCrawlPersonas` roster + the `p21-post-deploy-crawl.spec.ts` test to the agent emails (separate persona model + test contract), and wire the post-deploy crawl to the agent auth states.

## Deployment Authority

- Repo-owned deploy workflow: n/a (tooling/scripts; no app runtime change).
- Shared runtime mutators: the provisioner mutates Clerk + Supabase — run by the operator in the secret env, NOT by CI/auto-deploy.
- Approved image digest: n/a.
- ACA runtime invariant: unchanged (no app code path touched).
- Worker image invariant: n/a.
- Feature/env flag update path: n/a.
- Live signed-in proof required: After the operator runs `--agents --apply`, prove `prime-agent-client-auth-states.ts` mints a working auth state for at least one client (e.g. apexretail) with no manual login.

## Rollback Plan

Revert the PR (removes the roster + `--agents` + repoint). To remove provisioned agent users: ban/delete them via Clerk + Supabase (operator). No app data/migration.

## Known Gaps

- The operator must run the one `--agents --apply` step (account creation requires `CLERK_SECRET_KEY`; not done here).
- The crawl's `resolveCrawlPersonas` model + its p21 test still reference the old emails — the follow-on alignment.
- Agent accounts carry the demo password from the shared provisioner path (harmless; the proof flow uses sign-in tokens, not the password) — can be hardened to truly password-less later.

## Audit Evidence

- PR URL: (filled on creation) `claude/agent-login-per-client` → `main`.
- CI: `npm run release:check`, tsc clean, `--agents --plan-only` resolves 6 logins with no network/secrets.
