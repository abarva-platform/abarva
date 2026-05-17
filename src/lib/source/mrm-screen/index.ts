// Source · MRM-readiness vendor screen · Wave C1 · public surface.
//
// GAP-5 from FIRSTCAPITAL-LOOP-WIRING-GAPS.md: a hard pass/fail vendor
// screen against SR 11-7 model-risk-management readiness, applied before
// TCO comparison so vendors that cannot support model validation are
// screened out up front.

export {
  MRM_CRITERIA,
  MRM_CRITICAL_CRITERION_IDS,
  getMrmCriterion,
} from './criteria';
export {
  buildMrmScreenView,
  screenVendorForMrmReadiness,
  summarizeMrmScreen,
  vendorsEligibleForTco,
} from './screen';
export {
  MRM_CRITERION_GRADES,
  MRM_CRITERION_IDS,
  MRM_SCREEN_VERDICTS,
  type MrmCriterionAssessment,
  type MrmCriterionDefinition,
  type MrmCriterionGrade,
  type MrmCriterionId,
  type MrmCriterionResult,
  type MrmScreenSummary,
  type MrmScreenVerdict,
  type MrmScreenView,
  type MrmVendorScreenInput,
  type MrmVendorScreenResult,
} from './types';
