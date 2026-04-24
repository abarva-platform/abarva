# 05 ROUTE AND NAVIGATION MODEL

## Required Route Family

- `/source`
- `/source/events`
- `/source/events/[eventId]`
- `/source/events/[eventId]/scorecard`
- `/source/events/[eventId]/artifacts/[artifactId]`
- `/source/value`

## Corresponding File Paths

- [src/app/(maestro)/source/page.tsx](/Users/anand/Projects/nexus/src/app/(maestro)/source/page.tsx)
- [src/app/(maestro)/source/events/page.tsx](/Users/anand/Projects/nexus/src/app/(maestro)/source/events/page.tsx)
- [src/app/(maestro)/source/events/[eventId]/page.tsx](/Users/anand/Projects/nexus/src/app/(maestro)/source/events/[eventId]/page.tsx)
- [src/app/(maestro)/source/events/[eventId]/scorecard/page.tsx](/Users/anand/Projects/nexus/src/app/(maestro)/source/events/[eventId]/scorecard/page.tsx)
- [src/app/(maestro)/source/events/[eventId]/artifacts/[artifactId]/page.tsx](/Users/anand/Projects/nexus/src/app/(maestro)/source/events/[eventId]/artifacts/[artifactId]/page.tsx)
- [src/app/(maestro)/source/value/page.tsx](/Users/anand/Projects/nexus/src/app/(maestro)/source/value/page.tsx)

## Route Table

| Route | Purpose | Primary user intent | Primary components | Data dependency | Actions |
|---|---|---|---|---|---|
| `/source` | Portfolio dashboard | Understand active/waiting/at-risk sourcing work | `AbarVaSourceDashboard`, later `SourcingEventTable`, `SourceAlertPanel` | Source dashboard query | Open event, inspect value |
| `/source/events` | Event index | Browse and filter all events | `SourcingEventTable` | Source event list query | Open event |
| `/source/events/[eventId]` | Event workspace | Manage one sourcing event | `NexusEngagementCanvas` | Source event detail query | Change stage, open artifact, inspect Nexus guidance |
| `/source/events/[eventId]/scorecard` | Scorecard governance | Review weights and lock criteria | `ScorecardGovernancePanel`, `EvaluationCriteriaEditor` | Scorecard query | edit weights, add rationale, approve, lock |
| `/source/events/[eventId]/artifacts/[artifactId]` | Artifact route | Inspect an artifact directly | `SourceArtifactDrawer` or artifact page shell | Artifact query | review, approve, export later |
| `/source/value` | Value ledger | Inspect projected and realized value | `SourceValueLedger` | Value ledger query | inspect line item |

## Navigation Recommendation

For the first vertical slice, `/source` should remain hidden/internal.

Reason:

- the experience needs Build Pack review before broad product navigation exposure
- Source is not ready to appear as a final top-nav product
- internal direct route access supports review without confusing demo users

Later promotion options:

- primary top nav after event canvas and scorecard governance are stable
- platform menu if Source remains one of several workflow products
- command center entry point for internal pilots

## Navigation Anti-Patterns

- do not route Source through `/preview`
- do not route Source through `/programs`
- do not create a second Source shell
- do not expose all subroutes before the interaction model is reviewed
