import type { SourceEventArchetype } from '@/lib/source/archetypes/types';
import type {
  StageGateView,
  StageTaskView,
  TaskReviewRowView,
} from '@/components/source/canvas/analytics/view-model';

export const RFP_STAGE_KEY = 'rfp';

export interface RfpFactBeatInput {
  archetype: SourceEventArchetype;
  presentLeverKeys?: ReadonlySet<string>;
  nextStageName: string | null;
}

function clauseCoverage(input: RfpFactBeatInput) {
  const rules = input.archetype.valueLeverRules ?? [];
  const observed = rules.filter((rule) => input.presentLeverKeys?.has(rule.key)).length;
  const rows: TaskReviewRowView[] = rules.map((rule) => {
    const present = input.presentLeverKeys?.has(rule.key) ?? false;
    return {
      key: rule.name,
      value: present ? 'Included-clause fact observed' : 'Included clause not confirmed',
      flag: !present,
    };
  });
  return { rules, observed, rows };
}

export function buildRfpFactDerivedTasks(input: RfpFactBeatInput): readonly StageTaskView[] {
  const coverage = clauseCoverage(input);
  return [{
    id: 'rfp.clause-coverage',
    title: 'Review RFP clause evidence',
    subtitle: `${coverage.observed} of ${coverage.rules.length} included-clause facts observed`,
    type: 'provide',
    state: 'todo',
    guide: `Review the RFP clause checklist against the archetype requirements: ${coverage.rules.map((rule) => `${rule.name}: ${rule.rfpClause}`).join('; ')}. A missing inclusion fact is not proof that a clause is absent.`,
    rows: coverage.rows,
    provenance: {
      owner: 'Sourcing lead',
      source: 'RFP clause coverage facts',
    },
    cta: 'Review clause coverage',
    factTemplateCode: 'RFP_CLAUSES_V1',
  }];
}

export function buildRfpFactDerivedGate(input: RfpFactBeatInput): StageGateView {
  const coverage = clauseCoverage(input);
  const unconfirmed = coverage.rules.length - coverage.observed;
  return {
    approver: input.archetype.requiredStakeholders[0] ?? 'Decision owner',
    confirms: [
      {
        label: input.presentLeverKeys === undefined
          ? 'No clause checklist observed'
          : `${coverage.observed} of ${coverage.rules.length} value-lever clauses evidenced`,
        detail: input.presentLeverKeys === undefined
          ? 'No per-lever included-clause signal has been observed for this event. Clause coverage requires review.'
          : `${unconfirmed} value-lever clauses are not confirmed by an included-clause fact. This does not prove that they are absent or that the RFP is approved.`,
      },
      {
        label: `${coverage.rules.length} archetype clause requirements to review`,
        detail: coverage.rules.map((rule) => `${rule.name}: ${rule.rfpClause}`).join('; '),
      },
      {
        label: 'Review package and release authority',
        detail: input.nextStageName
          ? `Confirm the governed package, recipients and approvals before advancing to ${input.nextStageName}.`
          : 'Confirm the governed package, recipients and approvals before closing.',
      },
    ],
    generates: input.archetype.deliverablePack
      .filter((item) => item.stage === RFP_STAGE_KEY)
      .map((item) => ({ label: item.label })),
    nextStageName: input.nextStageName,
  };
}
