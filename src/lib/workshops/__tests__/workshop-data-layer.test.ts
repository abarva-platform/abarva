import JSZip from 'jszip';
import { lintWorkshopTemplateDepth, workshopDepthContent } from '../depth-lint';
import { buildWorkshopPdfBytes, buildWorkshopZipBytes, substituteTenantContext } from '../render';
import type { WorkshopTemplateRecord } from '../types';

function sampleWorkshop(): WorkshopTemplateRecord {
  const now = '2026-05-23T00:00:00.000Z';
  return {
    id: 'workshop-1',
    clientId: null,
    slug: 'time-wardley-diagnostic',
    name: 'TIME x Wardley Diagnostic',
    durationMinutes: 180,
    version: 1,
    parentVersionId: null,
    status: 'draft',
    depthScore: 0,
    owningGateId: 'gate-1',
    hypothesisToTest: 'Numerical hypothesis to test: 60-70% of Run spend is trapped in Tolerate or Eliminate apps.',
    stakeholderMap: {
      grid: 'Stakeholder map with influence, interest, and named 1:1 pre-work.',
    },
    facilitatorTactics: {
      push: 'Push on unsupported run-cost claims.',
      listen: 'Listen for app-owner dissent.',
      escalateTrigger: 'Escalate trigger when finance and app owners disagree.',
    },
    verticalOverlays: ['retail'],
    createdBy: 'user-1',
    updatedBy: 'user-1',
    approvedBy: null,
    publishedAt: null,
    retiredAt: null,
    createdAt: now,
    updatedAt: now,
    assets: [
      {
        id: 'asset-1',
        clientId: null,
        workshopId: 'workshop-1',
        assetType: 'pre_read',
        sequenceIndex: 0,
        name: 'Pre-read',
        format: 'markdown',
        contentText: 'Pre-read: 15-30 min briefing with glossary and {{client.app_portfolio}} context.',
        contentBlobRef: null,
        schema: {},
        timeBoxMinutes: 20,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'asset-2',
        clientId: null,
        workshopId: 'workshop-1',
        assetType: 'agenda',
        sequenceIndex: 1,
        name: 'Minute agenda',
        format: 'markdown',
        contentText: '00:00 opening, 00:10 hypothesis review, minute-by-minute agenda through decision readout.',
        contentBlobRef: null,
        schema: {},
        timeBoxMinutes: 30,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'asset-3',
        clientId: null,
        workshopId: 'workshop-1',
        assetType: 'facilitator_brief',
        sequenceIndex: 2,
        name: 'Facilitator brief',
        format: 'markdown',
        contentText: 'Facilitator brief with objectives, success criteria, time-boxes, and escalation path.',
        contentBlobRef: null,
        schema: {},
        timeBoxMinutes: 10,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'asset-4',
        clientId: null,
        workshopId: 'workshop-1',
        assetType: 'worksheet',
        sequenceIndex: 3,
        name: 'TIME canvas',
        format: 'markdown',
        contentText: 'Worksheet canvas is pre-built for each app classification.',
        contentBlobRef: null,
        schema: {},
        timeBoxMinutes: 35,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'asset-5',
        clientId: null,
        workshopId: 'workshop-1',
        assetType: 'decision_capture',
        sequenceIndex: 4,
        name: 'Decision capture',
        format: 'json',
        contentText: 'Decision capture: decision, owner, rationale, dissent, and follow-up commitments.',
        contentBlobRef: null,
        schema: { required: ['decision', 'owner', 'dissent'] },
        timeBoxMinutes: 25,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'asset-6',
        clientId: null,
        workshopId: 'workshop-1',
        assetType: 'pre_mortem',
        sequenceIndex: 5,
        name: 'Pre-mortem',
        format: 'markdown',
        contentText: 'Pre-mortem: 15 min ritual before final commitment.',
        contentBlobRef: null,
        schema: {},
        timeBoxMinutes: 15,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'asset-7',
        clientId: null,
        workshopId: 'workshop-1',
        assetType: 'stakeholder_map',
        sequenceIndex: 6,
        name: 'Stakeholder map',
        format: 'markdown',
        contentText: 'Stakeholder map uses influence and interest grid with named 1:1 pre-work.',
        contentBlobRef: null,
        schema: {},
        timeBoxMinutes: 15,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'asset-8',
        clientId: null,
        workshopId: 'workshop-1',
        assetType: 'post_read',
        sequenceIndex: 7,
        name: 'Post-read',
        format: 'markdown',
        contentText: 'Post-read: 24h commitments tracker with owners and due dates.',
        contentBlobRef: null,
        schema: {},
        timeBoxMinutes: 20,
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}

describe('workshop data layer', () => {
  it('models a smoke workshop with 8 assets across at least 5 types', () => {
    const workshop = sampleWorkshop();
    expect(workshop.assets).toHaveLength(8);
    expect(new Set(workshop.assets.map((asset) => asset.assetType)).size).toBeGreaterThanOrEqual(5);
    expect(workshop.assets.reduce((sum, asset) => sum + (asset.timeBoxMinutes ?? 0), 0)).toBe(170);
  });

  it('builds Rubric W content that passes depth lint', async () => {
    const lint = await lintWorkshopTemplateDepth(sampleWorkshop(), 'unit-test');
    expect(workshopDepthContent(sampleWorkshop())).toContain('Decision capture');
    expect(lint.pass).toBe(true);
    expect(lint.score).toBeGreaterThanOrEqual(8);
  });

  it('renders valid PDF and ZIP bytes with tenant context substitution', async () => {
    const workshop = sampleWorkshop();
    const context = {
      clientId: 'client-1',
      clientName: 'Apex Retail Group',
      moveName: 'AI-enabled IT productivity',
      appPortfolio: ['Order Hub', 'Store Labor Planner'],
    };
    expect(substituteTenantContext('Apps: {{client.app_portfolio}}', context)).toContain('Order Hub');

    const pdf = buildWorkshopPdfBytes(workshop, context);
    expect(pdf.subarray(0, 5).toString('utf-8')).toBe('%PDF-');

    const zip = await buildWorkshopZipBytes(workshop, context, pdf);
    expect(zip.subarray(0, 2).toString('utf-8')).toBe('PK');
    const parsed = await JSZip.loadAsync(zip);
    expect(Object.keys(parsed.files).some((name) => name.endsWith('facilitator-pack.pdf'))).toBe(true);
    const preRead = await parsed.file('01-pre-read.md')?.async('string');
    expect(preRead).toContain('Store Labor Planner');
  });
});
