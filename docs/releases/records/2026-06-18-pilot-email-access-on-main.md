# 2026-06-18-pilot-email-access-on-main — Carry pilot user sign-in access onto main

## Release ID

`2026-06-18-pilot-email-access-on-main`

## Status

`candidate`

## Plain-English Summary

Production has been served by a stale feature branch that granted five real
pilot users access to their assigned client. Main (which we want to deploy
instead, because it carries ~1,000 commits of fixes plus the Source remediation)
does not yet know those five users. This change ports their access onto main so
that, when prod cuts over to main, no pilot user loses sign-in. Each user is
pinned to exactly one client and gets the locked `client` role — the same access
they have today. They are **not** granted admin: any Source/admin rights still
flow from their Clerk role, not from this list.

## Layer Impact

- `global-control-lane`: shared auth/tenant-resolution. Adds an exact-email →
  client map in `client-config.ts` (`inferClientKeyFromEmail`) and a pilot
  allowlist in `access-routing.ts` (`hasExplicitTenantAlias` +
  `inferSessionRoleFromEmail`). Purely additive; no existing mapping changes.

## Client Applicability

- All clients: the resolver is shared, but the effect is scoped to five named
  users.
- Specific clients: meridian, lakeshore, arcturus (First Capital), skyharbor —
  one pilot user each (lakeshore has two).
- Internal only: no
- Public/demo only: no
- Feature flag: none.

## ⚠️ Access grants in this change (review each)

| Email | Client | Role |
|---|---|---|
| `kmysore@gmail.com` (Kiran Mysore · CDAO / pilot sponsor) | meridian | client |
| `surekha.durvasula@gmail.com` (VP Innovation / Delivery) | lakeshore | client |
| `anandshp@gmail.com` | lakeshore | client |
| `admin@abarva.ai` | arcturus (First Capital) | client |
| `anand@abarva.ai` | skyharbor | client |

These mirror the production pilot's `PILOT_PASSCODE_EMAILS` exactly (mapping +
role), minus admin — the branch did not place them in its client-admin roster
either. Operator `anand.sundaram+<client>@thesundaram.com` aliases are already
handled on main and are unchanged.

## Changes Included

- Branch `fix/pilot-email-access-on-main`.
- `src/lib/client-config.ts` — `PILOT_EXACT_EMAIL_TO_CLIENT_KEY` checked first
  in `inferClientKeyFromEmail`.
- `src/lib/auth/access-routing.ts` — `PILOT_ACCESS_EMAILS` + `isPilotAccessEmail`,
  wired into `hasExplicitTenantAlias` and `inferSessionRoleFromEmail`.
- `src/lib/auth/__tests__/pilot-access.test.ts` — grant contract + fences.

## QA / Validation

- `jest pilot-access.test.ts` → 8 passed (each grant resolves + pins + `client`
  role; case-insensitive; fences prove no over-grant for other gmail/abarva.ai).
- `jest resolveTenant + tenant-keys + tenant-isolation-probes` → 84 passed (no
  regression).
- `eslint` (3 files) → exit 0.

## Rollout Plan

Merge to main on review (NO auto-merge — access grants require sign-off) → ACA
image build/deploy → then production traffic is cut over to the main revision
(separate, deliberate step).

## Rollback Plan

Revert the commit / redeploy prior `main-<sha>`. Removing an entry from either
list immediately revokes that user's pinned access on next sign-in.

## Audit Evidence

- PR: (filled on open) `fix/pilot-email-access-on-main`
- Local proof: jest 8/8 + 84/84; eslint exit 0
- Source of grants: production branch `codex/ai-control-tower-substrate`
  `PILOT_PASSCODE_EMAILS` + `EXACT_EMAIL_TO_CLIENT_KEY`

## Known Gaps

The branch's synthetic Lakeshore CXO demo emails
(`cio@lakeshore-holdings.example.com`, `cfo@…`) are NOT ported here — they are
demo personas, not pilot users, and out of scope for "don't break pilot access."
Port separately if the Lakeshore demo roster is needed on main.
