// Smoke tests for the Slice 5 structured-data docx renderers.
// Each test builds a real Document, packs to bytes, and confirms the
// ZIP magic + non-trivial size. We don't unzip + diff the XML — the
// structured-docx-base helpers and per-artifact wrappers are simple
// enough that a successful pack with valid magic is sufficient
// regression coverage. Real validation happens via prod download +
// open-in-Word.

import { Packer } from 'docx';
import { buildAppInventoryDocx } from '../renderers/app-inventory-docx';
import type { AppInventoryPayload } from '../renderers/app-inventory';
import { buildResponseChecklistDocx } from '../renderers/response-checklist-docx';
import type { ResponseChecklistPayload } from '../renderers/response-checklist';
import { buildScorecardDocx } from '../renderers/scorecard-docx';
import type { ScorecardPayload } from '../renderers/scorecard';

const COMMON = {
  tenantName: 'Meridian Health',
  eventCode: 'MERI-CLOUD-2026',
  eventName: 'Meridian Health Cloud & Infrastructure',
  issuedBy: 'Janet Fischer, VP IT Ops',
  generatedAt: '2026-05-08T03:30:00.000Z',
} as const;

describe('Slice 5 · structured-data docx renderers', () => {
  it('buildAppInventoryDocx produces a valid docx', async () => {
    const payload: AppInventoryPayload = {
      ...COMMON,
      tierDefinitions: [
        { tier: 1, label: 'Mission-critical', criterion: 'Outage halts revenue.', recoveryObjective: 'RTO < 4h', examples: 'Epic CIS' },
        { tier: 2, label: 'Important', criterion: 'Productivity impact.', recoveryObjective: 'RTO < 24h', examples: 'ServiceNow' },
        { tier: 3, label: 'Standard', criterion: 'Tolerable for days.', recoveryObjective: 'RTO < 72h', examples: 'Archive' },
      ],
      rows: [
        { id: 'A-EPIC-01', name: 'Epic CIS', tier: 1, owner: 'Karen Liu', techStack: 'Cache MUMPS', hostingToday: 'Newark colo', annualWorkloadCount: 24000, inScope: true },
        { id: 'A-X-02', name: 'Unclassified app', tier: 0, owner: '', techStack: '', hostingToday: '', annualWorkloadCount: 0, inScope: true },
      ],
    };
    const doc = buildAppInventoryDocx(payload);
    const buf = await Packer.toBuffer(doc);
    expect(buf.byteLength).toBeGreaterThan(4000);
    expect(buf[0]).toBe(0x50);
    expect(buf[1]).toBe(0x4b);
  });

  it('buildResponseChecklistDocx produces a valid docx', async () => {
    const payload: ResponseChecklistPayload = {
      ...COMMON,
      submissionDeadline: '2026-06-15T17:00:00.000Z',
      mandatoryItems: [
        { id: 'M-EXEC-01', section: 'Executive summary', requirement: 'Exec summary ≤ 2 pages.' },
        { id: 'M-PRICING-01', section: 'Pricing', requirement: 'Submit d19 pricing workbook.' },
      ],
      optionalItems: [
        { id: 'O-AI-01', section: 'AI / automation', requirement: 'AI in delivery with productivity claims.' },
      ],
      formatExpectations: [
        { topic: 'File formats', requirement: 'PDF + native xlsx.' },
        { topic: 'Filename', requirement: '{vendor}__{eventCode}__{artifact}.{ext}' },
      ],
      certifications: [
        'Officer is authorized to bind the Vendor.',
        'Pricing firm for 90 days.',
      ],
    };
    const doc = buildResponseChecklistDocx(payload);
    const buf = await Packer.toBuffer(doc);
    expect(buf.byteLength).toBeGreaterThan(4000);
    expect(buf[0]).toBe(0x50);
  });

  it('buildScorecardDocx produces a valid docx with criteria + vendors + rubric', async () => {
    const payload: ScorecardPayload = {
      ...COMMON,
      roundLabel: 'Initial · pre-BAFO',
      criteria: [
        { id: 'C-FUNCTIONAL', label: 'Functional fit', weightPercent: 25, description: 'Coverage of d04 inventory.' },
        { id: 'C-PRICING', label: 'Pricing & TCO', weightPercent: 50, description: 'd19 normalized 3-year TCO.' },
        { id: 'C-RISK', label: 'Risk profile', weightPercent: 25, description: 'd20 trap log + financial stability.' },
      ],
      vendors: ['Acme', 'Beta', 'Gamma'],
      scoreGuidance: [
        { score: 1, label: 'Does not meet', rubric: 'Material gap.' },
        { score: 3, label: 'Meets', rubric: 'Fully meets the requirement.' },
        { score: 5, label: 'Best in class', rubric: 'Differentiated.' },
      ],
    };
    const doc = buildScorecardDocx(payload);
    const buf = await Packer.toBuffer(doc);
    expect(buf.byteLength).toBeGreaterThan(4000);
    expect(buf[0]).toBe(0x50);
  });
});
