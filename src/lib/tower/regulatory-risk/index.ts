// Tower · Regulatory-scoped risk lens · Wave C1 · public surface.
//
// GAP-7 from FIRSTCAPITAL-LOOP-WIRING-GAPS.md: a regulatory dimension on
// the Tower risk view so a CXO sees regulatory exposure as its own lens
// — a control gap against a named regime — rather than folded into
// generic delivery risk. Carries legal-privileged disclosure scoping
// (GAP-9) through to the regulatory risk line.

export {
  RISK_SEVERITIES,
  buildRegulatoryRiskLensView,
  classifyRiskLine,
  regulatoryRegimeLabel,
  summarizeRegulatoryRisk,
} from './regulatory-risk-lens';
export {
  REGULATORY_REGIMES,
  RISK_KINDS,
  type ClassifiedRiskLine,
  type RegulatoryRegime,
  type RegulatoryRiskLensView,
  type RegulatoryRiskSummary,
  type RiskKind,
  type RiskSeverity,
  type TowerRiskLineInput,
} from './types';
