# AbarVa Setup Module · Autonomous Build Spec

**Version:** 1.0 · April 28 2026
**Status:** Build-ready · for agent execution loop
**Target:** Setup module specified as the governance and connector layer that unblocks live Tower and Intelligence data

This spec gives the next agent a clean map of what Setup already is, what is still seeded-only, and how to ship connector and governance waves without drifting into accidental platform rewrites.

---

## §1 · Purpose & role

Setup is the **Steward-led governance and integration surface** for AbarVa. It is where connector health, auth state, tenant controls, user access, audit history, and policy review live. Setup is the platform operator surface that decides what data can flow, who can see it, and whether the ingestion layer is trustworthy.

Setup is **not** the analytics surface. Tower consumes connector outputs but does not configure them. Setup is not the strategy surface either. Intelligence consumes signals, but Setup governs whether those signals are available and within policy. Setup is also not a generic admin junk drawer. The module should stay tightly scoped to control-plane work that changes platform readiness.

**Lead agent:** Steward. Steward speaks in governance language:

- what is configured
- what is degraded
- what needs re-auth
- what data classes are active
- what approval or review is still pending

The Steward register is different from every other surface. It should sound precise, calm, and control-plane oriented.

---

## §2 · State baseline

### Route inventory

Canonical Setup routes currently live under `src/app/(maestro)/admin/**`:

- `/admin`
- `/admin/connectors`
- `/admin/connectors/[connectorId]`
- `/admin/connectors/[connectorId]/reconnect`
- `/admin/users`
- `/admin/users-access`
- `/admin/invite`
- `/admin/audit`
- `/admin/policies`
- `/admin/tenant`
- `/admin/architecture`

There is also a parallel platform-admin family under `src/app/(maestro)/platform/admin/**`:

- `/platform/admin`
- `/platform/admin/connectors`
- `/platform/admin/users`
- `/platform/admin/audit`
- `/platform/admin/architecture`
- several other platform pages (`build-progress`, `data`, `quality`, `production-readiness`, and more)

That means Setup has its own route-shape ambiguity, though it is less acute than Programs. The active user-facing connector and governance work appears to target `/admin/**`, but the platform-admin family still exists and cannot be ignored in planning.

### Shell state

The Setup pages in `src/components/setup/**` are already shell-era pages. They use `AppShell`, mostly pair with `AgentColumn`, and already carry Steward identity. That is good news: Setup does not need a shell convergence wave as deep as Source did.

Current exceptions:

- reconnect and invite flows render full-width work panes without a visible agent column
- platform-admin surfaces are only partially aligned with the Setup component family

### Component count

Setup currently has **8 TSX components** under `src/components/setup/`:

- `SetupConnectorsPage.tsx`
- `ConnectorDetailPage.tsx`
- `ConnectorReconnectPage.tsx`
- `SetupUsersPage.tsx`
- `InviteCollaboratorPage.tsx`
- `SetupAuditPage.tsx`
- `SetupPoliciesPage.tsx`
- `SetupTenantPage.tsx`

This is a compact module compared with Programs. That makes Setup a good candidate for clean wave decomposition and fast convergence once the spec exists.

### Data-layer state

Setup currently has only **2 TypeScript files** under `src/lib/setup/`:

- `shell-setup-fixture.ts`
- `shell-setup-tenant-fixture.ts`

That is the important architectural warning. The Setup UI exists, but the live connector backbone does not. Today the surface is primarily fixture-driven.

### Current fixture reality

The seeded connector set currently includes:

- ServiceNow
- Salesforce CRM
- Snowflake
- Jira
- Confluence
- Azure DevOps
- Microsoft 365
- PostgreSQL

That is close to the intended target, but not identical. The founder's desired integration-class taxonomy is broader and more explicit:

- `T-MS-GRAPH`
- `T-GITHUB`
- `T-ANTHROPIC`
- `T-SERVICENOW`
- `T-SAP`
- `T-RSS`
- `T-CUSTOM`

This should be handled as a roadmap convergence item, not a rewrite of current seeded pages.

### What is already built versus still missing

Shipped today:

- connectors index
- connector detail
- reconnect flow
- users page
- invite flow
- audit page
- policies page with in-page review modal
- tenant page

Still missing in architectural terms:

- typed live connector health primitives
- real ingestion backing for Microsoft Graph
- GitHub and Anthropic live connector implementations
- policy/audit persistence beyond seeded UI
- a formal smoke test for setup-to-tower data flow

