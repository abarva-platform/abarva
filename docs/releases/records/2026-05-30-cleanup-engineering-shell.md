# 2026-05-30 — Adopt /engineering/traces shell + Diagnostics sidebar (Wave 1 CL-3)

## Release ID

`2026-05-30-cleanup-engineering-shell`

## Status

`released`

## Plain-English Summary

W1-PR-2 relocated the raw reasoning trace inspector from the
agent-named `/admin/atlas/traces` to the workflow-anchored
`/engineering/traces`. The page existed and the proxy redirect was
in place, but the destination was orphaned — no shell, no sidebar
entry, no link from anywhere except the 301 redirect. CL-3 closes
the loop: `/engineering/traces` now renders inside the canonical
`AdminCanonShellV2` (already wired) AND has a real sidebar entry
under a new "DIAGNOSTICS" group, slotted after Production Readiness
and Compliance, before Releases. The Steward shell now exposes the
trace inspector to operators directly. The header eyebrow on the
page is also retitled from "Atlas observability" → "Reasoning
observability" per the workflow-first-agents-hidden doctrine — the
sidebar label is "Engineering Traces", never "Atlas". The legacy
`/admin/agents/atlas` redirect stub directory is deleted; the proxy
`adminRouteConsolidationMap` already handles that path, so the
on-disk page was redundant.

## Layer Impact

- **runtime-app-lane** — sidebar config + sidebar render +
  function-named page header. No data-plane, broker, or RLS impact.
- **Component layer:** `AdminSidebar` learns about
  `AdminSubSection.group` and renders an uppercase group divider
  above the first entry of each group. The first group ("Setup")
  is intentionally suppressed because the shell header already
  shows "Setup · Admin" (avoids visual duplication).
- **Config layer:** `ADMIN_SUB_SECTIONS` gains an
  `engineering-traces` entry pointing at `/engineering/traces`
  under the new `Diagnostics` group. New groups also annotate
  existing entries: Setup (overview), Governance (users-access),
  Releases (releases), Learn (training).
- **Routing layer:** No proxy changes — the
  `/admin/atlas/traces → /engineering/traces` redirect from W1-PR-2
  still works and preserves query strings (e.g. `?traceId=…`).
- **Hygiene layer:** `admin-routes-resolve.test.ts` gains a CL-3
  block asserting `/engineering/traces` is discoverable from the
  sidebar under Diagnostics, the label is workflow-anchored (no
  "Atlas"), and no agent-named sub-directories live under
  `src/app/(maestro)/admin/` (atlas / sentinel / steward / nexus /
  agents).

## Client Applicability

- **All admin users** across all tenants. The Setup/Admin sidebar
  is shared infrastructure.
- **No feature flag.**
- **No public/demo-specific behavior.**

## Changes Included

- `src/lib/admin/admin-shell-config.ts`
  - Add `engineering-traces` to `AdminSubSectionId` union.
  - Add `AdminSidebarGroup` type and optional `group` field on
    `AdminSubSection`.
  - Add the `Engineering Traces → /engineering/traces` entry
    under the Diagnostics group; annotate existing entries with
    their group headers.
- `src/components/admin/AdminSidebar.tsx`
  - Render an uppercase group header above the first entry of each
    group (suppressed for the first "Setup" group to avoid
    duplicating the header).
- `src/app/(maestro)/engineering/traces/page.tsx`
  - Drop "Atlas" branding from metadata title, eyebrow, and
    H1/subtitle. Page now reads "Engineering reasoning traces" /
    "Diagnostics · Reasoning observability". The shell wrapping
    (`AdminCanonShellV2` + `AgentRail`) was already in place from
    W1-PR-2 — no structural change to the page body or data
    fetching.
- `src/app/(maestro)/admin/agents/` — DELETED (was a single-file
  `/admin/agents/atlas/page.tsx` redirect stub, made redundant by
  the proxy `adminRouteConsolidationMap` entry from W1-PR-2).
- `src/__tests__/hygiene/admin-routes-resolve.test.ts`
  - New describe block `engineering surface is adopted (Wave 1
    CL-3)` asserts `/engineering/traces` exists, has a sidebar
    entry under Diagnostics, and the label is workflow-anchored.
  - New describe block `no agent-named routes exist under /admin`
    forbids `/admin/{atlas,sentinel,steward,nexus,agents}/`
    sub-directories.
- `docs/releases/records/2026-05-30-cleanup-engineering-shell.md`
  - This record.

## QA / Validation

- `npx eslint src/` — passes (no new warnings).
- `npx tsc --noEmit` — passes for touched files (pre-existing
  workflow-artifact errors documented in
  `feedback_typecheck_workflow_artifact.md` remain).
- `npm run test:nav` — passes.
- `npm run test:behaviors` — passes (five `tenant-onboarding.test.ts`
  failures are pre-existing per W1-PR-2 record §QA).
- `npx jest src/__tests__/hygiene/admin-routes-resolve.test.ts` —
  passes including new CL-3 assertions.

## Rollout Plan

- Squash-merge to `main` after CI green.
- Vercel preview/production deploy will pick up automatically.
- No data-plane migrations.
- No feature flag — applies immediately on deploy.

## Rollback Plan

- `git revert <merge-sha> -m 1` and redeploy. The change is a
  shell/sidebar/config refactor; reverting restores the prior
  un-grouped sidebar layout and re-introduces the redundant
  `/admin/agents/atlas` redirect stub (harmless — the proxy still
  handles it).

## Audit Evidence

- Verdict spine: `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §3
  (route altitude — function-named primary routes).
- Doctrine spine: `feedback_workflow_first_agents_hidden.md`
  (workflow-anchored IA; agents fronted by chat, not nav).
- Prior wave record:
  `docs/releases/records/2026-05-30-admin-route-consolidation-pr2.md`
  (W1-PR-2 relocation of `/admin/atlas/traces` → `/engineering/traces`).
- Proxy redirect: `src/proxy.ts` →
  `adminRouteConsolidationMap['/admin/atlas/traces']`.
- Hygiene test artifact:
  `src/__tests__/hygiene/admin-routes-resolve.test.ts` (CL-3 block).

## Known Gaps

- The "DIAGNOSTICS" group has a single entry today (Engineering
  Traces). Future Diagnostics entries — pipeline health, eval runs,
  prompt-version diffs — will slot under the same group header
  without further sidebar refactor.
