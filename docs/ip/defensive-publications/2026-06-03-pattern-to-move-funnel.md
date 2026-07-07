# Defensive Publication Draft: Pattern-to-Move Funnel

Date: 2026-06-03
Status: ready for external publication review
Audience: founder, patent counsel, product leadership, product architecture reviewers

This document is a defensive-publication draft. It is not legal advice and it
is not itself a public defensive publication while this repository remains
private. To complete the defensive-publication backlog item, publish a reviewed
version through a public channel and record the public URL.

## Abstract

AbarVa uses a pattern-to-Move funnel that converts enterprise signals and
authored industry patterns into human-approved strategic work. A pattern can be
detected from tenant context, cited as an explanation, tested against evidence,
promoted into a candidate Move, shaped into artifacts, and tracked through
approval and execution. The funnel separates pattern-level guidance from
client-specific evidence, requires source citations when pattern guidance drives
claims, and gates consequential promotion behind human approval.

## Problem

Enterprise AI systems often surface recommendations without a clear path from
generic pattern to accountable execution. This creates several risks:

- users cannot see whether a recommendation came from authored expertise,
  client evidence, or model inference;
- recommendations skip the step where pattern fit is validated against tenant
  facts;
- AI-generated opportunities turn into programs without explicit human
  approval;
- evidence and citations are lost between detection, brief creation, and
  execution;
- the corpus becomes advisory content rather than an operating system for
  governed work.

The disclosed funnel makes pattern use explicit, evidence-bound, and
approval-gated.

## Disclosure

The pattern-to-Move funnel has these properties:

1. The system stores authored patterns with applicability signals, anti-signals,
   evidence expectations, validation rules, artifact sections, and value levers.
2. Agents retrieve pattern guidance alongside tenant, program, source-event, or
   portfolio context.
3. Agent responses distinguish pattern-level guidance from client-specific
   evidence.
4. A detected pattern can remain exploratory, be dismissed, or be promoted into
   a candidate Move.
5. Promotion requires an approval packet containing the pattern basis, evidence
   references, confidence or uncertainty, risk caveats, and human justification.
6. The resulting Move keeps backlinks to the source pattern, tenant facts,
   evidence ids, and approving human.
7. Downstream artifacts and scorecards can cite the same pattern basis and
   evidence bundle instead of regenerating unsupported recommendations.
8. Validation fixtures can block workflow progression when required pattern
   sections, evidence, approvals, or artifact inputs are missing.

## Implementation Evidence

The current repository contains these concrete implementation points:

| Evidence | Path | What It Shows |
| --- | --- | --- |
| Pattern usage contract | `docs/platform-design/pattern-operating-model/05_AGENT_PATTERN_USAGE_CONTRACT.md` | Defines how Nexus, Sentinel, Atlas, and Steward use patterns and when citations are required. |
| Pattern validation model | `docs/platform-design/pattern-operating-model/07_PATTERN_TO_VALIDATION_MODEL.md` | Defines validation fixtures, outcome types, and approval readiness checks derived from patterns. |
| Pattern to product logic | `docs/platform-design/pattern-operating-model/08_PATTERN_TO_PRODUCT_LOGIC_MODEL.md` | Describes how patterns shape product behavior rather than remaining static content. |
| Intelligence implementation | `src/components/intelligence-v3/IntelligenceV3Page.tsx` | Frames Intelligence as the pattern-to-Move funnel surface. |
| Intelligence lens tabs | `src/components/intelligence/IntelligenceLensTabs.tsx` | Implements an attention strip and pattern queue in the Intelligence experience. |
| Cross-module trace view | `src/lib/programs/cross-module-trace-view.ts` | Links Intelligence pattern-to-Move context into Moves traceability. |
| AI generated UI catalog | `docs/legal/AI_GENERATED_UI_CATALOG.md` | Tracks pattern recommendation surfaces that need AI labels, citations, and confidence controls. |

## Example Funnel Record

The funnel can be represented as a governed transition record:

```ts
type PatternToMovePromotion = {
  tenantKey: string;
  patternId: string;
  sourceSurface: 'intelligence' | 'source' | 'tower' | 'setup-admin';
  evidenceIds: string[];
  antiSignalsReviewed: string[];
  confidenceLabel: 'low' | 'medium' | 'high';
  proposedMoveTitle: string;
  humanApproverId: string;
  humanJustification: string;
  createdMoveId?: string;
};
```

The pattern gives the system an expert hypothesis. The evidence and human
approval decide whether that hypothesis becomes accountable work.

## Novelty Framing For Counsel Review

This draft does not claim that business patterns, recommendation engines, or
workflow approvals are novel by themselves. The differentiating combination to
evaluate is:

- authored corpus patterns carry both reasoning content and workflow controls;
- agents must cite when pattern guidance shapes a claim or action;
- pattern recommendations are explicitly separated from tenant-specific facts;
- promotion from recommendation to Move requires a human approval packet;
- downstream artifacts inherit the same pattern/evidence provenance.

## Publication Notes

Before public posting, review for confidential implementation details and remove
non-public customer names, credentials, and pricing. Suggested public-publication
record fields:

- publication channel;
- public URL;
- publication timestamp;
- reviewer;
- version or commit hash;
- confidentiality review result.

## Related Internal Documents

- `docs/gtm/D3-PATENT-DECISION-MEMO.md`
- `docs/ip/ABARVA_PATENT_DISCLOSURE_PACKET_2026-05-14.md`
- `docs/platform-design/pattern-operating-model/05_AGENT_PATTERN_USAGE_CONTRACT.md`
