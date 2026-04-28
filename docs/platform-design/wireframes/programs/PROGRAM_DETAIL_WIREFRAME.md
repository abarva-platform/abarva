# Program Detail - Flagship Workspace

Source artifacts:

- Founder-authored DOCX: `docs/platform-design/wireframes/programs/PROGRAM_DETAIL_WIREFRAME.docx`
- Normalized from `/Users/anand/Downloads/AbarVa_Wireframe_Specifications_Program_Intelligence_Tower/AbarVa_Program_Detail_Wireframe_Specification.docx`

## 1. Page identity

- Canonical page name: `Program Detail - Flagship Workspace`
- Route: `/tenant/[tenantSlug]/programs/[programSlug]`
- Surface: `Programs`
- Primary agent owner: `Nexus`
- Secondary agents: `Steward`, `Sentinel`, `Atlas`
- Primary user question: How do we move this program to the next decision or gate with the right workshop, evidence, deliverables, and actions?

## 2. Five-question test answers

- Where am I: tenant/program breadcrumb and program header identify the tenant, program code, and program name.
- What matters right now: Nexus editorial and current gate card explain current phase, gate, and next decision.
- What is blocked or at risk: gate readiness plus evidence/missing inputs panel identify value hypothesis gaps, sponsor alignment gaps, and missing evidence.
- What does the agent recommend: Nexus workshop canvas proposes the next workshop and owner action.
- What should I do next: action bar and Nexus mission card provide the next concrete move.

## 3. Zone composition

- Zone A: canonical shell with Programs active.
- Zone B: sticky context strip for tenant, program code, phase, gate, deterministic/live caveat, and linked Source event.
- Zone C: workflow-first workspace with editorial, phase journey, gate card, workshop canvas, deliverables/evidence, and actions.
- Zone D: agent rail with Nexus primary and Steward/Sentinel/Atlas as contextual handoffs.
- Zone E: drawers for evidence, deliverables, gate readiness, missions, and linked Source event details.

## 4. ASCII wireframe with coordinate labels

```text
+------------------------------------------------------------------------------------------------------+
| [A-1] AbarVaLogo [A-2] Apex Retail - Rich [A-3] Home Programs Source Intelligence Tower Admin [A-4]|
+------------------------------------------------------------------------------------------------------+
| [B-1] APX-02 - Demand Forecasting Modernization - P4 Design - Gate Pending - Seed-backed [B-2] Link|
+------------------------------------------------------------------------------------------------------+
| [C-1] Program Header                                                  | [D-1] Agent Rail            |
| [C-2] Nexus Editorial Brief                                           | [D-2] Nexus Mission         |
| [C-3] Phase Journey Rail   [C-4] Gate Readiness   [C-5] Workshop     | [D-3] Steward Gate         |
| [C-6] Overview | Workshop | Deliverables | Evidence | Actions | Gate | [D-4] Sentinel Evidence    |
| [C-7] Deliverables by Phase + Evidence Coverage                       | [D-5] Atlas Implication    |
| [C-8] Evidence / Missing Inputs                                       | [D-6] 3 Suggestions+Custom |
| [C-9] Action Bar                                                      |                            |
+------------------------------------------------------------------------------------------------------+
| [E-1] Evidence, gate, deliverable, mission, and linked Source event drawers                          |
+------------------------------------------------------------------------------------------------------+
```

## 5. Element catalog

- `A-1` Canonical wordmark and shell: must use the approved AbarVa shell and logo component.
- `B-1/B-2` Program context and Source bridge: show tenant, program, phase, gate, and linked Source event when available.
- `C-2` Nexus editorial: concise orchestration guidance with context and evidence qualifiers.
- `C-3` Phase journey: six phases with clear current/completed/future rendering.
- `C-4` Gate readiness card: shows status, blockers, and missing inputs.
- `C-5` Workshop canvas: shows agenda, questions, SMEs, and evidence to capture.
- `C-7/C-8` Deliverables and evidence: table/card hybrid with version, coverage, and missing inputs.
- `C-9` Action bar: always tied to the current program state.

