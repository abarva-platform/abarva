// Tower · Regulatory-scoped risk lens · Wave C1 · view model.
//
// Pure transforms that classify Tower risk lines into a regulatory
// dimension and roll the regulatory subset into its own lens, with
// legal-privileged disclosure scoping carried through.
//
// Expert value: a CXO reading the Tower risk view should see "the
// SR 11-7 model validation gate is a regulatory control gap" as a
// distinct lens — not as one schedule line among many. Folding
// regulatory exposure into generic delivery risk hides exactly the
// thing a regulated-AI program is judged on.
//
// No clock, no randomness, no I/O — consumes already-built risk lines.

import type { DisclosureClassification } from '@/lib/source/disclosure-flag';
import { isPrivilegedClassification } from '@/lib/source/disclosure-flag';
import {
  RISK_SEVERITIES,
  type ClassifiedRiskLine,
  type RegulatoryRegime,
  type RegulatoryRiskLensView,
  type RegulatoryRiskSummary,
  type RiskKind,
  type RiskSeverity,
  type TowerRiskLineInput,
} from './types';

/** Human-readable label for a regulatory regime. */
export function regulatoryRegimeLabel(regime: RegulatoryRegime): string {
  switch (regime) {
    case 'sr_11_7_model_risk':
      return 'SR 11-7 model risk';
    case 'bsa_aml':
      return 'BSA/AML';
    case 'fair_lending':
      return 'Fair lending';
    case 'consent_order':
      return 'Consent order';
    case 'data_privacy':
      return 'Data privacy';
    default:
      return 'Other regulatory';
  }
}

/** Severity sort weight — most severe first. */
const SEVERITY_ORDER: Record<RiskSeverity, number> = {
  critical: 3,
  high: 2,
  moderate: 1,
  low: 0,
};

/**
 * Classify one risk line.
 *
 * The regulatory dimension is decided by `regime`: a line with a
 * regulatory regime IS a regulatory control gap and is classified
 * `regulatory` regardless of any caller-supplied `kind`. A line with no
 * regime keeps its caller-supplied `kind`, defaulting to `delivery` when
 * the caller gave neither — the safe non-regulatory default.
 */
export function classifyRiskLine(
  input: TowerRiskLineInput,
): ClassifiedRiskLine {
  const regime: RegulatoryRegime | null = input.regime ?? null;
  const kind: RiskKind = regime ? 'regulatory' : input.kind ?? 'delivery';
  const isRegulatory = kind === 'regulatory';
  const disclosure: DisclosureClassification = input.disclosure ?? 'none';
  const privileged = isPrivilegedClassification(disclosure);

  return {
    id: input.id,
    subjectRef: input.subjectRef,
    title: input.title,
    detail: input.detail,
    severity: input.severity,
    kind,
    regime,
    isRegulatory,
    disclosure,
    privileged,
    executiveReadout: buildExecutiveReadout(
      input.title,
      input.severity,
      kind,
      regime,
      privileged,
    ),
  };
}

/**
 * Compose the executive readout. For a regulatory line it names the
 * exposure as a *control gap against a named regime* — the explicit
 * "regulatory control gap, not a schedule slip" framing the scenario
 * demands. Privileged lines carry a disclosure caveat.
 */
function buildExecutiveReadout(
  title: string,
  severity: RiskSeverity,
  kind: RiskKind,
  regime: RegulatoryRegime | null,
  privileged: boolean,
): string {
  const privilegeSuffix = privileged
    ? ' This risk line is legal-privileged — scope disclosure to counsel-controlled channels.'
    : '';

  if (kind === 'regulatory' && regime) {
    return `${title} is a ${severity}-severity regulatory control gap against ${regulatoryRegimeLabel(regime)} — it must be read as a compliance exposure, not a delivery slip.${privilegeSuffix}`;
  }
  return `${title} is a ${severity}-severity ${kind} risk.${privilegeSuffix}`;
}

function emptySeverityCounts(): Record<RiskSeverity, number> {
  return { low: 0, moderate: 0, high: 0, critical: 0 };
}

/**
 * Build the reconciled regulatory-risk summary over the classified
 * lines. Reconciliation guarantee (test-enforced):
 * `sum(bySeverity) === regulatoryLineCount`.
 */
export function summarizeRegulatoryRisk(
  lines: readonly ClassifiedRiskLine[],
): RegulatoryRiskSummary {
  const regulatory = lines.filter((l) => l.isRegulatory);
  const bySeverity = emptySeverityCounts();
  const byRegime: Partial<Record<RegulatoryRegime, number>> = {};
  let elevatedRegulatoryCount = 0;
  let privilegedRegulatoryCount = 0;

  for (const line of regulatory) {
    bySeverity[line.severity] += 1;
    if (line.severity === 'high' || line.severity === 'critical') {
      elevatedRegulatoryCount += 1;
    }
    if (line.privileged) privilegedRegulatoryCount += 1;
    if (line.regime) {
      byRegime[line.regime] = (byRegime[line.regime] ?? 0) + 1;
    }
  }

  return {
    totalRiskLines: lines.length,
    regulatoryLineCount: regulatory.length,
    elevatedRegulatoryCount,
    privilegedRegulatoryCount,
    byRegime,
    bySeverity,
  };
}

/**
 * Build the full Tower regulatory-risk lens view for one portfolio:
 * classify every risk line, extract the regulatory subset sorted
 * most-severe first (tie-broken by id for determinism), and reconcile
 * the summary.
 */
export function buildRegulatoryRiskLensView(args: {
  readonly portfolioRef: string;
  readonly riskLines: readonly TowerRiskLineInput[];
}): RegulatoryRiskLensView {
  const allLines = args.riskLines.map(classifyRiskLine);

  const regulatoryLines = allLines
    .filter((l) => l.isRegulatory)
    .sort((a, b) => {
      const order = SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
      if (order !== 0) return order;
      return a.id.localeCompare(b.id);
    });

  return {
    portfolioRef: args.portfolioRef,
    allLines,
    regulatoryLines,
    summary: summarizeRegulatoryRisk(allLines),
  };
}

/** Re-exported canonical severity tuple for callers that need the list. */
export { RISK_SEVERITIES };
