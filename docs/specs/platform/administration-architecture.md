# AbarVa Platform Administration · Architecture Specification

**The foundational infrastructure for identity, access, data governance, and operational control across the AbarVa platform.**

This document specifies how AbarVa handles users, organizations, datasets, access control, audit, and governance. It is the foundational infrastructure underneath every other surface — Programs, Intelligence, and Tower all depend on the primitives defined here.

This spec exists because AbarVa's core value proposition depends on enterprise trust. A Fortune 50 CIO cannot deploy a platform that handles their strategic planning, their financial data, their M&A work, their compensation strategy, or their regulatory exposure unless the platform demonstrates — through architecture, not marketing — that sensitive data is handled correctly. Every technical diligence review, every SOC 2 audit, every security questionnaire depends on the primitives specified here.

This document is written for four audiences:

1. **Anand** as founder making strategic decisions about tenancy, roles, data handling, and enterprise readiness
2. **Engineers (Claude Code, Codex, future team)** implementing the infrastructure
3. **Security reviewers** (client CISOs, AbarVa's SOC 2 auditor, enterprise security teams) evaluating AbarVa
4. **Investors** (Shail, Anthology Fund, future VCs) asking "is this really enterprise-ready?"

Reads alongside:
- `docs/specs/platform/agent-architecture.md` — defines Nexus, Sentinel, Atlas; Steward is added as the fourth agent
- `docs/specs/platform/data-layer-future-state.md` — the knowledge graph and Genome mechanics that this infrastructure protects
- `docs/specs/platform/data-ingestion-integration.md` — the ingestion patterns this governance layer controls
- `docs/specs/tower/design-spec.md` — Tower references admin infrastructure for signal routing and cohort peer isolation
- `docs/specs/_reference/nexus-agent-spec-v1.md` — context for earlier agent thinking

## Document structure

Five tracks across approximately 3,000 lines.

**Track A · Identity and Tenancy**
The foundational model. Single-tenant-per-client architecture, how clients map to organizations, how users belong to organizations, the hybrid model where Maestros can be client-employed or AbarVa-staff, SSO patterns, authentication infrastructure.

**Track B · Role and Permission Model**
The two-tier role structure (Admin, Maestro). Program-scoped access control. Time-bounded grants. Purpose-bounded grants. Cross-client isolation. What admins can do that Maestros cannot.

**Track C · Dataset Lifecycle**
How data enters AbarVa, gets classified, gets controlled, decays, archives. The source-class taxonomy (client-private, cohort-contributory, platform-public). Sensitivity tiers. The collaborative classification workflow between admin and Maestro.

**Track D · Governance and Audit**
What gets logged. Retention policies. Audit trail surfaceability. SOC 2 Type II scaffolding. Policy enforcement. Incident response patterns.

**Track E · Org Structure as Intelligence Input**
The special role of org-chart data as both admin artifact and agent input. How Nexus, Sentinel, and Atlas use org data without crossing sensitivity boundaries. Permission propagation from admin controls to agent reasoning.

Each track specifies architectural decisions, data models, operational patterns, and open questions. Each closes with locked decisions and checkpoints.

---

# TRACK A · Identity and Tenancy

## A.1 The tenancy decision

### Why single-tenant per client

AbarVa commits to a single-tenant-per-client architecture. Every client organization gets isolated infrastructure — dedicated database, dedicated vector index namespace, dedicated object storage, dedicated Anthropic API scope where feasible.

This decision has three drivers:

**Driver 1 — Enterprise sales gating.** Fortune 500 CISOs ask one question early in technical diligence: "is our data in the same database as your other customers?" The correct answer is "no — your data lives in infrastructure dedicated to your organization." Multi-tenant shared architecture, however well-engineered, fails this question in perception if not in reality. AbarVa's buyers (CIOs, CTOs, CISOs at enterprises doing sensitive AI transformation work) treat this as a go/no-go filter.

**Driver 2 — Regulatory clarity.** When a client's infrastructure is legally isolated, compliance scope is cleaner. SOX audit of a financial services client's AbarVa deployment traces to a specific Supabase project, specific Pinecone index, specific object bucket. No cross-client data commingling complicates the audit trail. GDPR data residency requirements resolve naturally (deploy the client's tenant in EU region).

**Driver 3 — Operational isolation.** Single-tenant means a bug, performance issue, or security incident in Client A's deployment does not propagate to Client B. Cohort-wide outages are impossible because there is no shared infrastructure. For a platform positioning itself as enterprise-critical, this isolation is non-negotiable.

### What single-tenant means concretely

Each client gets:

- **Dedicated Supabase project** — separate project ID, separate connection string, separate row-level security scope (though RLS becomes optional when cross-tenant isolation is at the project level)
- **Dedicated Pinecone namespace** (or dedicated index for larger clients) — vectors never crossed
- **Dedicated object storage bucket** — uploaded documents, artifacts, generated files all tenant-scoped
- **Dedicated API credentials** to Anthropic, Voyage, other third-party services where the service supports it — so per-client cost attribution and rate limiting are clean
- **Dedicated Vercel deployment** or at minimum dedicated project configuration per client
- **Dedicated backup, restore, and disaster recovery** procedures per tenant

### What single-tenant does NOT mean

Some things remain shared across all clients:

- **The AbarVa source code.** All clients run the same version of AbarVa software. Deployments differ by configuration, not by codebase.
- **AbarVa-authored knowledge** (L1 layer from the intelligence architecture). Public methodologies, framework taxonomies, industry reference materials live in a platform-level repository that all tenants read from but none can write to. This is what allows Nexus to "know consulting" without needing each client to teach it.
- **The Genome** (aggregated cross-client patterns). This is the one genuine cross-client data flow, and it is governed carefully. Genome patterns are derived from client data but stored in anonymized, aggregated form with cohort-size minimums. Detailed in Track C.
- **Cohort benchmarks** for Tower. Similar to Genome — computed from client data but stored as aggregates with minimum-cohort-size rules.

The shared elements are the specific things that make AbarVa valuable as a platform rather than a custom build per client. Everything else is isolated.

### Deployment patterns

Three deployment patterns support different enterprise security postures:

**Pattern 1 · AbarVa-managed cloud (default)**

AbarVa operates the tenant infrastructure in AbarVa's cloud accounts. Client accesses via standard SSO. Data never leaves AbarVa-controlled infrastructure but is isolated to the client's tenant. This is the simplest pattern and the default for most clients.

**Pattern 2 · Client-cloud deployment (VPC peering)**

For clients who require their data to remain in their own cloud environment, AbarVa deploys the client's tenant into the client's AWS/Azure/GCP account via infrastructure-as-code templates. AbarVa retains operational responsibility but the data never leaves the client's cloud boundary. This is what Prat asked about ("single-tenant in our VPC").

**Pattern 3 · Client-operated deployment (air-gapped)**

For highest-security clients (classified work, certain financial services contexts), the client operates the infrastructure themselves using AbarVa-provided deployment artifacts. AbarVa has no operational access. Updates delivered via signed artifact bundles. This pattern is heaviest operationally and reserved for clients who require it.

**Pattern selection by client:** Driven by the client's security posture and negotiated at contract time. Most clients will use Pattern 1. Target-tier clients likely require Pattern 2. Air-gapped is rare and negotiated case-by-case.

## A.2 Organization model

### Hierarchy

AbarVa's organizational hierarchy:

```
AbarVa (the platform company)
├── Clients (the enterprises using AbarVa — Apex, Meridian, First Capital, etc.)
│   ├── Organizations (business units or subsidiaries within a client, optional)
│   │   ├── Users (people who log in)
│   │   └── Programs (transformation work)
│   ├── Datasets (client-owned data)
│   └── Integrations (client's connected external systems)
```

At the top level: **AbarVa** is the platform. Everything else is client-scoped.

**Client** is the primary tenancy boundary. "Apex Retail Group" is a client. Each client has its own isolated infrastructure per the single-tenant model.

**Organizations** within a client are optional. Most clients won't use them. For large enterprises with distinct business units (e.g., a financial holding company with banking, wealth management, and insurance as separate units), organizations allow data segmentation within a client. A Program scoped to the banking org doesn't surface data from the wealth management org.

**Users** belong to a client (and optionally to a specific org within the client). Users never belong to AbarVa directly except for the AbarVa staff Maestro case (see A.3).

**Programs** are client-scoped (and optionally org-scoped). A Program's data access is constrained to its client/org.

**Datasets** are client-owned. A dataset uploaded by Apex cannot be seen by Meridian under any circumstances.

**Integrations** (Microsoft 365, Snowflake, etc.) are client-scoped. Each client's integration configuration is independent.

### Why this structure

The hierarchy is deliberately thin. Three reasons:

1. **Clarity for admins.** Admins understand "Client → User → Program." Complex hierarchies with departments, teams, projects, workspaces confuse non-technical admins and create permission-management overhead.

2. **Flexibility without overbuilding.** The optional Organizations layer handles the 5% of clients with genuine internal segmentation needs. For the other 95%, it's invisible — all users belong to the client directly, no middle layer.

3. **Fast onboarding.** New client setup is: create client tenant → add admin → admin adds Maestros and datasets. No template org structure to configure before productive work starts.

### The "organization within client" pattern

When used, organizations serve two specific purposes:

**Purpose A — Data segmentation.** A holding company's banking org shouldn't see the insurance org's customer data even though both live within the same client tenant. Organization-scoping provides this boundary.

**Purpose B — Maestro specialization.** Different Maestros may work on different organizations within the same client. A Maestro assigned to the banking org doesn't see insurance Programs.

Admins can create, rename, reorganize, and dissolve organizations within their client. AbarVa never creates organizations on behalf of a client.

## A.3 The user model

### User types

AbarVa recognizes exactly two first-class user types:

**Admin** — one per client. Has full rights over client tenant: user management, dataset management, access policy, audit visibility, compliance configuration, Steward agent scope, Platform surface access.

**Maestro** — many per client. Runs Programs. Has access to specific datasets per grant. Cannot manage other users, cannot modify platform-level settings, cannot view audit logs beyond their own activity.

Every user is either Admin or Maestro. No third tier.

**Sponsor, Owner, Contributor, Viewer** — these terms appear in Program contexts but are not separate user types. They are Program-scoped roles that a Maestro holds on a specific Program. A Maestro can be Sponsor on one Program and Contributor on another; the system-level identity remains "Maestro."

### Why two tiers and not more

The temptation in platform design is to create fine-grained role hierarchies — "Senior Admin, Junior Admin, Lead Maestro, Senior Maestro, Junior Maestro, Viewer-Only, Guest" — driven by real-world corporate hierarchies. This is almost always a mistake for three reasons:

1. **Mapping to client org hierarchies fails.** Every client has different titles, different role seniorities, different access expectations. A spec-defined role hierarchy never fits any specific client cleanly.

2. **Permission management complexity scales poorly.** With two tiers, you manage "who is admin, who is Maestro." With seven tiers, you're always debugging "why can't this user do X."

3. **Actual access is scoped below role.** What matters is "can this user see Dataset Y on Program Z?" That's not solved by more role tiers — it's solved by per-dataset-per-program access grants. See Track B.

AbarVa's two-tier model puts role granularity where it belongs (binary — admin/not) and access granularity where it belongs (per-dataset-per-program).

### Hybrid Maestro origin

A Maestro can be:

**Client Maestro** — employed by the client (e.g., Apex's Strategy Director running an AI program). Has a client.com email, uses client SSO, appears in client org charts.

**AbarVa Maestro** — employed by AbarVa (e.g., AbarVa's Principal Consultant supporting Apex during rollout). Has an abarva.ai email. Granted Maestro access to specific clients by those clients' admins.

**VIP Maestro** — external advisor or contractor embedded temporarily (e.g., a former retail CIO brought in as advisor). Similar to AbarVa Maestro but with time-bounded access.

All three are "Maestro" as far as the role model is concerned. The distinction is operational — where the human is employed, what email domain they use, who their employer is — not architectural.

**Admin visibility on Maestro origin:** Admins see the full origin metadata. The user list clearly distinguishes Client Maestro (Apex-employed), AbarVa Maestro (AbarVa-employed, approved for Apex work), and VIP Maestro (external advisor, time-bounded). This transparency is important because admins need to know who is a contractor vs employee when making access decisions.

### User data captured on setup

When an admin sets up a new user, AbarVa captures structured data that serves three purposes simultaneously:

**Purpose 1 — Identity and authentication.** Name, email, phone, SSO provider, MFA method, timezone.

**Purpose 2 — Organizational context.** Title, department, reporting manager, office location, start date at organization.

**Purpose 3 — Agent context.** Professional background (prior roles, years of experience), domain specializations, languages, areas of interest. This data feeds Nexus and other agents so conversations are personalized.

The third purpose is why user setup is richer than "name, email, role." AbarVa captures:

- **Professional profile:** Current title, reporting relationship, years in current role, professional background (e.g., "20 years enterprise IT, prior VP Engineering at Fortune 100 retailer")
- **Specializations:** Domain expertise (e.g., "retail operations, supply chain, demand forecasting")
- **Preferences:** Communication style preferences, meeting cadence preferences, technical depth preferences
- **Context markers:** Active strategic initiatives, recent role changes, board involvement, public speaking engagements (for VIPs)

This data is the L4 layer of AbarVa's four-layer intelligence architecture (from the Intelligence Integrated VIP System spec). It turns a generic AI tool into a personalized advisor.

**Privacy consideration:** Users have the right to see and edit everything captured about them. Admins can see structured fields but not free-text notes authored by other users about a person. The VIP system has additional controls on sensitive observations.

### The Admin user specifically

The Admin is a special Maestro. Every Admin is also a Maestro — they can run Programs, participate in Intelligence research, view Tower. But Admin has additional rights that Maestros lack:

- **User management** — add, edit, deactivate users; change roles; manage access grants
- **Dataset management** — upload, classify, archive datasets; grant and revoke dataset access
- **Integration management** — configure Microsoft 365, Snowflake, Salesforce, etc.; manage API credentials
- **Governance configuration** — set policies, approve data exports, configure audit retention
- **Platform surface access** — the only user type with full Platform surface visibility
- **Steward agent administrative scope** — Steward answers admin questions for Admin users that it won't answer for Maestros

The Admin-Maestro relationship is "Admin = Maestro + extra rights." There is no "Admin-only user" without Maestro capabilities. This keeps the mental model clean: every admin can still run a Program if needed.

## A.4 Authentication infrastructure

### SSO by default for enterprise

Enterprise clients authenticate via Single Sign-On. AbarVa integrates with:

- **SAML 2.0** — the enterprise standard, works with Okta, Azure AD (Entra ID), Ping, OneLogin, and most identity providers
- **OAuth 2.0 / OIDC** — Google Workspace, Microsoft 365, others
- **Client-specific requirements** — air-gapped clients may require certificate-based auth; handled case-by-case

When a client onboards, SSO integration is Day 1 work. AbarVa provisions the SAML or OIDC configuration; the client's IT team configures their IdP; users authenticate via their corporate credentials.

AbarVa does not maintain its own password store for enterprise users. Password management is the client's IdP responsibility.

### Fallback authentication

For AbarVa Maestros (AbarVa-employed) and for initial admin setup before client SSO is configured, AbarVa operates its own authentication via Clerk (current) or equivalent. This is gated:

- AbarVa-employed users authenticate via AbarVa's SSO (google.abarva.ai) and are cross-mapped to client tenants by invitation
- Client admins may have fallback credentials for initial setup, immediately migrated to client SSO on completion

### MFA

Multi-factor authentication is required for all Admin users. Mandatory at SSO layer (most enterprise IdPs enforce this natively) or mandatory at AbarVa layer for fallback auth.

For Maestros, MFA is recommended and configurable per-client. Most enterprise clients will require it.

### Session management

Sessions are time-bounded. Default: 8 hours of activity, 30 minutes of inactivity triggers re-auth. Client admins can adjust:

- More secure: 4 hours / 15 min
- More permissive (internal tools only): 24 hours / 2 hours

Session tokens are invalidated on:
- User deactivation (immediate)
- Role change (immediate re-auth required)
- Explicit session revocation by admin
- Security incident triggering mass re-auth

## A.5 Identity data model

### Core tables (logical model)

```sql
-- Client tenant (this table exists once per AbarVa deployment, lists clients)
CREATE TABLE clients (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,                    -- "Apex Retail Group"
  legal_name TEXT,                       -- "Apex Retail Group LLC"
  tenant_id TEXT UNIQUE NOT NULL,        -- tenant slug for routing: "apex-retail"
  industry_code TEXT NOT NULL,
  region TEXT NOT NULL,                  -- "US", "EU", etc. — determines data residency
  deployment_pattern TEXT NOT NULL,      -- 'managed' | 'client-cloud' | 'air-gapped'
  sso_config_id TEXT,                    -- reference to SSO integration
  created_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL,                  -- 'active' | 'paused' | 'offboarded'
  soc2_scope BOOLEAN NOT NULL DEFAULT TRUE
);

-- Organizations within a client (optional layer)
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id),
  name TEXT NOT NULL,
  parent_org_id UUID REFERENCES organizations(id),  -- nested orgs if needed
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE (client_id, name)
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id),
  org_id UUID REFERENCES organizations(id),
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL,                    -- 'admin' | 'maestro'
  origin TEXT NOT NULL,                  -- 'client' | 'abarva' | 'vip'
  status TEXT NOT NULL,                  -- 'active' | 'inactive' | 'pending_invite'
  sso_identity TEXT,                     -- SAML NameID or OIDC sub
  mfa_enforced BOOLEAN NOT NULL,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES users(id),
  UNIQUE (client_id, email)
);

-- User profile (rich context for agent use)
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  title TEXT,
  department TEXT,
  reports_to_user_id UUID REFERENCES users(id),
  office_location TEXT,
  start_date_at_org DATE,
  timezone TEXT,
  years_in_role INTEGER,
  professional_background TEXT,          -- markdown, admin-authored + user-editable
  specializations TEXT[],                -- array of domain tags
  communication_preferences JSONB,       -- {tone, depth, cadence, etc.}
  active_initiatives TEXT[],             -- current strategic priorities
  recent_role_changes JSONB,             -- for onboarding context
  board_involvement TEXT,                -- for VIPs
  public_speaking JSONB,                 -- recent talks, publications
  updated_at TIMESTAMPTZ NOT NULL,
  updated_by UUID REFERENCES users(id)
);

-- Relationship notes (decaying observations from intelligence layer)
-- Existing table per prior Data Layer spec — admin-layer adds the view
-- and permission controls, actual data in relationship_notes table.
```

### Design notes

**`client_id` on every user-scoped table.** Tenancy enforcement at query layer assumes this. Every query that touches user data includes `WHERE client_id = $tenant_id`. Under single-tenant deployment, this is redundant (each tenant is a separate DB) but the discipline is maintained for defense-in-depth and for the managed-cloud case where misconfiguration could theoretically leak.

**Email uniqueness is scoped per client.** An Apex employee with email `jane@apex.com` and a Meridian employee with email `jane@meridian.com` are obviously different; but the system also allows `jane@example.com` to exist at both Apex and Meridian if for some reason the same real person works at both (rare but possible). Uniqueness is `(client_id, email)`, not `email` alone.

**SSO identity links to external IdP.** When a user authenticates via SAML, the IdP returns a `NameID` which maps to this user record. Email is the display; SSO identity is the auth key.

**Profile data is rich.** This is deliberate. The profile table is not just HR data; it's L4 intelligence input. Admins and users collaborate on keeping it current. Stale profiles produce stale agent responses.

**`created_by` audit trail.** Every user record knows who created it. This is the first audit-trail requirement — for SOC 2 and for operational forensics.

## A.6 User lifecycle

### Onboarding

**Step 1 — Admin initiates.** Admin navigates to User Management, clicks "Invite User," enters email and role (Admin or Maestro).

**Step 2 — Optional profile pre-fill.** Admin may pre-populate profile data if known (title, department, reports-to). Or leaves it empty for the user to complete.

**Step 3 — Invitation email sent.** User receives email with link to join AbarVa. Link is time-bound (7 days default, configurable).

**Step 4 — User completes SSO flow.** User clicks link, authenticates via client SSO, lands in AbarVa.

**Step 5 — User completes profile.** User edits their own profile fields. Some fields (title, reporting manager) are admin-only-editable to prevent self-inflation.

**Step 6 — Admin grants access.** Admin adds the user to relevant Programs and grants dataset access per Program.

The onboarding flow is linear. Steward agent can assist by pre-drafting profile data from public sources (LinkedIn with permission, corporate website) but final user control remains with the user.

### Active user management

During a user's tenure, admins can:

- **Edit profile fields** — keep role, title, reporting relationships current
- **Change role** — promote Maestro to Admin or vice versa (requires explicit admin confirmation)
- **Add/remove from Programs** — grant or revoke Program-scoped participation
- **Manage dataset access** — per Track B
- **View activity** — last login, active sessions, recent actions (audit log)
- **Temporarily suspend** — pause access without deactivating (e.g., parental leave, sabbatical)
- **Reactivate** — restore access

Users can:

- **Edit own profile fields** (except admin-restricted fields)
- **View own access grants** — see which Programs they're on and which datasets they can see
- **View own activity log** — see their own actions (not other users')
- **Request access** — ask admin for dataset or Program access (request is logged, admin approves/denies)

### Deactivation

When a user leaves:

**Immediate:**
- Admin deactivates the user
- Active sessions invalidated
- SSO integration revokes access (many IdPs do this automatically when the user leaves the corporate directory)
- User cannot log in anymore
- Dataset access grants held by the user are revoked

**Retained for audit:**
- User record remains in the database (soft-delete: status = 'inactive')
- Historical actions attributed to the user remain in audit logs
- Artifacts authored by the user remain visible (attribution preserved)
- Profile data remains readable for context ("Jake Chen authored this in Q2 — he left the company in September")

**Purged after retention period:**
- Per SOC 2 and regulatory requirements, user PII may be purged after a client-defined retention period (default 7 years)
- Artifacts authored are retained but attribution shifts from name to role ("Former CDO")
- This is a client-configurable policy; some clients retain PII longer for legal reasons

### Handling an Admin leaving

Admin departures are handled specially because losing the sole admin locks the client out.

**Prevention:** Every client must designate at least one backup admin or a designated "admin recovery contact." AbarVa monitors that all clients have a backup admin; if an admin leaves and no backup exists, AbarVa notifies the client and blocks admin departure until a backup is designated.

**Admin transition ceremony:** When an admin role transitions, AbarVa requires:
1. Outgoing admin designates incoming admin
2. Incoming admin accepts via authenticated session
3. AbarVa logs the transition with both identities
4. Outgoing admin loses admin rights; retains Maestro rights unless also departing
5. All outgoing admin's dataset access grants held as admin are transferred or reassessed

This ceremony is one of the most sensitive workflows in AbarVa. It gets full audit logging and notification to the client's security team.

**Emergency admin recovery:** If the sole admin is suddenly unavailable (medical emergency, unexpected departure without handoff), the client's designated recovery contact can initiate an emergency admin recovery through AbarVa support. This is a manual, identity-verified process and is not initiated in-product. Audit trail records the recovery event.

## A.7 Decisions locked in Track A

| # | Decision | Rationale |
|---|---|---|
| A.L1 | Single-tenant per client architecture | Enterprise sales gating, compliance clarity, operational isolation |
| A.L2 | Three deployment patterns: AbarVa-managed, client-cloud, air-gapped | Accommodates security posture range |
| A.L3 | Hierarchy: AbarVa → Clients → (Organizations) → Users / Datasets / Programs | Thin, clear, flexible |
| A.L4 | Two user types: Admin (one per client), Maestro (many per client) | Role granularity where it belongs; access granularity at dataset level |
| A.L5 | Every Admin is also a Maestro with extra rights | Clean mental model, no admin-only users |
| A.L6 | Maestros can be client-employed, AbarVa-employed, or VIP/external | Hybrid model per Anand's specification |
| A.L7 | SSO by default for enterprise users; fallback auth for AbarVa staff and initial setup | Enterprise table stakes |
| A.L8 | MFA required for Admin, recommended for Maestro, client-configurable | Balance security and usability |
| A.L9 | Rich user profile data (L4 intelligence input) captured on setup, user-editable | Personalized agent experience from day one |
| A.L10 | Email uniqueness scoped per-client | Supports edge case of same person at multiple clients |
| A.L11 | Backup admin designation required for every client | Prevents admin-departure lockout |
| A.L12 | Admin transition requires formal ceremony with audit logging | Most sensitive workflow; warrants process rigor |

## A.8 Open decisions for later tracks

- Program-scoped role model (Sponsor, Owner, Contributor, Viewer) — Track B
- Dataset access control primitives — Track B and Track C
- Audit retention policies — Track D
- Specific SOC 2 controls mapping — Track D

---

## Track A · Checkpoint

**STATUS · Track A of 5 complete**

Identity and tenancy specified. Single-tenant architecture locked. Three deployment patterns defined. Two-tier user model (Admin + Maestro) with hybrid Maestro origin. Rich user profile capture. Authentication infrastructure. User lifecycle including edge cases.

Ready for Track B (Role and Permission Model).

---

# TRACK B · Role and Permission Model

## B.1 Why access control deserves its own track

Track A defined who users are. Track B defines what they can do.

This is where AbarVa either passes or fails enterprise security review. The previous tracks and subsequent ones matter, but access control is the specific place where a CISO's question "show me how a Maestro can only see Apex data, not Meridian" gets answered. A weak answer here kills the enterprise deal regardless of every other virtue of the product.

AbarVa's access control model has three layers:

**Layer 1 · Tenant isolation** (from Track A — single-tenant deployment already provides this)
**Layer 2 · Role-based rights** (Admin vs Maestro, specified below)
**Layer 3 · Program and dataset-scoped grants** (fine-grained access to specific resources, specified below)

The layers compose: a Maestro must be within the tenant, must have Maestro role rights, AND must have explicit grant to a specific Program or dataset. Missing any layer and access is denied.

## B.2 Role rights matrix

The definitive answer to "what can each role do?"

### Admin rights (exclusive to Admin)

- **User management**
  - Invite users (admin or maestro)
  - Edit user profile fields (admin-restricted fields: title, reporting manager, role)
  - Change user roles (promote/demote)
  - Deactivate users
  - Designate backup admin
  - Initiate admin transition ceremony

- **Dataset management**
  - Upload datasets via Platform surface
  - Classify datasets (sensitivity tier, source class, retention policy)
  - Archive datasets
  - Delete datasets (with audit trail)
  - Configure dataset refresh schedules

- **Access policy**
  - Grant Maestro access to datasets (per Program or org-wide)
  - Revoke access grants
  - Configure access time-bounds
  - Approve cross-org dataset requests
  - Configure default access policies for new Programs

- **Integration configuration**
  - Connect external systems (Microsoft 365, Snowflake, Salesforce, etc.)
  - Manage API credentials
  - Configure sync schedules
  - Disconnect integrations

- **Governance**
  - View full audit log (all user actions)
  - Export audit data
  - Configure retention policies
  - Approve data exports
  - Manage policy attestations
  - View compliance dashboard

- **Platform surface access**
  - Only user type with full Platform surface navigation
  - Steward agent administrative scope (see Document 4)

### Maestro rights (all users, including admins)

- **Program participation**
  - Create Programs (if authorized per client policy; some clients require admin approval for new Programs)
  - Run Programs in phases 1-7
  - Access Nexus, Sentinel, Atlas in Program contexts
  - Collaborate with other Maestros on Programs they share

- **Dataset access (per grant)**
  - View datasets explicitly granted to the user
  - Query data through agent interfaces
  - Export data (subject to dataset export policy)

- **Intelligence research**
  - Create Intelligence threads
  - Use Sentinel for research
  - Save threads, promote threads to Programs
  - Access L1 (public) knowledge always; L2 (client) knowledge per grant; L3 (program) knowledge when on Program team; L4 (user) is always own-only

- **Tower viewing**
  - View Tower for client (portfolio-level)
  - Atlas conversations

- **Personal profile**
  - Edit own profile fields (except admin-restricted)
  - View own activity log
  - Request access to new datasets (routes to admin)

### Rights Maestros do NOT have

Unless they are also admins:

- Cannot manage other users (invite, edit roles, deactivate)
- Cannot upload datasets to platform-wide scope (can upload program-scoped content, which is different)
- Cannot grant access to other Maestros
- Cannot configure integrations
- Cannot view full audit log (only own activity)
- Cannot export data beyond Program-scoped exports
- Cannot approve policy changes
- Cannot access Platform surface beyond personal settings

## B.3 Dataset access: the critical primitive

The hardest access-control problem in AbarVa is dataset access. Programs need data to function, but not all data. A Maestro running the Contact Center AI program for Apex does not need access to Apex's executive compensation dataset. A Maestro running the Executive Compensation Strategy program does not need access to the Contact Center operational data.

AbarVa models dataset access with three dimensions:

**Dimension 1 · Scope** — what the grant applies to
**Dimension 2 · Duration** — how long the grant lasts
**Dimension 3 · Purpose** — what the grant is used for

### Scope

Four levels of access scope:

**Scope A · Client-wide** — Maestro can see this dataset from any Program or Intelligence thread within this client. Used for general context data: org structure, product catalog, public-facing materials.

**Scope B · Organization** — Maestro sees this dataset when working in a specific org within the client. Used when organizational data is walled off (banking vs insurance).

**Scope C · Program** — Maestro sees this dataset only when acting in the context of a specific Program. Used for Program-specific sensitive data: the financials for a specific consolidation effort, the compensation data for a specific Program.

**Scope D · Session** — Maestro sees this dataset only during a specific Intelligence thread or agent invocation. Used for one-off analysis where the Maestro needs a glimpse of sensitive data for a single conversation, not ongoing access.

### Duration

**Standing grant** — access persists until explicitly revoked.

**Time-bound grant** — access expires at a specified date. Example: a Maestro granted access to M&A-related data for a 90-day engagement; access automatically revokes when the period ends.

**Event-bound grant** — access expires on a specified event. Example: access granted until Program Phase 7 completes, at which point access revokes automatically.

**Session-bound grant** — access lasts only for an active user session, revokes on logout or session expiration.

### Purpose

Every access grant carries a stated purpose. Purpose is documented at grant time and surfaces in audit logs.

Example:
> Maestro: Sarah Chen  
> Dataset: Apex Compensation Data Q3 2026  
> Scope: Program-scoped to "Executive Compensation Alignment" Program  
> Duration: Event-bound, until Program closes or Sep 30 2026, whichever first  
> Purpose: "Compensation benchmarking for the AI Leadership role redesign within the Executive Comp Alignment Program"  
> Granted by: [Admin name]  
> Granted at: 2026-04-15T09:22Z

Purpose is not a free-text field only. AbarVa offers structured purpose templates:
- "Program execution" (default for Program-scoped)
- "Research and analysis" (Intelligence thread work)
- "Benchmarking" (comparative context)
- "Audit response" (compliance-related)
- "Specific named investigation" (user enters brief free-text tag)

Structured purpose enables audit analytics ("show me all access grants for audit purposes in the last quarter") and policy enforcement ("research-purpose grants max 90 days; program-execution grants can be event-bound indefinite").

### Composing access grants

A grant is a tuple of (user, dataset, scope, duration, purpose). A user may have multiple grants to the same dataset with different scopes or purposes.

Example:

Sarah Chen has two grants to the "Apex 2026 Vendor Contracts" dataset:

Grant 1:
- Scope: Program-scoped (AI Supplier Consolidation Program)
- Duration: Event-bound (until Program closes)
- Purpose: Program execution

Grant 2:
- Scope: Session-bound
- Duration: Session only
- Purpose: Research and analysis (she's asking Sentinel to analyze vendor overlap)

Both grants are independent and auditable separately. When the Program closes, Grant 1 auto-revokes but Grant 2 might still be in effect if the session is active.

### Grant approval workflow

**Admin-initiated grant:** Admin creates grant directly in UI. Effective immediately. Logged.

**Maestro-requested grant:** Maestro requests access via Platform surface or Steward agent. Request enters admin approval queue. Admin reviews: approves, denies, or approves with modifications (different scope, shorter duration, narrower purpose).

**Auto-approved grant categories:** Some low-sensitivity access can auto-approve per client policy. Example: a Maestro joining an active Program automatically receives access to that Program's scoped datasets. Admin configures which categories auto-approve and which require manual review.

**Emergency grant:** Admin can grant emergency access with abbreviated workflow for urgent operational needs. Requires enhanced audit documentation and post-hoc review.

## B.4 The data model

### Core tables

```sql
-- Datasets (see Track C for full lifecycle model)
CREATE TABLE datasets (
  id UUID PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id),
  org_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  source_class TEXT NOT NULL,      -- 'client-private' | 'cohort-contributory' | 'platform-public'
  sensitivity_tier TEXT NOT NULL,  -- 'public' | 'internal' | 'restricted' | 'confidential'
  classification_status TEXT NOT NULL, -- 'classified' | 'pending_classification' | 'disputed'
  owner_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL,
  -- ... (full schema in Track C)
);

-- Access grants
CREATE TABLE dataset_access_grants (
  id UUID PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id),
  user_id UUID NOT NULL REFERENCES users(id),
  dataset_id UUID NOT NULL REFERENCES datasets(id),
  
  -- Scope
  scope_type TEXT NOT NULL,        -- 'client-wide' | 'organization' | 'program' | 'session'
  scope_org_id UUID REFERENCES organizations(id),
  scope_program_id UUID REFERENCES programs(id),
  scope_session_id TEXT,           -- session identifier for session-scoped grants
  
  -- Duration
  duration_type TEXT NOT NULL,     -- 'standing' | 'time-bound' | 'event-bound' | 'session-bound'
  expires_at TIMESTAMPTZ,          -- for time-bound
  expires_on_event TEXT,           -- event key for event-bound
  expires_on_event_param UUID,     -- parameter for event (e.g., program_id for "program_closed")
  
  -- Purpose
  purpose_category TEXT NOT NULL,  -- structured purpose
  purpose_description TEXT,        -- free-text detail
  
  -- Audit
  granted_by UUID NOT NULL REFERENCES users(id),
  granted_at TIMESTAMPTZ NOT NULL,
  revoked_by UUID REFERENCES users(id),
  revoked_at TIMESTAMPTZ,
  revoke_reason TEXT,
  
  -- State
  status TEXT NOT NULL,            -- 'active' | 'revoked' | 'expired' | 'pending_approval'
  approval_request_id UUID REFERENCES access_requests(id),
  
  CONSTRAINT valid_scope CHECK (
    (scope_type = 'client-wide' AND scope_org_id IS NULL AND scope_program_id IS NULL) OR
    (scope_type = 'organization' AND scope_org_id IS NOT NULL AND scope_program_id IS NULL) OR
    (scope_type = 'program' AND scope_program_id IS NOT NULL) OR
    (scope_type = 'session' AND scope_session_id IS NOT NULL)
  )
);

-- Access requests
CREATE TABLE access_requests (
  id UUID PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id),
  requested_by UUID NOT NULL REFERENCES users(id),
  dataset_id UUID NOT NULL REFERENCES datasets(id),
  requested_scope TEXT NOT NULL,
  requested_duration TEXT NOT NULL,
  requested_purpose TEXT NOT NULL,
  justification TEXT NOT NULL,          -- maestro's explanation
  status TEXT NOT NULL,                 -- 'pending' | 'approved' | 'denied' | 'modified'
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_decision TEXT,
  review_notes TEXT,
  resulting_grant_id UUID REFERENCES dataset_access_grants(id),
  created_at TIMESTAMPTZ NOT NULL
);
```

### Query-time access enforcement

When a user queries a dataset (directly, through Nexus, through Sentinel, through Atlas, or through Steward), the platform enforces access at query time:

```python
# Pseudocode for dataset access check
def can_access_dataset(user, dataset, context):
    # Layer 1: Tenant check (already implicit - single-tenant deployment)
    assert user.client_id == dataset.client_id
    
    # Layer 2: Role check
    # Public datasets (L1 platform-public) accessible to all Maestros
    if dataset.source_class == 'platform-public':
        return True
    
    # Layer 3: Grant check
    active_grants = fetch_active_grants(user.id, dataset.id)
    
    for grant in active_grants:
        if grant.is_expired():
            continue  # Expired grants don't count
        
        if grant.scope_type == 'client-wide':
            return True
        
        if grant.scope_type == 'organization':
            if context.current_org_id == grant.scope_org_id:
                return True
        
        if grant.scope_type == 'program':
            if context.current_program_id == grant.scope_program_id:
                return True
        
        if grant.scope_type == 'session':
            if context.session_id == grant.scope_session_id:
                return True
    
    return False
```

**Critical properties of this check:**

1. **Runs on every data access.** Not just on login, not cached indefinitely. Every agent query that touches a dataset re-verifies access.
2. **Fail-closed.** If no active grant matches the context, access is denied. There is no implicit access.
3. **Context-aware.** The check considers what the user is currently doing. A Maestro on Program A cannot access Program B's datasets even if they have a grant scoped to Program B — because the context is Program A.
4. **Loggable.** Every check (success and failure) is auditable.

### Agent behavior on access denial

When an agent (Nexus, Sentinel, Atlas, Steward) needs data the user lacks access to, the agent handles this gracefully:

**Option 1 · Acknowledge the limit:**
> "I don't have access to the Apex executive compensation dataset. If this is needed for your Program, you can request access from your admin. Want me to help draft the request?"

**Option 2 · Continue without the data:**
> "I can't see the compensation data, but I can still help you think through the framework. Here's what I'd typically look at, and you can fill in the specifics..."

**Option 3 · Route to admin:**
> "The analysis you're asking for requires the vendor pricing dataset, which you don't have access to. I've prepared a request — review and submit to your admin?"

Agents never pretend to have data they don't, never infer values for data they can't see, never "work around" access denials. The access model is absolute: agents respect it completely.

## B.5 Cross-client isolation

A Maestro working with multiple clients is common — especially for AbarVa-employed Maestros but also for external advisors who work with multiple enterprises.

The isolation requirement is absolute: **a Maestro's work with Client A cannot contaminate, reference, or leak into Client B's context.**

### Technical isolation

Per Track A, each client has a dedicated tenant deployment. Physical/logical database isolation means cross-client queries are impossible at the database level. A Maestro logged into Apex's tenant simply cannot reach Meridian's database.

### UX isolation

A Maestro with access to multiple clients must explicitly switch tenants in the UI. Switching tenants:
- Logs out of the current tenant (or maintains as separate authenticated session)
- Clears in-memory context (recent queries, draft content, chat history, pinned signals)
- Requires re-authentication if session has been idle
- Surfaces the new tenant's branding/context clearly

The user always knows which client's data they are looking at. Accidental "I thought I was in Apex but I was in Meridian" moments are designed out.

### Agent isolation

Agents inherit isolation from deployment. Nexus running in Apex's tenant has no access to Meridian's data, Meridian's Genome contributions, or Meridian's cohort benchmarks. Each tenant has its own agent instantiation with its own context.

The one exception is Genome and cohort data, which is cross-client by design. This is handled at the architectural level through aggregation and cohort-size minimums (see Track C). At query time, agents can reference "retail peers (n=7)" without exposing which specific clients contributed.

### Knowledge isolation

A Maestro learns things while working with a client — strategic priorities, internal politics, proprietary methods. Some of that learning is personal and travels with the Maestro to future engagements. Some is client-confidential and cannot travel.

AbarVa handles this through:

**Personal notes layer** — Maestros can keep private notes that travel with them. These are not stored in the client tenant; they are stored in the Maestro's personal workspace (AbarVa-managed if AbarVa-employed, client-isolated for client-employed Maestros).

**Explicit knowledge capture** — If a learning should be contributed to the platform (Genome pattern, generic solution shape), the Maestro explicitly contributes it through a curated workflow that strips client-specific identifiers.

**No implicit cross-pollination** — Nothing a Maestro does in Apex's tenant is visible when they log into Meridian's tenant, ever.

## B.6 Program-scoped roles

Within a Program, users hold Program-scoped roles that are different from the platform-level role (Admin/Maestro).

### The Program role set

**Sponsor** — executive owner of the Program. Signs off on charter, approves scope changes, attests to outcomes. Typically C-level or VP-level.

**Program Owner** — operational lead. Drives day-to-day execution. Typically Director or Senior Manager level.

**Maestro** (note: Program-scoped meaning) — AbarVa-experienced contributor who runs the Program's agent interactions, authors artifacts, shepherds phases. In Program context, "Maestro" has a specific meaning distinct from the platform-level Maestro role.

**Contributor** — active participant but not leading. Attends meetings, reviews artifacts, provides input.

**Viewer** — read-only access to Program state and artifacts. Common for stakeholders who need awareness without active involvement.

**Advisor** — external or non-executive input provider. Sometimes has time-bounded participation.

### How platform role maps to Program role

A user who is platform-level Maestro might be Program Sponsor, Program Owner, Program Maestro, Contributor, Viewer, or Advisor on a specific Program.

The platform role (Admin/Maestro) is about platform-level permissions. The Program role is about Program-level responsibilities and access.

**Example:** Sarah Chen is a platform-level Maestro (she can participate in Programs). On the Contact Center AI Program, she is the Program Maestro (she drives execution). On the AI Supplier Consolidation Program, she is a Contributor (she provides vendor expertise but doesn't lead). On the Executive Compensation Strategy Program, she is not a participant at all (no role).

### Program access derivation

Access to Program artifacts is derived from Program role:

- **Sponsor** — full read/write, gate authority, attestation authority
- **Program Owner** — full read/write, operational authority
- **Program Maestro** — full read/write, agent-orchestration authority
- **Contributor** — read/write on specific artifacts, read-only on others
- **Viewer** — read-only
- **Advisor** — read/write on feedback/comment artifacts, read-only on core

Access to Program-scoped datasets is derived from Program role plus explicit grants:

- Sponsor, Owner, Program Maestro typically have automatic access to Program-scoped datasets
- Contributors may or may not have access depending on data sensitivity
- Viewers and Advisors require explicit grants for sensitive Program data

Admins can override this derivation for specific cases.

## B.7 Revocation patterns

Revoking access is as critical as granting it. Three revocation patterns:

### Explicit revocation

Admin selects a user's grant and revokes it. Effective immediately. Reason captured in audit log. User is notified.

### Automatic expiration

Time-bound and event-bound grants expire automatically when their condition is met. No admin action required. Audit log records the expiration.

### Cascade revocation

Some events cause multiple grants to revoke in cascade:

- **User deactivation** revokes all grants held by that user
- **Program closure** revokes all Program-scoped grants for that Program
- **Program archive/delete** revokes all Program-scoped grants
- **Organization dissolution** revokes all organization-scoped grants
- **Dataset archive** makes all grants moot (data no longer accessible)

Cascade revocations are handled transactionally. Either all affected grants are revoked or none are, to prevent partial-state access leaks.

### Emergency revocation

In security incidents (suspected compromise, unauthorized access attempt, data breach scenario), admin can trigger emergency revocation:

- Revokes all active grants for a user
- Invalidates active sessions
- Triggers alert to client security team
- Initiates post-incident review workflow

Emergency revocation is intentionally abrupt. No graceful degradation. If we're wrong and it was a false alarm, the inconvenience of re-granting is acceptable.

## B.8 Decisions locked in Track B

| # | Decision | Rationale |
|---|---|---|
| B.L1 | Three-layer access: tenant isolation, role rights, grants | Defense in depth |
| B.L2 | Dataset access grants are tuples: (user, dataset, scope, duration, purpose) | Captures the full access intent |
| B.L3 | Four scope levels: client-wide, organization, program, session | Matches real access patterns |
| B.L4 | Four duration types: standing, time-bound, event-bound, session-bound | Access doesn't outlive its purpose |
| B.L5 | Every grant has stated purpose, structured + free-text | Enables audit analytics and policy enforcement |
| B.L6 | Access check runs on every data access, fails closed | Never implicit access |
| B.L7 | Agents handle access denial gracefully — acknowledge, continue, or route to admin | Access model is absolute |
| B.L8 | Cross-client isolation is physical (separate tenants) plus UX (explicit switching) plus agent (inherited from deployment) | Triple-layered isolation |
| B.L9 | Genome and cohort data exception is architecturally safe (aggregation + cohort minimums) | Cross-client value without cross-client leak |
| B.L10 | Program-scoped roles (Sponsor, Owner, Program Maestro, Contributor, Viewer, Advisor) distinct from platform role | Clean separation of concerns |
| B.L11 | Three revocation patterns: explicit, automatic, cascade + emergency | Covers all realistic scenarios |

---

## Track B · Checkpoint

**STATUS · Track B of 5 complete · ~1,150 lines total**

Role and permission model specified. Two-tier platform role with rich per-dataset grants. Scope × duration × purpose composition. Query-time enforcement. Cross-client isolation. Program-scoped role model. Revocation patterns.

Ready for Track C (Dataset Lifecycle).

---

# TRACK C · Dataset Lifecycle

## C.1 Why dataset lifecycle matters

Data enters AbarVa, gets classified, gets used, gets updated, decays, eventually archives or is deleted. Each transition carries risk: classified too loosely and sensitive data leaks into Programs that shouldn't see it; classified too strictly and legitimate Program work gets blocked; retained too long and compliance exposure grows; archived too eagerly and historical context disappears.

Track C specifies how AbarVa manages this lifecycle with enough rigor that:
- A client admin can look at the dataset catalog and understand what exists
- An auditor can trace any piece of data back to its origin, classification, and access history
- Agents can reason about data without violating sensitivity boundaries
- Clients trust AbarVa with sensitive data because they can see how it's handled

## C.2 Dataset as an entity

A **dataset** in AbarVa is a bounded collection of related data with a specific purpose, owner, and lifecycle. Examples:

- "Apex 2026 Vendor Contracts" — a specific set of PDFs representing the client's current vendor agreements
- "Apex Q3 2026 Compensation Data" — HR compensation records for a specific period
- "Apex Telemetry: Contact Center Agent Actions" — ongoing telemetry feed
- "Apex Org Chart" — organizational structure data
- "Apex Business Strategy 2026" — the strategic plan document
- "Industry Benchmark: Retail AI Adoption" — an AbarVa-curated benchmark dataset

A dataset is not "every document ever uploaded." It's a defined collection. Datasets are the unit of classification, access control, retention, and audit.

### Dataset composition

A dataset contains:

- **Core records** — the actual data (rows in a table, documents in a collection, events in a stream)
- **Metadata** — who created it, when, source, format, structure
- **Classification** — sensitivity tier, source class, retention policy
- **Provenance** — where the records came from, what transformations happened
- **Access grants** — who has access under what conditions
- **Audit trail** — history of all access, modifications, exports

Every dataset has all six. A dataset without provenance is a dataset we can't trust. A dataset without classification is a dataset we can't safely use. A dataset without audit trail is a dataset we can't defend in compliance review.

## C.3 Source class

Every dataset has a source class that determines its handling rules. Three source classes:

### Client-private

Data that belongs to the client exclusively. Never leaves the client tenant, never contributes to Genome, never appears in cohort benchmarks.

Examples:
- Client's compensation data
- Client's M&A documents
- Client's board materials
- Client's proprietary methodologies
- Client's customer data
- Client's internal communications

**Handling rules:**
- Stored only in client tenant
- Access controlled per Track B
- Cannot be used as training data for any model
- Cannot be analyzed for pattern contribution
- Export requires admin approval
- Retained per client policy

### Cohort-contributory

Data from which anonymized, aggregated patterns can be derived for Genome or cohort benchmarks. The raw data remains client-private but the *patterns* contribute.

Examples:
- Client's AI use case outcomes (can contribute to "Contact Center AI Program typically takes 9 months" pattern)
- Client's vendor spend profile (can contribute to "retail peers median AI spend $X" benchmark)
- Client's adoption metrics (can contribute to "top-20 retailers hit 67% median adoption" pattern)
- Client's program execution data (can contribute to "most Programs launch 2 weeks later than plan" pattern)

**Handling rules:**
- Raw data remains client-private
- Admin must explicitly consent to cohort contribution per dataset
- Contribution is always anonymized (client name never surfaces)
- Contribution follows cohort-size minimums (never contribute if cohort has fewer than 3 clients)
- Client can revoke contribution; downstream aggregates recompute to remove contribution
- Client can see what patterns their data has contributed to

### Platform-public

Data AbarVa maintains centrally that all clients read from. Never client-specific.

Examples:
- Industry taxonomy (retail sub-verticals, FS product lines, healthcare specialties)
- Methodology frameworks (consulting methodologies AbarVa has codified)
- Vendor catalog (public information about AI vendors: Anthropic, OpenAI, Databricks, etc.)
- Regulatory references (public regulation summaries)
- Public benchmark data (published industry research)

**Handling rules:**
- Stored centrally in AbarVa platform
- Read-only from client tenants
- AbarVa updates; clients cannot modify
- No access control (all Maestros can read)
- Provenance includes source citations for any external data

### Why three classes matter

The class determines where the data lives, who can see it, what can be learned from it, and how it's governed. A CISO reviewing AbarVa needs to understand: "what happens if I upload our compensation strategy — where does it go, who sees it, does it contribute to some other customer's analysis?"

AbarVa's answer, for client-private: "It stays in your isolated tenant. Only users you grant access can see it. It doesn't contribute to any cross-client pattern. When you delete it, it's gone."

For cohort-contributory: "Your raw data stays in your tenant. You can explicitly consent to pattern contribution. Patterns are anonymized and only shared when the cohort has sufficient size to prevent de-anonymization. You can audit what we've learned and revoke contribution."

For platform-public: "This is data we maintain. It's the same for all customers. You're reading, not contributing."

This clarity is what wins or loses enterprise deals.

## C.4 Sensitivity tier

Orthogonal to source class is sensitivity tier — how carefully the data itself must be handled.

Four sensitivity tiers:

### Public

Data that is safe to share externally and requires no special handling.

Examples: client's public press releases, client's published financial reports, industry research AbarVa has citing rights to.

### Internal

Data that is safe within the client but should not leave the client's boundary. Default tier for most business data.

Examples: org charts, internal product roadmaps, non-sensitive operational data, project status reports.

### Restricted

Data that requires specific authorization to access within the client. Limited distribution even within the client's organization.

Examples: compensation data (limited to HR + executives), M&A data (limited to deal team), legal hold materials (limited to legal + affected parties), certain financial details (limited to finance + executives).

### Confidential

Data that requires explicit grant to any individual, cannot be exported without elevated approval, and has enhanced audit.

Examples: board deliberations, active legal proceedings, acquisition targets in early discussion, whistleblower investigations, data subject to regulatory confidentiality.

### Tier determines handling

| Dimension | Public | Internal | Restricted | Confidential |
|---|---|---|---|---|
| Default access | All Maestros in client | All Maestros in client | Explicit grant required | Explicit grant required |
| Export | Standard | Admin-aware | Admin approval | Elevated approval + justification |
| Audit | Standard | Standard | Enhanced | Enhanced + real-time alerting |
| Agent reasoning | Standard | Standard | Restricted — agent acknowledges sensitivity | Restricted — agent may refuse certain query types |
| Retention default | Per client policy | Per client policy | Longer (audit requirement) | Longest (legal requirement) |

### Relationship between source class and sensitivity

Source class and sensitivity are independent dimensions. A dataset has both.

Matrix of realistic combinations:

| Source class × Sensitivity | Example |
|---|---|
| Client-private × Public | Client's published press releases (technically client-owned, but public content) |
| Client-private × Internal | Org chart |
| Client-private × Restricted | Compensation data |
| Client-private × Confidential | M&A target list |
| Cohort-contributory × Internal | Adoption metrics |
| Cohort-contributory × Restricted | Executive comp ranges (can contribute to benchmarks in anonymized ranges) |
| Cohort-contributory × Confidential | Rare — most Confidential data is not suitable for cohort contribution |
| Platform-public × Public | Industry taxonomy |
| Platform-public × Internal | AbarVa methodology (not confidential but not broadly distributed outside clients) |

## C.5 Classification workflow

Per Anand's specification, classification is collaborative between client admin and Maestro.

### Trigger

Classification happens when:
- Admin uploads a new dataset (most common)
- Maestro uploads a new dataset (admin reviews classification within 48 hours)
- Dataset arrives via automated integration (auto-classified tentatively, admin reviews)
- Dataset's context changes significantly (e.g., regulatory environment shifts)

### Workflow

**Step 1 — Proposed classification**

Whoever uploads the data proposes an initial classification:
- Source class (client-private, cohort-contributory, platform-public)
- Sensitivity tier (public, internal, restricted, confidential)
- Retention policy (how long to retain)
- Export policy (standard, admin-approved, elevated-approved)

If the upload is via automated integration, Steward agent proposes classification based on content analysis (PII detection, financial figures, named individuals, document structure). Agent's confidence is displayed.

**Step 2 — Admin confirmation**

Admin reviews proposed classification. Three outcomes:
- **Accept** — classification is confirmed
- **Modify** — admin adjusts sensitivity tier, source class, or policy
- **Dispute resolution** — if Maestro and admin disagree, admin's decision is final but a note captures the disagreement

**Step 3 — Classification lock**

Once admin confirms, classification is locked. Changes require explicit admin action with audit trail. Agents reference the locked classification for access decisions.

**Step 4 — Periodic review**

Sensitive datasets (Restricted, Confidential) are reviewed periodically (default quarterly, configurable). Admin confirms classification is still appropriate or updates.

### Disagreement handling

If Maestro and admin disagree on classification:

- Maestro proposes (e.g., "This is Internal")
- Admin reviews (e.g., "This should be Restricted")
- Admin's decision prevails
- Maestro's original proposal is recorded in audit
- Maestro can add written justification for future reference
- If Maestro believes admin is wrong, they can escalate (e.g., to CISO if applicable) via external channels — not an in-product workflow

Disagreement isn't blocked — it's resolved with admin authority and audit transparency.

### Classification metadata

Every dataset tracks:

```sql
CREATE TABLE dataset_classifications (
  id UUID PRIMARY KEY,
  dataset_id UUID NOT NULL REFERENCES datasets(id),
  source_class TEXT NOT NULL,
  sensitivity_tier TEXT NOT NULL,
  retention_days INTEGER,           -- null = indefinite, per client policy
  export_policy TEXT NOT NULL,      -- 'standard' | 'admin-approved' | 'elevated-approved'
  
  -- Provenance of classification
  proposed_by UUID REFERENCES users(id),
  proposed_at TIMESTAMPTZ,
  proposed_classification JSONB,    -- snapshot of original proposal
  
  -- Confirmation
  confirmed_by UUID NOT NULL REFERENCES users(id),
  confirmed_at TIMESTAMPTZ NOT NULL,
  
  -- Change history (supersession rather than overwrite)
  superseded_by UUID REFERENCES dataset_classifications(id),
  
  -- Next review
  next_review_due DATE,
  review_frequency_months INTEGER,
  
  -- Notes
  classification_notes TEXT
);
```

Classifications are versioned. When classification changes, a new row is written and linked to the superseded one. Historical classifications remain for audit.

## C.6 Dataset provenance

Provenance answers "where did this data come from and what happened to it on the way?"

Per the Data Layer Future State spec, provenance is foundational to agent trustworthiness. If an agent cites a number, the provenance trail must support traceability from the cited number back to its origin.

### Provenance dimensions

**Origin** — where the data entered AbarVa
- Automated pipeline (Microsoft Graph API, Snowflake query, etc.)
- Manual upload (user uploaded a file)
- Authored (Maestro or admin created content directly)
- Platform-imported (AbarVa imported from external source)
- Derived (computed from other datasets)

**Ingestion metadata**
- Timestamp of ingestion
- User who initiated ingestion (if manual)
- Source system identifier (for automated)
- Source file hash (for uploads, enables integrity check)
- Transformation log (what processing happened between raw source and stored form)

**Chain of custody**
- Every read event logged
- Every modification logged (who, when, what changed)
- Every export logged
- Every agent retrieval logged (which queries touched this data)

### Provenance data model

```sql
CREATE TABLE dataset_provenance (
  id UUID PRIMARY KEY,
  dataset_id UUID NOT NULL REFERENCES datasets(id),
  origin_type TEXT NOT NULL,        -- see list above
  ingested_at TIMESTAMPTZ NOT NULL,
  ingested_by UUID REFERENCES users(id),  -- null for automated
  source_system_id TEXT,            -- for automated
  source_identifier TEXT,           -- file hash, query ID, API endpoint
  transformation_log JSONB,         -- array of transformation events
  integrity_hash TEXT               -- hash of stored data for integrity verification
);

CREATE TABLE dataset_lineage (
  id UUID PRIMARY KEY,
  derived_dataset_id UUID NOT NULL REFERENCES datasets(id),
  source_dataset_id UUID NOT NULL REFERENCES datasets(id),
  derivation_type TEXT NOT NULL,    -- 'query' | 'transformation' | 'aggregation' | 'summarization'
  derivation_logic TEXT,            -- description or SQL of derivation
  created_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES users(id)
);
```

Datasets derived from other datasets carry lineage. When an agent produces an analysis from Dataset A, the resulting artifact has lineage back to A. Users can always trace "where did this number come from" through the lineage chain.

## C.7 Dataset retention and archival

Data doesn't live forever.

### Retention policy

Each dataset has a retention policy defined at classification time:

- **Indefinite** — retained as long as the client is active
- **Fixed duration** — retained for N days/months/years from creation
- **Event-bound** — retained until an event (e.g., "until Program X closes + 7 years")
- **Regulatory** — retained per specific regulatory requirement (e.g., "SOX: 7 years from transaction date")

Default retention by sensitivity:
- Public: 3 years (business records default)
- Internal: 7 years (business records + audit window)
- Restricted: 7 years (audit window)
- Confidential: 7-10 years depending on context (legal and audit)

Clients can override defaults per their legal and compliance requirements.

### Archival

When a dataset reaches end-of-retention, it's archived — not deleted. Archival:

- Moves data from hot storage to cold storage
- Maintains full record for compliance
- Access requires admin approval and documented purpose
- Continues to be auditable
- Uses longer-term storage costs appropriately

### Deletion

True deletion is rare and requires explicit process:

- Admin initiates with documented legal or compliance justification
- System confirms no active legal hold, regulatory requirement, or ongoing investigation prevents deletion
- Deletion cascades to derived datasets (or admin explicitly chooses to retain derivatives)
- Deletion event is itself logged (we audit what we deleted)
- Physical data removed from primary storage; backup copies may persist per backup retention policy

Some datasets cannot be deleted:
- Data under active legal hold
- Data subject to regulatory retention (SOX, GDPR retention, etc.) within the retention window
- Data whose deletion would compromise audit integrity
- Data referenced by active compliance attestations

### Client exit

When a client leaves AbarVa entirely:

- Client can export all their data in standard formats
- After export confirmation, client tenant is decommissioned per client contract
- Physical data is wiped from storage (primary and backup) per contractual commitments
- Retention continues only for contractually or legally mandated periods (e.g., if contract requires AbarVa to retain certain records for 3 years post-termination)
- Platform-public and cohort-aggregate data continues to exist (the client's anonymized contributions to Genome don't disappear with the client's exit — but client can revoke contribution before exit)

## C.8 Org structure as a special dataset

Per Anand's explicit callout: "one of the data loads is the org structure, hierarchy, roles, who is who."

The org structure dataset is treated as a first-class dataset with special handling because it's used by every agent, across every Program, and its quality determines agent effectiveness.

### What's in it

The org structure dataset for a client contains:

- **People records** — every known person in the org with their role, title, reporting line
- **Reporting relationships** — who reports to whom
- **Functional groupings** — teams, departments, business units
- **Role history** — role changes over time (promotions, departures, reorgs)
- **External relationships** — known external advisors, board members, key consultants

Much of this overlaps with the user profile data from Track A (users are a subset of people in the org structure), but the org structure is broader — it includes people who aren't AbarVa users.

### How it's captured

Three ingestion patterns:

**Pattern 1 · HRIS integration**

Client connects Workday, BambooHR, SuccessFactors, or equivalent. AbarVa pulls structured data daily:
- Employee roster
- Titles and roles
- Reporting relationships
- Departments and locations

This is the cleanest path when available.

**Pattern 2 · Manual upload**

Admin uploads org structure as CSV or via structured authoring surface. Updated manually when significant changes occur.

**Pattern 3 · Hybrid**

Core structure from HRIS (employees, titles, reporting). Admin enriches with qualitative data (strategic priorities, specializations, recent role changes not yet in HRIS, VIP observations).

### How agents use it

Every agent consults the org structure for context:

- **Nexus** uses it to identify stakeholders for a Program ("Who's the CIO?"), draft outreach ("What does Priya respond to?"), and understand reporting dynamics ("Jake reports to Priya, so aligning Jake matters but Priya has sign-off authority")
- **Sentinel** uses it to frame research for specific roles ("A CTO asking this would focus on X; a VP Engineering would focus on Y")
- **Atlas** uses it to summarize portfolio dynamics ("Your CDO champions digital programs; your CFO is risk-cautious")
- **Steward** uses it to help admins reason about access grants ("Sarah reports to the CFO; does she need compensation data access by default?")

### Permission boundaries on org data

The org structure is Internal-sensitivity by default but has specific fields that become Restricted:

- Compensation data — Restricted
- Performance review data — Restricted  
- Departure/termination reasons — Restricted
- Medical accommodation data — Restricted or Confidential
- Investigation or disciplinary records — Confidential

Agents reason over Internal-tier org data by default but do not surface Restricted fields unless the user has explicit grants.

**Example:** Nexus can say "Jake Chen is Head of Contact Operations, reports to CIO Priya Sethi, has been in role 18 months." Nexus does not say "Jake Chen's base salary is $X" unless the user specifically has access to compensation data.

This boundary is enforced at query time through access control.

### Org data freshness

Stale org data produces wrong agent output. Stale data examples:

- Agent suggests outreach to person who left 6 months ago
- Agent assumes reporting relationship that's been restructured
- Agent cites expertise of person who's transitioned to different role

AbarVa tracks freshness per data element and surfaces warnings:

- HRIS-synced data: Fresh if synced within last 7 days
- Manually authored data: Reviewed by admin within last 90 days
- Agent-surfaced staleness: "Note — I'm working from org data last updated 4 months ago. Some reporting relationships may have changed."

## C.9 Dataset catalog (admin visibility)

Admins need to answer questions like:
- What datasets exist in our tenant?
- Which are active vs archived?
- Who has access to the compensation data?
- When was the vendor contracts dataset last refreshed?
- What datasets are due for classification review?
- Which datasets have had unusual access patterns lately?

The dataset catalog surface (specified in Document 2 · Admin Surface Design Spec) answers these. It provides:

- Filterable list of all datasets with source class, sensitivity, owner, last update
- Per-dataset detail with full classification, provenance, access list, audit summary
- Review queue (datasets pending classification or periodic review)
- Search by name, content (for unstructured), or metadata
- Bulk operations (archive, reclassify, review)

Steward agent supports dataset catalog operations:
- "Show me all compensation datasets"
- "Which datasets haven't been accessed in 6 months?"
- "Who's accessed the M&A folder in the last week?"
- "What datasets are due for classification review this quarter?"

## C.10 Decisions locked in Track C

| # | Decision | Rationale |
|---|---|---|
| C.L1 | Dataset is the unit of classification, access, retention, and audit | Clean primitive |
| C.L2 | Every dataset has source class (private/cohort/public) × sensitivity (public/internal/restricted/confidential) | Two orthogonal dimensions |
| C.L3 | Classification is collaborative: proposed by uploader, confirmed by admin | Shared responsibility, admin authority |
| C.L4 | Classifications are versioned with full history | Audit trail for access decisions |
| C.L5 | Provenance is captured for every dataset: origin, ingestion metadata, chain of custody | Traceability from number to source |
| C.L6 | Derived datasets carry lineage to source datasets | Enables "where did this come from" queries |
| C.L7 | Retention policy default by sensitivity, client-overridable | Sensible defaults, flexible for compliance |
| C.L8 | Archival (not deletion) when retention expires | Preserves audit integrity |
| C.L9 | Deletion is rare, requires explicit process with hold checks | Prevents accidental loss |
| C.L10 | Org structure dataset treated specially — first-class, multi-agent consumer | Foundational for agent effectiveness |
| C.L11 | Org data permission boundaries respected at field level (compensation, reviews, etc. Restricted) | Prevent inadvertent sensitive disclosure |
| C.L12 | Dataset catalog surface answers admin's "what exists, who has access" questions | Admin visibility |

---

## Track C · Checkpoint

**STATUS · Track C of 5 complete · ~1,600 lines total**

Dataset lifecycle specified. Source class × sensitivity matrix. Collaborative classification workflow. Provenance and lineage. Retention and archival. Org structure as special dataset. Catalog visibility. Ready for Track D (Governance and Audit).

---

# TRACK D · Governance and Audit

## D.1 Why governance deserves a dedicated track

Tracks A, B, and C specified the primitives: who users are, what they can access, how data is classified. Track D specifies how we *prove* those primitives are operating correctly. That proof is the difference between "we have security controls" and "we can demonstrate to an auditor, a regulator, or a client's CISO that security controls operated as designed over a specified period."

Governance is the operational discipline that makes access control defensible. Audit is the evidence trail that makes governance provable. Together they answer the questions enterprise buyers actually ask:

- "If your most privileged admin went rogue, what would we see?"
- "Can you prove no one outside my Program team has queried our M&A data?"
- "When your SOC 2 auditor looks at Q2 2026, what will they find?"
- "If we discover an incident six months from now, can we reconstruct what happened?"

A platform that can't answer these questions crisply is a platform that doesn't close enterprise deals. Track D specifies the answers.

This track also scaffolds AbarVa's SOC 2 Type II program. Not in the sense of a complete audit control matrix — that's the auditor's work product — but in the sense of ensuring AbarVa's architecture produces the evidence SOC 2 requires. Building audit-ready infrastructure now is dramatically cheaper than retrofitting for audit later.

## D.2 What gets logged

The foundational principle: **if it touches identity, access, or data, it's logged.**

Not sampled. Not summarized. Every event captured, structured, and retained.

### Identity events

- User created (who, by whom, role assigned, profile snapshot)
- User profile updated (who, by whom, field-level before/after)
- User role changed (who, from what role, to what role, by whom, justification)
- User activated / deactivated / suspended / reactivated
- User logged in (success or failure, with IP, user agent, SSO provider)
- User logged out (explicit or timeout)
- Session created / invalidated
- MFA challenge (success or failure)
- Password reset initiated / completed (for fallback auth)
- Admin transition ceremony (outgoing admin, incoming admin, timestamp)
- Emergency admin recovery (initiated, verified, completed)

### Access events

- Access grant created (user, dataset, scope, duration, purpose, granted by)
- Access grant modified (before/after state, reason)
- Access grant revoked (explicit, automatic, cascade, emergency)
- Access request submitted (user, dataset, requested scope, justification)
- Access request approved / denied / modified
- Access check performed at query time (user, dataset, context, decision) — sampled for high-volume queries, fully logged for sensitive data
- Access denial (user attempted to access something they lacked grant for — always logged)
- Emergency revocation (who initiated, scope of revocation, affected users)

### Dataset events

- Dataset created (name, source, uploader, initial classification proposal)
- Dataset classified (source class, sensitivity tier, retention, by whom)
- Dataset classification changed (before/after, by whom, reason)
- Dataset content updated (refresh, manual edit, integration sync)
- Dataset accessed (user, query type, timestamp) — for Restricted and Confidential always; sampled for Internal
- Dataset exported (user, destination, format, timestamp, admin approval reference for sensitive exports)
- Dataset archived / restored / deleted
- Classification review performed / deferred
- Provenance anomaly detected (integrity hash mismatch, unexpected transformation)

### Agent events

- Agent query initiated (user, agent, query, context — Program/Intelligence thread/Tower view)
- Agent accessed dataset (agent, dataset, user on whose behalf, access check result)
- Agent produced artifact (type, content summary, datasets referenced)
- Agent refused action (reason — policy, missing access, safety filter)
- Agent escalated to human (reason, escalation destination)
- Prompt injection or manipulation attempt detected

### Governance events

- Retention policy changed (dataset, old policy, new policy, by whom)
- Export policy changed
- Audit log query (who queried audit log, what query, what results returned)
- Compliance attestation (policy acknowledged by user, date, version)
- Incident declared (severity, scope, initial findings)
- Incident resolved (resolution, lessons learned)

### Meta-audit

We audit the audit system itself:

- Audit log configuration changes
- Audit log retention changes
- Audit log access by admins (who read audit logs, what filters)
- Audit log export events
- Audit log integrity checks (periodic verification that logs haven't been tampered with)

The meta-audit is critical. A SOC 2 audit asks: "How do you ensure audit integrity?" The answer is: "Access to audit logs is itself logged, audit retention is immutable except by a narrow break-glass process that's itself logged, and we perform periodic integrity checks."

## D.3 Audit event model

### Canonical event schema

```sql
CREATE TABLE audit_events (
  id UUID PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id),
  
  -- When and where
  occurred_at TIMESTAMPTZ NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,  -- when the system recorded the event
  source_component TEXT NOT NULL,    -- which subsystem generated it
  source_instance_id TEXT,           -- specific server/container
  
  -- Event identity
  event_type TEXT NOT NULL,          -- e.g., 'user.role_changed', 'dataset.accessed'
  event_category TEXT NOT NULL,      -- 'identity' | 'access' | 'dataset' | 'agent' | 'governance' | 'meta'
  severity TEXT NOT NULL,            -- 'info' | 'notice' | 'warning' | 'critical'
  
  -- Actors
  actor_user_id UUID REFERENCES users(id),
  actor_session_id TEXT,
  actor_ip_address INET,
  actor_user_agent TEXT,
  on_behalf_of_user_id UUID REFERENCES users(id),  -- for agent actions
  
  -- Target
  target_type TEXT,                  -- 'user' | 'dataset' | 'program' | 'access_grant' | etc.
  target_id UUID,
  target_context JSONB,              -- target-specific details
  
  -- Event payload
  payload JSONB NOT NULL,            -- full structured event data
  before_state JSONB,                -- state before change (for modification events)
  after_state JSONB,                 -- state after change
  
  -- Traceability
  correlation_id TEXT,               -- groups related events (e.g., a single user action causing cascade)
  parent_event_id UUID REFERENCES audit_events(id),
  
  -- Integrity
  event_hash TEXT NOT NULL,          -- cryptographic hash of event contents
  previous_event_hash TEXT           -- hash chain for tamper detection
);

CREATE INDEX ON audit_events (client_id, occurred_at DESC);
CREATE INDEX ON audit_events (client_id, actor_user_id, occurred_at DESC);
CREATE INDEX ON audit_events (client_id, target_type, target_id, occurred_at DESC);
CREATE INDEX ON audit_events (client_id, event_category, severity, occurred_at DESC);
CREATE INDEX ON audit_events (correlation_id);
```

### Design properties

**Append-only.** Audit events are never updated or deleted by normal application code. The database enforces this via triggers that reject UPDATE and DELETE operations on the audit_events table. Only a documented break-glass process (requiring multiple sign-offs) can remove audit data, and that removal is itself logged.

**Hash-chained.** Each event's hash incorporates the previous event's hash. Tampering with any historical event invalidates every subsequent hash. Periodic integrity verification walks the chain and alerts on breaks.

**Structured.** Payload is JSONB with strictly defined schemas per event type. This enables analytics queries ("how many role-change events in Q3 touched admin roles?") rather than free-text log parsing.

**Context-rich.** Every event carries actor identity, target identity, correlation ID for related events, and before/after state for modifications. Forensic reconstruction of any incident is possible from audit data alone.

**Client-scoped.** Every event has client_id. Cross-client audit queries are impossible (which is correct — Apex's admin cannot see Meridian's audit events, and vice versa).

### Event volume

Typical enterprise client generates audit events at these rates:

| Event type | Typical daily volume |
|---|---|
| Identity (logins, sessions) | 500 - 5,000 |
| Access grants (creation/modification) | 10 - 100 |
| Access checks (at query time) | 10,000 - 100,000 (sampled for non-sensitive) |
| Dataset events | 100 - 1,000 |
| Agent events | 1,000 - 10,000 |
| Governance | 10 - 100 |

Sampling rules keep volumes manageable without losing fidelity:

- All access checks on Confidential datasets: full logging
- Access checks on Restricted: full logging
- Access checks on Internal: 1 in 10 sampled, plus all denials, plus all unusual patterns
- Access checks on Public: 1 in 100 sampled

The sampling config is itself a governance decision logged in meta-audit.

## D.4 Audit retention

### Retention by event category

- **Identity events:** 7 years (covers SOC 2 + most regulatory windows)
- **Access events:** 7 years
- **Dataset events:** 7 years, or longer if dataset itself has longer retention
- **Agent events:** 3 years for routine, 7 years for sensitive data interactions
- **Governance events:** 10 years (policy changes and compliance history)
- **Meta-audit:** 10 years

Client-specific regulatory requirements may extend retention. Financial services clients often require 10-year retention across the board. Healthcare clients may have HIPAA-related requirements (though AbarVa does not primarily serve PHI — see positioning guardrails).

### Retention storage

- **0-90 days:** Hot storage (indexed, queryable in seconds)
- **90 days - 2 years:** Warm storage (indexed, queryable in minutes)
- **2+ years:** Cold archival (retrieval takes hours, via admin request)

This tiering keeps primary storage costs manageable while maintaining legal-grade retention.

### Retention extensions

Audit data can be placed on legal hold, which suspends normal retention aging:

- Admin (with appropriate authority) places dataset or audit scope on legal hold
- Hold is itself logged
- While on hold, no data ages out of retention
- Hold release requires documented justification

## D.5 Audit trail surfaceability

Audit data has value only if it can be accessed when needed. Track D specifies three access patterns:

### Pattern 1 · Admin in-product audit queries

Admins access audit data through the Platform surface (Document 2 · Admin Surface Design Spec details the UI). Capabilities:

- Filter by actor, target, event type, time range, severity
- Drill into correlation groups (see all events from a single user action)
- Export audit data (subject to approval for bulk exports)
- Saved audit queries for recurring reviews
- Alerts on audit patterns (e.g., "notify me when anyone accesses compensation data after hours")

Steward agent supports natural-language audit queries:

- "Show me all access denials in the last 7 days"
- "Who modified the vendor contracts dataset this month?"
- "Has anyone exported compensation data?"
- "Summarize admin activity this quarter"

Steward translates natural-language queries to structured audit queries, executes them, and presents results. For sensitive audit queries (accessing raw audit of another user's actions), Steward confirms intent and logs the audit query.

### Pattern 2 · Auditor access

External auditors (SOC 2, regulatory, client-requested) need access to audit data for specific time windows and scopes.

AbarVa provides auditor access via:

- **Scoped audit views** — auditor is granted read-only access to audit data within a defined scope (time range, event categories, client scope)
- **Auditor-specific UI** — simplified interface optimized for audit workflows
- **Audit export packages** — structured export of audit data for offline analysis
- **Witness mode** — auditor can observe live audit queries being run by admin (for training or verification)

Auditor access is time-bounded and itself logged.

### Pattern 3 · Incident response access

During a security incident, rapid audit access is critical.

AbarVa's incident response audit access:

- **Incident declaration** triggers elevated audit capabilities for designated responders
- **Incident-scoped queries** pre-defined for common scenarios ("unauthorized access detected," "suspected data exfiltration," "account compromise")
- **Real-time audit streaming** for active incidents
- **Post-incident audit export** captures all relevant audit data for forensic analysis

Incident response audit access is its own audit trail — we log who ran what queries during an incident.

## D.6 SOC 2 Type II scaffolding

SOC 2 Type II certifies that service organizations maintain controls over a period (typically 6-12 months). Unlike Type I (point-in-time), Type II requires evidence of control operation over time.

AbarVa architecting for SOC 2 Type II means:

### Coverage of five trust service criteria

SOC 2 defines five trust service criteria (TSC). AbarVa must cover the applicable ones:

- **Security** (always required) — controls protecting against unauthorized access
- **Availability** — controls maintaining service uptime
- **Processing Integrity** — controls ensuring data is processed completely, accurately, timely
- **Confidentiality** — controls protecting confidential information
- **Privacy** — controls for personal information (applies if AbarVa processes personal data)

AbarVa pursues Security + Confidentiality for initial audit. Availability and Processing Integrity are added in subsequent audits as the product matures.

### Control categories SOC 2 expects

For each TSC, specific control categories must be addressed. The architecture Track D provides evidence for:

**Access controls**
- Evidence: Role model (Track B), access grants (Track B), query-time enforcement (Track B), audit of access events (this track)

**Change management**
- Evidence: Versioned classifications (Track C), versioned policies, audit of all changes

**System operations**
- Evidence: Audit of all system events, integrity verification, incident response process (below)

**Risk assessment**
- Evidence: Periodic review cycles (Track C), classification review, access review

**Vendor management**
- Evidence: Integration configuration (Track A), third-party service inventory, data handling agreements

**Monitoring**
- Evidence: Audit log patterns, alert rules, incident detection

The detailed mapping of AbarVa controls to SOC 2 control categories is the auditor's work product, written in collaboration with AbarVa during audit preparation. Track D's job is to ensure the infrastructure *produces the evidence* the auditor needs.

### Continuous compliance monitoring

SOC 2 Type II requires that controls operate continuously. AbarVa monitors:

- **Access review cadence** — are periodic access reviews being performed on schedule?
- **Classification review cadence** — are datasets being reviewed per their frequency?
- **Audit integrity** — are hash chains intact? Any unexplained gaps?
- **Policy attestation** — are users completing required attestations?
- **Incident response drills** — are tabletop exercises being conducted?

These are tracked in a compliance dashboard (Document 2) visible to admins and AbarVa compliance personnel.

## D.7 Policy enforcement

Policies are the statements of "how AbarVa handles things." Examples:

- "All Admin users must enable MFA"
- "Confidential datasets require elevated approval for export"
- "Access grants for research purpose expire within 90 days"
- "Dataset classifications must be reviewed at least quarterly"
- "Agents cannot export bulk data without admin approval"

Policies are enforced through architecture (not just documentation). Track D specifies the enforcement points.

### Policy enforcement at configuration time

Policies manifest as configuration constraints:

- MFA enforcement: configuration check when a user is created as Admin
- Export policy by sensitivity: configuration cascades from classification to dataset-level defaults
- Grant expiration by purpose: configuration cascades from grant purpose to default duration
- Review cadence: configuration generates review-due reminders

When a policy is changed, affected configurations are re-evaluated.

### Policy enforcement at action time

Policies manifest as runtime checks:

- Export of Confidential dataset: check for elevated approval before proceeding
- Grant creation with unusual scope: check for policy consistency, may require additional approval
- Admin action outside normal pattern: elevated logging, potentially alert

Runtime enforcement fails closed. If a policy check cannot be executed (e.g., policy service unavailable), the action is blocked until the check succeeds.

### Policy change management

Policies themselves are versioned and audit-logged:

- Current policy version is referenced by all enforcement points
- Policy changes require explicit admin action with documented justification
- Policy change triggers re-evaluation of affected state (e.g., changing MFA policy triggers evaluation of all current Admin users)
- Historical policy versions preserved for audit reconstruction ("what was the export policy on date X?")

## D.8 Incident response

### Incident categories

AbarVa recognizes these incident categories:

- **Unauthorized access** — someone accessed something they shouldn't have
- **Data exfiltration** — data left AbarVa inappropriately
- **Account compromise** — a user account was used by someone other than the legitimate user
- **Integrity violation** — data was modified inappropriately
- **Availability disruption** — service unavailable or degraded
- **Policy violation** — documented policy was violated (may or may not be malicious)
- **Vulnerability disclosure** — security flaw identified requiring patch

### Detection

Incidents are detected through:

- **Automated monitoring** — patterns in audit data that match known threat signatures
- **User reports** — users reporting suspicious activity
- **Admin observation** — admin noting unusual activity during routine review
- **Partner alerts** — AWS GuardDuty, client-side security tools, etc.
- **Post-hoc discovery** — incident identified retrospectively during investigation

### Response workflow

**Step 1 · Declaration**

Any admin (or designated security personnel) can declare an incident. Declaration captures:
- Initial description
- Suspected scope (users, datasets, timeframes affected)
- Severity estimate
- Incident ID assigned

**Step 2 · Containment**

Immediate actions to limit ongoing exposure:
- Compromised account: emergency revocation of all grants
- Exfiltration suspected: block identified export channels
- Integrity concern: mark affected datasets read-only pending investigation
- Vulnerability: deploy mitigations

Containment actions are themselves audit-logged.

**Step 3 · Investigation**

Responders use audit data and forensic tools to:
- Reconstruct the incident timeline
- Identify scope (what was actually affected)
- Identify root cause (how it happened)
- Assess data integrity and exposure

**Step 4 · Notification**

Based on investigation findings:
- Client admin notified immediately for all incidents affecting their tenant
- Affected users notified per breach notification requirements
- Regulatory notification if required (GDPR, state breach laws, etc.)
- AbarVa senior leadership notified for all severity-critical incidents

**Step 5 · Remediation**

Actions to restore secure state:
- Revoke compromised credentials, reset sessions
- Restore data integrity from backups if needed
- Patch vulnerabilities
- Update access controls if gaps identified

**Step 6 · Post-mortem**

Every incident generates a post-mortem:
- What happened (timeline)
- What went right
- What went wrong
- What needs to change (process, architecture, training)
- Concrete action items with owners and due dates

Post-mortems are retained for organizational learning. Client-facing incidents share appropriate summaries with affected clients.

### Client notification commitments

AbarVa's contracts specify notification commitments:

- **Severity-critical incidents (confirmed unauthorized access to Restricted or Confidential data):** Client notified within 24 hours
- **Severity-high incidents (suspected issues, integrity concerns):** Client notified within 72 hours
- **Severity-medium incidents (policy violations, non-data-affecting):** Client notified in regular security reports
- **Severity-low incidents (minor deviations):** Logged, reviewed in periodic security reports

These commitments exceed most regulatory minimums (GDPR 72-hour breach notification, most state laws 30-60 days) and are specifically designed to satisfy enterprise procurement requirements.

## D.9 Transparency reporting

Periodic transparency reports communicate AbarVa's governance posture to clients:

### Monthly client security report (per-client)

Per client, delivered monthly:
- Audit summary (total events, by category, notable patterns)
- Access review status (what's due, what's overdue)
- Classification review status
- Incident summary (any incidents affecting this client)
- Unusual pattern alerts (if any)

### Quarterly client compliance report (per-client)

Per client, delivered quarterly:
- SOC 2 audit status (in-progress, completed, with opinion)
- Policy changes during quarter
- Attestation completion rates (who owes attestations)
- Compliance dashboard snapshot
- Upcoming audit activities

### Annual AbarVa transparency report (platform-wide)

Platform-wide, delivered annually:
- Aggregate incident statistics (anonymized)
- Audit posture summary
- Policy evolution
- Security investments made
- Certifications achieved or in progress

This transparency is itself a competitive differentiator. Most platforms disclose incidents reactively; AbarVa discloses proactively.

## D.10 Decisions locked in Track D

| # | Decision | Rationale |
|---|---|---|
| D.L1 | Everything touching identity, access, or data is logged | No sampling on sensitive events |
| D.L2 | Audit events are append-only, hash-chained, with integrity verification | Tamper-evident audit trail |
| D.L3 | Canonical audit event schema with actor, target, context, before/after state | Forensic reconstruction capability |
| D.L4 | Retention by event category (3-10 years) with legal hold extensions | Meets regulatory windows |
| D.L5 | Three audit access patterns: admin in-product, auditor scoped, incident response | Right access for right purpose |
| D.L6 | Steward agent supports natural-language audit queries | Admin workflow accessibility |
| D.L7 | Architecture produces evidence for SOC 2 Type II, audit coverage Security + Confidentiality initially | Audit-ready, not audit-retrofitted |
| D.L8 | Policies enforced at configuration time (cascading) and action time (runtime checks) | Defense in depth |
| D.L9 | Policy changes versioned with full history | Enables historical reconstruction |
| D.L10 | Incident response workflow: declare, contain, investigate, notify, remediate, post-mortem | Standard IR pattern with AbarVa-specific controls |
| D.L11 | Client notification commitments exceed regulatory minimums (24/72 hours for critical/high) | Competitive differentiator |
| D.L12 | Periodic transparency reports (monthly, quarterly, annual) | Proactive disclosure model |

---

## Track D · Checkpoint

**STATUS · Track D of 5 complete · ~2,100 lines total**

Governance and audit specified. What's logged (everything touching identity/access/data). Event schema with integrity chaining. Retention tiering. Access patterns (admin, auditor, incident). SOC 2 Type II scaffolding. Policy enforcement. Incident response. Transparency reporting.

Ready for Track E (Org Structure as Intelligence Input) — the final track.

---

## Track E · Org Structure as Intelligence Input

This track specifies how organizational data — who works at the client, what they do, who they report to, how the company is structured — becomes the primary intelligence input that powers every agent in the AbarVa platform. This is the track where platform administration stops being a control-plane concern and starts being a product-intelligence concern.

### E.1 · Why org structure is the foundational dataset

Every other dataset AbarVa handles — vendor contracts, financial ledgers, IT inventory, customer analytics — is referenced only when the topic at hand requires it. When a Program explores cost structure, the financial ledger is queried. When a Program examines IT rationalization, the software inventory is queried. These datasets are **conditional inputs.**

Org structure is different. Org structure is queried on **every meaningful interaction** with every agent in the platform. When a Maestro asks Nexus "what should we do about declining engagement in Contact Operations?" the agent needs to know:

- Who runs Contact Operations (so recommendations can be routed to the accountable executive)
- Who that person reports to (so the Program is calibrated to the right level of sponsorship)
- What the Contact Operations organization looks like (so workforce-impact assessments are realistic)
- Who the peer functions are (so cross-functional dependencies are identified)
- What recent changes have occurred (so the agent doesn't reference departed staff or outdated structure)

Without org data, agent output is generic. With org data, agent output becomes specific, sponsorship-aware, and credibly client-grounded. The gap between "here's what leading organizations do for contact operations modernization" and "here's what Jake Chen's team should do given that he joined seven months ago and has an open Director of Quality role you haven't filled" is the gap between a research tool and a decision-grade platform.

Every Fortune 50 CIO the AbarVa platform targets will be evaluating this gap. Prat will ask during his demo: "Does it know who my people are, or does it just know what my function does?" The answer to that question is specified here.

### E.2 · What org structure data contains

The org structure dataset is a structured representation of the client organization that goes beyond a simple reporting tree. It contains five interlocking substructures, each serving a different agent use case.

**E.2.1 · People roster.** The set of individuals who work at the client. For each person the platform captures:

- Full name and preferred name
- Current title (the human-readable title, not just a job code)
- Current role (the canonical functional role from the role taxonomy)
- Direct manager (link to another person in the roster)
- Team or organization (link to an org unit)
- Start date in current role
- Start date at the company
- Tenure in role and tenure at company (derived, not stored)
- Location (city, country; region for reporting purposes)
- Contact email (for system use, not for Program outreach)
- Status (active, on leave, departing, departed)
- VIP flag (specifically-profiled executive; see VIP integration below)

The roster is the foundational layer. Everything else references back to people.

**E.2.2 · Role taxonomy.** A structured classification of functional roles at the client. The role taxonomy is distinct from titles because titles are messy and inconsistent ("VP of Operations," "Operations Lead," "Sr. Director, Operations"). The role taxonomy normalizes these into canonical role codes that agents can reason over.

The role taxonomy contains canonical role codes with:

- Role identifier (e.g., `cio`, `cto`, `vp-finance`, `director-it-operations`, `manager-engineering`)
- Role family (executive, director, manager, individual-contributor, specialist)
- Functional domain (technology, finance, operations, hr, product, marketing, sales, legal)
- Seniority tier (c-suite, svp, vp, director, senior-manager, manager, lead, ic)
- Typical span of control (for validation — a role coded as "manager" with 200 direct reports suggests data quality issue)

When a person is captured in the roster, their title is mapped to a canonical role code by either the Maestro (during manual authoring), the Steward agent (during classification assistance), or an automated mapping service (during HRIS integration). Title-to-role mapping is versioned and audited because misclassification can cause agent misrecommendations.

**E.2.3 · Org units.** The structural containers that people belong to. Org units form a tree:

- Top of tree: the client company itself
- Next level: major business divisions or regions
- Next level: functional departments within divisions
- Next level: teams within departments
- Leaf level: individual contributors or small teams

Each org unit has:

- Unit identifier
- Name
- Parent unit (establishing the tree)
- Unit type (division, department, team, function)
- Owner (the person who runs the unit, linked to the roster)
- Cost center code (for financial dataset joins)
- Headcount (derived from roster, not stored)
- Tenure of owner in current role

The org unit tree enables queries like "show me everyone in the Contact Operations organization" or "what is the headcount of the IT Infrastructure team" without requiring the agent to traverse person-level reporting lines.

**E.2.4 · Reporting relationships.** The explicit links between people that establish the management chain. While every person has a "direct manager" field in the roster, reporting relationships as a first-class dataset enable richer queries:

- Who reports to me directly (span of control)
- Who reports into my organization (full downstream)
- Who is my manager, grandmanager, great-grandmanager (upward chain)
- Who are my peers (people who share my manager)
- Who are my functional peers (people with similar role codes in different units)

These are derived from the roster but cached explicitly because agents query them frequently.

**E.2.5 · Change events.** The dataset of structural changes over time. Every hire, departure, promotion, reorganization, and title change is captured as a time-stamped event:

- Event type (hire, departure, promotion, lateral-move, reorg, title-change, manager-change)
- Event date
- Person affected
- Before state (role, unit, manager if relevant)
- After state
- Source (HRIS sync, manual authoring, announcement-derived)
- Notes (free text for context)

Change events enable agents to reason about organizational stability, hiring velocity, attrition patterns, and leadership turnover — all of which are meaningful signals for transformation Programs. A client with three CIO changes in eighteen months is in a different Program-readiness state than a client with CIO tenure of seven years.

### E.3 · How org structure data is ingested

Org structure data enters the platform through three pathways, and the pathway matters for freshness, completeness, and trust.

**E.3.1 · HRIS synchronization.** The preferred pathway for clients with mature HR systems (Workday, SuccessFactors, Oracle HCM, BambooHR). Org data flows into AbarVa through scheduled sync:

- Full sync initially to establish baseline
- Daily incremental sync for change detection
- Real-time webhooks for critical events (hires, departures, manager changes) where supported

HRIS sync is the most reliable pathway because the data is already authoritative at the client. The limitation is coverage — HRIS systems often lack the canonical role taxonomy, so Maestros still need to augment the imported data with role-code mapping. HRIS sync also typically excludes executive-level detail (exec comp, strategic responsibilities) that sit in separate board-adjacent systems.

HRIS sync is controlled by the integration patterns specified in Track A of this document and in `docs/specs/platform/data-ingestion-integration.md`. Access is audited per Track D.

**E.3.2 · Manual authoring.** For clients without HRIS integration or for clients during initial onboarding before integration completes. The Maestro (with Steward agent assistance) captures org structure directly in the admin surface:

- Import from LinkedIn exports, company org chart files, or Maestro research
- Manual entry through the admin surface
- Steward-assisted bulk entry ("I found 23 people mentioned in the meeting notes; let me walk you through capturing them")

Manual authoring is appropriate for the first 60-90 days of a client engagement while HRIS integration is being established. It is also the permanent pathway for clients who choose not to integrate HRIS with AbarVa (some highly-regulated clients prefer this isolation).

**E.3.3 · Hybrid ingestion.** The most common real-world pattern. HRIS sync establishes the broad base (all employees, basic structure) and Maestro authoring augments for depth (canonical role codes, exec profiles, strategic notes, relationship quality). The Steward agent actively helps reconcile the two sources when they disagree — for example, when HRIS shows a person's title as "Manager, IT" but the Maestro has characterized them during interviews as "the de facto CTO for the operations division."

In hybrid mode, each field has a source of authority marker (`hris_synced`, `maestro_authored`, `reconciled`) so that agents can distinguish between authoritative-structural-data and curated-contextual-data when reasoning.

### E.4 · How agents consume org structure data

Different agents consume org data differently, reflecting their different purposes. The permissions enforced here are critical because org data contains sensitive signals (compensation bands, performance indicators for some HRIS integrations, personal details).

**E.4.1 · Nexus consumes org data for Program scoping and recommendation routing.**

When a Maestro runs a Program, Nexus queries the org structure to:

- Identify the accountable executive for the Program's scope (who runs the affected function?)
- Map Program recommendations to specific organizational levels (this is a SVP-level recommendation vs this is a director-level action)
- Assess change-readiness based on tenure (a function whose leader is three months in has different Program dynamics than one with ten years of stability)
- Identify cross-functional dependencies (recommendations for Contact Operations implicate IT, HR, and Finance — who are those peer leaders?)
- Surface VIP-enriched context when the Program touches VIP executives (e.g., the CFO is a VIP with a public profile around cost discipline; Nexus shapes recommendations accordingly)

Nexus sees the full people roster, role taxonomy, org unit tree, and reporting relationships. Nexus does NOT see compensation data, performance review data, or confidential personnel notes — even if those are present in the HRIS source. Org structure available to Nexus is the Internal-sensitivity subset of the full HRIS feed.

The data-layer filtering for this is specified in Track C (dataset sensitivity tiers) and enforced at the query layer in Track B (role-based permissions). Nexus's Maestro-grant to org-structure data is always scoped to the Internal tier, never Restricted or Confidential.

**E.4.2 · Sentinel consumes org data for research targeting and contradiction detection.**

Sentinel's research runs across public and external sources but needs org context to target effectively:

- "Find recent statements by the Apex Retail Group CIO" — requires knowing who the CIO is
- "What has the Head of Supply Chain said publicly about inventory automation?" — requires knowing who that person is
- "Are there contradictions between what Priya Sethi says publicly and what internal documents assert?" — requires the full name and role

Sentinel consumes the same Internal-tier org subset as Nexus. When Sentinel surfaces findings in the Intelligence interface, it attributes them to the correct person based on org data ("According to CIO Priya Sethi's Q3 earnings remarks...").

**E.4.3 · Atlas consumes org data for portfolio-level organizational pattern detection.**

Atlas operates at the Tower level, across all client Programs. Atlas sees aggregate patterns:

- "Across our portfolio, what's the average CIO tenure at the moment we begin Programs?"
- "Are there structural patterns that correlate with Program success? (stable leadership, defined org units, established role taxonomy)"

Atlas sees org structure data but in aggregated, anonymized form for cross-client intelligence. Atlas does NOT see person-level data across clients — that would violate tenant isolation specified in Tracks A and B. Atlas sees things like "the median client we work with has 4 CIO-reporting-line direct reports; Apex has 7" — useful signal without exposing Apex's specific CIO or the names of those 7 reports.

**E.4.4 · Steward consumes org data for admin operations.**

Steward (specified in Document 4 of this Wave) is the only agent that sees the full org data including sensitive attributes. Steward is the admin-side agent, so it needs full visibility to help admins do admin work:

- "Who currently has access to the executive compensation dataset?" — requires knowing names and roles
- "Show me all users added in the last 30 days and their org placement"
- "Which senior leaders are flagged as VIPs and have their VIP profiles been updated in the last 90 days?"

Steward's visibility is broad but bounded by the admin who invokes it. If a client admin asks Steward about Steward's own client, full visibility is granted. If an AbarVa-side Maestro asks Steward about a client they don't have rights to, Steward refuses the query and logs the attempt.

### E.5 · Permission boundaries within org structure data

Org structure is a single dataset conceptually but contains multiple sensitivity tiers within it. Field-level permissions apply.

**E.5.1 · Public-tier fields.** Name, current title, org unit, manager name. These are often already discoverable through LinkedIn, press releases, or company org pages. Any authenticated user in the client tenant can see these fields for anyone in the roster.

**E.5.2 · Internal-tier fields.** Canonical role code, tenure in role, tenure at company, location, direct reports list, peer list. Available to all Maestros with org-data grants. Not available outside the tenant.

**E.5.3 · Restricted-tier fields.** Compensation band, performance rating, promotion history, succession-planning notes, confidential HR notes. Available only to admin-approved users with specific business need. Never flows to Nexus, Sentinel, or Atlas. Only Steward sees these, and only when the invoking admin has rights.

**E.5.4 · Confidential-tier fields.** Specific dollar compensation, active performance improvement plans, termination decisions in progress, board-restricted personnel matters. Available only to the client admin and specifically-authorized users. Never flows to any agent. Handled through separate encrypted storage with additional access controls.

Field-level tier classification is set during dataset classification (see Track C). When HRIS sync brings in data, the sync configuration specifies which fields map to which tier. The default tier for unclassified org data is Internal, not Restricted — this is a conscious choice that treats the bulk of org data as usable by agents, with specific fields gated upward.

### E.6 · Freshness and data quality

Org data goes stale fast. People change roles, managers, locations, and titles constantly. Stale org data is worse than missing org data because agents cite stale data with the same confidence as fresh data.

**E.6.1 · Freshness indicators.** Every field in the org structure dataset carries a `last_verified_at` timestamp. For HRIS-synced fields, this is the timestamp of the most recent successful sync. For Maestro-authored fields, this is the timestamp of the most recent explicit Maestro confirmation (not just the last edit — a confirmation action that says "yes, still accurate").

**E.6.2 · Agent freshness behavior.** When agents consume org data, they check freshness:

- Data verified within 7 days: cited with full confidence
- Data verified 8-30 days ago: cited with a mild caveat ("per our records, though last verified 18 days ago")
- Data verified 31-90 days ago: cited with explicit freshness warning ("last confirmed 6 weeks ago — may warrant re-verification")
- Data older than 90 days: flagged as stale; agent suggests re-confirming before relying on it

This behavior is consistent across Nexus, Sentinel, and Atlas. Steward uses the same thresholds but also proactively surfaces stale data in its admin recommendations ("23 people haven't been re-verified in over 90 days; would you like to walk through a quick refresh?").

**E.6.3 · Stale data remediation.** Steward provides a guided workflow for admins to walk through stale records and either re-confirm or update them. The workflow is designed for batch processing — admins rarely want to update people one at a time, so Steward offers filters ("all people in IT with stale data") and suggested batch actions ("mark all as still current if HRIS has synced in last 7 days").

For HRIS-integrated clients, stale data usually indicates a sync issue, not a data accuracy issue. Steward flags these cases differently and routes them to technical-integration-support rather than admin-manual-refresh.

### E.7 · VIP integration

Certain people in the client organization warrant enriched profiles beyond the baseline org structure data. These are the VIPs — typically C-suite executives, board members, and strategically-important directors. The VIP system specified in `docs/specs/platform/intelligence-vip-system.md` governs how these profiles are built and used.

**E.7.1 · VIP identification.** Admins (or AbarVa Maestros with admin-grant) flag specific people in the org roster as VIPs. Typical VIP criteria include:

- C-suite titles (CEO, CFO, CIO, CTO, COO, CHRO, CMO, General Counsel)
- Board members
- SVP-level leaders of Program-relevant functions
- Specific individuals whose sponsorship or resistance materially affects Program outcomes

VIP status is stored as a flag on the roster record but unlocks a separate data model — the VIP profile — that contains extensive additional context.

**E.7.2 · VIP profile contents.** Beyond the baseline roster data, VIP profiles capture:

- Public statements and positions (from earnings calls, interviews, conference remarks)
- Strategic priorities attributed to the individual
- Communication style and decision-making patterns
- Known relationships (peer executives, board allies, industry connections)
- Risk flags (contentious past engagements, public commitments that might constrain Programs)
- Program history (which AbarVa Programs have engaged this executive, what the outcomes were)

VIP profiles are authored by Maestros with Steward assistance. They are classified at the Internal tier (not Restricted) because the underlying data comes largely from public sources. However, the aggregation and interpretation represent Maestro judgment that is treated as AbarVa-proprietary.

**E.7.3 · Agent consumption of VIP profiles.** When an agent encounters a VIP in a query context, the agent automatically enriches its reasoning with VIP profile data. Nexus scoping a Program where the CFO is a critical sponsor pulls the CFO's VIP profile into the recommendation framing. Sentinel researching the CIO's public positions pulls VIP-curated statements as a starting point.

VIP enrichment is opt-in per Program — Maestros can toggle VIP-aware mode on or off based on their preference. Default is on for executive-sponsored Programs, off for operational-level Programs where VIP context would be noise.

### E.8 · Org structure and Program success correlation

Over time, AbarVa accumulates data about which org structure patterns correlate with Program success. This is the cross-client intelligence that Atlas surfaces at the Tower level.

Patterns observed include (as the platform matures):

- Programs sponsored by executives with <1 year tenure have different risk profiles than those with 3+ years tenure
- Programs touching functions undergoing active reorganization show higher implementation complexity
- Programs in clients with well-mapped role taxonomy execute faster than those without
- Programs in clients with clear org unit ownership succeed at higher rates than those with ambiguous ownership

These correlations are not reported at the individual-client level (that would be surveillance-creepy) but at the portfolio level for Atlas reasoning and for AbarVa's own strategic learning about what makes Programs succeed.

Atlas uses this data to produce Tower-level recommendations: "Your Contact Operations Program is entering a phase where tenure stability of the accountable VP matters. Given Priya has been in role 14 months and is generally considered stable, risk is medium-low." This is the kind of organizational-context-aware recommendation that pure LLM reasoning cannot produce without the structured org data underneath.

### E.9 · Other datasets that feed agents

While org structure is the most foundational agent-consumed dataset, several other datasets also serve as agent intelligence inputs. These are specified in detail elsewhere but summarized here for completeness of the intelligence-input picture.

**E.9.1 · Strategic priorities dataset.** A structured capture of the client's stated strategic priorities for the year or planning horizon. Used by Nexus to ensure Program recommendations ladder up to stated strategy. Typically 5-15 priorities authored by Maestros during onboarding, refreshed quarterly.

**E.9.2 · Technology inventory.** The list of software and platforms the client operates. Used by Nexus for IT-modernization Programs, by Sentinel for vendor-landscape research, and by Atlas for portfolio-level technology pattern detection. Ingested through CMDB integration where available, Maestro-authored otherwise.

**E.9.3 · Active commitments dataset.** Current contractual and strategic commitments the client has made — signed vendor contracts, board-committed initiatives, public commitments to analysts or investors. Used by Nexus to avoid recommending things that contradict existing commitments. Particularly important for Contradiction Agent specialist reasoning.

**E.9.4 · Recent events dataset.** Significant events affecting the client in the last 6-12 months — leadership changes, M&A activity, regulatory actions, significant public moments. Used by agents to contextualize current recommendations ("given the recent CIO transition, Programs in IT should account for stability-first positioning").

**E.9.5 · Program history dataset.** The record of past AbarVa Programs for the client, their outcomes, and lessons learned. Used by all agents to build on prior work rather than starting fresh. Also used to identify repeat patterns ("this is the third Program this year that has identified the same process gap; the underlying issue is likely structural").

All of these datasets follow the same governance primitives (Track C sensitivity tiers, Track B role-grants, Track D audit) but org structure is first among them because it's queried most frequently and underlies the context for all the others.

### E.10 · Summary table

| Ref | Statement | Why it matters |
|-----|-----------|----------------|
| E.L1 | Org structure is the foundational dataset for agent intelligence, queried on every meaningful interaction | Without it, agents are generic; with it, they're decision-grade |
| E.L2 | Org data contains five substructures: people roster, role taxonomy, org units, reporting relationships, change events | Rich enough to support agent reasoning beyond a simple org chart |
| E.L3 | Ingestion pathways: HRIS sync (preferred), manual authoring (fallback), hybrid (most common) | Different clients need different pathways without sacrificing governance |
| E.L4 | Different agents consume org data with different permission scopes | Nexus/Sentinel see Internal tier; Atlas sees aggregates; Steward sees full detail |
| E.L5 | Field-level sensitivity tiers within org data: Public, Internal, Restricted, Confidential | Org structure isn't monolithic — compensation and reviews need stricter gating |
| E.L6 | Freshness tracking with agent-side freshness-aware citation behavior | Stale data cited confidently is worse than missing data |
| E.L7 | VIP profile integration enriches executive-focused Programs automatically | Turns org data from a directory into strategic-context intelligence |
| E.L8 | Cross-client portfolio patterns feed Atlas without exposing individual-client data | Compounding intelligence asset without tenant-leak |
| E.L9 | Other intelligence datasets (strategic priorities, tech inventory, commitments, events, program history) follow the same governance primitives | Org is first among equals, not the only intelligence input |

---

## Track E · Checkpoint

**STATUS · Track E of 5 complete · ~2,600 lines total**

Org structure specified as the foundational agent intelligence input. Five substructures defined. Three ingestion pathways. Agent-specific consumption patterns with permission tier enforcement. Freshness architecture. VIP integration. Portfolio-level pattern surfacing. Other intelligence datasets summarized.

This completes Document 1 · Platform Administration Architecture Specification. Next: Document 4 · Steward Agent Specification.

---

## Document 1 · Synthesis

**Five tracks complete. ~2,600 lines.**

The Platform Administration Architecture is now specified across identity, access, data, governance, and intelligence integration. Together, these five tracks establish the infrastructure underneath every other surface of AbarVa.

**Foundational decisions locked in this spec:**

- Single-tenant-per-client architecture with three deployment patterns
- Two-tier user model: one Admin per client, many Maestros
- Hybrid Maestro origin: client-employed, AbarVa-staff, or third-party contractor
- Program-scoped, time-bounded, purpose-bound access grants
- Four-tier dataset sensitivity: Public, Internal, Restricted, Confidential
- Collaborative classification with admin-final-authority
- Append-only hash-chained audit trail, SOC 2 Type II scaffolded
- Org structure as first-class intelligence input with field-level permissions

**What this spec enables:**

- Enterprise-grade security posture that passes Fortune 50 CIO diligence
- Clear boundaries between Maestro daily work and Admin governance
- Architectural coherence between admin controls and agent behavior
- Audit-ready operation supporting SOC 2 Type II pursuit
- Data intelligence that makes agents credibly client-specific rather than generic

**What this spec does NOT cover (intentional scope boundaries):**

- Specific UI page designs (Document 2 · Platform Admin Surface Design Spec — Wave 2)
- Specific Maestro daily workflows (Document 3 · Maestro Data Operations Workbench Spec — Wave 2)
- The Steward agent's implementation (Document 4 · Steward Agent Specification — Wave 1, upcoming in this file continuation)
- Deep-dive org-structure ingestion patterns (Document 5 · Org Structure as Data Specification — Wave 3 or folded into E.3 later)

**Open questions flagged during writing:**

- Final agent name for Steward (working name; pending explicit Anand confirmation)
- Whether Document 5 stands alone or consolidates into this spec's Track E
- Specific SOC 2 audit firm and timeline (has business implications, not spec implications)
- Whether the admin transition ceremony in Track A is product-configurable or platform-enforced

These questions do not block implementation. They are either process decisions (agent naming) or deferred-scope decisions (Document 5 structure).

---

