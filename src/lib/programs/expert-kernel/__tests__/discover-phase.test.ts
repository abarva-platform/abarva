// Expert Kernel — Discover phase playbook + deliverables tests.
//
// Covers: the playbook (question tree / traps / kill triggers), the four
// Discover deliverables, the Apex-grounded case, and 2 golden + 2 adversarial
// cases. Every module is pure and deterministic — these assert behaviour.

import {
  discoverPlaybook,
  buildDiscoverDeliverables,
  type DiscoverDeliverablesInput,
} from '../phase-playbooks/discover';
import { buildApexContactCenterDiscover } from '../phase-playbooks/apex-discover-case';
import type { BaselineMetricInput } from '../baseline-model';

// ---------------------------------------------------------------------------
// playbook — question tree, traps, kill triggers
// ---------------------------------------------------------------------------

describe('discoverPlaybook', () => {
  it('returns the contact-centre walk for human_in_loop_agent', () => {
    const pb = discoverPlaybook('human_in_loop_agent');
    const ids = pb.questionTree.map((q) => q.id);
    // The canonical contact-centre diagnostic path.
    for (const id of [
      'cc_call_volume',
      'cc_handle_time',
      'cc_containment',
      'cc_transfer_rate',
      'cc_qa_error_rate',
      'cc_labour_cost',
      'cc_channel_mix',
      'cc_tooling',
      'cc_deflection_history',
      'cc_workforce_constraints',
      'cc_compliance_exposure',
    ]) {
      expect(ids).toContain(id);
    }
  });

  it('shares the contact-centre walk with the assistant archetype', () => {
    expect(discoverPlaybook('assistant').questionTree).toEqual(
      discoverPlaybook('human_in_loop_agent').questionTree,
    );
  });

  it('falls back to the generic spine for other archetypes', () => {
    const pb = discoverPlaybook('data_remediation');
    expect(pb.questionTree.every((q) => q.id.startsWith('gen_'))).toBe(true);
    expect(pb.questionTree.length).toBeGreaterThan(0);
  });

  it('every question names its required evidence', () => {
    for (const arch of ['human_in_loop_agent', 'generic'] as const) {
      for (const q of discoverPlaybook(arch).questionTree) {
        expect(q.requiredEvidence.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('marks volume and unit-cost as sizing-blocking for contact centre', () => {
    const pb = discoverPlaybook('human_in_loop_agent');
    const blocking = pb.questionTree.filter((q) => q.blocksSizing).map((q) => q.id);
    expect(blocking).toContain('cc_call_volume');
    expect(blocking).toContain('cc_labour_cost');
  });

  it('carries phase traps and kill triggers with a no-go path', () => {
    const pb = discoverPlaybook('human_in_loop_agent');
    expect(pb.traps.length).toBeGreaterThan(0);
    expect(pb.killTriggers.some((k) => k.effect === 'no-go')).toBe(true);
    expect(pb.killTriggers.some((k) => k.effect === 'reshape')).toBe(true);
    // Every trap states its mitigation; every trigger states its condition.
    expect(pb.traps.every((t) => t.mitigation.trim().length > 0)).toBe(true);
    expect(pb.killTriggers.every((k) => k.condition.trim().length > 0)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

/** A fully-recorded contact-centre baseline — used by golden cases. */
function fullBaseline(): BaselineMetricInput[] {
  return [
    {
      key: 'containment_pct',
      label: 'Containment',
      value: 30,
      unit: 'percent',
      source: 'ACD',
      sourceQuality: 'measured',
      asOf: '2026-05-01',
      confidence: 'high',
    },
    {
      key: 'contact_volume_annual',
      label: 'Annual contact volume',
      value: 9_000_000,
      unit: 'contacts_per_year',
      source: 'ACD platform export',
      sourceQuality: 'measured',
      asOf: '2026-05-01',
      confidence: 'high',
    },
    {
      key: 'cost_per_contact_usd',
      label: 'Cost per contact',
      value: 6.4,
      unit: 'usd',
      source: 'Finance',
      sourceQuality: 'measured',
      asOf: '2026-05-01',
      confidence: 'high',
    },
  ];
}

// ---------------------------------------------------------------------------
// Discover deliverables
// ---------------------------------------------------------------------------

describe('buildDiscoverDeliverables', () => {
  it('builds all four deliverables and a go/no-go', () => {
    const d = buildDiscoverDeliverables({
      moveName: 'M',
      tenantKey: 't',
      archetype: 'human_in_loop_agent',
      problemStatement: 'Containment is below target.',
      anchorMetricKey: 'containment_pct',
      baselineMetrics: fullBaseline(),
      opportunityStatement: 'Lift containment.',
    });
    expect(d.problemStatement.statement.length).toBeGreaterThan(0);
    expect(d.baseline.metrics.length).toBe(3);
    expect(d.opportunity.statement.length).toBeGreaterThan(0);
    expect(['go', 'reshape', 'no-go']).toContain(d.goNoGo.decision);
  });
});

// ---------------------------------------------------------------------------
// GOLDEN CASE 1 — full data → 'go', opportunity expressible in dollars
// ---------------------------------------------------------------------------

describe('golden case 1 — clean contact-centre Discover', () => {
  it('returns go with a dollars-expressible opportunity', () => {
    const d = buildDiscoverDeliverables({
      moveName: 'Routing Move',
      tenantKey: 't',
      archetype: 'human_in_loop_agent',
      problemStatement: 'Containment 30% vs 42% target.',
      anchorMetricKey: 'containment_pct',
      baselineMetrics: fullBaseline(),
      opportunityStatement: 'Lift containment, cut cost-to-serve.',
    });
    expect(d.goNoGo.decision).toBe('go');
    expect(d.goNoGo.firedKillTriggers).toHaveLength(0);
    expect(d.opportunity.expressibleAs).toBe('dollars');
    expect(d.problemStatement.anchorIsMeasured).toBe(true);
    expect(d.unansweredSizingQuestions).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// GOLDEN CASE 2 — generic archetype, full data → 'go'
// ---------------------------------------------------------------------------

describe('golden case 2 — generic archetype clean Discover', () => {
  it('returns go using the generic spine', () => {
    const d = buildDiscoverDeliverables({
      moveName: 'Generic Move',
      tenantKey: 't',
      archetype: 'process_redesign',
      problemStatement: 'Order cycle time above target.',
      anchorMetricKey: 'cycle_time_days',
      baselineMetrics: [
        {
          key: 'cycle_time_days',
          label: 'Cycle time',
          value: 12,
          unit: 'days',
          source: 'ERP',
          sourceQuality: 'measured',
          asOf: '2026-05-01',
          confidence: 'high',
        },
        {
          key: 'cost_per_unit_usd',
          label: 'Cost per order',
          value: 40,
          unit: 'usd',
          source: 'Finance',
          sourceQuality: 'measured',
          asOf: '2026-05-01',
          confidence: 'medium',
        },
      ],
      opportunityStatement: 'Compress the order cycle.',
    });
    expect(d.goNoGo.decision).toBe('go');
    expect(d.opportunity.expressibleAs).toBe('dollars');
  });
});

// ---------------------------------------------------------------------------
// ADVERSARIAL CASE 1 — no measured problem at all → genuine 'no-go'
// ---------------------------------------------------------------------------

describe('adversarial case 1 — no measured problem', () => {
  it('returns a genuine no-go when the baseline has no recorded metric', () => {
    const d = buildDiscoverDeliverables({
      moveName: 'Vibes Move',
      tenantKey: 't',
      archetype: 'human_in_loop_agent',
      problemStatement: 'Leadership feels the contact centre is slow.',
      anchorMetricKey: null,
      baselineMetrics: [
        {
          key: 'aht_minutes',
          label: 'AHT',
          value: null,
          unit: 'minutes',
          source: 'seed gap',
          sourceQuality: 'absent',
          asOf: '2026-05-19',
          confidence: 'low',
          seedGapReason: 'Not recorded — no ACD instrumentation seeded.',
        },
      ],
      opportunityStatement: 'Make the contact centre faster.',
    });
    // The go/no-go MUST be able to say no.
    expect(d.goNoGo.decision).toBe('no-go');
    expect(d.goNoGo.firedKillTriggers.some((t) => t.code === 'kill_no_measured_problem')).toBe(
      true,
    );
    expect(d.problemStatement.anchorIsMeasured).toBe(false);
    expect(d.opportunity.expressibleAs).toBe('directional');
  });
});

// ---------------------------------------------------------------------------
// ADVERSARIAL CASE 2 — thin data + observed compliance kill → 'no-go'
// ---------------------------------------------------------------------------

describe('adversarial case 2 — compliance kill trigger fires', () => {
  it('returns no-go when a no-go kill trigger is observed', () => {
    const input: DiscoverDeliverablesInput = {
      moveName: 'Transcript Move',
      tenantKey: 't',
      archetype: 'human_in_loop_agent',
      problemStatement: 'Containment 28% vs 40% target.',
      anchorMetricKey: 'containment_pct',
      baselineMetrics: [
        {
          key: 'containment_pct',
          label: 'Containment',
          value: 28,
          unit: 'percent',
          source: 'ACD',
          sourceQuality: 'measured',
          asOf: '2026-05-01',
          confidence: 'medium',
        },
      ],
      opportunityStatement: 'Lift containment with transcript-driven routing.',
      observedKillTriggerCodes: ['kill_cc_compliance_blocks'],
    };
    const d = buildDiscoverDeliverables(input);
    expect(d.goNoGo.decision).toBe('no-go');
    expect(
      d.goNoGo.firedKillTriggers.some((t) => t.code === 'kill_cc_compliance_blocks'),
    ).toBe(true);
  });

  it('thin data without a hard kill returns reshape with fix conditions', () => {
    const d = buildDiscoverDeliverables({
      moveName: 'Thin Move',
      tenantKey: 't',
      archetype: 'human_in_loop_agent',
      problemStatement: 'Containment 28% vs 40% target.',
      anchorMetricKey: 'containment_pct',
      baselineMetrics: [
        {
          key: 'containment_pct',
          label: 'Containment',
          value: 28,
          unit: 'percent',
          source: 'ACD',
          sourceQuality: 'measured',
          asOf: '2026-05-01',
          confidence: 'medium',
        },
        {
          key: 'contact_volume_annual',
          label: 'Annual contact volume',
          value: null,
          unit: 'contacts_per_year',
          source: 'seed gap',
          sourceQuality: 'absent',
          asOf: '2026-05-19',
          confidence: 'low',
          seedGapReason: 'Not recorded.',
        },
        {
          key: 'cost_per_contact_usd',
          label: 'Cost per contact',
          value: null,
          unit: 'usd',
          source: 'seed gap',
          sourceQuality: 'absent',
          asOf: '2026-05-19',
          confidence: 'low',
          seedGapReason: 'Not recorded.',
        },
      ],
      opportunityStatement: 'Lift containment.',
    });
    expect(d.goNoGo.decision).toBe('reshape');
    expect(d.goNoGo.fixConditions.length).toBeGreaterThan(0);
    expect(d.opportunity.expressibleAs).toBe('directional');
  });
});

// ---------------------------------------------------------------------------
// Apex-grounded Discover case
// ---------------------------------------------------------------------------

describe('Apex Contact Center AI Routing — Discover', () => {
  const d = buildApexContactCenterDiscover();

  it('is grounded on the audited Apex substrate, not fabrication', () => {
    expect(d.tenantKey).toBe('apex-retail');
    expect(d.archetype).toBe('human_in_loop_agent');
    // Recorded metrics are real KPIs.
    const recorded = d.baseline.recordedMetrics.map((m) => m.key);
    expect(recorded).toContain('containment_pct');
    expect(recorded).toContain('aht_minutes');
    // The four absent items are honest seed gaps.
    const gaps = d.baseline.seedGaps.map((g) => g.key);
    expect(gaps).toEqual(
      expect.arrayContaining([
        'cost_per_contact_usd',
        'contact_volume_annual',
        'channel_mix',
        'qa_error_rate_pct',
      ]),
    );
    expect(d.baseline.seedGaps.every((g) => Boolean(g.seedGapReason))).toBe(true);
  });

  it('anchors the problem on a measured metric', () => {
    expect(d.problemStatement.anchorMetricKey).toBe('containment_pct');
    expect(d.problemStatement.anchorIsMeasured).toBe(true);
  });

  it('expresses the opportunity directionally — volume + cost are seed gaps', () => {
    expect(d.opportunity.expressibleAs).toBe('directional');
    expect(d.opportunity.cappedBySeedGaps).toEqual(
      expect.arrayContaining(['contact_volume_annual', 'cost_per_contact_usd']),
    );
  });

  it('returns a genuinely grounded reshape — not a rubber-stamp go', () => {
    // The Apex Discover go/no-go is honest: the volume + cost seed gaps fire
    // reshape kill triggers, so the Move advances only after they close.
    expect(d.goNoGo.decision).toBe('reshape');
    expect(d.goNoGo.firedKillTriggers.map((t) => t.code)).toEqual(
      expect.arrayContaining(['kill_cc_no_unit_cost', 'kill_cc_no_volume']),
    );
    expect(d.goNoGo.fixConditions.length).toBeGreaterThan(0);
    // No compliance no-go observed — the privacy review is expected to clear.
    expect(d.goNoGo.firedKillTriggers.some((t) => t.effect === 'no-go')).toBe(false);
  });

  it('flags the sizing-blocking questions still unanswered', () => {
    const unanswered = d.unansweredSizingQuestions.map((q) => q.id);
    expect(unanswered).toContain('cc_call_volume');
    expect(unanswered).toContain('cc_labour_cost');
  });
});