---

## §3 · Target architecture

### Surface decision

Setup should converge around `/admin/**` as the operator-facing control-plane route family. The `/platform/admin/**` family can remain for platform-specific and founder-oriented pages, but connector and governance waves should not bounce between both families without an explicit reason.

### Steward column contract

Steward quotes should answer:

- is the connector healthy
- when did it last authenticate
- when did it last pull
- what scope is active
- what governance action is required

Steward should not sound like a portfolio analyst or a strategist.

### Connector Health primitive

Future build waves should standardize on this health object:

```ts
type ConnectorHealth = {
  last_authenticated_at: string | null;
  last_successful_pull_at: string | null;
  pull_latency_ms: number | null;
  pii_filter_active: boolean;
  scope_active: string[];
};
```

This is the Setup equivalent of provenance. It is the canonical minimal object that downstream modules should trust when deciding whether a connector can power a story.

### Integration-class registry

Target connector classes:

| Key | Integration class | Primary downstream consumer |
|---|---|---|
| T-MS-GRAPH | Microsoft Graph / M365 Copilot telemetry | Tower, Intelligence |
| T-GITHUB | GitHub usage and repo metrics | Tower, Programs |
| T-ANTHROPIC | Anthropic Console usage and model telemetry | Tower |
| T-SERVICENOW | ServiceNow incidents, changes, Now Assist | Tower, Programs |
| T-SAP | SAP Joule / ERP data | Tower |
| T-RSS | vendor and market announcement RSS | Intelligence |
| T-CUSTOM | files, webhooks, manual uploads | cross-surface |

That registry belongs in the spec now, even if the code still reflects older connector naming.

---

## §4 · Scope · catalog entries

Setup maps to 11 `SET-*` catalog entries in `pages.yaml`.

| ID | Name | Current implementation status | Build priority | Mockup status |
|---|---|---|---|---|
| SET-IDX-CONN | Setup · Connectors view | built | P0 | in-shell |
| SET-IDX-USR | Setup · Users view | built | P1 | pending |
| SET-IDX-AUD | Setup · Audit log view | built | P1 | pending |
| SET-IDX-POL | Setup · Policies view | built | P1 | pending |
| SET-IDX-TEN | Setup · Tenant view | built | P2 | pending |
| SET-IDX-ARC | Setup · Architecture view | partial | P2 | pending |
| SET-DTL-CONN-DEGRADED | Connector detail · degraded | built | P0 | pending |
| SET-DTL-CONN-HEALTHY | Connector detail · healthy | built | P1 | pending |
| SET-FLW-CONN-RECONNECT | Connector re-auth flow | built | P1 | pending |
| SET-FLW-USR-INVITE | Invite collaborator flow | built | P1 | pending |
| SET-MOD-POLICY-REVIEW | Annual policy review modal | built | P2 | pending |

Status guidance:

- `built` means the surface exists today in the canonical Setup component family
- `partial` means the route or concept exists but the desired integrated behavior is incomplete

Setup is further along in UI coverage than the backlog implies. Its real gap is infrastructure and data plumbing, not page existence.

---

## §5 · Build waves

Setup should ship in seven waves, `W0` through `W6`.

| Wave | Title | Catalog entries | Est. PR size | Dependencies | Smoke impact |
|---|---|---|---|---|---|
| W0 | Audit + spec | docs only | docs-only | none | defines `S-SMOKE-MS-GRAPH` |
| W1 | Shell convergence + connectors foundation | SET-IDX-CONN plus route cleanup | 300-500 lines | W0 | connectors index becomes canonical |
| W2 | Connector detail + auth flow | SET-DTL-CONN-DEGRADED, SET-DTL-CONN-HEALTHY, SET-FLW-CONN-RECONNECT | 400-700 lines | W1 | setup smoke gets detail assertions |
| W3 | Microsoft Graph live | typed MS Graph connector + health | 500-800 lines | W2 | unblocks Tower live M365 storyline |
| W4 | GitHub + Anthropic connectors | new connector classes and detail views | 500-800 lines | W3 | extends tower/usage coverage |
| W5 | Users + audit | SET-IDX-USR, SET-IDX-AUD, SET-FLW-USR-INVITE | 300-600 lines | W1 | governance trail becomes testable |
| W6 | Policies + governance | SET-IDX-POL, SET-IDX-TEN, SET-IDX-ARC, SET-MOD-POLICY-REVIEW | 400-700 lines | W5 | governance and tenant story closes |

