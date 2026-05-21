// Healthcare Function Packs — clinical operations & documentation and
// patient access, engagement & experience.
//
// These two packs extend the healthcare reference depth beyond the value-
// based-care spine. This suite asserts each one meets the §6 depth bar
// (FUNCTION_PACK_DEPTH_MINIMUMS), is reachable through resolveFunctionPack,
// and — for the clinical-documentation pack — is grounded against the real
// audited Meridian Health "Ambient Clinical Value Chain Activation" substrate.

import {
  FUNCTION_PACK_DEPTH_MINIMUMS,
  REQUIRED_DELIVERABLE_ARTIFACTS,
} from '../function-pack-types';
import {
  checkFunctionPackDepth,
  resolveFunctionPack,
} from '../function-pack-registry';
import { clinicalOperationsDocumentationPack } from '../healthcare/clinical-operations-documentation';
import { patientAccessEngagementExperiencePack } from '../healthcare/patient-access-engagement-experience';

describe('clinicalOperationsDocumentationPack — §6 depth bar', () => {
  const pack = clinicalOperationsDocumentationPack;

  it('resolves through the registry under its (industry, function) key', () => {
    expect(
      resolveFunctionPack(
        'healthcare-provider',
        'clinical_operations_documentation',
      ),
    ).toBe(pack);
  });

  it('passes the machine-checkable depth bar with no shortfalls', () => {
    const result = checkFunctionPackDepth(pack);
    expect(result.shortfalls).toEqual([]);
    expect(result.passes).toBe(true);
  });

  it('meets every §6 minimum layer count', () => {
    expect(pack.operatingMetrics.length).toBeGreaterThanOrEqual(
      FUNCTION_PACK_DEPTH_MINIMUMS.operatingMetrics,
    );
    expect(pack.painThemes.length).toBeGreaterThanOrEqual(
      FUNCTION_PACK_DEPTH_MINIMUMS.painThemes,
    );
    expect(pack.aiUseCaseArchetypes.length).toBeGreaterThanOrEqual(
      FUNCTION_PACK_DEPTH_MINIMUMS.aiUseCaseArchetypes,
    );
    expect(pack.referenceSolutionPatterns.length).toBeGreaterThanOrEqual(
      FUNCTION_PACK_DEPTH_MINIMUMS.referenceSolutionPatterns,
    );
    expect(pack.evidenceAnchors.length).toBeGreaterThanOrEqual(
      FUNCTION_PACK_DEPTH_MINIMUMS.evidenceAnchors,
    );
  });

  it('carries an outline for each of the four Moves phase artifacts', () => {
    const artifacts = pack.deliverableOutlines.map((o) => o.artifact).sort();
    expect(artifacts).toEqual([...REQUIRED_DELIVERABLE_ARTIFACTS].sort());
  });

  it('specifies ambient clinical documentation as the marquee archetype', () => {
    const ambient = pack.aiUseCaseArchetypes.find(
      (a) => a.key === 'ambient_clinical_documentation',
    );
    expect(ambient).toBeDefined();
    expect(ambient?.valueMechanism.trim().length).toBeGreaterThan(0);
    expect(ambient?.controlPosture).toBe('human-in-the-loop');
  });

  it('grounds its operating metrics against the audited Meridian substrate', () => {
    // The Meridian Ambient Clinical case recorded real audited baselines
    // (meridian-ambient-clinical-case.ts). Those figures must sit inside the
    // planning ranges of the corresponding pack metrics.
    const byKey = new Map(pack.operatingMetrics.map((m) => [m.key, m]));

    // Pajama time — Meridian primary-care baseline ~129 min/day (E17).
    const pajama = byKey.get('after_hours_documentation_minutes');
    expect(pajama).toBeDefined();
    expect(129).toBeGreaterThanOrEqual(pajama!.benchmarkRange.low);
    expect(129).toBeLessThanOrEqual(pajama!.benchmarkRange.high);

    // Note sign-to-close — Meridian baseline ~11.4 hours (E8).
    const note = byKey.get('note_sign_to_close_hours');
    expect(note).toBeDefined();
    expect(11.4).toBeGreaterThanOrEqual(note!.benchmarkRange.low);
    expect(11.4).toBeLessThanOrEqual(note!.benchmarkRange.high);

    // CDI HCC-relevant query volume — Meridian baseline ~40/week (E25).
    const cdi = byKey.get('cdi_query_rate');
    expect(cdi).toBeDefined();
    expect(40).toBeGreaterThanOrEqual(cdi!.benchmarkRange.low);
    expect(40).toBeLessThanOrEqual(cdi!.benchmarkRange.high);

    // HCC capture — Meridian MA-panel baseline ~58% (E28).
    const hcc = byKey.get('hcc_capture_rate');
    expect(hcc).toBeDefined();
    expect(58).toBeGreaterThanOrEqual(hcc!.benchmarkRange.low);
    expect(58).toBeLessThanOrEqual(hcc!.benchmarkRange.high);

    // MBI-HSS emotional-exhaustion burnout — Meridian baseline ~54% (E2).
    const burnout = byKey.get('mbi_burnout_signal');
    expect(burnout).toBeDefined();
    expect(54).toBeGreaterThanOrEqual(burnout!.benchmarkRange.low);
    expect(54).toBeLessThanOrEqual(burnout!.benchmarkRange.high);

    // Every benchmark stays a labelled planning range — never an asserted fact.
    for (const metric of pack.operatingMetrics) {
      expect(metric.benchmarkRange.label).toBe('planning-range');
    }
  });
});

