// Canonical Source specs — single import surface.
//
// Three catalogs make up the per-stage spec:
//   - artifact specs    (what artifacts are required at each stage)
//   - gate criteria     (what must be true to advance from stage N → N+1)
//   - evidence reqs     (what data sources must reach min readiness)
//
// Plus the lead-agent-by-stage map (already in portfolio-derivations).
//
// These are the source of truth that DB seed migrations (Slice 2) and the
// auto-scaffolding flow (Slice 3) read from.

export {
  SOURCE_ARTIFACT_SPECS,
  specsForStage,
  requiredSpecsForStage,
  gateDefiningSpecsForStage,
  specByCode,
  type SourceArtifactSpec,
  type ArtifactRequirementLevel,
  type ArtifactDefaultTier,
} from './artifact-specs';

export {
  SOURCE_GATE_CRITERIA,
  criteriaForStage,
  hardCriteriaForStage,
  criteriaByArtifactCode,
  criterionById,
  type SourceGateCriterion,
  type GateCriterionSeverity,
} from './gate-criteria';

export {
  SOURCE_EVIDENCE_REQUIREMENTS,
  evidenceForStage,
  requiredEvidenceForStage,
  evidenceById,
  type SourceEvidenceRequirement,
  type EvidenceMinimumState,
} from './evidence-requirements';
