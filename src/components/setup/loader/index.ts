// Admin Loader — presentational UI components.
// Pure props-in / events-out; no data fetching, no server actions.
// See docs/build/setup-admin-loader/ for the workflow + wireframes.

export { DropZone, default as DropZoneDefault } from "./DropZone";
export type { DropZoneProps } from "./DropZone";

export {
  UnderstandingProgress,
  default as UnderstandingProgressDefault,
} from "./UnderstandingProgress";
export type {
  UnderstandingProgressProps,
  UnderstandingPhase,
  UnderstandingPhaseStatus,
} from "./UnderstandingProgress";

export {
  ReviewTable,
  LOADER_DIMENSION_LABELS,
  default as ReviewTableDefault,
} from "./ReviewTable";
export type { ReviewTableProps, ReviewRowAction } from "./ReviewTable";

export {
  ClarificationStep,
  clarificationKey,
  default as ClarificationStepDefault,
} from "./ClarificationStep";
export type { ClarificationStepProps } from "./ClarificationStep";

export {
  AskStewardDock,
  default as AskStewardDockDefault,
} from "./AskStewardDock";
export type { AskStewardDockProps, StewardMessage } from "./AskStewardDock";

export {
  LandingZonePanel,
  default as LandingZonePanelDefault,
} from "./LandingZonePanel";
export type {
  LandingZonePanelProps,
  LandingZoneHelperLink,
} from "./LandingZonePanel";

export {
  LoaderStatePills,
  LOADER_LIFECYCLE_STAGES,
  default as LoaderStatePillsDefault,
} from "./LoaderStatePills";
export type {
  LoaderStatePillsProps,
  LoaderLifecycleStage,
  LoaderStageStatus,
} from "./LoaderStatePills";
