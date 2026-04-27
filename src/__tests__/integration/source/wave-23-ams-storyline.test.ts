// Wave 23 integration tests — AMS Outsourcing 2026 storyline.
// Type-shape and contract tests only — no React rendering, no jsdom, no I/O.
// Covers SRC34, SRC35, SRC36 (view models), SRC37 (BAFO), SRC38 (seed), LINK2.

import {
  buildAmsVendorStoryline,
  getAmsVendorById,
  AMS_OUTSOURCING_2026_EVENT_ID,
  AMS_OUTSOURCING_2026_EVENT_NAME,
  AMS_OUTSOURCING_2026_LINKED_PROGRAM,
  AMS_OUTSOURCING_2026_TENANT_SLUG,
} from '../../../lib/source/ams-outsourcing-2026-view';

import {
  buildAmsIntelligenceSignals,
  getAmsSignalByPatternId,
} from '../../../lib/source/ams-intelligence-signals-view';

import {
  buildAmsBafoView,
} from '../../../lib/source/ams-bafo-view';

import {
  buildCdpSourceReverseLinkView,
} from '../../../lib/source/cdp-source-reverse-link-view';

import {
  getSourceEventSeed,
  listSourceEventSeed,
} from '../../../lib/source/mock-seed';

import {
  SOURCE_GOLDEN_EVENT_IDS,
} from '../../../lib/source/constants';

// ---------------------------------------------------------------------------
// SRC34 — AMS Vendor Storyline View Model
// ---------------------------------------------------------------------------

describe('SRC34 · AmsVendorStoryline', () => {
  let storyline: ReturnType<typeof buildAmsVendorStoryline>;

  beforeAll(() => {
    storyline = buildAmsVendorStoryline();
  });

  test('eventId matches constant', () => {
    expect(storyline.eventId).toBe(AMS_OUTSOURCING_2026_EVENT_ID);
  });

  test('eventName is AMS Outsourcing 2026', () => {
    expect(storyline.eventName).toBe(AMS_OUTSOURCING_2026_EVENT_NAME);
  });

  test('tenantSlug is apex-retail', () => {
    expect(storyline.tenantSlug).toBe(AMS_OUTSOURCING_2026_TENANT_SLUG);
  });

  test('linkedProgramCode is APX-CDP-2026', () => {
    expect(storyline.linkedProgramCode).toBe(AMS_OUTSOURCING_2026_LINKED_PROGRAM);
  });

  test('has exactly 4 vendors', () => {
    expect(storyline.vendors).toHaveLength(4);
  });

  test('vendor IDs are all unique', () => {
    const ids = storyline.vendors.map((v) => v.vendorId);
    expect(new Set(ids).size).toBe(4);
  });

  test('all vendors have deterministicSeed: true', () => {
    for (const v of storyline.vendors) {
      expect(v.deterministicSeed).toBe(true);
    }
  });

  test('pricing divergence note does not contain dollar amounts or percentages', () => {
    const note = storyline.pricingDivergenceNote;
    expect(note).not.toMatch(/\$[0-9]/);
    expect(note).not.toMatch(/[0-9]+%/);
  });

  test('Northstar Managed Services is in BAFO', () => {
    const northstar = storyline.vendors.find((v) => v.vendorId === 'northstar-managed-services');
    expect(northstar).toBeDefined();
    expect(northstar?.proposalStatus).toBe('bafo_requested');
  });

  test('ArcVault Managed is in BAFO', () => {
    const arcvault = storyline.vendors.find((v) => v.vendorId === 'arcvault-managed');
    expect(arcvault).toBeDefined();
    expect(arcvault?.proposalStatus).toBe('bafo_requested');
  });

  test('all vendors have at least one risk flag', () => {
    for (const v of storyline.vendors) {
      expect(v.riskFlags.length).toBeGreaterThan(0);
    }
  });

  test('all vendors have at least one differentiator', () => {
    for (const v of storyline.vendors) {
      expect(v.keyDifferentiators.length).toBeGreaterThan(0);
    }
  });

  test('all vendors have a non-empty sourceToProgramBridge', () => {
    for (const v of storyline.vendors) {
      expect(v.sourceToProgramBridge.length).toBeGreaterThan(0);
    }
  });

  test('getAmsVendorById returns correct vendor', () => {
    const vendor = getAmsVendorById('northstar-managed-services');
    expect(vendor).not.toBeNull();
    expect(vendor?.vendorLabel).toBe('Northstar Managed Services');
  });

  test('getAmsVendorById returns null for unknown ID', () => {
    expect(getAmsVendorById('unknown-vendor')).toBeNull();
  });

  test('each call returns a new object (no shared reference)', () => {
    const a = buildAmsVendorStoryline();
    const b = buildAmsVendorStoryline();
    expect(a).not.toBe(b);
    expect(a.vendors).not.toBe(b.vendors);
  });
});

