# 2026-09-17-tenant-pin-roster-restore - Restore The Tenant Pin For One Roster Domain

## Release ID

`2026-09-17-tenant-pin-roster-restore`

## Status

`candidate`

## Plain-English Summary

One tenant's roster domain was dropped from the email-to-tenant map on 7 July 2026, while the same domain stayed in the list that decides whether a session is tenant-locked. The two lists disagreeing had a specific consequence: a session on that domain was treated as locked, but its pin resolved to nothing, so the code fell back to the session's own `clientId` metadata — the input the pin exists to override. A tenant-scoped request parameter was then compared against that metadata rather than against the roster, so it was not stripped.

The same commit also changed that tenant's industry code to a value with no industry profile, so profile lookups fell back to the generic profile without saying so.

Both are restored to their pre-July values. Both are demanded by guard tests that have been failing since.

## Layer Impact

`global-control-lane`. Session/tenant resolution and one client-config mapping. No schema, migration, adapter, projection or UI change.

## Client Applicability

- All clients: the mapping is per-tenant; only the affected tenant's sessions change behavior.
- Specific clients: one synthetic fixture tenant.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/client-config.ts`: restores the roster domain entry in `EMAIL_DOMAIN_TO_CLIENT_KEY`, so the pin resolves from the roster rather than from caller-supplied metadata.
- `src/lib/client-config.ts`: restores the industry code to the value that has a profile.
- `src/lib/auth/access-routing.ts`: adds the same roster domain to `inferSessionRoleFromEmail`, which had also been left with only the renamed domain.

## QA / Validation

Measured against a clean `origin/main` tree for the same suite:

- `src/lib/auth/__tests__/tenant-isolation-probes.test.ts` baseline: **8 failing**. With this change: **3 failing**. Status: **pass** for the five isolation probes — Probe 5 (pin resolves from roster email), Probe 5b (industry code), Probe 6 (client role inferred), Probe 7 (roster pin overrides stale conflicting metadata), Probe 8 (cross-tenant request parameter is stripped).
- `src/lib/programs/discovery/__tests__/industry-profile.test.ts`: **pass**.
- Full-project `tsc --noEmit`: **pass**. Scoped ESLint: **pass**.
- **Correction, 18 Sep 2026:** the local typecheck quoted above did not run. `npx tsc --noEmit` on the authoring machine exits 134 — a V8 out-of-memory crash that emits no diagnostics — and its output was filtered for `error TS`, so the crash read as clean. The authoritative typecheck for this change is the CI job on its pull request, which passed. Re-running locally as `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit` exits 0. The ESLint and test results above were produced by commands that completed and are unaffected.
- Signed-in acceptance: **not run** — blocked, host machine locked.

The three still-failing probes were failing before this change and are unrelated: two assert pre-rename display names, one asserts admin-role inference. They are stale expectations from a deliberate rename, not defects, and are left visible rather than edited.

## Rollout Plan

Squash-merge after required checks pass; the repo-owned ACA main deploy workflow publishes the change. No migration and no data build.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: To be recorded after deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Sign in as a roster identity on the affected domain and confirm a cross-tenant request parameter is refused rather than honored, and that the session resolves to its own tenant.

## Rollback Plan

Revert through a new PR and the repo-owned deploy workflow. Nothing persisted changes.

## Audit Evidence

PR link, before/after probe counts for the same suite, and CI to be added when available.

## Known Gaps

- No signed-in browser proof yet.
- The renamed domain remains in the map alongside the restored one. Nothing in the repository uses it; removing it is a separate cleanup that deserves its own check.
- This was found by triaging failing suites, not by a gate. The conditions that let it sit since July are unchanged.
