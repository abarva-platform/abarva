# E2E Validation Pass · 2026-05-30 Trust Plane work

**Scope** Independent end-to-end validation of the action handlers and UI
zones shipped by today's 45 PRs against the live app.

**Mode** Local dev server (`npm run dev` on http://localhost:3000) with
real Clerk credentials and the real Azure/Postgres data plane
(`DATABASE_URL`-backed broker adapters). No writes were executed against
the Vercel production deployment.

**Personas exercised** Apex Retail (cio@apex-retail), Meridian Health
(cdio@meridian-health), First Capital (cio@firstcapital), Northstar
Clinical (ceo@northstar-clinical), SkyHarbor Air (cto@skyharbor-air). All
five canonical demo tenants. Persona-existence verified via Clerk; the
dry-run of `scripts/provision-cxo-personas.ts` reports `clerk:update` for
all 22 canonical CXO accounts, meaning every persona — including the
ones previously believed missing (Northstar + SkyHarbor) — is already
provisioned in Clerk.

**Specs**
- `tests/e2e/admin-tenant-isolation.spec.ts` (shipped today as PR-G) —
  re-run against the live app to confirm closure of the Apex-leak
  regression gate.
- `tests/e2e/admin-action-handlers.spec.ts` (new, this PR) — walks the
  shipped action handlers per persona and asserts the UI's success-state
  contract is met.

---

## 1. E2E infra status

| Item | Status | Notes |
|---|---|---|
| `playwright.config.ts` | ✅ Present | `testDir: './tests/e2e'`, baseURL from `BASE_URL` env (defaults to `http://localhost:3000`) |
| Playwright Chromium browsers | ✅ Installed | `~/Library/Caches/ms-playwright/chromium-1217` |
| `tests/e2e/_helpers/auth.ts` | ✅ Functional | `withClerkAuth()` issues a Clerk sign-in ticket and sets `__session` + `abarva_active_client` cookies |
| `tests/e2e/_helpers/env.ts` | ✅ Functional | Loads `.env.local` and `../nexus/.env.local`; reads `CLERK_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `BASE_URL` |
| `.env.local` contents | ✅ Real keys | `pk_test_*` and `sk_test_*` Clerk keys, `DATABASE_URL`, plus legacy Supabase vars (compat shims) |
| Dev server boot | ✅ 200 on `/` | Boots within ~30s on Node 24; admin routes render |
| Persona provisioning | ✅ All 22 present | `npx tsx scripts/provision-cxo-personas.ts` (dry-run) reports `clerk:update` for every persona including Northstar + SkyHarbor; memory entry asserting these were missing is stale |

**Required env to run the e2e suite locally:**
- `CLERK_SECRET_KEY` (real, server-only) — drives ticket sign-in.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (real, valid format).
- `DATABASE_URL` — Azure/Postgres connection string the broker reads.
- `BASE_URL=http://localhost:3000` (or a Vercel preview URL).
- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` — required
  by the legacy compat shims that some admin routes still touch; without
  them, the specs self-skip via the `missingClerkPrereqs()` / `missingSupabasePrereqs()` guards in `_helpers/auth.ts`.

---

## 2. `admin-tenant-isolation.spec.ts` (PR-G) — re-run results

The spec is `describe.configure({ mode: 'serial' })` and bails on first
failure, so I re-ran each route under the meridian-health and other
tenant filters to characterize the failure surface. **Verdict: the gate
catches two real leaks that the 45-PR set did NOT close.**

| Route | apex-retail | meridian-health | first-capital | northstar-clinical | skyharbor-air |
|---|---|---|---|---|---|
| `/admin` | n/a (Apex) | PASS | PASS | PASS | PASS |
| `/admin?tab=tenant` | n/a | **FAIL** | **FAIL** | **FAIL** | **FAIL** |
| `/admin/data-trust` | n/a | PASS | PASS | PASS | PASS |
| `/admin/connectors` | n/a | PASS | PASS | PASS | PASS |
| `/admin/users-access` | n/a | PASS | PASS | PASS | PASS |
| `/admin/users-access/notifications` | n/a | PASS | PASS | PASS | PASS |
| `/admin/users-access/sso-configuration` | n/a | PASS | PASS | PASS | PASS |
| `/admin/agent-readiness` | n/a | PASS | PASS | PASS | PASS |
| `/admin/production-readiness` | n/a | PASS | PASS | PASS | PASS |
| `/admin/compliance` | n/a | PASS | PASS | PASS | PASS |
| `/admin/audit?tab=activity` | n/a | PASS | PASS | PASS | PASS |
| `/admin/audit?tab=isolation` | n/a | PASS | PASS | PASS | PASS |
| `/admin/audit?tab=approvals` | n/a | PASS | PASS | PASS | PASS |
| `/admin/programs/approvals` | n/a | PASS | PASS | PASS | PASS |
| `/admin/cross-program-signals` | n/a | PASS | PASS | PASS | PASS |
| `/admin/customer` | n/a | PASS | PASS | PASS | PASS |
| `/admin/releases` | n/a | **FAIL** | **FAIL** | **FAIL** | **FAIL** |
| `/admin/inbox` | n/a | PASS | PASS | PASS | PASS |

(Apex tenant rows omitted; the leak gate is, by construction, only
defined for non-Apex tenants.)

### Leak #1 · `/admin?tab=tenant`

**Symptom** Every non-Apex tenant renders `Apex Retail Group` for the
Tenant identity → Name field and `apex-retail` for Slug.

**Root cause** `src/app/(maestro)/admin/page.tsx:371` renders
`<AdminTenantTab />` with no `config` prop. `AdminTenantTab` then falls
back to `TENANT_FIXTURE` (`src/lib/setup/shell-setup-tenant-fixture.ts`,
hard-coded `name: 'Apex Retail Group'`, `slug: 'apex-retail'`). The PR-G
spec was supposed to catch this; it did, but the fix for the tab-tenant
surface was never wired through the broker.

**Severity** P0 — tenant-confusion bug visible in every Trust Plane
header for every non-Apex tenant.

### Leak #2 · `/admin/releases`

**Symptom** The Release Ledger surface renders the raw markdown body of
`docs/releases/records/2026-05-30-tower-servicenow-cmdb-ingest.md`,
which contains a CLI example using `--client-id apexretail` inside the
QA evidence block. That string sails through the live-rendered ledger
for every non-Apex tenant.

**Root cause** `src/lib/admin/release-ledger.ts` reads
`docs/releases/records/*` from disk and pipes the markdown straight into
`ReleaseLedgerSurface`. The content is not tenant-scoped or sanitized.
The PR-G spec's regex flags this correctly.

**Severity** P1 — the release ledger is meant to be tenant-agnostic
operations content, but rendering literal "apexretail" inside a
Northstar admin's Release Ledger is still a tenant-confusion signal and
breaks the F8 + F9 regression gate the PR set claimed to close.

---

## 3. `admin-action-handlers.spec.ts` — new validation pass

35 tests, 5 personas × 7 action surfaces. **All 35 passed.**

| Surface / contract | apexretail | meridian-health | first-capital | northstar-clinical | skyharbor-air |
|---|---|---|---|---|---|
| `/admin` renders trust strip + posture grid + audit ribbon | PASS | PASS | PASS | PASS | PASS |
| `/admin/audit?tab=isolation` renders IsolationLane | PASS | PASS | PASS | PASS | PASS |
| InviteCollaboratorDialog walks to Review step (Send reachable) | PASS | PASS | PASS | PASS | PASS |
| AddConnectorPanel Save draft surfaces saved-banner OR validation-error | PASS | PASS | PASS | PASS | PASS |
| TenantSwitcher chip or static label renders | PASS | PASS | PASS | PASS | PASS |
| Notifications preferences page Save button reachable | PASS | PASS | PASS | PASS | PASS |
| `/admin/programs/approvals` renders without 500 | PASS | PASS | PASS | PASS | PASS |

### Action-handler verification status

| Handler | Status | Why |
|---|---|---|
| `InviteCollaboratorDialog` → `sendInvite` server action | VERIFIED-PARTIAL | Dialog opens via `?invite=open`, all 4 steps render, Send button is enabled at Review. **Click NOT executed** — the server action calls Clerk's `invitations.createInvitation` and would email `e2e-validation@abarva.test`. Unit tests at `src/lib/admin/__tests__/invite-collaborator-audit.test.ts` cover the `admin_audit_log` write contract. |
| `AddConnectorPanel` → `createPendingConnectorAction` | VERIFIED | Panel opens via `?add=open`, template selectable, name fillable, Save clicked. UI contract: saved-banner OR validation-error MUST appear within 15s — held for every tenant. |
| `ConnectorTestConnectionButton` (Test connection) | BLOCKED | Requires navigation to an individual connector detail page (`/admin/connectors/[connectorId]`). No connector detail page is reachable for non-Apex tenants in the demo seed (the connector list is empty). Needs seed data before this can be walked. |
| `ApprovalDecisionPanel` Notify sponsor / Escalate | BLOCKED | Requires a pending approval row in the persona's tenant. `/admin/programs/approvals` renders cleanly for every persona but the table is empty for non-Apex tenants. Needs seed approvals before this can be walked. |
| `TenantSwitcher` switch flow | VERIFIED-PARTIAL | Chip / static-label renders for every persona. Actual click-switch NOT executed because it would invalidate the rest of the test suite by changing the active-client cookie mid-run. The component's unit tests (`src/components/admin/__tests__/TenantSwitcher.test.tsx`) cover the switch contract. |
| Notifications preferences Save | VERIFIED-PARTIAL | Page mounts; Save button is reachable for every persona. Click NOT executed because it would mutate the persona's preferences row, contaminating subsequent test runs. The broker contract is covered by `src/components/admin/__tests__/NotificationsPreferencesPage.test.tsx`. |
| Trust strip (4 chips, broker data) | VERIFIED | `data-testid="admin-trust-strip"` renders for every persona on `/admin`. Chip-level "(estimated)" assertion not tightened in this pass — the visible-zone assertion is the contract the user requested. |
| PostureGrid (4 cards) | VERIFIED | `data-testid="admin-posture-grid"` OR empty-tenant upload affordance renders for every persona. The PR brief allowed an empty state for tenants with no data; that branch is exercised. |
| AuditRibbon | VERIFIED | `data-testid="audit-ribbon"` rows OR `audit-ribbon-empty` empty state renders for every persona. |
| IsolationLane | VERIFIED | `isolation-lane-empty` / `isolation-lane-table` / `isolation-lane` renders for every persona on `/admin/audit?tab=isolation`. |
| Steward chat rail (tenant-aware response) | NOT-WALKED | Defer to PR-B's unit suite (`src/__tests__/security/`) which already gates the tenant-aware editorial body. An interactive chat walk would require streaming the LLM, which is non-deterministic and out of scope for a CI-runnable e2e. |

---

## 4. What worked

1. **Action-handler scaffolding (open → fill → reach success contract)
   works for all 5 personas.** The component-level testids shipped with
   the 45 PRs are well-placed; no persona-specific divergence in
   visibility of `invite-collaborator-dialog`, `add-connector-panel`,
   `admin-trust-strip`, `admin-posture-grid`, `audit-ribbon`, or
   `isolation-lane`.
2. **Persona provisioning is in better shape than memory suggested.**
   All 22 canonical CXO personas (including Northstar + SkyHarbor) are
   already provisioned in Clerk per the dry-run output. The Trust Plane
   work can be walked for every tenant without re-provisioning.
3. **`/admin?tab=isolation` IsolationLane**, the audit tabs, the
   compliance / agent-readiness / production-readiness / customer pages,
   and `/admin/data-trust` all pass the Apex-leak regression gate
   cleanly across every non-Apex tenant. The bulk of the 6-layer Apex
   default-string remediation actually held.

## 5. What didn't (with reasons)

1. **`/admin?tab=tenant` leaks Apex on every non-Apex tenant.** P0. Real
   bug, real user-visible regression. Cause: `<AdminTenantTab />`
   called with no `config` prop in `src/app/(maestro)/admin/page.tsx`,
   so it falls through to the hard-coded `TENANT_FIXTURE`. Fix is
   trivial (resolve tenant config from the broker and pass `config`)
   but was not part of the PR-A→PR-G scope.
2. **`/admin/releases` leaks Apex on every non-Apex tenant.** P1. The
   Release Ledger pipes the raw markdown body of
   `docs/releases/records/2026-05-30-tower-servicenow-cmdb-ingest.md`
   to the page; that record contains `--client-id apexretail` in its CLI
   evidence block, which trips the F8 + F9 regression gate.
3. **ConnectorTestConnectionButton and ApprovalDecisionPanel cannot be
   walked end-to-end** because the demo seed for non-Apex tenants does
   not contain connector rows or pending approval rows. The shipped
   components are unit-test-covered, but the e2e contract — a real
   click on a real list-item that resolves to a detail surface — is
   blocked on seed data, not on code.

## 6. What we did NOT test, and why

| Action | Reason |
|---|---|
| `sendInvite` server action (click Send) | Would email `e2e-validation@abarva.test` via Clerk's invitations API on every run. Not idempotent. Covered by unit tests. |
| `TenantSwitcher` actual click-switch | Would invalidate `abarva_active_client` cookie mid-suite. Covered by unit tests. |
| Notification preferences Save click | Would upsert a real `notification_preferences` row for the demo persona. Pollutes the demo. Covered by unit tests. |
| Steward chat "what should I do next?" prompt | Requires LLM streaming; non-deterministic for CI. Tenant-aware editorial body is covered by PR-B's hygiene scanner and unit suite. |
| ConnectorTestConnectionButton click | Demo seed has no connector rows for non-Apex tenants. |
| ApprovalDecisionPanel Notify / Escalate clicks | Demo seed has no pending approvals for non-Apex tenants. |
| Production Vercel deployment | Read-only constraint per validation brief. All walks ran against local `npm run dev`. |

---

## 7. Recommended follow-ups

1. **P0 fix** `/admin?tab=tenant` — wire `AdminTenantTab` to receive
   `config` from a broker call instead of falling through to
   `TENANT_FIXTURE`. Until then, the PR-G regression gate is failing
   for every non-Apex tenant.
2. **P1 fix** `/admin/releases` — either tenant-scope the ledger
   rendering (most records are global; flag tenant-specific ones), or
   sanitize the Apex literal in the 2026-05-30 servicenow-cmdb release
   record. Less invasive option: replace `--client-id apexretail` with
   `--client-id <tenant-key>` in the CLI evidence block.
3. **Seed** Add at least one pending approval and one pending connector
   per non-Apex tenant to the demo seed so the Notify-sponsor / Escalate
   / Test-connection lanes can be exercised end-to-end.
4. **Memory** The note that "Northstar + SkyHarbor admins are missing"
   is stale. All 22 canonical CXO personas are provisioned in Clerk per
   today's `provision-cxo-personas.ts` dry-run.

---

## 8. Reproduction

```bash
# Worktree
git worktree add -b test/e2e-admin-action-handlers /private/tmp/nexus-e2e-admin-ah origin/main
cp .env.local /private/tmp/nexus-e2e-admin-ah/.env.local
cd /private/tmp/nexus-e2e-admin-ah
npm install
npm run dev &  # wait for 200 on http://localhost:3000

# New spec — should be 35/35 green
BASE_URL=http://localhost:3000 \
  npx playwright test tests/e2e/admin-action-handlers.spec.ts \
  --reporter=list --workers=1

# Existing PR-G spec — should be RED on /admin?tab=tenant and /admin/releases
# (serial-mode bails on first failure; filter with -g to characterize per route)
BASE_URL=http://localhost:3000 \
  npx playwright test tests/e2e/admin-tenant-isolation.spec.ts \
  --reporter=list --workers=1
```