describe('patientAccessEngagementExperiencePack — §6 depth bar', () => {
  const pack = patientAccessEngagementExperiencePack;

  it('resolves through the registry under its (industry, function) key', () => {
    expect(
      resolveFunctionPack(
        'healthcare-provider',
        'patient_access_engagement_experience',
      ),
    ).toBe(pack);
  });

  it('passes the machine-checkable depth bar with no shortfalls', () => {
    const result = checkFunctionPackDepth(pack);
    expect(result.shortfalls).toEqual([]);
    expect(result.passes).toBe(true);
  });

  it('meets every §6 minimum layer count', () => {
    expect(pack.operatingMetrics.length).toBeGreaterThanOrEqual(
      FUNCTION_PACK_DEPTH_MINIMUMS.operatingMetrics,
    );
    expect(pack.painThemes.length).toBeGreaterThanOrEqual(
      FUNCTION_PACK_DEPTH_MINIMUMS.painThemes,
    );
    expect(pack.aiUseCaseArchetypes.length).toBeGreaterThanOrEqual(
      FUNCTION_PACK_DEPTH_MINIMUMS.aiUseCaseArchetypes,
    );
    expect(pack.referenceSolutionPatterns.length).toBeGreaterThanOrEqual(
      FUNCTION_PACK_DEPTH_MINIMUMS.referenceSolutionPatterns,
    );
    expect(pack.evidenceAnchors.length).toBeGreaterThanOrEqual(
      FUNCTION_PACK_DEPTH_MINIMUMS.evidenceAnchors,
    );
  });

  it('carries an outline for each of the four Moves phase artifacts', () => {
    const artifacts = pack.deliverableOutlines.map((o) => o.artifact).sort();
    expect(artifacts).toEqual([...REQUIRED_DELIVERABLE_ARTIFACTS].sort());
  });

  it('is the highest-bet-density function — specifies the five access archetypes', () => {
    // The task fixes a floor of >= 5 fully-specified archetypes for this
    // function: AI scheduling/triage, the digital front door, contact-centre
    // assist, patient comms/outreach, and referral management.
    const keys = pack.aiUseCaseArchetypes.map((a) => a.key);
    expect(keys.length).toBeGreaterThanOrEqual(5);
    for (const expected of [
      'ai_scheduling_and_triage',
      'digital_front_door',
      'contact_centre_assist',
      'patient_communications_outreach',
      'referral_management_intelligence',
    ]) {
      expect(keys).toContain(expected);
    }
    // Every archetype carries a value mechanism — the §6 hard fail.
    for (const archetype of pack.aiUseCaseArchetypes) {
      expect(archetype.valueMechanism.trim().length).toBeGreaterThan(0);
    }
  });

  it('carries the named access operating metrics with planning-range benchmarks', () => {
    const keys = new Set(pack.operatingMetrics.map((m) => m.key));
    for (const expected of [
      'third_next_available_appointment',
      'no_show_rate',
      'digital_self_scheduling_adoption',
      'call_abandonment_rate',
      'average_speed_of_answer',
      'first_contact_resolution',
      'patient_portal_activation_rate',
      'referral_to_appointment_conversion',
      'network_leakage_rate',
      'patient_experience_score',
    ]) {
      expect(keys.has(expected)).toBe(true);
    }
    for (const metric of pack.operatingMetrics) {
      expect(metric.benchmarkRange.label).toBe('planning-range');
      expect(metric.benchmarkRange.high).toBeGreaterThanOrEqual(
        metric.benchmarkRange.low,
      );
    }
  });
});
