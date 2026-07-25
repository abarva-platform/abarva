# REF_EXECUTIVE_ROADMAP

The Visual & Artifact Reference Contract for the P4 Executive Transition Roadmap — this is the
human-readable mirror of `src/lib/deliverables/shared/reference-library/executive-roadmap-reference.ts`,
the single source both Moves generation pipelines and the SVG renderer read from. This is the
**pilot** for a design-system-style reference library covering ~20 diagram types across P2/P3/P4;
the other references (Current-State Overview, Root-Cause Tree, Target Architecture, Business Case,
etc.) will follow this same shape once this pattern is proven.

## Purpose

Show how the Move moves from mandate to realized value across a small number of decision-gated
horizons — **not a project schedule, a sequencing argument.**

## Audience

CIO, sponsor, steering committee.

## When to use

P4 (Build the Plan), required — every Move produces one Executive Transition Roadmap before
mobilization.

## Executive Story Contract

Sitting above the visual/section contract (per the hierarchy: Executive Story Contract → Artifact
Contract → Section Contract → Visual Reference Contract → Rendering Specification):

| Field              | Content                                                                                                                                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Executive question | Why this sequence, and what do we need to decide to keep it moving?                                                                                                                                            |
| Core message       | State the one-sentence thesis for why this order de-risks the Move (e.g. _"A four-stage transition establishes trusted data first, proves value in one function, then scales safely"_) — never just "Roadmap." |
| Decision required  | Name the specific gate decision(s) the sponsor must make to unlock the next horizon.                                                                                                                           |
| Audience takeaway  | The sponsor can repeat back why the sequence is ordered this way, and what they're being asked to approve now.                                                                                                 |
| Narrative arc      | context → tension → evidence → implication → decision                                                                                                                                                          |

## Required sections (of the parent artifact)

The roadmap artifact itself (not just this exhibit) follows `MOVES_ROADMAP` in
`orchestrator/briefs/deliverable-structures.ts`: Executive Summary, Objectives & Guiding Principles,
Starting Point, Phases & Work Packages, Sequencing & Dependencies, Resourcing & Operating Model,
Phase Gates & Milestones, Risks/Issues/Dependencies, Recommendation & Next Actions.

## Diagram rules

- **Horizons** (exactly 4, in order): Mobilize → Establish Foundation → Deliver Priority Outcomes →
  Scale and Optimize.
- **Workstreams** (at most 6, chosen from): Business & Process, Technology, Data, AI / Automation,
  Governance & Controls, Change & Adoption.
- **Max 3 major activities** per horizon/workstream cell.
- Every roadmap item must carry: outcome, major activity, dependency, decision/gate, owner role,
  timing, success measure.
- **Decision gates**: diamond shape, shown between horizons.
- **Dependencies**: dashed connector.

## Allowed

- Rounded rectangles for cells/activities.
- Diamonds for decision gates.
- Dashed connectors for dependencies.
- Outcome language ("establishes trusted data," "proves value in member service").

## Not allowed (forbidden patterns)

- Sprint numbers ("Sprint 3").
- Day/week counters ("Day 45", "Week 6").
- Explicit calendar dates unless the client has approved specific committed dates.
- "Gantt" or Gantt-chart-style task lists.
- Task-list language ("Task 1.2.3: configure endpoint").

See [`rendering-rules.md`](./rendering-rules.md) for the SVG layout/typography/color spec,
[`example-data.json`](./example-data.json) for a realistic data example, and
[`gold-standard.svg`](./gold-standard.svg) / [`bad-example.svg`](./bad-example.svg) for worked
exemplars.

## Where this is wired in the codebase

- Contract: `src/lib/deliverables/shared/reference-library/executive-roadmap-reference.ts`
- Orchestrator prompt/brief: `orchestrator/briefs/deliverable-structures.ts` (`MOVES_ROADMAP.expectedExhibits`)
- Golden-bar prompt: `strategic-moves-artifact-standard.ts` (`p4RoadmapAssignment()`)
- Renderer: `orchestrator/renderers.tsx` (`svgRoadmapExhibit()`)
- Quality gate (orchestrator): `orchestrator/quality-validator.ts` (`requiredExhibitElementsByKind`, `forbiddenContentPatterns`)
- Quality gate (golden-bar): `golden-bar.ts` (`forbiddenContentPatterns`)
