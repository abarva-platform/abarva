# Admin Setup Page Blueprint
**Route:** /platform/admin
**Surface:** admin
**Primary user:** Steward admin / Platform operator / Founder
**Primary question:** "Is AbarVa ready to use this tenant's data, users, agents, and governance safely?"
**Primary agent:** Steward
**Supporting agents:** Atlas
**Demo data readiness:** partial (manifest-backed — AdminCanonShell Wave 0/17)

## Job-to-be-Done
The Admin Setup page is the platform operator's readiness dashboard. It tells the operator what data is loaded vs available vs usable, who has access and with what permissions, which datasets have been approved, what the connector and agent readiness status is, and what governance or security gaps remain. Steward surfaces the specific blockers that prevent full readiness.

**First 10 seconds:** Operator sees: (1) how many data sources are loaded and approved, (2) user/access configuration status, (3) agent readiness for each agent (Nexus/Sentinel/Steward/Atlas), (4) what Steward says needs attention before the next demo or pilot.

## Data Contract
**Required:** Data loaded/available/usable summary, user/access list, dataset approval status, connector/data readiness per surface, agent readiness per agent, governance/security gaps, Steward next admin action.
**Available today:** Manifest-backed partial data:
  - Apex Retail: data loaded (programmes, source scenario)
  - Users: Clerk test users configured (admin, arcturus client, meridian client, investor)
  - Agents: Nexus/Sentinel/Atlas/Steward — deterministic contracts landed
  - Connectors: deferred — no live integrations
  - Governance: partial — no real data access policy enforcement
**Missing:** Live data ingestion, real connector integrations, real dataset approval workflow, live user provisioning.
**Evidence basis:** Manifest-backed admin read model. Wave 0-17 deterministic.
**Must not claim:** Live data access, real connector integrations, real governance enforcement, production-ready.

## Layout

```
+-----------------------------------------------------------------------+
| AbarVa Nav [Platform Admin]                                            |
+-----------------------------------------------------------------------+
| STEWARD BRIEF                                                          |
| "AbarVa is demo-ready for Apex Retail. Pilot readiness has 2 blockers.|
|  Production readiness has 5 blockers. Governance enforcement is        |
|  partial — dataset approval workflow is deferred."                     |
| [deterministic seed caveat]                                            |
+-----------------------------------------------------------------------+
| READINESS OVERVIEW STRIP                                               |
| [Data: 2/5 loaded] [Users: 4/? configured] [Agents: 4/4 contracts]   |
| [Connectors: 0 live] [Governance: partial]                             |
+-----------------------------------------------------------------------+
| ADMIN SECTION TABS                                                     |
| [Data] [Users & Access] [Agents] [Connectors] [Governance]            |
+-----------------------------------------------------------------------+
|                                                                        |
| [TAB: Data — default]                                                  |
|  Data loaded vs available vs usable per surface.                       |
|  Apex Retail: programmes (rich), source (partial), intelligence (seed) |
|  Meridian: programmes (thin), source (none), intelligence (seed)       |
|  Arcturus: programmes (shell_only), source (none), intelligence (seed) |
|  Dataset approval status. Missing data flagged.                        |
|                                                                        |
| [TAB: Users & Access]                                                  |
|  Configured Clerk test users. Role assignments.                        |
|  OTP 424242 note for demo. Access boundaries.                          |
|  Production user provisioning: deferred.                               |
|                                                                        |
| [TAB: Agents]                                                          |
|  Agent readiness per agent: Nexus / Sentinel / Steward / Atlas         |
|  Contract status: landed. Live wiring: deferred.                       |
|  Context bundle status. Evidence ledger status.                        |
|                                                                        |
| [TAB: Connectors]                                                       |
|  Connector registry. All: deferred / not live.                         |
|  Planned: Salesforce, SAP, Azure AD, Jira, Confluence.                 |
|  Honest status: none currently live.                                   |
|                                                                        |
| [TAB: Governance]                                                       |
|  Data access policy status (TRUST1/2/3).                               |
|  Dataset approval workflow: deferred.                                  |
|  Agent data access policy matrix: contract-only.                       |
|  Security scan: deferred.                                              |
|                                                                        |
+-----------------------------------------------------------------------+
| STEWARD NEXT ACTION                                                    |
| "Complete dataset approval workflow before pilot onboarding."          |
+-----------------------------------------------------------------------+
```

