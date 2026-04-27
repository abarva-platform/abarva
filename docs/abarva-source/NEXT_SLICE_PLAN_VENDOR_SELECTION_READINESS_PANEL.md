# NEXT SLICE: Vendor Selection Readiness Panel

## 1) Purpose
Create a bounded Source event canvas panel for vendor selection readiness. The panel should present deterministic synthesis from executive decision and readiness models without introducing any selection automation.

This slice is a planning artifact to define behavior before implementation.

## 2) Relationship to Executive Decision Summary
The panel is a presentation layer for the output of `buildSourceVendorSelectionReadiness`, which already consumes:

- Executive decision synthesis (`SourceExecutiveDecisionSummary`)
- Commercial signals (`SourceCommercialSignals`)
- Stage-gate state (`SourceStageGateReadiness`)
- Artifact evidence posture (`SourceArtifactStatusStripSeed` via model input)

It should not recompute these inputs; it should only project the canonical fields into a clear operator view.

## 3) Relationship to Stage Gates / Artifacts / Evidence
The panel must surface the same blocking logic used by the readiness model:

- Selection posture and readiness status
- Vendor viability and blockers
- Unresolved commercial / evidence / gate issues
- Required artifacts and approvals before selection review
- Suggested next action and executive implication
- Relevant steward / sentinel notes

Any issue shown in the panel must map back to:
- `unresolvedCommercialIssues`
- `unresolvedEvidenceIssues`
- `unresolvedGateIssues`

## 4) Placement in Event Canvas
The panel should appear in the active Source event workspace next to other deterministic decision surfaces after Executive Decision and before workflow-specific comparison visuals.

- Preferred location: `SourceActiveStageWorkspace` selection-readiness section.
- Fallback: panel rendered under existing Source decision surfaces when placement is gated by workspace layout.
- Must not replace BAFO or executive panel; it is an additional summary surface.

## 5) Fields to Show
Minimum fields:

- Selection readiness status
- Selection posture
- Selection review readiness (`true/false`)
- Viable vendors
- Blocked vendors
- Unresolved commercial issues
- Unresolved evidence issues
- Unresolved gate issues
- Required artifacts
- Required approvals
- Recommended next action
- Atlas executive implication
- Steward gate note

Optional but useful:

- Source modules used
- Next action owner/context for deterministic handoff

## 6) Agent Behavior Mapping

- **Nexus**: shows readiness posture, recommended next action, and evidence-required remediation.
- **Sentinel**: shows unresolved evidence cautions and unresolved evidence issues.
- **Steward**: highlights gate/approval blockers and required approvals.
- **Atlas**: surfaces executive implications and tradeoff framing for review planning.

## 7) What Not to Build
- No final vendor selection.
- No approval workflow or action execution from the panel.
- No chat/model calls from the panel.
- No artifact upload/parse/persistence interaction.
- No workflow engine hooks; no routing decisions beyond navigation to already-existing surfaces.

## 8) Acceptance Criteria
- Panel is deterministic from `SourceVendorSelectionReadiness` input.
- Panel omits selection actions beyond guidance.
- Blocker visibility is explicit and attributable to `commercial`, `evidence`, or `gate` origin.
- Panel is included in Source event canvas with no symbol-heavy or full-dashboard visual treatment.
- Existing tests for model determinism and import boundaries remain unaffected.

## 9) Design Compliance Notes
- Use compact table/list hybrid presentation.
- Keep within existing Source design language: off-white/warm-white background and restrained accents.
- Use minimal icons and minimal card chrome.
- Keep action posture concise; no dense narrative blocks.
- Ensure no decorative or fabricated symbol usage and no generic chatbot framing.
