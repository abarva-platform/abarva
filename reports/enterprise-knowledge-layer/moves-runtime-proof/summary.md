# Moves Knowledge Runtime Proof

Status: PASS
Generated: 2026-07-14T00:00:00.000Z

## Flag

- name: "ENABLE_KNOWLEDGE_LAYER_MOVES_RUNTIME"
- defaultEnabled: false
- disabledStatus: "disabled"
- enabledStatuses: ["enabled","enabled","enabled"]

## Truth Split

- defaultMovesBehaviorChanged: false
- existingBehaviorUnchangedWhenFlagDisabled: true
- routeOrApiChanged: false
- createsKnowledgeContextPreviewOnlyWhenFlagEnabled: true
- claudeCalled: false
- claudeReadyPayloadPreparedButNotSentByAudit: true
- productionTenantDataWritten: false
- activeTenantAccessUpdated: false
- candidatePromoted: false
- moduleReadsCandidateByDefault: false
- deployRequired: false

## What This Proves

Moves can be the first controlled runtime consumer of the Enterprise Knowledge Layer behind an explicit non-default flag. When enabled, the runtime helper builds a phase-aware Moves context pack, prepares a reviewable Knowledge Context Preview artifact, and exposes a Claude-ready context payload for downstream generation input without calling Claude in this proof.

## What This Does Not Do

- Does not change existing default Moves behavior.
- Does not write production tenant data.
- Does not promote candidate data.
- Does not update Active Tenant Access.
- Does not attach Move evidence automatically.
- Does not send the payload to Claude during the audit.

## Scenario Results

| Scenario | Tenant | Phase | Status | Profiles | Relationships | Evidence | Gaps | Unsupported Claims | Artifact | Quality |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| Meridian Agent Assist / Member Service P2 | meridian-health | P2 Diagnose & Evidence Pressure-Test | enabled | 30 | 29 | 5 | 4 | 2 | meridian-health-runtime-meridian-agent-assist-p2-p2-knowledge-context-preview | Hits the mark for controlled Moves runtime preview: it gives phase context, shows what can be reviewed, preserves unsupported claims, and keeps Claude/model payloads governed. |
| Meridian Finance Analytics P1 | meridian-health | P1 Charter & Baseline | enabled | 50 | 49 | 5 | 4 | 2 | meridian-health-runtime-meridian-finance-p1-p1-knowledge-context-preview | Hits the mark for controlled Moves runtime preview: it gives phase context, shows what can be reviewed, preserves unsupported claims, and keeps Claude/model payloads governed. |
| Generic Vendor Onboarding P0 | meridian-health | P0 Intake & Decision Framing | enabled | 50 | 49 | 5 | 4 | 2 | meridian-health-runtime-generic-vendor-onboarding-p0-p0-knowledge-context-preview | Hits the mark for controlled Moves runtime preview: it gives phase context, shows what can be reviewed, preserves unsupported claims, and keeps Claude/model payloads governed. |

## Phase Contract

| Phase | Label | Status |
| --- | --- | --- |
| P0 | P0 Intake & Decision Framing | enabled |
| P1 | P1 Charter & Baseline | enabled |
| P2 | P2 Diagnose & Evidence Pressure-Test | enabled |
| P3 | P3 Options & Business Case | enabled |
| P4 | P4 Executive Decision & Commit | enabled |
| P5 | P5 Execution Handoff | enabled |

## Anti-Hardcoding Gate

- pass: true
- forbidden patterns: none
