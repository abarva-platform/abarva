# Agentic Spine Verification Runbook

Slice ID: QA1
Slice name: Agentic Spine Verification Runbook
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-24
Author: Code (sole)
Type: Documentation only — no application code, no runtime
modification, no migrations, no model calls.

This runbook is the founder-facing checklist for verifying that the
agentic spine — Programs ↔ Tower ↔ Intelligence ↔ Admin, mediated by
Nexus / Sentinel / Atlas / Steward — renders honestly and behaves as
designed before push, PR, or demo. It is a deterministic checklist;
it intentionally does not exercise live retrieval or model calls.

The runbook is meant to be **walked manually** in a browser after the
relevant slice work has reached `code_complete`. It supports:

- Solo overnight founder review when batch slices land.
- Pre-PR sanity sweep before pushing to a remote.
- Pre-demo dry-run on a local dev server.

Use one section per verification target. Each row has a single
expected outcome; do not skip rows.

---

## 1. Branch hygiene checklist

Run from the repo root before any verification walk.

| Check | Command | Expected outcome |
|---|---|---|
| Current branch | `git branch --show-current` | Names the slice / batch branch you intend to verify (no detached HEAD). |
| Working tree | `git status --short` | No unexpected modifications. Untracked founder / canon docs are allowed (they were never staged). |
| Branch position | `git status -sb` (header line) | Branch is ahead of `origin/<branch>` by the expected commit count; never behind without intent. |
| Ahead-of-main delta | `git log --oneline origin/main..HEAD` | Lists exactly the slices in scope; no surprise commits. |
| Last commit | `git log --oneline -1` | Matches the slice you intend to verify. |
| Last commit scope | `git show --stat HEAD` | Touches only the slice's allowed files; no Source / runtime / migration files. |
| Untracked surprise check | `git ls-files --others --exclude-standard` | Only known founder / canon docs. No new src / supabase files. |

**Stop and investigate** if any check fails. Do not push or demo from a
working tree with unexplained modifications.

---

## 2. Required validation commands

Run from the repo root in order. Each must pass before the live walk.

| Step | Command | Pass criterion |
|---|---|---|
| TypeScript | `npx tsc --noEmit --pretty false` | Empty output (no errors). |
| Production build | `npm run build` | Completes; route table emitted; no compile errors. |
| Unit / integration tests · core | `npx jest src/__tests__/integration/programs/programs-canonical-surface.test.ts` | All green. |
| | `npx jest src/__tests__/integration/programs/programs-nexus-rail-metadata.test.ts` | All green. |
| | `npx jest src/__tests__/integration/programs/programs-phase-gate-status.test.ts` | All green. |
| | `npx jest src/__tests__/integration/programs/programs-deliverables-evidence-value.test.ts` | All green. |
| | `npx jest src/__tests__/integration/programs/programs-control-tower-signals.test.ts` | All green. |
| Tower | `npx jest src/__tests__/integration/tower/program-pressure-cards.test.ts` | All green. |
| Intelligence | `npx jest src/__tests__/integration/intelligence/sentinel-pattern-detections.test.ts` | All green. |
| | `npx jest src/__tests__/integration/intelligence/sentinel-active-patterns-page.test.ts` | All green. |
| | `npx jest src/__tests__/integration/intelligence/sentinel-pattern-detail.test.ts` | All green. |
| Admin (when ADM2 / ADM3 are in scope) | `npx jest src/__tests__/integration/admin/steward-setup-control-center.test.ts` | All green. |
| | `npx jest src/__tests__/integration/admin/dataset-domain-inventory.test.ts` | All green (skip if ADM3 not yet merged). |
| Auth probes | `npx jest src/lib/auth/__tests__/tenant-isolation-probes.test.ts` | All green. |

If any command fails, **stop and decide**: amend the slice, discard,
or capture the failure in a tracked issue before proceeding to the
live walk.

---

## 3. Routes to live-walk

Start the dev server (`npm run dev`) and walk these routes in order
on at least one canonical demo tenant (default: `apex-retail`). Where
both `apex-retail` and `meridian` exist, walk both.

```text
/tenant/apex-retail/programs
/tenant/apex-retail/programs/[programSlug]
/tenant/apex-retail/tower
/tenant/apex-retail/intelligence
/tenant/apex-retail/intelligence/patterns/[patternKey]
/platform/admin
/platform/admin/build-progress
```

The `[programSlug]` placeholder should be a real program slug visible
on the index (e.g., the first card after the header). The
`[patternKey]` placeholder should be a Sentinel pattern key visible
in the Active Patterns grid (e.g.,
`value_ledger_incompleteness`).

For each route, walk the section-specific checklist below.

---

## 4. Programs verification

Open `/tenant/apex-retail/programs`, then drill into one program
detail.