## 6. Click and interaction map

- Programs nav link -> returns to tenant program list.
- Linked Source Event chip -> opens a source-link drawer or the related Source event route when resolvable.
- Phase card -> opens a phase detail drawer; no phase transition occurs here.
- Gate card -> opens Steward gate rationale and readiness evidence.
- Workshop evidence item -> opens evidence drawer.
- Deliverable row -> opens deliverable detail drawer with version and evidence context.
- Action bar buttons -> open contextual drawers or proposed actions; no workflow engine side effects are implied.

## 7. Agent editorial contract

- Authoring agent: `Nexus`
- Required context bundle: tenant, program, phase, gate, workshop readiness, deliverables, evidence, missions, and linked Source event.
- Permitted modes: `status`, `diagnostic`, `recommendation`, `artifact`, `evidence`, `refusal_or_caveat`
- Voice contract: orchestration lead, program-specific, and never chatbot-first.
- Honest disclosure: full/partial/thin/blocked/unavailable context states must change the editorial posture.
- Forbidden behavior: no gate approval, no invented evidence, no fake live model output, no direct state transition claims.

## 8. Suggested actions specification

- Fresh load with full context:
  - Confirm Workshop 5 outputs
  - Open evidence gaps for current gate
  - Preview deliverables for Design phase
  - Custom
- Blocked gate state:
  - Assign value evidence owner
  - Open Steward gate rationale
  - Review linked Source event commercial blockers
  - Custom
- Ambiguous context:
  - Show context used
  - Select a phase to inspect
  - Open program resume state
  - Custom

Forbidden suggestions include generic filler like `Tell me more`, `Analyze this`, or `Ask AI`.

## 9. Workflow state rendering

- Program state machine: `Origination`, `Charter`, `Diagnose`, `Design`, `Execute`, `Verify`
- Gate states: `ready`, `pending`, `blocked`, `warning`, `deferred`
- Completed phases are de-emphasized but still auditable.
- Blocked states require visible reasons and missing inputs.
- Future states remain read-only and cannot be advanced from this page.

## 10. File attachment behavior

- Attachments belong in the Evidence drawer or Deliverable detail drawer, not in the top-level page shell.
- Supported types: `PDF`, `DOCX`, `PPTX`, `XLSX/CSV`, screenshots, diagrams
- Default classifications: `evidence_candidate` or `deliverable_artifact`
- Failed conversions must render `stored but not yet usable as evidence`.

## 11. Cross-surface consistency

- Program phase and gate labels must match Programs list, Tower program impact, and related runbooks.
- Program IDs and Source event IDs must remain canonical.
- Agent names must remain `Nexus`, `Sentinel`, `Steward`, and `Atlas`.
- Deliverable evidence coverage must match shared program/evidence surfaces.

## 12. Failure modes this page must prevent

- Generic program coaching disconnected from the current phase and gate
- Chat-first layouts with no work-object orientation
- Fake approval or implied gate transition
- Evidence laundering through deliverables with no support
- Workshop theater with no agenda, tensions, or evidence-to-capture
- Drift between program detail and linked Source or Tower surfaces

## 13. Acceptance criteria

- Five-question test passes above the fold.
- Canonical shell and AbarVa visual rules are preserved.
- Program phase, gate, workshop, deliverables/evidence, and next action all render within first scroll depth.
- Apex Retail seeded program identity is preserved with no generic placeholders.
- Suggested actions remain context-generated and useful.

## 14. Persona walkthrough

- Persona: Client Maestro or transformation lead managing the current program.
- Goal: decide how to move the program into the next decision or gate.
- First three seconds: the user sees the program header, Nexus brief, current phase/gate, and next workshop/readiness posture.
- Turn 1: open the linked Source event to understand downstream commercial blockers.
- Turn 2: review gate rationale and missing evidence.
- Turn 3: assign the next program action, such as confirming Workshop 5 outputs or designating an evidence owner.
- Exit state: the user understands the current program journey, the blocker set, and the next recommended move.