## Workflow Sequence
1. Operator lands on Admin Setup — reads Steward brief (overall readiness posture)
2. Operator reviews readiness overview strip — scans data/users/agents/connectors/governance
3. Operator reviews Data tab — identifies which surfaces have loaded data
4. Operator reviews Users & Access tab — confirms test users are configured
5. Operator reviews Agents tab — verifies agent contracts and readiness
6. Operator reviews Connectors tab — notes all connectors are deferred
7. Operator reviews Governance tab — notes gaps before pilot
8. Operator follows Steward next action → navigates to Production Readiness page for full blocker list

**Unlocks next step:** Data loaded, users configured, agents initialized, governance reviewed.
**Blocks progress:** Connector integrations all deferred; dataset approval workflow deferred; real governance enforcement not wired.

## Agent-Centric Requirements
- Steward brief: "AbarVa is [demo/pilot/production] ready for [tenant]. [N] blockers remain for [next tier]." Must be specific about readiness tier and blockers.
- Context used: Manifest-backed admin read model, dataset approval state, connector registry, agent readiness, governance policy state.
- Confidence: "Manifest-backed partial data. Not live platform monitoring."
- Missing inputs: Live connector status, real data ingestion, real user provisioning.
- Recommended next action: "Complete dataset approval workflow before pilot onboarding. Review Production Readiness page for full blocker list."
- 3 choices + custom: Not on admin overview — admin is a status page, not a decision surface.
- Low-context disclosure: Specific blockers listed per tab — no fake "all ready" claims.

## Visual Canon
- Warm off-white (#F8F7F4) base
- Georgia serif for Steward brief
- DM Sans for tabs, status indicators, metadata
- AdminRouteShell (Wave 20 SHELL6) orientation strip
- No teal, no full-page dark mode, no sparkles
- Status indicators: green (loaded/configured), amber (partial), red (missing/deferred) — no fake all-green
- Above fold: Steward brief + readiness overview strip + tab bar
- Connectors tab must show honest deferred status — no fake live badges

## Interaction Model
- Tabs: 5 admin section tabs (Data / Users & Access / Agents / Connectors / Governance)
- Drawers: Dataset detail drawer (click dataset → approval status detail)
- Same-canvas updates: Tab switch updates content
- Drilldowns: Production Readiness → /platform/admin/production-readiness; Architecture → /platform/admin/architecture
- Empty state: Not applicable — manifest-backed data always populates tabs
- Blocked/deferred state: Connectors/governance deferred → explicit "deferred" badge, not fake live

## Acceptance Criteria
- [ ] Steward brief visible with specific readiness tier and blockers
- [ ] No fake "ready" claim without evidence (e.g., connectors must not show as live)
- [ ] Steward shows specific blockers (minimum 2 for pilot)
- [ ] Data tab shows Apex Retail as richest, Arcturus as shell_only
- [ ] Connectors tab shows all as deferred/not live
- [ ] Agent readiness shows 4/4 contracts landed (wiring deferred)
- [ ] Deterministic seed caveat visible
- [ ] Link to Production Readiness page present

## Route Ownership
- Route file: src/app/(maestro)/platform/admin/page.tsx (expected)
- Expected shell: AdminCanonShell + AdminRouteShell (Wave 20 SHELL6) + AbarVaAppShell
- Expected components: StewardBrief, ReadinessOverviewStrip, AdminSectionTabs, DataReadinessPanel, UsersAccessPanel, AgentReadinessPanel, ConnectorRegistryPanel, GovernancePolicyPanel
- Legacy risk: Low — AdminCanonShell (Wave 0/17) is established; verify no TopBar.tsx
