/**
 * TD-4 — TenantRecord -> EnterpriseAgentContextItem mapper · unit tests.
 *
 * Covers all 7 record kinds from the design doc §3.1 mapping table
 * with realistic payloads pulled from the meridian-health setup
 * dataset, plus null-handling and classification mapping.
 */

jest.mock('server-only', () => ({}));

import {
  mapTenantRecordToContextItem,
  mapTenantRecordsToContextItems,
} from '../mapper';
import type { TenantRecord } from '../types';

const TENANT = 'meridian-health';

function makeRecord(overrides: Partial<TenantRecord> & Pick<TenantRecord, 'segmentId' | 'recordKind' | 'recordId' | 'title'>): TenantRecord {
  return {
    tenantKey: TENANT,
    payload: {},
    ...overrides,
  };
}

describe('mapTenantRecordToContextItem — per record_kind', () => {
  it('maps systems_inventory -> system with vendor / criticality / renewal / owner', () => {
    const record = makeRecord({
      segmentId: 'it_landscape',
      recordKind: 'systems_inventory',
      recordId: 'it_landscape:system:meridian:epic-hyperspace',
      title: 'Epic Hyperspace',
      classification: 'restricted',
      payload: {
        vendor: 'Epic',
        category: 'Inpatient EHR',
        business_criticality: 'Critical',
        renewal_date: '2027-06-30',
        owner_id: 'person:meridian:maya-ramos',
        annual_cost_usd: 9_200_000,
      },
    });

    const item = mapTenantRecordToContextItem(record);

    expect(item).not.toBeNull();
    expect(item!.kind).toBe('system');
    expect(item!.id).toBe('tenant-data:it_landscape:system:meridian:epic-hyperspace');
    expect(item!.title).toBe('Epic Hyperspace');
    expect(item!.summary).toContain('Epic');
    expect(item!.summary).toContain('Inpatient EHR');
    expect(item!.summary).toContain('criticality critical');
    expect(item!.summary).toContain('renewal 2027-06-30');
    expect(item!.summary).toContain('owner person:meridian:maya-ramos');
    expect(item!.provenanceIds).toEqual(
      expect.arrayContaining([
        'it_landscape:system:meridian:epic-hyperspace',
        'person:meridian:maya-ramos',
      ]),
    );
    expect(item!.sensitivity).toBe('l4_raw');
    expect(item!.dataClassification).toBe('restricted');
  });

  it('maps kpi_definition -> kpi_metric with full provenance triple', () => {
    const record = makeRecord({
      segmentId: 'kpi_dictionary',
      recordKind: 'kpi_definition',
      recordId: 'kpi_dictionary:kpi:meridian:001',
      title: 'ALOS adjusted for observation conversion',
      classification: 'internal',
      payload: {
        current_value: '51.1%',
        target_fy2026: '56.4%',
        source_system: 'system:meridian:epic-ambulatory',
        data_owner: 'person:meridian:harold-kim',
        confidence: 0.9,
      },
    });

    const item = mapTenantRecordToContextItem(record);

    expect(item).not.toBeNull();
    expect(item!.kind).toBe('kpi_metric');
    expect(item!.id).toBe('tenant-data:kpi_dictionary:kpi:meridian:001');
    expect(item!.summary).toContain('current 51.1%');
    expect(item!.summary).toContain('target 56.4%');
    expect(item!.summary).toContain('source system:meridian:epic-ambulatory');
    expect(item!.summary).toContain('data owner person:meridian:harold-kim');
    expect(item!.summary).toContain('confidence 0.9');
    expect(item!.provenanceIds).toEqual(
      expect.arrayContaining([
        'kpi_dictionary:kpi:meridian:001',
        'system:meridian:epic-ambulatory',
        'person:meridian:harold-kim',
      ]),
    );
    expect(item!.sensitivity).toBe('summary');
  });

  it('maps program_record -> program and surfaces open contradiction', () => {
    const record = makeRecord({
      segmentId: 'program_inventory',
      recordKind: 'program_record',
      recordId: 'program_inventory:meridian-prior-auth-2026',
      title: 'Prior Authorization Automation',
      classification: 'internal',
      payload: {
        current_phase_name: 'P4 Build',
        sponsor: 'person:meridian:patricia-okafor',
        program_lead: 'person:meridian:david-henderson',
        budget_approved_usd: 14_200_000,
        budget_consumed_usd: 5_200_000,
        open_contradiction: 'Cohere is both prior-auth vendor and DENIALS-2024 vendor',
      },
    });

    const item = mapTenantRecordToContextItem(record);

    expect(item).not.toBeNull();
    expect(item!.kind).toBe('program');
    expect(item!.title).toBe('Prior Authorization Automation');
    expect(item!.summary).toContain('P4 Build');
    expect(item!.summary).toContain('sponsor person:meridian:patricia-okafor');
    expect(item!.summary).toContain('lead person:meridian:david-henderson');
    expect(item!.summary).toContain('budget 5200000/14200000');
    expect(item!.summary).toContain('OPEN CONTRADICTION: Cohere is both prior-auth vendor and DENIALS-2024 vendor');
    expect(item!.provenanceIds).toEqual(
      expect.arrayContaining([
        'program_inventory:meridian-prior-auth-2026',
        'person:meridian:patricia-okafor',
        'person:meridian:david-henderson',
      ]),
    );
  });

  it('maps evidence_claim -> evidence with claim, source, confidence, caveat', () => {
    const record = makeRecord({
      segmentId: 'evidence_ledger',
      recordKind: 'evidence_claim',
      recordId: 'evidence_ledger:ev:meridian:001',
      title: 'Clinician documentation time baseline',
      classification: 'internal',
      payload: {
        claim: 'Clinician documentation time baseline is 45 minutes/day',
        source_doc: 'q4-financial-close.pdf',
        confidence: 0.88,
        caveats: 'Source is sufficient for synthetic tenant reasoning; not public customer data.',
      },
    });

    const item = mapTenantRecordToContextItem(record);

    expect(item).not.toBeNull();
    expect(item!.kind).toBe('evidence');
    expect(item!.summary).toContain('Clinician documentation time baseline is 45 minutes/day');
    expect(item!.summary).toContain('source: q4-financial-close.pdf');
    expect(item!.summary).toContain('confidence 0.88');
    expect(item!.summary).toContain('caveat: Source is sufficient');
    expect(item!.provenanceIds).toEqual(
      expect.arrayContaining([
        'evidence_ledger:ev:meridian:001',
        'q4-financial-close.pdf',
      ]),
    );
  });

  it('maps vendor_contract -> vendor_contract', () => {
    const record = makeRecord({
      segmentId: 'vendor_contracts',
      recordKind: 'vendor_contract',
      recordId: 'vendor_contracts:vendor:meridian:001',
      title: 'Epic — Cloud',
      classification: 'confidential',
      payload: {
        vendor_name: 'Epic',
        product: 'Cloud',
        annual_spend_usd: 4_500_000,
        renewal_or_expiry: '2027-06-30',
        risk_level: 'Medium',
        key_risk: 'AI/ML and BAA language reviewed; older contracts need refresh.',
        vendor_id: 'vendor:meridian:001',
      },
    });

    const item = mapTenantRecordToContextItem(record);

    expect(item).not.toBeNull();
    expect(item!.kind).toBe('vendor_contract');
    expect(item!.summary).toContain('Epic — Cloud');
    expect(item!.summary).toContain('spend 4500000');
    expect(item!.summary).toContain('renewal 2027-06-30');
    expect(item!.summary).toContain('risk Medium');
    expect(item!.summary).toContain('key risk: AI/ML and BAA language reviewed');
    expect(item!.provenanceIds).toEqual(
      expect.arrayContaining([
        'vendor_contracts:vendor:meridian:001',
        'vendor:meridian:001',
      ]),
    );
    expect(item!.sensitivity).toBe('structured');
  });

  it('maps org_role -> person with role / org_unit / reports-to / priorities / decision rights', () => {
    const record = makeRecord({
      segmentId: 'org_structure',
      recordKind: 'org_role',
      recordId: 'org_structure:person:meridian:elaine-morales',
      title: 'Dr. Elaine Morales',
      classification: 'internal',
      payload: {
        role: 'President & Chief Executive Officer',
        org_unit: 'system',
        reports_to_role: 'Board',
        priorities: [
          'margin recovery',
          'clinical quality and safety',
          'provider-plan integration',
          'AI governance where relevant',
        ],
        decision_rights: ['Enterprise tradeoff escalation'],
      },
    });

    const item = mapTenantRecordToContextItem(record);

    expect(item).not.toBeNull();
    expect(item!.kind).toBe('person');
    expect(item!.summary).toContain('President & Chief Executive Officer');
    expect(item!.summary).toContain('org unit system');
    expect(item!.summary).toContain('reports to Board');
    expect(item!.summary).toContain('priorities margin recovery; clinical quality and safety; provider-plan integration');
    expect(item!.summary).toContain('decision rights: Enterprise tradeoff escalation');
    expect(item!.provenanceIds).toEqual(
      expect.arrayContaining([
        'org_structure:person:meridian:elaine-morales',
        'Board',
      ]),
    );
  });

  it('maps cross_program_signal -> cross_program_signal with programs / severity / recommendation', () => {
    const record = makeRecord({
      segmentId: 'cross_program_signals',
      recordKind: 'cross_program_signal',
      recordId: 'cross_program_signals:xprog:meridian:001',
      title: 'Okafor lead on prior-auth and RCM creates overload',
      classification: 'internal',
      payload: {
        programs: ['meridian-prior-auth-2026', 'meridian-ai-governance-2026'],
        severity: 'Medium',
        recommendation: 'Assign owner, confirm evidence, and include in next program gate review.',
      },
    });

    const item = mapTenantRecordToContextItem(record);

    expect(item).not.toBeNull();
    expect(item!.kind).toBe('cross_program_signal');
    expect(item!.title).toBe('Okafor lead on prior-auth and RCM creates overload');
    expect(item!.summary).toContain('Programs: meridian-prior-auth-2026, meridian-ai-governance-2026');
    expect(item!.summary).toContain('severity Medium');
    expect(item!.summary).toContain('Assign owner, confirm evidence');
    expect(item!.provenanceIds).toEqual(
      expect.arrayContaining([
        'cross_program_signals:xprog:meridian:001',
        'meridian-prior-auth-2026',
        'meridian-ai-governance-2026',
      ]),
    );
  });
});