The critical-path wave is **W3**. Microsoft Graph is the first genuinely high-leverage connector because it unlocks live M365 Copilot data for Tower and gives Intelligence a real source of user telemetry.

---

## §6 · Plan phase spec

Each Setup wave starts with a plan file that includes:

- in-scope catalog entries
- out-of-scope surfaces
- exact files to touch
- connector classes involved
- secrets or environment dependencies
- smoke impact
- risk and rollback
- model class declaration
- auto-approval claim

Setup plan docs must explicitly answer:

- does this wave require founder-owned secrets or platform settings
- does this wave add a new connector class
- does this wave touch `/admin/**`, `/platform/admin/**`, or both
- does this wave require any downstream Tower or Intelligence assumptions

Any wave that needs Vercel secrets, Clerk setup, GitHub secrets, or external API project provisioning should name that clearly so the founder-owned setup work is separated from the agent-authored code PR.

---

## §7 · Design phase spec

### Mockup conventions

Primary path:

- `/mnt/user-data/outputs/abarva-mockups/setup/`

Fallback path:

- `docs/build/mockups/setup/`

### Steward voice register

Steward copy should sound like platform governance, not product marketing:

- "ServiceNow auth expired at 14:22 UTC; refresh token remains valid"
- "PII filter active for M365 mailbox metadata; file bodies excluded"
- "GitHub usage scope is org metrics only; repo content pull is disabled"

### Suggested actions

Setup actions may be more operational than other surfaces, but they should still be explicit:

- reconnect auth
- narrow scope
- review audit events
- start annual policy review
- confirm tenant settings

---

## §8 · Build phase spec

### File conventions

- operator-facing setup pages under `src/app/(maestro)/admin/**`
- platform-level founder/admin pages under `src/app/(maestro)/platform/admin/**`
- connector health primitives and registries in `src/lib/setup/**`

### Component patterns

Preferred shape:

- index page renders a stable connector grid or governance table
- detail page renders status, health, scope, auth, and action panel
- flows are explicit pages or modals, not hidden async states

### Data contract rules

Every connector detail surface should eventually receive:

- connector identity
- typed connector class
- `ConnectorHealth`
- scope list
- policy flags
- last audit touchpoint

### Forbidden patterns

- ad hoc health objects per connector
- inline hardcoded OAuth or API state logic in page components
- new connector classes added without spec entry
- mixing operator setup and founder-only platform admin concerns in the same PR unless explicitly planned

---

## §9 · Test phase spec

Setup's module smoke is **`S-SMOKE-MS-GRAPH`**.

Minimum storyline:

1. go to `/admin`
2. confirm Microsoft 365 / Microsoft Graph connector card exists
3. open connector detail
4. assert auth state is healthy
5. assert last successful pull is present
6. assert scope list is present
7. follow the downstream Tower storyline to the M365 program detail and confirm the usage data is no longer seeded-only

The future Playwright home for this is `tests/e2e/smoke/setup-ms-graph.smoke.ts`.

Required assertions:

- connector detail route resolves without 404/500
- healthy state is visible
- last pull timestamp is visible
- connector scope is visible
- Tower consumer page renders the expected dependent signal

Visual baselines:

- connectors index
- healthy detail state
- degraded detail state
- reconnect flow

---

## §10 · Auto-approval policy

Setup waves are eligible for auto-approval only if all eight criteria are true:

1. Required plan approval exists for the active trust tier.
2. PR size remains within tier cap.
3. No escalation trigger from §13 fired.
4. Local verification gates for the slice are green.
5. `Smoke Tests on Vercel Preview` is green on the PR once the infrastructure exists.
6. Any connector health UI changes include matching snapshot or visual updates.
7. No new dependency, secret, or external service requirement was introduced silently.
8. PR description clearly separates founder-owned infra setup from agent-authored code.

Setup is the module most likely to cross founder-owned infrastructure boundaries, so criterion 7 matters more here than in most UI waves.

---

## §11 · PR & merge conventions

- one branch per wave
- one connector family per PR unless the wave spec explicitly bundles them
- branch naming: `setup/wave-W{N}/{slug}`
- PR title: `[Setup W{N}] <wave title>`
- PR body must state whether secrets, OAuth client setup, or Vercel/GitHub settings are required outside the repo

