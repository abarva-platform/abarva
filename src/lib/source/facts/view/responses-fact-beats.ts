import type { SourceEventArchetype } from '@/lib/source/archetypes/types';
import type { ResponseStatus } from '@/lib/source/facts/event-facts-reader';
import type {
  StageGateView,
  StageTaskView,
  TaskReviewRowView,
} from '@/components/source/canvas/analytics/view-model';

export const RESPONSES_STAGE_KEY = 'responses';

export interface VendorResponseCoverage {
  vendors: readonly string[];
  statusByVendorLever: ReadonlyMap<string, ReadonlyMap<string, ResponseStatus>>;
}

export interface ResponsesFactBeatInput {
  archetype: SourceEventArchetype;
  vendorResponses?: VendorResponseCoverage;
  nextStageName: string | null;
}

function coverageFor(input: ResponsesFactBeatInput) {
  const rules = input.archetype.valueLeverRules ?? [];
  const vendors = input.vendorResponses?.vendors ?? [];
  let observed = 0;
  let addressed = 0;
  let partial = 0;
  let dodged = 0;
  const rows: TaskReviewRowView[] = rules.map((rule) => {
    let seenForRule = 0;
    for (const vendor of vendors) {
      const status = input.vendorResponses?.statusByVendorLever.get(vendor)?.get(rule.key);
      if (!status) continue;
      seenForRule++;
      observed++;
      if (status === 'addressed') addressed++;
      else if (status === 'partial') partial++;
      else dodged++;
    }
    return {
      key: rule.name,
      value: `${seenForRule} of ${vendors.length} observed vendors mapped`,
      flag: seenForRule < vendors.length || vendors.length === 0,
    };
  });
  return {
    rules,
    vendors,
    rows,
    observed,
    addressed,
    partial,
    dodged,
    expected: vendors.length * rules.length,
  };
}

export function buildResponsesFactDerivedTasks(
  input: ResponsesFactBeatInput,
): readonly StageTaskView[] {
  const coverage = coverageFor(input);
  return [{
    id: 'responses.coverage',
    title: 'Review vendor response coverage',
    subtitle: `${coverage.observed} observed vendor-lever cells · ${coverage.rules.length} value levers`,
    type: 'provide',
    state: 'todo',
    guide: `Record one answer per vendor and lever in the response matrix. This event evaluates ${coverage.rules.map((rule) => rule.name).join('; ')}. An absent cell is not a dodged answer.`,
    rows: coverage.rows,
    provenance: {
      owner: 'Sourcing lead',
      source: 'Vendor response coverage facts',
    },
    cta: 'Review response coverage',
    factTemplateCode: 'RESPONSE_COVERAGE_V1',
  }];
}

export function buildResponsesFactDerivedGate(
  input: ResponsesFactBeatInput,
): StageGateView {
  const coverage = coverageFor(input);
  const missing = coverage.expected - coverage.observed;
  const coverageDetail = coverage.vendors.length === 0
    ? 'No vendor response coverage has been observed for this event. The invited supplier set and response completeness require independent review.'
    : `${coverage.addressed} addressed, ${coverage.partial} partial and ${coverage.dodged} dodged; ${missing} vendor-lever cells not observed. These are observed vendors only, not proof that every invited supplier responded.`;

  return {
    approver: input.archetype.requiredStakeholders[0] ?? 'Decision owner',
    confirms: [
      {
        label: coverage.vendors.length === 0
          ? 'No vendor response cells observed'
          : `${coverage.observed} of ${coverage.expected} observed vendor-lever cells mapped`,
        detail: coverageDetail,
      },
      {
        label: `${coverage.rules.length} archetype value levers to review`,
        detail: coverage.rules.map((rule) => `${rule.name}: ${rule.evaluationImpact}`).join('; '),
      },
      {
        label: 'Review response set for evaluation',
        detail: input.nextStageName
          ? `Confirm the submitted response set and unresolved gaps under the governed gate before advancing to ${input.nextStageName}.`
          : 'Confirm the submitted response set and unresolved gaps under the governed gate before closing.',
      },
    ],
    generates: input.archetype.deliverablePack
      .filter((item) => item.stage === RESPONSES_STAGE_KEY)
      .map((item) => ({ label: item.label })),
    nextStageName: input.nextStageName,
  };
}