| Check | Where | Expected |
|---|---|---|
| Nexus rail mounts | Detail header / floating rail | Rail is visible; opens / closes; eyebrow names the program. |
| Confidence chip | Rail | Reflects the program's signal mix (medium / low). Never `high` from seed alone. |
| Context chip | Rail | One of `complete` / `usable_with_gaps` / `pattern_only` / `insufficient` / `blocked`. |
| Missing-inputs chip | Rail | Names ≥ 1 missing input when bundle is below `usable_with_gaps`. |
| Six canonical phases | Phase strip | Phase 1 → Phase 6 visible (Origination → Verify); current phase highlighted. |
| Four canonical hard gates | Gate row | G1 charter signed · G2 CXO interview · G3 design + value · G4 CXO verification. Each shows a status. |
| Steward readiness note | Right column | Names blocking items; routes to the right next action. |
| Evidence readiness | Detail | Per-program evidence state visible (`not_seeded` / `partial` / `ready`). |
| Value readiness | Detail | Per-program value state visible. Names the canonical G3 / G4 hard gates verbatim when missing. |

Stop if any of: confidence chip claims `high` from seed; gate-row missing one of G1–G4; evidence/value claims `ready` while the seed lacks a baseline.

---

## 5. Tower verification

Open `/tenant/apex-retail/tower`.

| Check | Where | Expected |
|---|---|---|
| Programs pressure cards section | Above existing tower content | Section present with eyebrow `<tenant> · Programs pressure · seed-only`. |
| Atlas Executive Brief panel | Inside the pressure section, above the strip | Brief renders title, top pressure, why it matters, programs affected, recommended action, three disabled "Ask Atlas" follow-up chips, interpretation basis caption. |
| Top severity chip | Brief header | Uppercase severity (`CRITICAL` / `HIGH` / `MEDIUM` / `LOW` / `NONE`). Tooltip names the basis. |
| Recommended action | Brief recommendation row | One sentence; routes to the canonical Programs detail. |
| "Open Program" link | Each card | Resolves to `/tenant/<routeSlug>/programs/<programSlug>`. |
| Footer caption | Section footer | Names "deterministic" source; disclaims live retrieval / model calls. |
| Evidence/value readiness gap count | Strip | ≥ 1 when seed lacks evidence/value capture; honest sentence. |

Stop if any of: brief invents a dollar amount; brief claims `high` confidence from seed; "Ask Atlas" chip is enabled or routes to a live runtime; pressure card claims evidence/value as `ready` while seed is empty.

---

## 6. Intelligence verification

Open `/tenant/apex-retail/intelligence`.

| Check | Where | Expected |
|---|---|---|
| Sentinel Brief panel | Top of page | Renders title, top pattern, severity + confidence chips, what Sentinel sees, why it matters, programs affected, recommended action, suggested handoffs, three disabled "Ask Sentinel" follow-up chips, interpretation basis. |
| Active patterns grid | Below the brief | One card per detection in I1 sort order. |
| Affected program list per card | Card body | Each program code links to canonical `/tenant/<routeSlug>/programs/<programSlug>`. |
| Pattern detail route | Click "Open pattern detail →" | Lands on `/tenant/<routeSlug>/intelligence/patterns/<patternKey>`. |
| Evidence trail on detail page | Detail body | Lists every contributing S9e signal (signal id, type, severity, program, route). |
| "Evidence citations are not yet wired" caption | Detail body, above the trail | Visible; honest. |
| Authored content panel (when I4 is merged) | Below handoffs | Definition · How Sentinel detects · Why it matters · Failure modes · Interventions · Required evidence · Related patterns · Handoff guidance. `source · deterministic seed` chip visible. |
| Disabled "Ask Sentinel" chips | Brief footer | All three render with `disabled` + `aria-disabled="true"` + sub-label `deferred · live sentinel runtime`. |
| Footer caption | Below pattern cards | Names deterministic source; disclaims live retrieval / Atlas / Claude / OpenAI. |

Stop if any of: brief or pattern card invents a dollar amount; "Ask Sentinel" chip is enabled; pattern card claims `high` confidence from a single program with no critical signal; evidence trail row claims a real `E-###` citation; authored content panel implies live retrieval.

---

## 7. Admin verification

Open `/platform/admin` and `/platform/admin/build-progress`.

| Check | Where | Expected |
|---|---|---|
| Admin guard | Any admin page | Renders only for admin allowlist email or `role: admin`; otherwise displays "restricted to platform administrators." |
| Build Progress access | Sidebar item | Visible; clicking opens the Build Progress dashboard. |
| Build Progress dashboard | `/platform/admin/build-progress` | Renders the founder slice / cycle / gate state. No crash. |
| Setup · Control Center (ADM2) | Sidebar item, default-selected | Boots on the new control center. Steward Brief above the cards. Five readiness cards: Dataset domains · Evidence readiness · Users + access · Connectors · Agent readiness. |
| Steward Brief recommendations | Brief recommendations panel | Names a single most-leveraged action; routes to a real admin sub-page. |
| Disabled "Ask Steward" chips | Brief footer | Three chips, all `disabled` + `aria-disabled="true"`. Sub-label `deferred · live steward runtime`. |
| Data readiness posture | Datasets card | 12 canonical domains shown; counts (ready / partial / not started) visible. |
| Agent readiness posture | Agents card | All four agents (Nexus · Sentinel · Atlas · Steward) with status + next admin action. |
| Existing admin sections | Sidebar | Maestros, Roles & Permissions, Security, Active Clients, Contract Terms, Sensitive Data Approvals, Quality Ops, Access Logs, Pending Requests, Audit Log, API Keys, Compliance — all still navigable. |