describe('mapTenantRecordToContextItem — edge cases', () => {
  it('returns null for an unknown (segment, record_kind) pair', () => {
    const record = makeRecord({
      segmentId: 'compliance_posture',
      recordKind: 'mystery_kind',
      recordId: 'compliance_posture:mystery:001',
      title: 'Mystery record',
      payload: { foo: 'bar' },
    });

    expect(mapTenantRecordToContextItem(record)).toBeNull();
  });

  it('returns null when required payload fields are missing', () => {
    const record = makeRecord({
      segmentId: 'evidence_ledger',
      recordKind: 'evidence_claim',
      recordId: 'evidence_ledger:ev:meridian:empty',
      title: 'Empty evidence',
      payload: {}, // no claim
    });

    expect(mapTenantRecordToContextItem(record)).toBeNull();
  });

  it('uses tenant_admin_upload as the default sourceBasis', () => {
    const record = makeRecord({
      segmentId: 'kpi_dictionary',
      recordKind: 'kpi_definition',
      recordId: 'kpi_dictionary:kpi:meridian:002',
      title: 'ED door-to-provider time',
      payload: {
        current_value: '52.2%',
        target_fy2026: '57.5%',
        source_system: 'system:meridian:epic-mychart',
        data_owner: 'person:meridian:anita-krishnamurthy',
        confidence: 0.9,
      },
    });

    const item = mapTenantRecordToContextItem(record);
    expect(item!.sourceBasis).toBe('tenant_admin_upload');
  });

  it('preserves a record-supplied sourceBasis when present', () => {
    const record = makeRecord({
      segmentId: 'kpi_dictionary',
      recordKind: 'kpi_definition',
      recordId: 'kpi_dictionary:kpi:meridian:003',
      title: 'OR block utilization',
      sourceBasis: 'derived',
      payload: {
        current_value: '13',
        target_fy2026: '58.6%',
        source_system: 'system:meridian:epic-cogito',
        data_owner: 'person:meridian:david-park',
        confidence: 0.9,
      },
    });

    const item = mapTenantRecordToContextItem(record);
    expect(item!.sourceBasis).toBe('derived');
  });
});

