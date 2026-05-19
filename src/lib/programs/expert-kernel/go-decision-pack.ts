// Expert Kernel — go-decision pack.
//
// The FINAL Mobilize artifact. It assembles the Mobilize phase outputs — the
// business-case skeleton, the adoption & change approach, the Tower
// measurement handoff — into a single decision packet a CXO acts on, in-app
// and exportable.
//
// The pack does NOT re-run the kernel and does NOT re-derive economics. It
// evaluates Mobilize READINESS — owned, adoptable, measurable — against the
// Mobilize playbook's kill triggers, and renders a go-decision verdict that
// honestly absorbs the business case's own recommendation.
//
// Verdict logic, deterministic:
//   - any fired kill trigger (incl. measurement_unwired) → 'no_go'
//   - business case 'kill'                               → 'no_go'
//   - business case 'shape' OR a non-blocking adoption concern that the
//     change approach has not cleared                    → 'conditional_go'
//   - otherwise                                          → 'go'
//
// Honesty rule: the pack NEVER hides the business-case critic findings or the
// fired kill triggers — they are rendered verbatim (playbook trap
// `pack_without_critic`).
//
// Pure module: deterministic, no I/O.

import type { BusinessCaseSkeleton } from './business-case-compiler';
import type { AdoptionApproach } from './adoption-approach';
import type { MeasurementHandoff } from './measurement-handoff';
import { MOBILIZE_PLAYBOOK, type KillTrigger } from './phase-playbooks/mobilize';

/** The Mobilize go-decision verdict. */
export type GoDecision = 'go' | 'conditional_go' | 'no_go';

/** A kill trigger that fired, with the observation that fired it. */
export interface FiredKillTrigger {
  trigger: KillTrigger;
  /** The concrete observation in this Move that fired it. */
  observation: string;
}

/** A condition that must be met before a `conditional_go` becomes a `go`. */
export interface GoCondition {
  code: string;
  condition: string;
}

export interface GoDecisionPackInput {
  /** The Design & Plan business-case skeleton. */
  businessCase: BusinessCaseSkeleton;
  /** The Mobilize adoption & change approach. */
  adoption: AdoptionApproach;
  /** The Mobilize value-measurement → Tower handoff. */
  measurement: MeasurementHandoff;
}

/** An exportable line in the decision packet. */
export interface PackSection {
  heading: string;
  /** Plain-text lines — render as-is in-app and in the export. */
  lines: string[];
}

export interface GoDecisionPack {
  moveName: string;
  tenantKey: string;
  /** The final verdict. */
  decision: GoDecision;
  /** Plain-language rationale for the verdict. */
  rationale: string;
  /** Kill triggers that fired — verbatim, never hidden. */
  firedKillTriggers: FiredKillTrigger[];
  /** For a conditional go: what must be true to upgrade it to a go. */
  conditions: GoCondition[];
  /** The business case's own recommendation, carried through. */
  businessCaseRecommendation: BusinessCaseSkeleton['recommendation'];
  /** Mobilize readiness flags — the three Mobilize questions, answered. */
  readiness: {
    owned: boolean;
    adoptable: boolean;
    measurable: boolean;
  };
  /** The assembled, exportable sections. */
  sections: PackSection[];
}

