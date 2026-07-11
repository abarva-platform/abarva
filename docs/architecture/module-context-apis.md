# Module Context APIs

Status: official architecture baseline.

Modules consume tenant intelligence through governed APIs, not random local tables.

| API | Purpose | Inputs | Target layers/views |
| --- | --- | --- | --- |
| getHomeContext | Home enterprise profile, known/unknown, gaps, chart inputs, readiness. | tenantKey, contractVersion? | Evidence Registry, Canonical Fact Store, Derived Intelligence, Graph |
| getIntelligenceContext | CXO advisory packet with facts, claims, citations, blocked claims, product capabilities. | tenantKey, question, intent, contractVersion? | Access/Dossier Layer, Derived Intelligence, Product Capability Registry |
| getMoveContext | Move phase packet with evidence, gaps, graph dependencies, commitments, readiness. | tenantKey, moveId, phase | Canonical Fact Store, Graph, Module Memory, Outcome Ledger |
| getSourceContext | Sourcing opportunity and commercial leverage packet. | tenantKey, sourceEventId, stage | Evidence Registry, Vendor/Commercial facts, Source Memory, Outcome Ledger |
| getTowerContext | Outcome ledger and value tracking packet. | tenantKey, portfolio/move/source scope | Outcome Ledger, Metric Definitions, Risks/Controls |
| getArtifactContext | Validated export packet with lineage and citations. | tenantKey, artifactId or module packet | Artifact Layer, Evidence Registry, Access Layer |
| getGraphContext | Typed relationship slice for a module question or object. | tenantKey, object ids, relationship filters | Enterprise Relationship Graph |
| getEvidenceCoverage | Coverage, freshness, and source authority by topic/module. | tenantKey, scope | Evidence Registry, Derived Intelligence |
| getAnswerabilityScore | Can AbarVa safely answer a topic with current evidence? | tenantKey, topic/question | Derived Intelligence, Product Capability Registry |
| validateClaimAgainstSources | Claim-to-source guard for client-facing answers and artifacts. | tenantKey, claim, evidence refs | Evidence Registry, Canonical Fact Store |
| promoteModuleMemory | Governed promotion of module memory to candidate facts. | tenantKey, moduleEventId, approval | Module Memory, Canonical Fact Store |
| computeOutcomeMeasurement | Tower measurement and value confidence computation. | tenantKey, valueCommitmentId | Outcome Ledger |
| computeSourceOpportunity | Source opportunity score and vendor leverage. | tenantKey, sourceEventId or category | Vendor/Commercial Estate, Benchmarks |
| computeMoveReadiness | Move phase/gate readiness score. | tenantKey, moveId, phase | Moves Memory, Evidence Registry, Graph |
| computeValueConfidence | Confidence in projected/committed/measured value. | tenantKey, value object | Outcome Ledger, Evidence Registry |
| computeStrategyExecutionTraceability | Trace strategy -> Move -> Source -> Tower outcomes. | tenantKey, strategy/object scope | All common layers |
