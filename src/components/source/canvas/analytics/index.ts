// Source analytics canvas — public surface (the redesigned three-beat page).
//
// Platform default behind the `source_analytics` flag: Source event routes render
// `SourceAnalyticsCanvas` for every tenant.

export { SourceAnalyticsCanvas } from './SourceAnalyticsCanvas';
export { ScopeAnalyticsStage } from './ScopeAnalyticsStage';
export { IntelPanel } from './IntelPanel';
export { TaskChecklist } from './TaskChecklist';
export { ScopeGate } from './ScopeGate';
export { ValueTypeChip, ValueTypeLegend } from './ValueTypeChip';
export { ValueWaterfall } from './ValueWaterfall';
export { AvaLauncher } from './AvaLauncher';
export { AnalyticsStageRail } from './AnalyticsStageRail';
export {
  StepInsightPanel,
  ValuePoolInsight,
  ValueBridgeInsight,
  ShouldCostInsight,
} from './insights';
export {
  SAMPLE_SCOPE_STAGE,
  SAMPLE_SCOPE_AVA,
} from './sample-view-model';
export {
  SAMPLE_STRATEGY_STAGE,
  SAMPLE_STRATEGY_AVA,
} from './strategy-sample-view-model';
export type {
  AvaLauncherView,
  FactConfidence,
  FactSourceCitation,
  GateConfirmView,
  GateDeliverableView,
  IntelPointTone,
  IntelPointView,
  IntelProvenance,
  ShouldCostInsightView,
  ShouldCostVendorView,
  SourceIntelViewModel,
  StageAnalyticsView,
  StageGateActionView,
  StageGateView,
  StageTaskView,
  StepInsightKind,
  StepInsightView,
  ValueBridgeInsightView,
  ValuePoolBarView,
  ValuePoolInsightView,
  TaskFileView,
  TaskProvenanceView,
  TaskReviewRowView,
  TaskState,
  TaskTemplateView,
  TaskType,
  ValueType,
  ValueUnit,
  ValueWaterfallBandView,
  ValueWaterfallView,
} from './view-model';
