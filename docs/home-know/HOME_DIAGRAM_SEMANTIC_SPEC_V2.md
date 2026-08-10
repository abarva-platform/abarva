# Home Diagram Semantic Spec V2

`HomeDiagramSemanticSpecV2` is the required source of truth before any Claude-assisted Home diagram
can become a runtime asset.

Claude may propose visual grouping and concise language. It must not create facts, numbers,
relationships, calculations, current-state labels, target states, gates, or approval status.

## Required Shape

```ts
interface HomeDiagramSemanticSpecV2 {
  specId: string;
  tenantKey: string;
  snapshotId: string;
  effectiveDate: string;
  lifecycleState:
    | "draft"
    | "semantic_validation_pass"
    | "human_review_approved"
    | "publication_approved";
  diagrams: HomeSemanticDiagram[];
  allowedValues: HomeAllowedValue[];
  calculations: HomeRegisteredCalculation[];
  claims: HomeNarrativeClaim[];
  publicationGate: HomePublicationGate;
}
```

## Diagram Semantics

```ts
interface HomeSemanticDiagram {
  diagramId: string;
  tab: "summary" | "patterns" | "context" | "economics" | "architecture" | "posture" | "coherence" | "trajectory" | "watchlist" | "evidence";
  title: string;
  purpose: string;
  nodes: HomeSemanticNode[];
  relationships: HomeSemanticRelationship[];
  annotations: HomeSemanticAnnotation[];
}

interface HomeSemanticNode {
  nodeId: string;
  label: string;
  state: "current" | "directional" | "hypothesis" | "target" | "unknown";
  scope: string;
  evidenceRefs: string[];
  confidence: "high" | "moderate" | "limited";
}

interface HomeSemanticRelationship {
  relationshipId: string;
  fromNodeId: string;
  toNodeId: string;
  label: string;
  relationshipType: string;
  state: "current" | "directional" | "hypothesis" | "target" | "unknown";
  evidenceRefs: string[];
  confidence: "high" | "moderate" | "limited";
}
```

## Numbers And Claims

```ts
interface HomeAllowedValue {
  valueId: string;
  label: string;
  value: number | string;
  unit: string;
  scope: string;
  denominator?: string;
  effectiveDate: string;
  evidenceRefs: string[];
  overlapGroup?: string;
}

interface HomeRegisteredCalculation {
  calculationId: string;
  label: string;
  formula: string;
  inputs: string[];
  outputValueId: string;
  roundingRule: string;
  overlapCheck: "pass" | "fail" | "not_applicable";
}

interface HomeNarrativeClaim {
  claimId: string;
  text: string;
  claimType: "observed" | "derived" | "hypothesis";
  evidenceRefs: string[];
  counterEvidenceRefs: string[];
  confidence: "high" | "moderate" | "limited";
  scope: string;
  effectiveDate: string;
  moduleBoundary: "home" | "intelligence" | "moves" | "source" | "tower";
}
```

## Publication Gate

```ts
interface HomePublicationGate {
  semanticValidationStatus: "not_run" | "pass" | "fail";
  humanReviewStatus: "not_reviewed" | "approved" | "rejected";
  deterministicRendererStatus: "not_run" | "pass" | "fail";
  runtimePublicationStatus: "blocked" | "approved";
}
```

## Non-Negotiable Validations

- Every visible number resolves to `HomeAllowedValue`.
- Every calculation resolves to `HomeRegisteredCalculation` and passes overlap checks.
- Unknown values remain unknown and are never converted to zero.
- Every node and relationship has state, scope, evidence, and confidence.
- Future state and gates require approved strategy, approved Move, or explicitly labeled planning
  hypothesis with authority source.
- Story claims remain balanced across enterprise identity, strengths, capabilities in motion,
  constraints, direction, and uncertainty.
- Home routes deeper action to Intelligence, Moves, Source, or Tower; it does not issue module-owned
  decisions.
