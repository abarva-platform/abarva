# Setup Fix Package · Completion Report

| | |
|---|---|
| **Run start** | 2026-05-07 |
| **Run end** | 2026-05-07 (same day) |
| **Outcome** | **6 of 9 PRs shipped + 1 polish PR shipped · 3 PRs deferred to Intelligence-aligned design session** |
| **Authority** | Anand (founder) · sole sign-off |

---

## §1 · Summary

Setup Fix Package terminated as a **strategic wrap** rather than a full 9-of-9 completion. Per Anand's 2026-05-07 direction (logged in `ESCALATION_REGISTER.md` entry 2): ship the high-impact capability fixes (PRs 1-5 + 9 polish), defer the three structural redesigns (PRs 6/7/8) to a future session that bundles them with Intelligence design — shared visual vocabulary makes one design pass more efficient than three separate ones, and Intelligence is the higher-leverage surface.

PRs shipped this run: **6** (PR 1, PR 2, PR 5, PR 3, PR 4, PR 9 — in merge order)
PRs deferred: **3** (PR 6, PR 7, PR 8 — Gates 2/3/4)

---

## §2 · Per-PR status

| # | Title | Branch | PR | Merged | Acceptance |
|---|---|---|---|---|---|
| 1 | Remove 4 panels (AI Initiatives, Build Progress, Architecture, Reasoning) | `setup-fix/01-remove-4-panels` | [#1639](https://github.com/anandsundaram-hash/abarva/pull/1639) | 2026-05-07 | ✅ Pass · 218 files removed (incl. 156 reasoning sub-routes), nav locked at 6 panels, all four removed routes 404 |
| 2 | Tenant binding defect fix | `setup-fix/02-tenant-binding-defect` | [#1640](https://github.com/anandsundaram-hash/abarva/pull/1640) | 2026-05-07 | ✅ Pass · `resolveAdminTenant()` helper wired into 4 broken pages + Users & Access; `data-trust-page-view.ts:545` hardcoded `'apex-retail'` replaced; 7/7 unit tests pass |
| 5 | Users & Access SSO docs + consequence copy | `setup-fix/05-users-access-sso` | [#1641](https://github.com/anandsundaram-hash/abarva/pull/1641) | 2026-05-07 | ✅ Pass · `/admin/users-access/sso-configuration` route added, "What this unlocks" panel renders when `ssoConfigured=false`, fake-disabled buttons replaced with non-button explanation |
| 3 | Overview landscape reconciliation (Option A) | `setup-fix/03-overview-landscape-reconciliation` | [#1642](https://github.com/anandsundaram-hash/abarva/pull/1642) | 2026-05-07 | ✅ Pass · `buildAuthoredInventoryFallback()` derives landscape rollups from capability matrix + Act 1 facts when no live snapshot; cross-section consistency restored |
| 4 | Overview Act 3 upload templates | `setup-fix/04-overview-act3-templates` | [#1643](https://github.com/anandsundaram-hash/abarva/pull/1643) | 2026-05-07 | ✅ Pass · 4 starter templates in `public/setup-templates/`; format preview block + Download CTA on each templated row |
| 9 | Production Readiness polish | `setup-fix/09-production-readiness-polish` | (this PR) | 2026-05-07 | ✅ Pass · Pilot tile carries 4 linked blockers; Demo tile + demo-seed gate criterion tenant-substituted |
| 6 | Data Trust redesign | — | — | **Deferred** | ⏸ Awaiting Claude Design output (Gate 2) |
| 7 | Connectors redesign | — | — | **Deferred** | ⏸ Awaiting Claude Design output (Gate 3) |
| 8 | Agent Readiness redesign | — | — | **Deferred** | ⏸ Awaiting Claude Design output (Gate 4) |

---

## §3 · What the user-visible Setup section now does (post-package)

- **Nav:** 6 panels (was 10). Overview, Data Trust, Connectors, Users & Access, Agent Readiness, Production Readiness.
- **Tenant identity:** all 6 panels now show the canonical display name in the top bar (e.g. "First Capital Financial", not "first-capital" or "Apex Retail"). Page-view builders use the active session's `tenantSlug`, not the previous hardcoded `'apex-retail'` defaults.
- **Overview:**
  - Three Acts + Client Data Landscape consistent (no more "rich Act 1 / 0 of 14 landscape" contradiction).
  - Act 3 has working upload templates (Enterprise Profile, IT System Landscape, Program Inventory, Compliance and Regulatory).
  - Steward chat block / Sentinel opener / landscape header all driven from the same source.
- **Users & Access:**
  - "Configure SSO" CTA leads to `/admin/users-access/sso-configuration` docs (was a dead `#sso` anchor).
  - "What this unlocks" panel renders inline.
  - Wave-gated "Invite user" replaced with explanation copy (no more fake-disabled buttons).
- **Production Readiness:**
  - Pilot card lists Access / Security / Connectors / Approvals as concrete linked blockers.
  - Demo tile + demo-seed gate evidence reflect the active tenant's display name.

---

## §4 · Substrate gaps consolidated (cross-reference: `SUBSTRATE_GAP_REGISTER.md`)

1. `src/lib/{reasoning,architecture,build-progress}/**` retention pending cross-surface audit (PR 1).
2. `src/components/admin/build-progress/**` retention contingent on `/platform/admin/build-progress` lifetime (PR 1).
3. Tests for preserved-but-functionally-orphaned lib code (PR 1).
4. **First Capital Financial (Arcturus) and Keystone Energy lack `data_inventory_*` ingestion scripts.** Authored fallback handles the display layer; if real ingestion is desired for those tenants, follow Apex/Meridian's pattern: add `src/scripts/setup-data/load-{tenant}-setup-data.ts` (PR 3).
5. **Per-tenant readiness assessments not in substrate.** PR 9 spec §2.2 contemplated tenant-derived assessment narratives; substrate doesn't currently support that, so PR 9 only substitutes display name in the existing copy. Per-tenant variation in the readiness narrative would need substrate work + a follow-up PR.

---

## §5 · Spec drift consolidated (cross-reference: `SPEC_DRIFT_REGISTER.md`)

13 entries across 6 themes:
- **Scope-edge cleanup beyond strict spec letter** (entries 1, 4, 5): platform redirect deletion, CommandPalette / GlobalSearchModal cleanup, Setup peer-page sub-nav cleanup. All judged necessary to avoid producing 404s after deletions.
- **Out-of-scope link rot left intentionally** (entries 2, 3): Source surface link to `/admin/reasoning/patterns`, Docs surface references to `/admin/reasoning`. Per spec §6 these surfaces are out of scope; flagged for a follow-up.
- **Conservative API/lib preservation** (entry 6): preserved `src/app/api/reasoning/**`, `src/lib/reasoning/**`, etc. per spec §12.2 ("preserve when uncertain").
- **Off-by-one in spec figures** (entry 7): PR 1 spec said "157 reasoning sub-routes"; actual count was 156 sub-routes + 1 parent.
- **QA metadata updates** (entry 8): inventory-style assertions about `/admin/architecture` route updated to match removal.
- **Pre-existing CI noise** (entries 9, 10, 11): 9 lint errors in Source/Tower (out of scope), 2 pre-existing test failures in QA suite, source-vs-test divergence in `admin-shell-v2.test.ts`. All verified pre-existing on `main` via `git stash` baseline.
- **PR 2 implementation choices** (entries 12, 13): convergent `resolveAdminTenant()` helper rather than per-page patches; preserved hardcoded "Apex Retail" fixture strings inside builders per spec §12.2 ("don't fix panel content").

---

## §6 · Escalations consolidated (cross-reference: `ESCALATION_REGISTER.md`)

| Gate | When | Resolution |
|---|---|---|
| 1 (PR 3) | Before starting PR 3 | Option A — landscape uses authored fallback when no snapshot. Resumed same day. |
| 2 / 3 / 4 (PRs 6/7/8) | After PR 4 merged | **Deferred** to Intelligence-aligned design session per Anand's strategic recommendation. Setup wraps at 6 of 9 + PR 9 polish; Intelligence becomes the next priority. |

---

## §7 · Out-of-scope observations collected

- **Source surface** still links to `/admin/reasoning/patterns` ([src/components/source/PatternRecommendationChips.tsx](../../src/components/source/PatternRecommendationChips.tsx)). 404 link rot. Out of scope per master prompt §0.
- **Docs surface** has ~10 references to `/admin/reasoning` in `src/app/(maestro)/docs/reasoning/**`. 404 link rot. Out of scope.
- **Pre-existing test infra drift:** 32 admin-tree test failures pre-exist on `main` independent of this package (verified via `git stash` baseline at PR 1 completion). Several test files assert lexical patterns in source that don't match current files. Worth a dedicated cleanup pass.
- **Apex's authored fallback** post-PR3 returns 347 records / 13 segments (matrix-derived) instead of the previous hardcoded 403 / 14. Production behavior unaffected (substrate snapshot wins). For visual consistency between authored fallback and live substrate, the matrix tiers may need calibration.
- **`buildProductionReadinessPageView` is now async with 2 args** (`tenantSlug`, `tenantName`). Existing callers default both to Apex Retail Group strings, so no immediate caller migration needed, but follow-up PRs touching this builder should pass `tenant.tenantName` (mirroring the pattern in `/admin/production-readiness/page.tsx`).

---

## §8 · Recommendations for follow-up

1. **Intelligence design intent → Claude Design HTML pass** for Intelligence + Setup PRs 6/7/8 together (per Anand's 2026-05-07 recommendation). Once HTML lands, a second Claude Code session implements both Setup redesigns and the new Intelligence surface in one push.
2. **Source / Docs link rot fix** as a small standalone PR (~30 min): update `PatternRecommendationChips.tsx` and the `docs/reasoning/**` CTAs to point at `/intelligence/ask` (the canonical Sentinel pattern surface today).
3. **FCF / Keystone substrate ingestion scripts** if those tenants need real data (mirror Apex/Meridian load scripts). Authored fallback is a stopgap; real ingestion is the long-term answer.
4. **Pre-existing admin test cleanup** — a dedicated pass to reconcile the source-vs-test divergence in `admin-shell-v2.test.ts` and the QA assertion drift in `wireframe-compliance-audit.test.ts`. Currently noise.
5. **Calibrate the authored matrix → records mapping** in `buildAuthoredInventoryFallback` so its output (347/13 for Apex) matches production substrate (403/14) within a small margin. Avoids visible drift between fallback and live values.

---

## §9 · End of run

Package owners: Anand (founder) reviews; Claude Code (this session) handed back at 6 of 9 PRs shipped + 1 polish PR shipped + 3 deferred Gates documented for the next session.

Three registers + this completion report are the audit trail.

End.
