# Home Knowledge Surface Preview Proof

Status: PASS
Generated: 2026-07-14T00:00:00.000Z

## Flag

- name: "ENABLE_KNOWLEDGE_LAYER_HOME_PREVIEW"
- defaultEnabled: false
- disabledStatus: "disabled"
- enabledStatuses: ["enabled","enabled","enabled","enabled"]

## Truth Split

- defaultHomeBehaviorChanged: false
- routeOrNavigationChanged: false
- previewOnly: true
- claudeCalled: false
- productionTenantDataWritten: false
- activeTenantAccessUpdated: false
- candidatePromoted: false
- moduleRuntimeBehaviorChanged: false
- deployRequired: false

## What This Proves

Home can render a client-facing Enterprise Knowledge Surface from HomeKnowledgePack/entity profile outputs behind a non-default flag. The proof shows enterprise brief, confidence, known context, relationships, gaps, evidence coverage, profile drill-downs, and recommended next evidence.

## What This Does Not Do

- Does not change the default Home route.
- Does not add a production route or navigation item.
- Does not call Claude.
- Does not write tenant data.
- Does not promote candidate data.
- Does not update Active Tenant Access.

## Scenario Results

| Scenario | Tenant | Status | Headline | Profiles | Relationships | Evidence | Gaps | Quality |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| Meridian Health — Enterprise Knowledge Overview | meridian-health | enabled | What AbarVa knows about Meridian Health | 63 | 8 | 10 | 7 | Hits the mark for a Home knowledge-surface preview: it leads with enterprise meaning, keeps evidence and gaps visible, supports double-click profiles, and keeps diagnostics secondary. |
| Meridian Health — Finance Analytics Profile | meridian-health | enabled | What AbarVa knows about Meridian Health | 50 | 8 | 5 | 4 | Hits the mark for a Home knowledge-surface preview: it leads with enterprise meaning, keeps evidence and gaps visible, supports double-click profiles, and keeps diagnostics secondary. |
| Meridian Health — Agent Assist Readiness Profile | meridian-health | enabled | What AbarVa knows about Meridian Health | 31 | 8 | 5 | 4 | Hits the mark for a Home knowledge-surface preview: it leads with enterprise meaning, keeps evidence and gaps visible, supports double-click profiles, and keeps diagnostics secondary. |
| HarborTrust Bank — Fraud Analyst Copilot Profile | harbortrust-bank | enabled | What AbarVa knows about HarborTrust Bank | 33 | 8 | 5 | 4 | Hits the mark for a Home knowledge-surface preview: it leads with enterprise meaning, keeps evidence and gaps visible, supports double-click profiles, and keeps diagnostics secondary. |

## Overall Quality Assessment

The Home preview now leads with enterprise meaning, confidence, relationships, evidence, and double-click profiles. Diagnostics are present only as collapsed technical data in the proof JSON/HTML.
