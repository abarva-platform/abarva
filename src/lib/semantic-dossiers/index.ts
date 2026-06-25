export { routeDimensionQuestion } from "./dimension-router";
export { buildUniversalDimensionDossier } from "./build-universal-dimension-dossier";
export { composeDossierAnswer } from "./compose-dossier-answer";
export {
  CURATED_DOSSIER_PROMPT_VERSION,
  loadCuratedSemanticDossier,
  type CuratedDossierBranchOption,
  type CuratedDossierLoadResult,
} from "./curated-dossier-store";
export type {
  BuildUniversalDimensionDossierInput,
  DimensionRoute,
  DossierAnswer,
  DossierArtifactType,
  DossierDimensionFamily,
  DossierFact,
  DossierGap,
  DossierRecord,
  DossierSourceCoverage,
  DossierSourceRequirement,
  DossierSurface,
  UniversalDimensionDossier,
} from "./types";