/** Evaluate which Mobilize kill triggers fired for this Move. */
function evaluateKillTriggers(
  input: GoDecisionPackInput,
): FiredKillTrigger[] {
  const fired: FiredKillTrigger[] = [];
  const trigger = (code: string): KillTrigger => {
    const t = MOBILIZE_PLAYBOOK.killTriggers.find((k) => k.code === code);
    if (!t) throw new Error(`Unknown Mobilize kill trigger: ${code}`);
    return t;
  };

  // no_operating_model_owner — the defining Mobilize kill trigger.
  if (input.adoption.ownerGap) {
    fired.push({
      trigger: trigger('no_operating_model_owner'),
      observation:
        'The adoption approach records no operating-model owner who has ' +
        'accepted accountability for running the Move after go-live.',
    });
  }

  // adoption_unfunded — change & adoption workstream has zero effort.
  const changeWs = input.businessCase.effort.workstreams.find(
    (w) => w.id === 'change_adoption',
  );
  if (!changeWs || changeWs.baseCost <= 0) {
    fired.push({
      trigger: trigger('adoption_unfunded'),
      observation:
        'The Design & Plan effort estimate carries no budgeted change & ' +
        'adoption workstream, yet the value forecast assumes an adoption ' +
        'curve.',
    });
  }

  // measurement_unwired — a committed metric has no baseline.
  if (!input.measurement.loopCloses) {
    fired.push({
      trigger: trigger('measurement_unwired'),
      observation:
        `${input.measurement.unwiredMetrics.length} committed value ` +
        `metric(s) cannot be wired to a recorded baseline: ` +
        `${input.measurement.unwiredMetrics
          .map((m) => m.label)
          .join(', ')}.`,
    });
  }

  // business_case_blocker_open — the business-case critic has a blocker.
  if (input.businessCase.critic.hasBlocker) {
    fired.push({
      trigger: trigger('business_case_blocker_open'),
      observation:
        `The business-case critic has ${input.businessCase.critic.blockers.length} ` +
        'open blocker(s): ' +
        input.businessCase.critic.blockers.map((b) => b.code).join(', ') +
        '.',
    });
  }

  return fired;
}

/**
 * Assemble the go-decision pack. Deterministic — evaluates Mobilize readiness
 * and the playbook kill triggers, then renders the verdict and the exportable
 * sections.
 */
