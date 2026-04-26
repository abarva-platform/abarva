// PDEL9 · Download / Export Contract tests.
//
// Pure deterministic coverage of the deliverable export contract.
// No React rendering, no DOM, no model calls, no live runtime.

import {
  buildDeliverableExportManifest,
  type DeliverableExportManifest,
  type DeliverableExportIntent,
  type ExportMode,
} from '../../../lib/programs/deliverable-export-contract';

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

let manifest: DeliverableExportManifest;

beforeAll(() => {
  manifest = buildDeliverableExportManifest();
});

// ---------------------------------------------------------------------
// Basic structure
// ---------------------------------------------------------------------

describe('buildDeliverableExportManifest · structure', () => {
  it('returns a manifest with an intents array', () => {
    expect(manifest).toBeDefined();
    expect(Array.isArray(manifest.intents)).toBe(true);
    expect(manifest.intents.length).toBeGreaterThanOrEqual(5);
  });

  it('totalIntents equals intents.length', () => {
    expect(manifest.totalIntents).toBe(manifest.intents.length);
  });

  it('generatedAt is 2026-04-26', () => {
    expect(manifest.generatedAt).toBe('2026-04-26');
  });
});

// ---------------------------------------------------------------------
// Live export is always false
// ---------------------------------------------------------------------

