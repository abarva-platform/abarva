# Next Slice: Executive Decision Summary

Date: 2026-04-26
Scope: deterministic executive decision foundation after BAFO and pricing readiness
Status: planned

## 1. Purpose

The executive decision summary slice creates a deterministic, read-only decision view that follows BAFO negotiation output into decision posture.

The output should make it easy for leadership to answer: can this source event move forward, or what is missing to reach a decision-ready state?

## 2. Relationship to BAFO / Negotiation

This slice consumes BAFO negotiation readiness and blockers to produce an executive decision posture:

- if BAFO blockers remain, status remains conditional or blocked;
- if commercial, evidence, and transition readiness are stable, status can move to ready with caveats;
- no new negotiation engine or scoring logic is introduced; BAFO outputs are mapped into decision framing only.

## 3. Relationship to Vendor Evaluation

Decision summary sits one layer above vendor evaluation:

- combines vendor completeness, commercial ask status, and evidence posture;
- preserves vendor-specific issues for leadership review;
- does not replace scorecards, scoring formulas, or evaluation workflows.

## 4. Executive Decision Question

The primary decision question should be rendered as:

- recommend proceed,
- recommend conditionally proceed,
- hold for remediation,
- or block until explicit remediation milestones are completed.

## 5. What Atlas Summarizes

Atlas should summarize deterministic decision context in board language:

- readiness posture per vendor group,
- high-risk blockers,
- assumption and exclusion pressure,
- transition timing versus commercial certainty.

## 6. What Nexus Recommends

Nexus recommendation should be concise and deterministic:

- next best action,
- top blockers to clear,
- minimal required clarifications,
- whether a recommendation lock is safe.

## 7. What Sentinel Cautions

Sentinel caution should include evidence and risk cautions:

- low-confidence claims,
- unresolved evidence flags,
- exclusions likely to cause post-award drift,
- commercial traps still active.

## 8. What Steward Blocks

Steward should block or gate when:

- assumptions remain unlocked,
- commercial blockers are unresolved,
- transition commitments are incomplete,
- evidence confidence is insufficient for recommendation lock.

## 9. Decision Options

Decision options should include:

- proceed with active conditions,
- proceed with explicit waivers,
- defer and run additional negotiation cycle,
- stop and return to source/refinement stage.

## 10. Value / Risk Summary

Decision summary should show:

- value upside direction,
- transition and adoption risk balance,
- evidence confidence ranking,
- commercial trap severity snapshot.

## 11. Evidence Confidence

Evidence confidence should be surfaced as:

- high,
- medium,
- low,
and should directly impact recommendation posture.

## 12. What Not to Build

- model calls,
- approval engine,
- final selection automation,
- document export/import,
- workflow engine changes,
- chat-based recommendation workflow.

## 13. Acceptance Criteria

The plan is acceptable when it:

- defines a deterministic executive decision framing,
- maps BAFO output into recommend/proceed/hold/block,
- identifies blockers and confidence explicitly,
- specifies decision roles (Atlas/Nexus/Sentinel/Steward),
- keeps scope to planning and governance messaging only.