Stop if any of: Build Progress is missing or broken; Steward Brief invents a dollar amount or claims live runtime; an existing admin section has been silently removed.

---

## 8. Tenant isolation checks

Tenant isolation is the most security-sensitive invariant. Verify
explicitly on every walk.

| Check | Where | Expected |
|---|---|---|
| Tenant-isolation probe (S7) | `npx jest src/lib/auth/__tests__/tenant-isolation-probes.test.ts` | All green. |
| Cross-tenant URL probe | Sign in as a Meridian-only user; visit `/tenant/apex-retail/programs/<programSlug>` | Forbidden (403) page. No charter content rendered. |
| Cross-tenant API probe | Hit any `/api/v1/...` route scoped to a tenant the signed-in user does not belong to | 403 response. No leakage in JSON. |
| Maestro-allowlist gate | Visit `/platform/admin` while signed in as a non-admin | "Restricted to platform administrators" message; no admin sidebar. |
| Build Progress visibility | `/platform/admin/build-progress` while signed out | Sign-in redirect (or admin-required notice). |
| Audit log of cross-tenant attempts (when wired) | Audit module | Failed cross-tenant attempts surface in the log; no silent denials. |

Stop if **any** cross-tenant probe leaks data. This is the highest-priority gate.

---

## 9. No-fabrication checks

Walk the same surfaces as §4–§7 and assert each line below explicitly.

| Check | Expected |
|---|---|
| No fake dollar values | No string field on Programs / Tower / Intelligence / Admin contains `$` followed by a number. Atlas brief / Sentinel brief / Steward brief / pattern detail / authored content all decline to invent dollars. |
| No fake citations | No surface displays a real `E-###` citation today. Pattern detail caption reads "Evidence citations are not yet wired for this deterministic pattern view." |
| No live model claim | No surface implies live Claude / OpenAI / Pinecone retrieval. All briefs carry a `deterministic_seed` or `*_read_model` source label. |
| Deterministic-source captions visible | Atlas brief footer · Sentinel brief footer · Steward brief footer · pattern detail footer · authored content panel footer · pressure-cards footer all carry an honest source caption. |
| Disabled affordances | Every "Ask Atlas" / "Ask Sentinel" / "Ask Steward" chip renders `disabled` + `aria-disabled="true"` + `deferred · live <agent> runtime` sub-label. |
| Honest empty states | Tenants with no detection / no signal / no datasets render explicit "no items today" copy that names the absence; no blank screens. |

Stop if any fabrication slips through. The platform's defensibility depends on it.

---

## 10. Morning review decision

After the live walk, decide for each slice / batch branch:

| Decision | When to choose | Action |
|---|---|---|
| **keep** | All checks pass and the slice reflects intent. | Leave the branch as-is; recommend it for push / PR after founder review. |
| **amend** | Validation passes but the surface needs polish (copy, spacing, an extra honest caption). | Amend on the same branch; re-run §2 validation; do not change scope. |
| **discard** | Validation fails or the slice does not reflect intent and is not worth amending. | `git branch -D <branch>` (only after confirming no other branch / worktree depends). Document the reason. |
| **cherry-pick** | A subset of the slice's commits is worth keeping in a different branch. | `git cherry-pick <sha>` onto the target branch. Re-run §2 validation. |
| **push / PR** | Slice is `keep`-ready and founder is signed off. | `git push origin <branch>` and `gh pr create`. Apply only after the slice's own acceptance criteria are explicitly verified. Default is to **wait** rather than push from an unsupervised batch. |

**Default for unsupervised overnight runs**: do not push, do not
merge, do not open PRs. Local commits only. The morning review
chooses one of the five outcomes above per branch.

---

## Branch / worktree hygiene appendix

When running multi-lane batches via `git worktree`:

- One worktree per slice.
- Symlinking `node_modules` into a worktree breaks Next.js Turbopack;
  run `npm install --prefer-offline` per worktree instead.
- Each worktree's `.next/` is independent; clearing it can be needed
  when the route table changes (e.g., a route directory is removed
  or renamed).
- Never run `git add .` in a worktree. Stage only the slice's
  declared allowed files.
- Before commit: `git diff --cached --name-only`. Confirm only
  allowed files are staged. Unstage anything else with `git restore
  --staged <path>` before committing.
- After commit: do not push. The morning review owns the push
  decision.
