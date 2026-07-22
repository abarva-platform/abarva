# Moves Stripe-Style Workflow UX Audit

Date: 2026-07-22
Lane: global-control-lane
Status: backlog candidate from live FS Demo run

## Executive Read

Moves is mechanically closer than it was, but the phase experience still reads too much like a long internal workbench. A first-time sponsor, PMO lead, or operating owner should not need to infer the workflow from scattered buttons, long explanatory panels, and buried upload or approval controls.

The target experience is a Stripe-like workflow shell:

1. One clear phase rail on the left.
2. One clear step navigator inside the phase.
3. One primary action per step.
4. Evidence, findings, approvals, and generated artifacts visible as lifecycle objects.
5. aVa/Phase Intelligence explaining the current step, not flooding the page.
6. Approve & Build showing exactly what will be committed, generated, carried forward, and blocked.

## Current UX Problem

The current P1 approval and adjacent phase pages are too dense. They combine guidance, templates, uploads, evidence status, generated files, next-phase previews, gate criteria, and build actions into a long page. This makes the product feel like it is collecting files and generating documents rather than leading a governed consulting workflow.

The user should always know:

- Where am I?
- What do I need to do now?
- What evidence does AbarVa already have?
- What will AbarVa do when I approve?
- What is optional versus blocking?
- What changed because of the uploaded evidence?
- What is carried forward to the next phase?

## UX Principles

| Principle                                | Product Rule                                                                                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One action per step                      | The current step owns the primary CTA. Do not show duplicate "Continue" and "Upload" actions that compete.                                                          |
| Evidence before assertion                | Every generated finding, gate status, and document claim should show whether it is evidence-backed, assumed, or a gap.                                              |
| Compact approval                         | Gate approval should be a decision page, not a scroll-heavy report.                                                                                                 |
| Human-approved lifecycle                 | AI drafts are not authoritative until a human downloads, edits or accepts, and uploads/approves a final.                                                            |
| Phase Intelligence is contextual         | The intelligence panel should explain the current step and next decision, like Source step intelligence.                                                            |
| Next phase prep is visible but secondary | Show what is coming next, but do not bury the current action below next-phase content.                                                                              |
| Wide canvas is earned                    | Use the center width for tables, split panes, lifecycle cards, and side-by-side evidence/action views. Avoid narrow content columns floating in excess white space. |

## Universal Phase Shell

All P0-P5 phases should use the same shell anatomy.

| Region               | Purpose                              | Required Behavior                                                                                                          |
| -------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Left rail            | Phase navigation and workspace links | Show P0-P5, Files & Evidence, Phase Intelligence, Approvals. Current phase and counts are visible.                         |
| Phase header         | Current phase objective              | Short title, one-line purpose, readiness count, and no large marketing copy.                                               |
| Step tabs            | Workflow navigation                  | Real tabs or vertical stepper with clear active, complete, blocked, and upcoming states. Each tab navigates the work pane. |
| Work pane            | Current task                         | Shows only what the user needs for the selected step.                                                                      |
| Evidence/action pane | Supporting evidence and CTA          | Shows uploaded files, reviewed findings, gaps, and the single action for the step.                                         |
| aVa dock             | Help, not page chrome                | Uses the correct dark logo and offers step-specific assistance.                                                            |

## P1 Approval Redesign

P1 approval should become a compact "Approve & Build Charter" decision screen.

### Current Issue

The P1 approval page is too long and mixes multiple responsibilities. It does not clearly distinguish:

- charter inputs,
- evidence uploaded,
- evidence reviewed,
- AI-generated draft deliverable,
- client-approved final,
- next-phase prep,
- gate blockers,
- the actual irreversible Approve & Build action.

### Target Screen

| Section             | What It Shows                                                   | Interaction                                                    |
| ------------------- | --------------------------------------------------------------- | -------------------------------------------------------------- |
| Decision Summary    | Move name, sponsor role, scope, success criteria, evidence plan | Read-only compact cards with edit links back to Charter Inputs |
| Evidence & Versions | Uploaded files, AI draft, redline, client-approved final        | Source-style artifact lifecycle cards                          |
| Gate Table          | Gate item, why it matters, current state, source, action        | Rows are clickable; blockers show exact remediation            |
| Build Preview       | What Approve & Build will generate and carry forward            | One list of generated deliverables plus next-phase prep pack   |
| Primary CTA         | Approve & Build P1 Charter                                      | Enabled only when required conditions are met                  |

### P1 Gate Table

