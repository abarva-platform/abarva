# 2026-05-30 · PRE-W4-PR-5 · Empty-state activation + UI polish bundle

## Plain-English

Four small fixes to the `/admin` Setup landing, drawn from
`PERSONA_A_TENANT_ADMIN_DAY1_2026-05-30.md` §9 (fixes #1, #2, #6, #7
plus the bonus #8 audit-ribbon copy):

1. **Activate the W3-PR-6 empty-state code.** The `emptyTenant` flag
   was never computed on the server page, so `EmptyTenantPrimaryCard`
   + `EmptyTenantUploadAffordance` (shipped in W3-PR-6) were
   unreachable for brand-new tenants. Now derived from
   `snapshot.segments.length === 0` and threaded into `HomeOverviewV2`.

2. **Retire the AI Initiatives Setup panel.** Panel #02 used to
   point at `/home/ai-initiatives`, which hard-redirects to `/home`
   — ejecting tenant admins from `/admin` every time they clicked the
   card. The Intelligence wave will redesign the initiatives surface;
   until then the panel is removed entirely. Setup panel numbering
   stays stable (03 Connectors, 04 Users & Access, …) so deep links
   and the design vocabulary don't drift.

3. **Unify the masthead label.** Browser tab said `Setup · AbarVa`,
   sidebar said `Setup · Admin`, masthead eyebrow said `HOME · WHERE
   YOU STAND…`. Pick one noun and use it — the eyebrow now reads
   `SETUP · WHERE YOU STAND…`.

4. **Suppress all-red Section 01 readiness for empty tenants.** Four
   modules would all evaluate to ≤30% (red bucket) with no substrate
   loaded — punishing a brand-new tenant on arrival. When `emptyTenant`
   is true, `composeHomeV2Extras` emits an empty `readiness` array and
   `HomeOverviewV2` renders a single editorial placeholder ("Readiness
   will compute when your first dataset lands.") instead of four red
   bars.

**Bonus fix #8 (persona §9 #8):** the audit ribbon empty line was a
flat "No activity in the last 24 hours." for an empty tenant. Replaced
with a stewarded sentence that names what fills the ribbon (substrate
ingest, auth/policy/approval events).

## Layer Impact

- **runtime-app-lane.** No DB migrations. No broker contract changes.
  All edits live in `src/app/(maestro)/admin/page.tsx`,
  `src/lib/admin/home-overview-v2.ts`,
  `src/components/home/HomeOverviewV2.tsx`,
  `src/components/admin/AuditRibbon.tsx`,
  and `src/scripts/audit/render-setup-home-snapshot.ts` (audit snapshot
  HTML to keep it in sync with the production eyebrow).

## Client Applicability

**All clients.** The empty-state path applies to any brand-new tenant.
The other three fixes (panel retirement, label unification, readiness
empty placeholder) apply to every tenant — non-empty tenants are
unaffected because the empty-state branches gate on `emptyTenant`.

## QA

- `npm run test:nav` — admin route shell tests.
- `npx jest src/components/home src/lib/admin src/components/admin`
  — new tests cover the four fixes:
  - `HomeOverviewV2.empty-state.test.tsx` — adds two assertions for
    the SETUP eyebrow and the Section 01 readiness placeholder.
  - `home-overview-v2-pre-w4-pr5.test.ts` (new) — panel #02 absent on
    all paths; readiness array empty when `emptyTenant: true`.
  - `AuditRibbon.test.tsx` — updated empty-state copy assertion.
- Manual: log in as an admin for a tenant with no substrate (e.g. a
  freshly-provisioned canonical tenant) and confirm:
  - eyebrow reads `SETUP · WHERE YOU STAND…`,
  - Section 01 shows the placeholder, not four red bars,
  - action queue replaced by the primary upload card,
  - posture grid replaced by the 4-tile upload affordance,
  - no `AI Initiatives` card in Section 05,
  - audit ribbon empty line reads the stewarded copy.

## Rollout

Behind no flag — straight code change to a runtime surface. The
empty-state code was already shipped (W3-PR-6); this just activates
it.

## Rollback

Single revert of the merge commit restores the prior behavior
(unreachable empty state, ejecting AI Initiatives panel, HOME
eyebrow, all-red readiness). No data migration to unwind.

## Audit Evidence

- Persona report `docs/build/PERSONA_A_TENANT_ADMIN_DAY1_2026-05-30.md`
  §9 fixes #1, #2, #6, #7, and bonus #8.
- Audit verdict `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §5.5
  (AI Initiatives panel listed for deletion).
- W3-PR-6 release record (introduced the empty-state code that this
  PR activates).