Like Programs, future Setup code waves may auto-merge only when orchestration criteria are met. This Session 1 spec PR remains founder-reviewed.

---

## §12 · The build loop

Setup loop:

1. read the spec
2. pick the next unblocked wave
3. write the wave plan
4. separate founder-owned infrastructure work from repo edits
5. implement only the repo slice for that wave
6. run the local checks for the slice
7. wait on preview deployment and smoke result
8. merge only when smoke and infra prerequisites are satisfied
9. journal the outcome

The special rule for Setup is that a wave may be "code complete" while still blocked on a founder-owned external setup step. That is not failure. It is a normal part of connector infrastructure work and should be recorded clearly.

---

## §13 · Escalation rules

Setup-specific escalation triggers:

1. Any wave requiring new GitHub Actions secrets, Vercel env vars, or Clerk/Vercel project changes.
2. Any wave introducing a new connector class not listed in this spec.
3. Any wave touching both `/admin/**` and `/platform/admin/**` without a narrow reason.
4. Any wave that stores sensitive connector scope or credential material directly in client-facing fixtures.
5. Any wave that claims live Tower or Intelligence data flow without an actual connector-backed proof path.
6. Any wave introducing PII-bearing ingestion without explicit filter rules.

### Route note

Setup does not have the exact same convergence problem as Programs, but it does have a split between `/admin/**` and `/platform/admin/**`. The working rule is:

- Setup operator waves target `/admin/**`
- platform-admin waves are separate unless explicitly bundled

If a wave cannot explain why it needs both, it should escalate instead of drifting across route families.

---

## §14 · Per-wave detailed spec

| Wave | Exact files to touch | Components affected | Mockups required | Steward voice variant | Exit criteria |
|---|---|---|---|---|---|
| W0 | spec docs only | none | none | none | spec authored |
| W1 | connectors index routes and setup fixtures | `SetupConnectorsPage`, route wrappers | connectors index mock | control-plane overview | canonical connectors surface stable |
| W2 | connector detail and reconnect files | `ConnectorDetailPage`, `ConnectorReconnectPage` | healthy + degraded + reconnect mocks | auth and health register | detail state consistent and typed |
| W3 | MS Graph connector health + downstream link files | setup lib + tower integration seams | ms-graph detail mock | live data readiness register | first live connector proves downstream flow |
| W4 | GitHub + Anthropic connector files | connector detail variants, index cards | two new connector mocks | telemetry and scope register | second and third connector classes live |
| W5 | user, invite, audit files | `SetupUsersPage`, `InviteCollaboratorPage`, `SetupAuditPage` | users + audit mocks | access-governance register | governance trail explicit |
| W6 | policies, tenant, architecture files | `SetupPoliciesPage`, `SetupTenantPage`, architecture surface | policy + tenant + architecture mocks | governance review register | annual review and tenant controls specified and testable |

Wave notes:

- `W3` is the first truly dependency-unblocking Setup wave.
- `W4` may split if GitHub and Anthropic setup complexity diverges too much.
- `W6` should stay narrow and avoid collapsing into general platform-admin cleanup.

---

## §15 · Glossary

| Term | Meaning |
|---|---|
| ConnectorHealth | the typed connector health primitive with auth, pull, latency, PII, and scope fields |
| control-plane | the operator-facing platform layer governing connectors, access, and policy |
| S-SMOKE-MS-GRAPH | Setup smoke storyline proving Microsoft Graph health and Tower consumption |
| `/admin/**` | canonical operator-facing Setup route family |
| `/platform/admin/**` | parallel platform-admin route family for broader platform surfaces |
| integration class | the connector taxonomy entry such as `T-MS-GRAPH` or `T-GITHUB` |

---

## §16 · Document control

- **Authoritative location:** [SETUP_BUILD_SPEC.md](/Users/anand/Projects/nexus/docs/build/SETUP_BUILD_SPEC.md)
- **Version:** 1.0
- **Authored:** April 28 2026
- **Owner:** Founder
- **Session:** Codex Session 1 morning doc run
- **Companion documents:** `ORCHESTRATION_SPEC.md`, `VERIFICATION_INFRASTRUCTURE_SPEC.md`, `TOWER_DESIGN_SPEC.md`

Setup becomes high leverage the moment live connector waves begin. This spec exists so that moment is planned, not improvised.