| Gate Item                     | Meaning                                                                                   | Status Logic                                                | UX                         |
| ----------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------- |
| Charter inputs complete       | Required P1 fields are present                                                            | Complete only if all required fields saved                  | Compact row with edit link |
| Evidence attached or caveated | Uploaded evidence or explicit caveats are visible                                         | Complete if evidence exists or gap is intentionally carried | Row opens evidence list    |
| Human review recorded         | User reviewed AI draft or uploaded final                                                  | Complete only after accept/upload action                    | Row opens approval form    |
| Full phase close executed     | Approve & Build ran context extract, deliverable queue, gate approval, next-phase handoff | Complete only after successful build                        | Primary action row         |

## Phase-by-Phase Workflow Shape

| Phase            | Step 1                          | Step 2                            | Step 3                                      | Step 4          | Approval Output                                    |
| ---------------- | ------------------------------- | --------------------------------- | ------------------------------------------- | --------------- | -------------------------------------------------- |
| P0 Originate     | Frame/Govern/Readiness inputs   | Files if needed                   | Approve & Build Charter                     | -               | P1 charter seed and intake mandate                 |
| P1 Charter       | Review/edit charter inputs      | Upload decision files             | Review generated charter draft and evidence | Approve & Build | Client-approved charter or AI draft clearly tagged |
| P2 Current State | Prepare sessions/templates      | Upload and review evidence        | Review findings/gaps                        | Approve & Build | Current-state readout, evidence gaps, P3 prep      |
| P3 Approach      | Review options                  | Upload decision records           | Compare solution approaches                 | Approve & Build | Selected solution direction and design package     |
| P4 Plan          | Review roadmap/economics inputs | Upload estimates and assumptions  | Review business case                        | Approve & Build | Roadmap, ROM estimate, value case, risk plan       |
| P5 Execute       | Review handoff readiness        | Upload final governance artifacts | Review Tower handoff                        | Approve & Build | Tower-ready execution packet                       |

## Immediate Recommendations

| Priority | Recommendation                                                                | Why It Matters                                                                         |
| -------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| P0       | Replace long approval pages with compact decision tables                      | The user should see the value and the blocker in one screen.                           |
| P0       | Remove duplicate primary actions from each step                               | A page cannot say both "Continue to Upload" and show an Upload CTA as the main action. |
| P0       | Make upload steps show uploaded file names and lifecycle state immediately    | "Uploaded 6 files" is not enough; the user needs to verify what arrived.               |
| P0       | Use Source-style artifact acceptance for generated deliverables               | AI-prepared draft, human reason, content drift, gate precondition, agent eligibility.  |
| P0       | Put Phase Intelligence on every step                                          | It should say what AbarVa knows, what is missing, and what this step means.            |
| P1       | Add client-approved deliverable upload before next-phase consumption          | Generated drafts must not become authoritative by accident.                            |
| P1       | Create document-length and prompt limits per deliverable                      | A 41-page P1 charter after P0 is not credible.                                         |
| P1       | Reclassify optional engineering artifacts such as DORA/ITSM by use case       | Useful for implementation readiness, but not always a hard blocker for strategy ROM.   |
| P1       | Add next-phase prep pack as a generated artifact, not hidden explanatory text | The product should hand the team a workshop kit, not just tell them to run one.        |

## Acceptance Criteria

- A first-time user can complete each phase by following the visible tabs in order.
- Every tab has exactly one dominant next action.
- Approval screens fit above the fold on a standard laptop viewport, with details behind tabs or disclosure rows.
- Files & Evidence shows every uploaded file with title, source, phase, status, and lifecycle state.
- Generated artifacts are clearly tagged as AI-prepared drafts until accepted or replaced by client-approved versions.
- Approve & Build shows what it will generate before it runs and what it generated after it completes.
- Next-phase prep artifacts are listed as outputs, with clear "use this next" guidance.
- Phase Intelligence is step-specific and evidence-aware.
- No generic hard blockers appear for a use case unless the phase explicitly needs them.
- All P0-P5 pages use the same shell, spacing, typography, tabs, and action placement.

## Open Design Questions

- Should every phase expose an "Evidence required" tab and a separate "Artifacts generated" tab, or should both live in Files & Evidence with filters?
- Should client-approved deliverables be required before a phase can advance, or allowed as a soft caveat for demo/sandbox moves?
- Should optional evidence such as DORA/ITSM be visible only under "implementation readiness" rather than the main P2 current-state gate?
- Should Approve & Build always generate the next-phase workshop kit, or only when the prior phase has enough evidence to tailor it?
