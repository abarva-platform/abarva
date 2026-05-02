export { corpus, loadCorpus } from './loader';
export type { CorpusEntity, LoadedCorpus, LoaderConfig } from './types';
export {
  METRIC_RECORDS,
  getMetricRecordById,
  getMetricRecordsByIndustryDomain,
  getTier1MetricRecords,
  summarizeMetricCoverage,
  validateMetricRecords,
} from './metric-records';
export type {
  GapClass,
  MetricDomain,
  MetricFoundationRequirements,
  MetricIndustry,
  MetricMaturityStatus,
  MetricPriorityTier,
  MetricRange,
  MetricRecord,
  MetricVendorLandscapeEntry,
} from './metric-records';
export { SOURCE_LIFECYCLE_PATTERNS, PAT_SRC_AMS_001, PAT_SRC_RFP_001 } from './source-lifecycle-patterns';
export {
  SOURCING_CATEGORY_PATTERNS,
  SOURCING_CATEGORY_PATTERN_COUNT,
  SOURCING_CATEGORY_PATTERN_IDS,
} from './seed-patterns-sourcing-categories';
export type {
  PatternKind,
  SourceEventPatternId,
  StageId,
  LifecycleStage,
  GateType,
  GateCriterion,
  ArtifactRequirement,
  ExpectedArtifact,
  SourcingCategory,
  VendorClass,
  VendorLandscapeTier,
  PricingModel,
  RiskSeverity,
  SourceBasisType,
  IndustryVariantKey,
  SourceBasisRef,
  VendorLandscapeEntry,
  PricingBenchmark,
  ContractClauseTemplate,
  NegotiationLever,
  RiskFactor,
  IndustryVariant,
  PerStageGates,
  PerStageArtifacts,
  SourcingPatternExtensions,
  ContradictionTemplate,
  FailureMode,
  LifecyclePatternSeed,
} from './seed-types';
