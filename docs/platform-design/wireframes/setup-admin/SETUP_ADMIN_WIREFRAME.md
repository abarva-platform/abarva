# Setup / Admin Control Center

Source artifacts:

- Founder-authored DOCX: `docs/platform-design/wireframes/setup-admin/SETUP_ADMIN_WIREFRAME.docx`
- Normalized from `/Users/anand/Downloads/AbarVa_Setup_Admin_Wireframe_Specification_Final.docx`

## 1. Page identity

- Canonical page name: `Setup / Admin Control Center`
- Route: `/platform/admin`
- Surface: `Admin`
- Primary agent owner: `Steward`
- Secondary agents: `Nexus`, `Sentinel`, `Atlas`
- Primary user question: Is AbarVa ready to use this tenant's data, users, agents, and governance safely, and what should the admin fix next?

## 2. Five-question test answers

- Where am I: global shell identifies `AbarVa > Platform > Admin`, and the page title reads `Setup / Admin Control Center`.
- What matters right now: Steward editorial states current posture such as `demo-ready`, `pilot partial`, and `production blocked`.
- What is blocked or at risk: readiness summary and blocker rail expose private data plane, model gateway, multi-tenant security, and audit gaps.
- What does the agent recommend: Steward recommends reviewing dataset usability and agent readiness before any pilot claim.
- What should I do next: action bar offers `Review Dataset Usability`, `Open Agent Readiness`, `Export Setup Packet`, and `Custom`.

## 3. Zone composition

- Zone A: fixed canonical AbarVa shell with tenant context, nav, search, alerts, and profile.
- Zone B: context strip for tenant data tier, environment, readiness posture, manifest freshness, and deterministic/live caveat.
- Zone C: Steward-led workspace with readiness summary, dataset domains, users/access, agent readiness, audit/evidence summary, and next actions.
- Zone D: agent rail with blockers, next action, suggestions, handoffs, and confidence/caveat.
- Zone E: drawers for evidence, dataset detail, users/access, agent readiness, audit trail, and Steward action detail.

## 4. ASCII wireframe with coordinate labels

```text
+--------------------------------------------------------------------------------------------------+
| [A-1] AbarVaLogo [A-2] Apex Retail v [A-3] Home Programs Source Intelligence Tower Admin [A-5] |
+--------------------------------------------------------------------------------------------------+
| [B-1] Apex Retail - Rich demo tenant - Demo ready / Pilot partial / Production blocked          |
| [B-2] Context used: manifest, tenant registry, datasets, users/access, audit gaps               |
+--------------------------------------------------------------------------------------------------+
| [C-1] Setup / Admin Control Center                                  | [D-1] Steward Rail        |
| Is AbarVa ready to use this tenant's data safely?                   | Context-first guidance    |
| [C-2] Steward Editorial Block                                       | [D-2] Blockers           |
| [C-3] Overview | Data Domains | Users & Access | Agent Readiness    | [D-3] Next Action        |
| [C-4] Demo Ready | Pilot Partial | Production Blocked | Score       | [D-4] Suggestions        |
| [C-5] Dataset Domain Inventory                                      | [D-5] Handoffs           |
| [C-6] Users & Access Summary   [C-7] Agent Readiness Matrix         | [D-6] Caveat             |
| [C-8] Action Bar                                                    |                          |
| [C-9] Audit / Evidence Summary                                      |                          |
+--------------------------------------------------------------------------------------------------+
| [E-1] Evidence Drawer [E-2] Dataset Drawer [E-3] Agent Drawer [E-4] Audit Drawer                |
+--------------------------------------------------------------------------------------------------+
```

## 5. Element catalog

- `A-1` Canonical logo and admin shell: must use the approved AbarVa shell, not legacy admin chrome.
- `B-1/B-2` Context strip: must clearly separate loaded data, available data, and usable evidence.
- `C-2` Steward editorial block: 1 short editorial block with confidence and source chips.
- `C-4` Readiness summary: should show three postures at once - demo readiness, pilot posture, and production blockers.
- `C-5` Dataset domain inventory: table-forward display of domain, loaded state, available state, usable evidence, and next action.
- `C-6/C-7` Users/access and agent readiness: concise operational status, not a dashboard wall.
- `C-8` Action bar: always context-specific, never generic AI prompts.
- `D-2/D-3` Blockers and next action: visible above the fold.