// ---------------------------------------------------------------------------
// SRC35 — AMS Intelligence Signals View Model
// ---------------------------------------------------------------------------

describe('SRC35 · AmsIntelligenceSignals', () => {
  let bundle: ReturnType<typeof buildAmsIntelligenceSignals>;

  beforeAll(() => {
    bundle = buildAmsIntelligenceSignals();
  });

  test('eventId matches AMS Outsourcing 2026', () => {
    expect(bundle.eventId).toBe(AMS_OUTSOURCING_2026_EVENT_ID);
  });

  test('has exactly 3 signals', () => {
    expect(bundle.signals).toHaveLength(3);
  });

  test('PAT-AMS-001 is present and has high confidence', () => {
    const signal = bundle.signals.find((s) => s.patternId === 'PAT-AMS-001');
    expect(signal).toBeDefined();
    expect(signal?.confidence).toBe('high');
    expect(signal?.category).toBe('pricing_divergence');
  });

  test('PAT-AMS-002 is present and has medium confidence', () => {
    const signal = bundle.signals.find((s) => s.patternId === 'PAT-AMS-002');
    expect(signal).toBeDefined();
    expect(signal?.confidence).toBe('medium');
    expect(signal?.category).toBe('scope_creep_risk');
  });

  test('cross-programme correlation signal is present', () => {
    const signal = bundle.signals.find((s) => s.category === 'cross_program_correlation');
    expect(signal).toBeDefined();
    expect(signal?.cdpCorrelation).not.toBeNull();
  });

  test('all signals have deterministicSeed: true', () => {
    for (const s of bundle.signals) {
      expect(s.deterministicSeed).toBe(true);
    }
  });

  test('all signals reference CDP correlation or have it null', () => {
    for (const s of bundle.signals) {
      expect(s).toHaveProperty('cdpCorrelation');
    }
  });

  test('getAmsSignalByPatternId returns PAT-AMS-001', () => {
    const signal = getAmsSignalByPatternId('PAT-AMS-001');
    expect(signal).not.toBeNull();
    expect(signal?.title).toContain('Pricing Divergence');
  });

  test('getAmsSignalByPatternId returns null for unknown ID', () => {
    expect(getAmsSignalByPatternId('PAT-UNKNOWN')).toBeNull();
  });

  test('evidence doc count is positive for all signals', () => {
    for (const s of bundle.signals) {
      expect(s.evidenceDocCount).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// SRC37 — AMS BAFO View Model
// ---------------------------------------------------------------------------

describe('SRC37 · AmsBafoView', () => {
  let bafo: ReturnType<typeof buildAmsBafoView>;

  beforeAll(() => {
    bafo = buildAmsBafoView();
  });

  test('eventId matches AMS Outsourcing 2026', () => {
    expect(bafo.eventId).toBe(AMS_OUTSOURCING_2026_EVENT_ID);
  });

  test('status is in_progress', () => {
    expect(bafo.status).toBe('in_progress');
  });

  test('has exactly 2 invited vendors', () => {
    expect(bafo.invitedVendors).toHaveLength(2);
  });

  test('Northstar Managed Services is invited', () => {
    const vendor = bafo.invitedVendors.find((v) => v.vendorId === 'northstar-managed-services');
    expect(vendor).toBeDefined();
    expect(vendor?.responseStatus).toBe('invited');
  });

  test('ArcVault Managed is invited', () => {
    const vendor = bafo.invitedVendors.find((v) => v.vendorId === 'arcvault-managed');
    expect(vendor).toBeDefined();
  });

  test('has exactly 2 excluded vendors', () => {
    expect(bafo.notInvitedVendors).toHaveLength(2);
  });

  test('BlueMaster is excluded', () => {
    const vendor = bafo.notInvitedVendors.find((v) => v.vendorId === 'bluemaster-operations');
    expect(vendor).toBeDefined();
    expect(vendor?.exclusionReason.length).toBeGreaterThan(0);
  });

  test('DataPeak is excluded', () => {
    const vendor = bafo.notInvitedVendors.find((v) => v.vendorId === 'datapeak-services');
    expect(vendor).toBeDefined();
  });

  test('has exactly 3 selection committee members', () => {
    expect(bafo.selectionCommittee).toHaveLength(3);
  });

  test('has non-empty nextSteps', () => {
    expect(bafo.nextSteps.length).toBeGreaterThan(0);
  });

  test('deterministicSeed is true', () => {
    expect(bafo.deterministicSeed).toBe(true);
  });

  test('invited vendors have non-empty keyNegotiationPoints', () => {
    for (const v of bafo.invitedVendors) {
      expect(v.keyNegotiationPoints.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// SRC38 — AMS Outsourcing 2026 event in mock-seed
// ---------------------------------------------------------------------------

describe('SRC38 · AMS Outsourcing 2026 mock-seed entry', () => {
  test('getSourceEventSeed returns the AMS Outsourcing 2026 event', () => {
    const event = getSourceEventSeed(AMS_OUTSOURCING_2026_EVENT_ID);
    expect(event).not.toBeNull();
    expect(event?.name).toBe('AMS Outsourcing 2026');
    expect(event?.accountName).toBe('Apex Retail');
  });

  test('event code is SRC-004', () => {
    const event = getSourceEventSeed(AMS_OUTSOURCING_2026_EVENT_ID);
    expect(event?.code).toBe('SRC-004');
  });

  test('event is listed in listSourceEventSeed', () => {
    const summaries = listSourceEventSeed();
    const found = summaries.find((s) => s.id === AMS_OUTSOURCING_2026_EVENT_ID);
    expect(found).toBeDefined();
  });

  test('event has orals_bafo as current stage', () => {
    const event = getSourceEventSeed(AMS_OUTSOURCING_2026_EVENT_ID);
    expect(event?.currentStageKey).toBe('orals_bafo');
  });

  test('event is active status', () => {
    const event = getSourceEventSeed(AMS_OUTSOURCING_2026_EVENT_ID);
    expect(event?.status).toBe('active');
  });

  test('event has 2 open alerts', () => {
    const event = getSourceEventSeed(AMS_OUTSOURCING_2026_EVENT_ID);
    expect(event?.openAlerts).toBe(2);
  });

  test('event has non-zero valueAtStakeUsd', () => {
    const event = getSourceEventSeed(AMS_OUTSOURCING_2026_EVENT_ID);
    expect(event?.valueAtStakeUsd).toBeGreaterThan(0);
  });

  test('event has at least 2 artifacts', () => {
    const event = getSourceEventSeed(AMS_OUTSOURCING_2026_EVENT_ID);
    expect(event?.artifacts.length).toBeGreaterThanOrEqual(2);
  });

  test('event has at least 8 stages', () => {
    const event = getSourceEventSeed(AMS_OUTSOURCING_2026_EVENT_ID);
    expect(event?.stages.length).toBeGreaterThanOrEqual(8);
  });

  test('constants include apexRetailAmsOutsourcing2026', () => {
    expect(SOURCE_GOLDEN_EVENT_IDS.apexRetailAmsOutsourcing2026).toBe(AMS_OUTSOURCING_2026_EVENT_ID);
  });
});

// ---------------------------------------------------------------------------
// LINK2 — CDP Program Reverse Source Event Link View Model
// ---------------------------------------------------------------------------

describe('LINK2 · CdpSourceReverseLinkView', () => {
  test('returns non-null for APX-CDP-2026', () => {
    const view = buildCdpSourceReverseLinkView('APX-CDP-2026');
    expect(view).not.toBeNull();
  });

  test('sourceEventId is AMS Outsourcing 2026 event', () => {
    const view = buildCdpSourceReverseLinkView('APX-CDP-2026');
    expect(view?.sourceEventId).toBe(AMS_OUTSOURCING_2026_EVENT_ID);
  });

  test('sourceEventName is AMS Outsourcing 2026', () => {
    const view = buildCdpSourceReverseLinkView('APX-CDP-2026');
    expect(view?.sourceEventName).toBe('AMS Outsourcing 2026');
  });

  test('routeHint points to correct source event route', () => {
    const view = buildCdpSourceReverseLinkView('APX-CDP-2026');
    expect(view?.routeHint).toBe(`/source/events/${AMS_OUTSOURCING_2026_EVENT_ID}`);
  });

  test('deterministicSeed is true', () => {
    const view = buildCdpSourceReverseLinkView('APX-CDP-2026');
    expect(view?.deterministicSeed).toBe(true);
  });

  test('returns null for unknown program code', () => {
    expect(buildCdpSourceReverseLinkView('NONEXISTENT')).toBeNull();
  });

  test('returns a fresh copy on each call', () => {
    const a = buildCdpSourceReverseLinkView('APX-CDP-2026');
    const b = buildCdpSourceReverseLinkView('APX-CDP-2026');
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});