export function buildGoDecisionPack(
  input: GoDecisionPackInput,
): GoDecisionPack {
  const { businessCase, adoption, measurement } = input;
  const firedKillTriggers = evaluateKillTriggers(input);

  // Mobilize readiness — the three Mobilize questions, answered honestly.
  const owned = !adoption.ownerGap;
  const adoptionBlocker = adoption.risks.some((r) => r.severity === 'blocker');
  const adoptable = !adoptionBlocker;
  const measurable = measurement.loopCloses;
  const readiness = { owned, adoptable, measurable };

  // Verdict.
  let decision: GoDecision;
  let rationale: string;
  const conditions: GoCondition[] = [];

  if (firedKillTriggers.length > 0 || businessCase.recommendation === 'kill') {
    decision = 'no_go';
    const reasons: string[] = [];
    if (firedKillTriggers.length > 0) {
      reasons.push(
        `${firedKillTriggers.length} Mobilize kill trigger(s) fired ` +
          `(${firedKillTriggers.map((f) => f.trigger.code).join(', ')})`,
      );
    }
    if (businessCase.recommendation === 'kill') {
      reasons.push('the business case recommends kill');
    }
    rationale =
      `No-go: ${reasons.join(' and ')}. The Move is not ready to leave ` +
      'Moves. See the fix-conditions for what must change before it is ' +
      'reconsidered.';
    for (const f of firedKillTriggers) {
      conditions.push({
        code: f.trigger.code,
        condition: f.trigger.fixCondition,
      });
    }
  } else if (businessCase.recommendation === 'shape') {
    // The Move clears every Mobilize kill trigger but the Design & Plan
    // business case still recommends shaping — proceed conditionally.
    decision = 'conditional_go';
    rationale =
      'Conditional go: the Move clears every Mobilize readiness gate, but ' +
      'the business case recommends shaping. Proceed only once the ' +
      'conditions below are met — they are tracked, not waived.';
    conditions.push({
      code: 'resolve_business_case_concerns',
      condition:
        'Resolve the business-case shaping items: ' +
        businessCase.recommendationRationale,
    });
  } else {
    decision = 'go';
    rationale =
      'Go: the business case holds with no open blocker, the Move has a ' +
      'named operating-model owner, the adoption approach supports the ' +
      'modelled adoption curve, and every committed metric is wired to a ' +
      'baseline and handed to Tower. The value loop closes.';
  }

  // Exportable sections — the in-app panels and the export share this shape.
  const sections: PackSection[] = [
    {
      heading: 'Go-decision',
      lines: [
        `Move: ${businessCase.moveName}`,
        `Tenant: ${businessCase.tenantKey}`,
        `Decision: ${decision.toUpperCase().replace('_', ' ')}`,
        `Business-case recommendation: ${businessCase.recommendation}`,
        rationale,
      ],
    },
    {
      heading: 'Mobilize readiness',
      lines: [
        `Owned (named operating-model owner): ${owned ? 'yes' : 'NO'}`,
        `Adoptable (change approach supports the curve): ${
          adoptable ? 'yes' : 'NO'
        }`,
        `Measurable (value loop closes to Tower): ${
          measurable ? 'yes' : 'NO'
        }`,
        `Operating-model owner: ${adoption.operatingModelOwner ?? 'NOT NAMED'}`,
        `Overall change load: ${adoption.overallChangeLoad}`,
        `Adoption confidence: ${adoption.adoptionConfidence}`,
      ],
    },
    {
      heading: 'Economics (from the business case)',
      lines: [
        `Investment range: ${businessCase.economics.investment.low} – ` +
          `${businessCase.economics.investment.high}`,
        `Net return range: ${businessCase.economics.netReturn.low} – ` +
          `${businessCase.economics.netReturn.high}`,
        `Payback (months): ${
          businessCase.economics.paybackMonths ?? 'not monetisable'
        }`,
        `Monetisable: ${businessCase.economics.monetisable ? 'yes' : 'no'}`,
      ],
    },
    {
      heading: 'Critic findings (surfaced verbatim — never hidden)',
      lines:
        businessCase.critic.findings.length === 0
          ? ['The critic raised no findings.']
          : businessCase.critic.findings.map(
              (f) => `[${f.severity}/${f.lens}] ${f.code}: ${f.message}`,
            ),
    },
    {
      heading: 'Fired kill triggers',
      lines:
        firedKillTriggers.length === 0
          ? ['No Mobilize kill trigger fired.']
          : firedKillTriggers.flatMap((f) => [
              `${f.trigger.code}: ${f.observation}`,
              `  Fix-condition: ${f.trigger.fixCondition}`,
            ]),
    },
    {
      heading: 'Conditions to clear',
      lines:
        conditions.length === 0
          ? ['No open conditions.']
          : conditions.map((c) => `${c.code}: ${c.condition}`),
    },
    {
      heading: 'Adoption & change approach',
      lines: [
        `Impacted roles: ${adoption.impactedRoles
          .map((r) => r.role)
          .join(', ')}`,
        `Total impacted headcount: ${
          adoption.totalImpactedHeadcount ?? 'not recorded'
        }`,
        `Hypercare window: ${adoption.hypercareWeeks} week(s)`,
        ...adoption.risks.map(
          (r) => `[${r.severity}] ${r.code}: ${r.message}`,
        ),
      ],
    },
    {
      heading: 'Value-measurement handoff to Tower',
      lines: [
        `Metrics committed: ${measurement.metrics.length}`,
        `Wired to a baseline: ${measurement.wiredMetrics.length} ` +
          `(coverage ${Math.round(measurement.wiringCoverage * 100)}%)`,
        `Value loop closes: ${measurement.loopCloses ? 'yes' : 'NO'}`,
        ...measurement.metrics.map(
          (m) =>
            `- ${m.label}: baseline ${
              m.baselineValue ?? 'SEED GAP'
            } → target ${m.targetValue ?? 'TBD'} (${m.cadence}, owner ${
              m.measurementOwnerRole
            })`,
        ),
      ],
    },
  ];

  return {
    moveName: businessCase.moveName,
    tenantKey: businessCase.tenantKey,
    decision,
    rationale,
    firedKillTriggers,
    conditions,
    businessCaseRecommendation: businessCase.recommendation,
    readiness,
    sections,
  };
}

/** Render the go-decision pack as a plain-text export. Deterministic. */
export function renderGoDecisionPackText(pack: GoDecisionPack): string {
  const out: string[] = [
    `GO-DECISION PACK — ${pack.moveName} (${pack.tenantKey})`,
    '='.repeat(64),
    '',
  ];
  for (const section of pack.sections) {
    out.push(section.heading);
    out.push('-'.repeat(section.heading.length));
    for (const line of section.lines) out.push(line);
    out.push('');
  }
  return out.join('\n');
}
