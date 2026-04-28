// Tests for REASON-11: SourceEventInstance type + AMS Vendor Consolidation 2026 instance
//
// Validates:
// 1. Instance shape — expected patternId, currentStage, vendor count
// 2. buildEvidenceMap — vendor-response-count > 0
// 3. Linked programs — APX-CDP-2026 with linkType 'unblocks'
// 4. Pattern binding integrity — patternId typed as SourceEventPatternId
// 5. Vendor risk flag — Vendor B (BlueMaster) has SOC-2 risk flag

import { buildEvidenceMap } from '@/lib/source/source-event-instance';
import {
  AMS_VENDOR_CONSOLIDATION_2026_INSTANCE,
  SOURCE_EVENT_INSTANCES,
} from '@/lib/source/source-event-instances';
import type { SourceEventPatternId } from '@/lib/intelligence/seed-types';

// ── 1. Instance shape ─────────────────────────────────────────────────────────

describe('AMS_VENDOR_CONSOLIDATION_2026_INSTANCE shape', () => {
  it('has the correct patternId', () => {
    expect(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.patternId).toBe('PAT-SRC-AMS-001');
  });

  it('has currentStage set to BAFO', () => {
    expect(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.currentStage).toBe('BAFO');
  });

  it('has the expected vendor count (4 vendors)', () => {
    expect(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.vendors).toHaveLength(4);
  });

  it('has a non-empty name', () => {
    expect(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.name).toBe('AMS Vendor Consolidation 2026');
  });

  it('has correct tenant slug', () => {
    expect(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.tenantSlug).toBe('apex-retail');
  });
});

// ── 2. buildEvidenceMap ───────────────────────────────────────────────────────

describe('buildEvidenceMap', () => {
  it('returns vendor-response-count greater than 0', () => {
    const map = buildEvidenceMap(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE);
    expect(typeof map['vendor-response-count']).toBe('number');
    expect(map['vendor-response-count'] as number).toBeGreaterThan(0);
  });

  it('returns bafo-vendor-responses as a number', () => {
    const map = buildEvidenceMap(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE);
    expect(typeof map['bafo-vendor-responses']).toBe('number');
  });

  it('returns vendors-shortlisted as a number', () => {
    const map = buildEvidenceMap(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE);
    expect(typeof map['vendors-shortlisted']).toBe('number');
    // Northstar and ArcVault are invited-bafo
    expect(map['vendors-shortlisted'] as number).toBeGreaterThanOrEqual(2);
  });

  it('includes artifact presence flags for locked/approved artifacts', () => {
    const map = buildEvidenceMap(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE);
    // ART-AMS-PLAN-01 is locked — should appear as true
    expect(map['artifact-ART-AMS-PLAN-01']).toBe(true);
  });

  it('includes evidence field values from EvidenceItem records', () => {
    const map = buildEvidenceMap(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE);
    // rfi-vendor-response-count evidence item value is '4'
    expect(map['rfi-vendor-response-count']).toBe('4');
  });
});

// ── 3. Linked programs ────────────────────────────────────────────────────────

describe('linkedPrograms', () => {
  it('contains APX-CDP-2026', () => {
    const link = AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.linkedPrograms.find(
      p => p.programId === 'APX-CDP-2026',
    );
    expect(link).toBeDefined();
  });

  it('APX-CDP-2026 link has linkType unblocks', () => {
    const link = AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.linkedPrograms.find(
      p => p.programId === 'APX-CDP-2026',
    );
    expect(link?.linkType).toBe('unblocks');
  });

  it('APX-CDP-2026 link has blockedAtStage of P3 Design', () => {
    const link = AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.linkedPrograms.find(
      p => p.programId === 'APX-CDP-2026',
    );
    expect(link?.blockedAtStage).toBe('P3 Design');
  });
});

// ── 4. Pattern binding integrity ──────────────────────────────────────────────

describe('pattern binding integrity', () => {
  it('patternId is PAT-SRC-AMS-001 (SourceEventPatternId type)', () => {
    // TypeScript enforces the type at compile time; this runtime check confirms
    // the value is a valid member of the SourceEventPatternId union.
    const validIds: SourceEventPatternId[] = [
      'PAT-SRC-AMS-001',
      'PAT-SRC-RFP-001',
      'PAT-SRC-SOLE-001',
      'PAT-SRC-FRAMEWORK-001',
      'PAT-SRC-RENEWAL-001',
      'PAT-SRC-DECOM-001',
      'PAT-SRC-EMERGENCY-001',
    ];
    expect(validIds).toContain(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.patternId);
    expect(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.patternId).toBe('PAT-SRC-AMS-001');
  });

  it('patternVersion is set', () => {
    expect(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.patternVersion).toBeTruthy();
  });
});

// ── 5. Vendor risk flag ───────────────────────────────────────────────────────

describe('vendor risk flags', () => {
  it('BlueMaster Operations has at least one risk flag', () => {
    const vendor = AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.vendors.find(
      v => v.id === 'bluemaster-operations',
    );
    expect(vendor).toBeDefined();
    expect(vendor?.riskFlags.length).toBeGreaterThan(0);
  });

  it('BlueMaster has a SOC-2 related risk flag in evidence', () => {
    // The SOC-2 gap for "Vendor B" (BlueMaster in the fixture) is tracked as
    // an evidence item with field 'bluemaster-soc2-attestation-status'
    const soc2Evidence = AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.evidence.find(
      ev => ev.field === 'bluemaster-soc2-attestation-status',
    );
    expect(soc2Evidence).toBeDefined();
    expect(soc2Evidence?.value).toBe('gap-open');
  });

  it('BlueMaster critical transition plan flag has correct severity', () => {
    const vendor = AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.vendors.find(
      v => v.id === 'bluemaster-operations',
    );
    const criticalFlag = vendor?.riskFlags.find(f => f.severity === 'critical');
    expect(criticalFlag).toBeDefined();
    expect(criticalFlag?.label).toContain('Transition plan');
  });
});

// ── 6. SOURCE_EVENT_INSTANCES collection ──────────────────────────────────────

describe('SOURCE_EVENT_INSTANCES', () => {
  it('is a non-empty array', () => {
    expect(SOURCE_EVENT_INSTANCES.length).toBeGreaterThan(0);
  });

  it('contains the AMS instance', () => {
    expect(SOURCE_EVENT_INSTANCES).toContain(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE);
  });
});
