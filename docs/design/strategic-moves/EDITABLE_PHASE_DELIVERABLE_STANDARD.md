# Moves Editable Phase Deliverable Standard

Status: active standard  
Lane: global-control-lane  
Applies to: every client and tenant

## Purpose

Moves phase-end artifacts must be usable in real client work. HTML is excellent
for visual review, live walkthroughs, aVa references, screenshots, and embedded
diagrams. It is not enough as the only phase-end deliverable.

Every phase-end deliverable must have an editable Word-equivalent record. The
Word record is the formal client-editable document for redlines, sponsor review,
workshop follow-up, and approval history. The HTML artifact is the visual review
companion.

Important deliverables must read like human-authored consulting documents. They
need an executive summary, table of contents, storyline, narration, exhibits, and
clear decision logic. A set of diagrams and tables without a narrative arc is not
a phase-end deliverable.

## Required Output Package

Each phase-end deliverable package includes:

| Output | Required | Purpose |
|---|---:|---|
| Editable Word phase deliverable | yes | Formal client-editable record with TOC, narrative, tables, appendices, review comments, and approval language. |
| HTML visual review companion | yes | Browser-ready visual companion with diagrams, charts, process flows, architecture views, and evidence navigation. |
| Evidence and provenance manifest | yes | Separates client-loaded evidence, AbarVa-generated deliverables, AbarVa-derived visualizations, and operator proof. |
| Workshop and session evidence pack | yes | Keeps agendas, interview guides, notes, decisions, corrections, and open evidence asks attached to the phase. |
| Derived visualization inventory | yes | Lists process flows, architecture diagrams, data flows, charts, and tables generated from evidence. |
| Editable Excel model | when estimating | Required for business cases, roadmap estimates, rate-card logic, scenarios, and finance validation. |

## Provenance Labels

Every exported file must carry one of these provenance labels:

| Label | Meaning |
|---|---|
| `client_loaded_evidence` | Client-provided or tenant-loaded evidence, datasets, notes, extracts, source rows, or uploaded files. |
| `abarva_generated_deliverable` | AbarVa-authored client-facing deliverable generated from approved context, evidence, prompts, and gates. |
| `abarva_derived_visualization` | A chart, table, process flow, architecture view, data flow, or relationship map generated from evidence. |
| `operator_proof` | Screenshots, API payloads, migration logs, deploy evidence, and test output. |

Derived process flows, diagrams, charts, and relationship maps must use this
client-facing label unless the client provided the visual directly:

> AbarVa-generated visualization derived from client-loaded evidence.

## Current State / Process Document Standard

P2 Discover & Diagnose artifacts that describe current state, process, handoffs,
or operating model require a Word-equivalent document with:

1. Cover page with tenant, Move, phase, draft/final status, owner, and review date.
2. Table of contents.
3. Executive diagnostic summary.
4. Storyline and narrative arc: why this current state matters, what the evidence says, what it means for change, and what decision comes next.
5. How work is organized today.
6. Leadership, teams, decision rights, and ways of working.
7. Workforce footprint: locations, roles, offshore/onshore mix where loaded, and adoption constraints.
8. Current-state business process narrative before diagrams.
9. Current-state process flows and handoff maps.
10. Systems and technology in use, including ERP/HCM/workflow platforms such as Workday, Oracle, ServiceNow, Jira, or client-loaded alternatives.
11. Data, reporting, controls, and governance signals.
12. What works today and should be preserved.
13. What breaks today, why it breaks, and operational implications.
14. Change, adoption, culture, and readiness observations.
15. Root causes, gaps, and evidence confidence.
16. Sponsor review packet: approve for draft design, request revisions, or hold for evidence.
17. Appendix: source register, caveats, review log, and client-to-complete evidence requests.

The process flow should never appear as an isolated graphic. It needs a human
operating narrative first: how work starts, who touches it, what systems are
used, where decisions happen, how exceptions are resolved, and what change would
mean for people, adoption, controls, and culture.

## Workshop Evidence Standard

Workshop and session evidence is first-class evidence. It is not an optional
attachment.

For current-state/process work, the package should include:

- business process discovery workshop agenda;
- business stakeholder interview guide;
- IT/application/data owner interview guide;
- current-state walkthrough notes;
- process observation notes;
- adoption, change, culture, and workforce-location observations;
- decisions captured;
- open questions and evidence requests;
- client corrections or approvals.

If these are missing, the artifact must list them under client-to-complete
evidence. It must not present the current-state process narrative as final.

## Runtime Contract

The Moves prompt must bind this standard into every generated phase artifact.
The persisted artifact metadata must also record:

- output role;
- provenance category;
- whether editable Word is required;
- required companion outputs;
- required Word sections;
- required workshop/session evidence;
- provenance rules.

This lets the File Cabinet, Downloads pack, review gate, and future export job
separate formal deliverables from review companions, evidence, derived visuals,
and operator proof.