describe('mapTenantRecordsToContextItems — bulk', () => {
  it('drops unmappable records and preserves order', () => {
    const mappableA: TenantRecord = {
      tenantKey: TENANT,
      segmentId: 'kpi_dictionary',
      recordKind: 'kpi_definition',
      recordId: 'kpi_dictionary:kpi:meridian:001',
      title: 'ALOS',
      payload: {
        current_value: '51.1%',
        target_fy2026: '56.4%',
        source_system: 'system:meridian:epic-ambulatory',
        data_owner: 'person:meridian:harold-kim',
        confidence: 0.9,
      },
    };
    const unmappable: TenantRecord = {
      tenantKey: TENANT,
      segmentId: 'compliance_posture',
      recordKind: 'mystery',
      recordId: 'compliance_posture:mystery:001',
      title: 'Mystery',
      payload: {},
    };
    const mappableB: TenantRecord = {
      tenantKey: TENANT,
      segmentId: 'cross_program_signals',
      recordKind: 'cross_program_signal',
      recordId: 'cross_program_signals:xprog:meridian:001',
      title: 'Cross-program signal',
      payload: {
        programs: ['meridian-ambient-2026'],
        severity: 'High',
        recommendation: 'Escalate.',
      },
    };

    const items = mapTenantRecordsToContextItems([mappableA, unmappable, mappableB]);
    expect(items).toHaveLength(2);
    expect(items[0]!.kind).toBe('kpi_metric');
    expect(items[1]!.kind).toBe('cross_program_signal');
  });
});

describe('classification -> sensitivity mapping', () => {
  function mappedSensitivity(classification: TenantRecord['classification']) {
    const item = mapTenantRecordToContextItem(
      makeRecord({
        segmentId: 'kpi_dictionary',
        recordKind: 'kpi_definition',
        recordId: `kpi_dictionary:kpi:meridian:${classification ?? 'none'}`,
        title: 'KPI',
        classification,
        payload: {
          current_value: '1',
          target_fy2026: '2',
          source_system: 'system:meridian:epic-cogito',
          data_owner: 'person:meridian:david-park',
          confidence: 0.9,
        },
      }),
    );
    return item!.sensitivity;
  }

  it('restricted -> l4_raw', () => {
    expect(mappedSensitivity('restricted')).toBe('l4_raw');
  });

  it('confidential -> structured', () => {
    expect(mappedSensitivity('confidential')).toBe('structured');
  });

  it('internal -> summary', () => {
    expect(mappedSensitivity('internal')).toBe('summary');
  });

  it('public -> summary', () => {
    expect(mappedSensitivity('public')).toBe('summary');
  });
});
