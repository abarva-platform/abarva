/**
 * Setup Acts content registry · validation suite
 *
 * Per SETUP-1_DETAILED_DESIGN.md §10.2. Tenant content with broken
 * references, marketing language, missing fields, or structural
 * defects fails CI — not warns.
 */

import {
  formatRelativeTimestamp,
  getAllSegmentReferences,
  getSetupActsContent,
  getSetupSummaryCounts,
  getSetupSummaryCountsWithSnapshot,
  mergeInventorySnapshot,
  resolveSegmentRef,
  type ActOneFact,
  type CapabilityGainEntry,
  type CapabilityNode,
  type SetupInventorySnapshot,
} from '@/lib/admin/setup-acts-registry';

describe('Setup Acts registry — Apex (rich) fixture', () => {
  it('returns rich content for apexretail tenant key', () => {
    const content = getSetupActsContent('apexretail');
    expect(content.tenantDataRichness).toBe('rich');
    expect(content.tenantDisplayName).toBe('Apex Retail Group');
  });

  it('Apex sentinelOpener is non-empty and references the tenant', () => {
    const content = getSetupActsContent('apexretail');
    expect(content.sentinelOpener.length).toBeGreaterThan(100);
    expect(content.sentinelOpener).toMatch(/Apex Retail/);
  });

  it('Apex Act 1 has at least 6 facts', () => {
    const content = getSetupActsContent('apexretail');
    expect(content.actOneFacts.length).toBeGreaterThanOrEqual(6);
  });

  it('every Act 1 fact has source segment + last-reviewed', () => {
    const content = getSetupActsContent('apexretail');
    for (const fact of content.actOneFacts) {
      expect(fact.label.length).toBeGreaterThan(0);
      expect(fact.value.length).toBeGreaterThan(0);
      expect(fact.sourceSegmentId).toMatch(/^\d{2}$/);
      expect(fact.sourceSegmentName.length).toBeGreaterThan(0);
      expect(typeof fact.lastReviewedDays).toBe('number');
    }
  });

  it('Apex Act 2 has at least 4 capability families covered', () => {
    const content = getSetupActsContent('apexretail');
    const families = new Set(content.actTwoCapabilityNodes.map((n) => n.family));
    expect(families.size).toBe(4); // pattern-citations, cross-program-signals, evidence-grounded-qa, outcome-measurement-readiness
  });

  it('every Act 2 capability node has a stable id starting with "cap."', () => {
    const content = getSetupActsContent('apexretail');
    for (const node of content.actTwoCapabilityNodes) {
      expect(node.id).toMatch(/^cap\./);
    }
  });

  it('every Act 2 capability node has a valid depth state', () => {
    const content = getSetupActsContent('apexretail');
    for (const node of content.actTwoCapabilityNodes) {
      expect(['grounded', 'partial', 'missing']).toContain(node.depthState);
    }
  });

  it('every Act 2 capability node has at least 2 grounding examples', () => {
    const content = getSetupActsContent('apexretail');
    for (const node of content.actTwoCapabilityNodes) {
      expect(node.groundingExamples.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('Apex Act 3 has at least 5 gain entries', () => {
    const content = getSetupActsContent('apexretail');
    expect(content.actThreeGainEntries.length).toBeGreaterThanOrEqual(5);
  });

  it('every Act 3 gain entry has Today/After previews + impact info', () => {
    const content = getSetupActsContent('apexretail');
    for (const gain of content.actThreeGainEntries) {
      expect(gain.id).toMatch(/^gain\./);
      expect(gain.targetSegmentId).toMatch(/^\d{2}$/);
      expect(gain.targetSegmentName.length).toBeGreaterThan(0);
      expect(gain.capabilityGained.length).toBeGreaterThan(20);
      expect(gain.todayPreview.length).toBeGreaterThan(20);
      expect(gain.afterPreview.length).toBeGreaterThan(20);
      expect(typeof gain.rank).toBe('number');
    }
  });

  it('Act 3 gain entries are unique by id', () => {
    const content = getSetupActsContent('apexretail');
    const ids = content.actThreeGainEntries.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('Apex has recent activity events', () => {
    const content = getSetupActsContent('apexretail');
    expect(content.recentActivity.length).toBeGreaterThan(0);
    for (const event of content.recentActivity) {
      expect(event.actor.length).toBeGreaterThan(0);
      expect(event.what.length).toBeGreaterThan(0);
      expect(event.timestamp.length).toBeGreaterThan(0);
    }
  });
});

describe('Setup Acts registry — sparse fallback', () => {
  it('returns rich content for known rich tenants (apex, meridian)', () => {
    expect(getSetupActsContent('apexretail').tenantDataRichness).toBe('rich');
    expect(getSetupActsContent('meridian').tenantDataRichness).toBe('rich');
  });

  it('returns sparse content for tenants without authored fixtures', () => {
    expect(getSetupActsContent('unknown')).toHaveProperty('tenantDataRichness', 'sparse');
  });

  it('sparse content has empty Act 1 + Act 2', () => {
    const content = getSetupActsContent('unknown');
    expect(content.actOneFacts).toEqual([]);
    expect(content.actTwoCapabilityNodes).toEqual([]);
  });

  it('sparse content has at least 3 onboarding gain entries', () => {
    const content = getSetupActsContent('unknown');
    expect(content.actThreeGainEntries.length).toBeGreaterThanOrEqual(3);
  });

  it('sparse content uses the cold-tenant opener', () => {
    const content = getSetupActsContent('unknown');
    expect(content.sentinelOpener).toMatch(/don['’]t know/i);
  });

  it('unknown tenant key returns sparse with safe display name', () => {
    const content = getSetupActsContent('not-a-real-tenant');
    expect(content.tenantDataRichness).toBe('sparse');
    expect(content.tenantDisplayName).toBe('Your tenant');
  });

  it('null tenant key returns sparse content', () => {
    const content = getSetupActsContent(null);
    expect(content.tenantDataRichness).toBe('sparse');
  });
});

describe('Setup Acts registry — voice rules (no marketing language)', () => {
  // Same forbidden list as J0/J1.
  const FORBIDDEN_PHRASES: ReadonlyArray<{ phrase: string; pattern: RegExp }> = [
    { phrase: 'unlock', pattern: /\b(?:unlock|unlocks|unlocked|unlocking)\b/i },
    {
      phrase: 'accelerate',
      pattern: /\b(?:accelerate|accelerates|accelerated|accelerating)\b/i,
    },
    {
      phrase: 'leverage',
      pattern: /\b(?:leverage|leverages|leveraged|leveraging)\b/i,
    },
    {
      phrase: 'empower',
      pattern: /\b(?:empower|empowers|empowered|empowering)\b/i,
    },
    { phrase: 'revolutionary', pattern: /\brevolutionary\b/i },
    { phrase: 'cutting-edge', pattern: /\bcutting[- ]edge\b/i },
    { phrase: 'game-changer', pattern: /\bgame[- ]chang(?:er|ing|e)\b/i },
    { phrase: 'best-in-class', pattern: /\bbest[- ]in[- ]class\b/i },
    { phrase: 'next-generation', pattern: /\bnext[- ]generation\b/i },
  ];

  function checkAllText(content: ReturnType<typeof getSetupActsContent>) {
    const checkText = (text: string, where: string) => {
      for (const { phrase, pattern } of FORBIDDEN_PHRASES) {
        if (pattern.test(text)) {
          throw new Error(
            `Setup acts content (${content.tenantKey}) ${where} contains forbidden phrase "${phrase}":\n${text}`,
          );
        }
      }
    };

    checkText(content.sentinelOpener, 'sentinelOpener');
    for (const fact of content.actOneFacts) {
      checkText(fact.label, 'actOneFacts.label');
      checkText(fact.value, 'actOneFacts.value');
    }
    for (const node of content.actTwoCapabilityNodes) {
      checkText(node.label, 'capability.label');
      for (const ex of node.groundingExamples) {
        checkText(ex.label, 'capability.groundingExamples.label');
      }
    }
    for (const gain of content.actThreeGainEntries) {
      checkText(gain.capabilityGained, 'gain.capabilityGained');
      checkText(gain.todayPreview, 'gain.todayPreview');
      checkText(gain.afterPreview, 'gain.afterPreview');
    }
  }

  it('Apex content uses no banned marketing language', () => {
    checkAllText(getSetupActsContent('apexretail'));
  });

  it('sparse content uses no banned marketing language', () => {
    checkAllText(getSetupActsContent('unknown'));
  });

  it('Meridian content uses no banned marketing language', () => {
    checkAllText(getSetupActsContent('meridian'));
  });
});

describe('Setup Acts registry — summary counts helper', () => {
  it('returns numeric counts for rich tenant', () => {
    const content = getSetupActsContent('apexretail');
    const counts = getSetupSummaryCounts(content);
    expect(typeof counts.totalRecords).toBe('number');
    expect(typeof counts.segmentsTracked).toBe('number');
    expect(typeof counts.capabilitiesGrounded).toBe('number');
    expect(counts.capabilitiesGrounded).toBeGreaterThan(0);
  });

  it('rich-tenant fallback total reflects real Apex record count (403)', () => {
    const content = getSetupActsContent('apexretail');
    const counts = getSetupSummaryCounts(content);
    expect(counts.totalRecords).toBe(403);
    expect(counts.segmentsTracked).toBe(14);
  });

  it('returns null counts for sparse tenant', () => {
    const content = getSetupActsContent('unknown');
    const counts = getSetupSummaryCounts(content);
    expect(counts.totalRecords).toBeNull();
    expect(counts.segmentsTracked).toBeNull();
    expect(counts.capabilitiesGrounded).toBe(0);
  });
});

describe('Setup Acts registry — snapshot merge', () => {
  function buildSnapshot(overrides: Partial<SetupInventorySnapshot> = {}): SetupInventorySnapshot {
    return {
      tenantKey: 'apex-retail',
      segments: [
        {
          segmentId: 'enterprise_profile',
          segmentName: 'Enterprise profile',
          familyNumber: 1,
          recordCount: 1,
          coverageScore: 100,
          staleCount: 0,
          missingCount: 0,
          healthState: 'complete',
          lastReviewedAt: null,
          lastIngestedAt: null,
        },
        {
          segmentId: 'org_structure',
          segmentName: 'Org structure',
          familyNumber: 2,
          recordCount: 36,
          coverageScore: 72,
          staleCount: 0,
          missingCount: 14,
          healthState: 'partial',
          lastReviewedAt: null,
          lastIngestedAt: null,
        },
      ],
      totalRecords: 37,
      totalChunks: 100,
      totalNodes: 50,
      totalEdges: 60,
      recentActivity: [
        {
          actor: 'Import pipeline',
          what: 'Imported segment org_structure',
          timestampIso: '2026-04-29T12:00:00Z',
        },
      ],
      lastIngestedAt: '2026-04-29T12:00:00Z',
      ...overrides,
    };
  }

  it('returns content untouched when snapshot is null', () => {
    const content = getSetupActsContent('apexretail');
    const merged = mergeInventorySnapshot(content, null);
    expect(merged).toBe(content);
  });

  it('replaces recent activity when snapshot has events', () => {
    const content = getSetupActsContent('apexretail');
    const snapshot = buildSnapshot();
    const merged = mergeInventorySnapshot(content, snapshot, new Date('2026-04-29T12:05:00Z'));
    expect(merged.recentActivity.length).toBe(1);
    expect(merged.recentActivity[0]?.actor).toBe('Import pipeline');
  });

  it('keeps authored activity when snapshot has no events', () => {
    const content = getSetupActsContent('apexretail');
    const snapshot = buildSnapshot({ recentActivity: [] });
    const merged = mergeInventorySnapshot(content, snapshot);
    expect(merged.recentActivity).toEqual(content.recentActivity);
  });

  it('promotes sparse tenant to rich when snapshot carries records', () => {
    const content = getSetupActsContent('unknown');
    expect(content.tenantDataRichness).toBe('sparse');
    const snapshot = buildSnapshot({ tenantKey: 'unknown', totalRecords: 12 });
    const merged = mergeInventorySnapshot(content, snapshot);
    expect(merged.tenantDataRichness).toBe('rich');
  });

  it('summary counts prefer live snapshot totals over fixture fallback', () => {
    const content = getSetupActsContent('apexretail');
    const snapshot = buildSnapshot({ totalRecords: 999 });
    const counts = getSetupSummaryCountsWithSnapshot(content, snapshot);
    expect(counts.totalRecords).toBe(999);
    expect(counts.segmentsTracked).toBe(2);
  });

  it('summary counts fall back to fixture totals when no snapshot', () => {
    const content = getSetupActsContent('apexretail');
    const counts = getSetupSummaryCountsWithSnapshot(content, null);
    expect(counts.totalRecords).toBe(403);
    expect(counts.segmentsTracked).toBe(14);
  });
});

describe('Setup Acts registry — segment reference helpers', () => {
  it('resolves numeric form "01" to enterprise_profile', () => {
    const ref = resolveSegmentRef('01');
    expect(ref?.segmentKey).toBe('enterprise_profile');
    expect(ref?.familyNumber).toBe(1);
    expect(ref?.displayName).toBe('Enterprise profile');
  });

  it('resolves substrate key "cross_program_signals" to numeric "14"', () => {
    const ref = resolveSegmentRef('cross_program_signals');
    expect(ref?.numericId).toBe('14');
    expect(ref?.familyNumber).toBe(14);
  });

  it('returns null for unknown ids', () => {
    expect(resolveSegmentRef('not-a-segment')).toBeNull();
    expect(resolveSegmentRef(null)).toBeNull();
  });

  it('exposes all 14 segments via getAllSegmentReferences', () => {
    const refs = getAllSegmentReferences();
    expect(refs).toHaveLength(14);
    expect(refs[0]?.familyNumber).toBe(1);
    expect(refs[13]?.familyNumber).toBe(14);
  });
});

describe('formatRelativeTimestamp', () => {
  const NOW = new Date('2026-04-29T12:00:00Z');

  it('returns "Just now" for very recent events', () => {
    expect(formatRelativeTimestamp('2026-04-29T11:59:50Z', NOW)).toBe('Just now');
  });

  it('returns minutes for sub-hour events', () => {
    expect(formatRelativeTimestamp('2026-04-29T11:30:00Z', NOW)).toBe('30m ago');
  });

  it('returns hours for sub-day events', () => {
    expect(formatRelativeTimestamp('2026-04-29T05:00:00Z', NOW)).toBe('7h ago');
  });

  it('returns days for sub-week events', () => {
    expect(formatRelativeTimestamp('2026-04-26T12:00:00Z', NOW)).toBe('3 days ago');
  });

  it('returns weeks for older events', () => {
    expect(formatRelativeTimestamp('2026-04-15T12:00:00Z', NOW)).toBe('2 weeks ago');
  });

  it('handles invalid timestamps gracefully', () => {
    expect(formatRelativeTimestamp('not-a-date', NOW)).toBe('Recently');
  });
});

describe('Setup Acts registry — type discipline', () => {
  it('Apex Act 1 fact shape is consistent', () => {
    const content = getSetupActsContent('apexretail');
    for (const fact of content.actOneFacts as ActOneFact[]) {
      const required: Array<keyof ActOneFact> = [
        'factType',
        'label',
        'value',
        'sourceSegmentId',
        'sourceSegmentName',
        'lastReviewedDays',
      ];
      for (const field of required) {
        expect(fact).toHaveProperty(field);
      }
    }
  });

  it('Apex Act 2 capability node shape is consistent', () => {
    const content = getSetupActsContent('apexretail');
    for (const node of content.actTwoCapabilityNodes as CapabilityNode[]) {
      const required: Array<keyof CapabilityNode> = [
        'id',
        'family',
        'label',
        'count',
        'countNoun',
        'depthState',
        'groundingExamples',
      ];
      for (const field of required) {
        expect(node).toHaveProperty(field);
      }
    }
  });

  it('Apex Act 3 gain entry shape is consistent', () => {
    const content = getSetupActsContent('apexretail');
    for (const gain of content.actThreeGainEntries as CapabilityGainEntry[]) {
      const required: Array<keyof CapabilityGainEntry> = [
        'id',
        'targetSegmentId',
        'targetSegmentName',
        'capabilityGained',
        'todayPreview',
        'afterPreview',
        'impactedPrograms',
        'rank',
      ];
      for (const field of required) {
        expect(gain).toHaveProperty(field);
      }
    }
  });
});