## 6. Click and interaction map

- Dataset domain row -> opens dataset detail drawer with usability and evidence explanation.
- Review Dataset Usability -> opens dataset detail drawer and, if instrumented later, emits an audit event.
- Open Agent Readiness -> opens agent readiness drawer with per-agent readiness posture.
- Export Setup Packet -> allowed only if permissions allow; current wireframe assumes explanatory/static behavior.
- Production blocker chip -> opens blocker detail drawer; never changes readiness state directly.

## 7. Agent editorial contract

- Authoring agent: `Steward`
- Required context bundle: tenant profile, data tier, dataset domain inventory, users/access state, connector/data readiness, agent readiness, readiness manifest, audit/governance gaps, environment/deployment status.
- Permitted response modes: `status`, `diagnostic`, `recommendation`, `evidence`, `executive`, `refusal_or_caveat`
- Voice contract: precise, governance-aware, conservative, and explicit about blockers.
- Confidence rendering: `High`, `Medium`, `Low`, or `Unavailable`, with caveats when context is partial or conflicting.
- Forbidden behavior: no production-ready claim, no live telemetry claim, no fabricated dataset or audit history, no unsafe admin approval language.

## 8. Suggested actions specification

- Fresh load with partial context:
  - Review dataset usability for Apex Retail
  - Open agent readiness matrix
  - Export setup packet for founder review
  - Custom
- Blocked state:
  - Open production blockers
  - Draft pilot-readiness caveat
  - Review private data plane plan
  - Custom
- Low-context tenant:
  - Show missing setup data
  - Open tenant data tier registry
  - Create setup data request
  - Custom

Forbidden suggestions include `Ask me anything`, `Generate insights`, `Continue`, and any context-free filler.

## 9. Workflow state rendering

- Admin state machine: `not_configured -> configured_partial -> demo_ready -> pilot_partial -> production_blocked -> production_ready`
- Current state is rendered in Zone B and C-4.
- Completed states are visually de-emphasized.
- Blocked states require reasons and missing inputs.
- Future locked states open explanation drawers rather than enabling approval actions.

## 10. File attachment behavior

- Direct upload is optional and only appears inside relevant drawers.
- Supported file types: `PDF`, `DOCX`, `XLSX/CSV`, `TXT/MD`, `PNG/JPEG`, `JSON`
- Failed conversions must render as `stored but not usable as evidence`.
- Steward cannot cite failed conversions as evidence.

## 11. Cross-surface consistency

- Readiness score and status must match `/platform/admin/production-readiness`.
- Tenant data tier must match Home, Programs, Source, Intelligence, and Tower.
- Dataset states must preserve the distinction between `loaded`, `available`, and `usable evidence`.
- Route naming and tenant references must remain canonical.

## 12. Failure modes this page must prevent

- Generic AI guidance with no context chips or tenant-specific posture
- Blank-prompt dead ends with no admin-specific next steps
- Steward hidden in the rail instead of leading the page
- Over-claiming pilot or production readiness
- Treating stored files as usable evidence without usability review
- Cross-surface drift in readiness language or tenant state
- Decorative handoffs with no concrete implication

## 13. Acceptance criteria

- Five-question test passes within the first three seconds.
- Zones A-E are present and behave consistently across desktop and mobile.
- Steward editorial renders for full, partial, low, unavailable, and conflicting context states.
- Dataset inventory separates `loaded`, `available`, and `usable evidence`.
- No runtime or manifest state is promoted by the page itself.
- Suggested actions remain context-generated and actionable.
- No banned visual patterns appear.

## 14. Persona walkthrough

- Persona: Priya Raman, CIO sponsor for Apex Retail's AbarVa pilot.
- Goal: decide whether the environment is ready for a controlled pilot conversation and, if not, what must be fixed first.
- First three seconds: Priya sees the canonical shell, Apex Retail context, the page title, Steward editorial, and the top blockers.
- Turn 1: She reviews dataset usability and learns KPI data is only partially decision-grade.
- Turn 2: She asks what blocks pilot readiness and sees concrete blockers: private data plane, model gateway, security review, and live audit trail.
- Turn 3: She opens agent readiness and sees Steward as ready for manifest-backed admin guidance while other agents remain partial.
- Exit state: she leaves with an honest demo-vs-pilot-vs-production posture and a clear next admin action.