describe('buildDeliverableExportManifest · no live export', () => {
  it('manifest.liveExportEnabled is always false', () => {
    expect(manifest.liveExportEnabled).toBe(false);
  });

  it('every intent has isLiveExportEnabled === false', () => {
    for (const intent of manifest.intents) {
      expect(intent.isLiveExportEnabled).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------
// Export mode / readiness honesty rules
// ---------------------------------------------------------------------

describe('buildDeliverableExportManifest · mode honesty', () => {
  const deferredModes: ExportMode[] = ['pdf_later', 'docx_later', 'pptx_later'];

  it('pdf_later/docx_later/pptx_later intents are NOT ready', () => {
    const deferredIntents = manifest.intents.filter((i) =>
      deferredModes.includes(i.requestedMode),
    );
    // We require at least one deferred-mode intent to test the rule.
    expect(deferredIntents.length).toBeGreaterThanOrEqual(1);
    for (const intent of deferredIntents) {
      expect(intent.exportReadiness).not.toBe('ready');
    }
  });

  it('pdf_later/docx_later/pptx_later intents have deferred readiness', () => {
    const deferredIntents = manifest.intents.filter((i) =>
      deferredModes.includes(i.requestedMode),
    );
    for (const intent of deferredIntents) {
      expect(intent.exportReadiness).toBe('deferred');
    }
  });

  it('ready intents only use html_static mode', () => {
    const readyIntents = manifest.intents.filter((i) => i.exportReadiness === 'ready');
    for (const intent of readyIntents) {
      expect(intent.requestedMode).toBe('html_static');
    }
  });
});

// ---------------------------------------------------------------------
// Caveat is never empty
// ---------------------------------------------------------------------

describe('buildDeliverableExportManifest · caveats', () => {
  it('every intent has a non-empty caveat', () => {
    for (const intent of manifest.intents) {
      expect(typeof intent.caveat).toBe('string');
      expect(intent.caveat.trim().length).toBeGreaterThan(0);
    }
  });

  it('deferred-mode intents mention future version in their caveat', () => {
    const deferredModes: ExportMode[] = ['pdf_later', 'docx_later', 'pptx_later'];
    const deferredIntents = manifest.intents.filter((i) =>
      deferredModes.includes(i.requestedMode),
    );
    for (const intent of deferredIntents) {
      expect(intent.caveat.toLowerCase()).toContain('future version');
    }
  });
});

// ---------------------------------------------------------------------
// Approval guard — no unguarded export
// ---------------------------------------------------------------------

describe('buildDeliverableExportManifest · approval guard', () => {
  it('every intent with requiresApproval: true has non-ready or blocked exportReadiness, unless approvalState is approved', () => {
    const approvalRequired = manifest.intents.filter((i) => i.requiresApproval === true);
    for (const intent of approvalRequired) {
      if (intent.approvalState !== 'approved') {
        // Must not be in 'ready' state without approval.
        expect(intent.exportReadiness).not.toBe('ready');
      }
    }
  });

  it('approved intents with requiresApproval: true may be ready', () => {
    const approvedIntents = manifest.intents.filter(
      (i) => i.requiresApproval === true && i.approvalState === 'approved',
    );
    // This test just validates the data is self-consistent — if an intent
    // is approved, it is allowed (but not required) to be ready.
    for (const intent of approvedIntents) {
      // approvalState is 'approved' — exportReadiness may be 'ready'
      expect(['ready', 'not_ready', 'deferred', 'blocked']).toContain(
        intent.exportReadiness,
      );
    }
  });
});

// ---------------------------------------------------------------------
// evidenceTraceRequired must be boolean
// ---------------------------------------------------------------------

describe('buildDeliverableExportManifest · evidence trace', () => {
  it('every intent has evidenceTraceRequired as a boolean', () => {
    for (const intent of manifest.intents) {
      expect(typeof intent.evidenceTraceRequired).toBe('boolean');
    }
  });
});

// ---------------------------------------------------------------------
// Aggregate counts
// ---------------------------------------------------------------------

describe('buildDeliverableExportManifest · aggregate counts', () => {
  it('readyCount matches actual ready intents', () => {
    const actualReady = manifest.intents.filter((i) => i.exportReadiness === 'ready').length;
    expect(manifest.readyCount).toBe(actualReady);
  });

  it('deferredCount matches actual deferred intents', () => {
    const actualDeferred = manifest.intents.filter(
      (i) => i.exportReadiness === 'deferred',
    ).length;
    expect(manifest.deferredCount).toBe(actualDeferred);
  });

  it('blockedCount matches actual blocked intents', () => {
    const actualBlocked = manifest.intents.filter(
      (i) => i.exportReadiness === 'blocked',
    ).length;
    expect(manifest.blockedCount).toBe(actualBlocked);
  });
});

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('buildDeliverableExportManifest · determinism', () => {
  it('returns byte-equal output across repeated calls', () => {
    const a = buildDeliverableExportManifest();
    const b = buildDeliverableExportManifest();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

// ---------------------------------------------------------------------
// Intent field completeness
// ---------------------------------------------------------------------

describe('buildDeliverableExportManifest · field completeness', () => {
  it('every intent has required fields with valid types', () => {
    const validModes: ExportMode[] = ['html_static', 'pdf_later', 'docx_later', 'pptx_later'];
    const validReadiness = ['ready', 'not_ready', 'deferred', 'blocked'];
    const validAudit = ['required', 'recommended', 'not_applicable'];
    const validApprovalState = ['approved', 'pending', 'not_required', 'blocked'];

    for (const intent of manifest.intents) {
      expect(typeof intent.deliverableId).toBe('string');
      expect(intent.deliverableId.trim().length).toBeGreaterThan(0);
      expect(typeof intent.deliverableName).toBe('string');
      expect(intent.deliverableName.trim().length).toBeGreaterThan(0);
      expect(validModes).toContain(intent.requestedMode);
      expect(validReadiness).toContain(intent.exportReadiness);
      expect(validAudit).toContain(intent.auditRequirement);
      expect(validApprovalState).toContain(intent.approvalState);
      expect(typeof intent.requiresApproval).toBe('boolean');
      expect(typeof intent.staticHtmlAvailable).toBe('boolean');
    }
  });

  it('ready intents have null exportBlocker', () => {
    const readyIntents = manifest.intents.filter((i) => i.exportReadiness === 'ready');
    for (const intent of readyIntents) {
      expect(intent.exportBlocker).toBeNull();
    }
  });

  it('non-ready intents have a non-empty exportBlocker', () => {
    const nonReadyIntents = manifest.intents.filter((i) => i.exportReadiness !== 'ready');
    for (const intent of nonReadyIntents) {
      expect(typeof intent.exportBlocker).toBe('string');
      expect((intent.exportBlocker as string).trim().length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('deliverable-export-contract · module hygiene', () => {
  it('serialized manifest contains no live URL references', () => {
    const serialized = JSON.stringify(manifest);
    expect(serialized).not.toMatch(/https?:\/\//);
  });

  it('serialized manifest does not claim any file was generated or downloaded', () => {
    const serialized = JSON.stringify(manifest).toLowerCase();
    // These strings would imply a real file was produced.
    expect(serialized).not.toContain('generated file');
    expect(serialized).not.toContain('download url');
    expect(serialized).not.toContain('blob:');
    expect(serialized).not.toContain('data:application');
  });

  it('liveExportEnabled and every isLiveExportEnabled are exactly the literal false', () => {
    expect(manifest.liveExportEnabled).toStrictEqual(false);
    for (const intent of manifest.intents) {
      expect(intent.isLiveExportEnabled).toStrictEqual(false);
    }
  });
});
