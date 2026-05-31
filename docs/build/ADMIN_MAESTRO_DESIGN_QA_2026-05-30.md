# Admin Maestro Design QA — 2026-05-30

## Design Principle

The Setup/Admin area is a Maestro operating console. It should answer one question per page, use the landing page for triage, and keep diagnostic or agent machinery behind deliberate actions.

## Landing Page Contract

`/admin` should be the only broad page. It should show:

- Tenant identity and setup readiness.
- The few actions that need attention now.
- Data/trust posture summarized at a glance.
- Recent audit or setup activity.
- Tenant profile tab for account facts, not a second dashboard.

It should not show raw matrices, all tenants, long trace tables, or a persistent chat rail.

## Menu Page Contract

| Menu item | Maestro question | Page should show first | Drilldown can show |
| --- | --- | --- | --- |
| Overview | What needs attention now? | Readiness summary, top actions, trust posture | Tenant profile tab, recent activity |
| Data Trust | What do we know and what is missing? | Loaded buckets, missing segments, next loads | Full trust ladder by segment |
| Connectors | What systems need connection or repair? | Connection health, blockers, next connector action | Requirements, logs, connector detail drawer |
| Users & Access | Who has access and what is risky? | Role/SSO posture, pending invites, risky flags | Full user table, program provisioning, invite history |
| Inbox | What signals need attention? | Unread and recent notifications | Event detail, preferences link |
| Customer Admin | What tenant controls exist? | Tenant control summary | Read-only audit, usage, substrate, egress detail |
| Agent Readiness | What can assistants safely do? | Per-agent readiness summary and top gaps | Capability matrix and per-agent actions |
| PatternOps | Where is the knowledge base strong or thin? | Coverage summary by domain | Promotion workflow, tenant context coverage |
| Production Readiness | Are we demo, pilot, or production ready? | Gate criteria and top blockers | History, readiness tiles, blocker drawer |
| Compliance | What can we honestly say? | SOC 2, GDPR, DPA, breach SLA posture | Evidence links and review dates |
| Reasoning Audit | What did the system reason for this tenant? | Active-tenant traces only | Trace detail for the selected tenant |
| Releases | What changed and how do we roll back? | Release ledger summary | Full release record detail |
| Training | Where do I learn the workflow? | Guide and references | Deep reference content |

## Actual Gaps Found

| Gap | Evidence | Fix status |
| --- | --- | --- |
| Admin pages auto-scrolled down | Steward dock called document-level `scrollIntoView()` | Fixed in PR #2651 |
| Setup/Admin pages were too crowded | Steward chat dock consumed a full middle lane | Fixed in PR #2651; Steward is an on-demand chip |
| Static agent rails still crowded pages | Users & Access, Connectors, and other pages kept a 320px right rail | Fixed in follow-up: static rails become an on-demand Guidance drawer |
| Engineering traces showed all tenants | Screenshot showed `All tenants` while active tenant was Apex | Fixed in PR #2651; page is active-tenant scoped |
| Menu labels were too internal | `Nexus/Sentinel/Atlas/Steward`, `Reasoning audit log`, symbol-heavy subtitles | Fixed in PR #2651 with plain Maestro-facing subtitles |
| Some drilldown pages are still dense | Agent Readiness matrix and PatternOps coverage map carry many cells | Keep as drilldowns; next wave should add progressive disclosure and summaries above dense tables |

## Acceptance Checks

- Landing page is broad triage only.
- Menu pages each answer one named Maestro question.
- Tenant-scoped pages never default to all tenants.
- No persistent agent rail consumes horizontal space by default.
- Dense tables appear below summary sections or behind drilldown controls.
- Page copy uses role/workflow language before internal agent names.
- Internal provenance labels such as `Context used`, `tenant isolation guard`, or `admin shell config` stay out of default Maestro cards; they belong in audit detail, logs, or expandable technical views.
- Shared status bars should use buyer/operator labels (`Client`, `Evidence source`, `Status`) and should not expose implementation labels like `Agent`, `Mode`, or `Setup/Admin`.
- Visible admin copy should describe what the Maestro can decide or do; implementation labels such as component names, wave numbers, and deterministic seed mechanics stay out of default page content.
