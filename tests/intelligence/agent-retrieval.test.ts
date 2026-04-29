import SOURCING_PATTERNS from '../../src/lib/intelligence/seed-patterns-sourcing';
import {
  retrieveCategoryContext,
  retrieveStageContext,
} from '../../src/lib/intelligence/agent-retrieval';

const patternBodiesById = new Map(SOURCING_PATTERNS.map((pattern) => [pattern.id, pattern.body]));

describe('agent corpus retrieval bridge', () => {
  it.each([
    ['Plan', 'PAT-SRC-013'],
    ['RFI', 'PAT-SRC-014'],
    ['Shortlist', 'PAT-SRC-015'],
    ['RFP', 'PAT-SRC-016'],
    ['Q&A', 'PAT-SRC-017'],
    ['Initial-Bid', 'PAT-SRC-018'],
    ['BAFO', 'PAT-SRC-001'],
    ['Selection', 'PAT-SRC-011'],
    ['Award', 'PAT-SRC-012'],
    ['Onboard', 'PAT-SRC-019'],
  ])('retrieves the %s stage doctrine from pattern %s', (stage, patternId) => {
    expect(retrieveStageContext(stage)).toBe(patternBodiesById.get(patternId));
  });

  it.each([
    ['AMS vendor consolidation', undefined, 'PAT-SRC-020'],
    ['Enterprise CRM replacement', undefined, 'PAT-SRC-CAT-CRM-001'],
    ['Global payroll modernization', undefined, 'PAT-SRC-CAT-PAYROLL-001'],
    ['Cloud data warehouse selection', undefined, 'PAT-SRC-CAT-CDW-001'],
    ['Invoice-to-pay AP automation event', undefined, 'PAT-SRC-CAT-AP-001'],
    ['Generic event name', 'managed-services', 'PAT-SRC-020'],
  ])('retrieves category context for %s / %s from pattern %s', (eventName, eventType, patternId) => {
    expect(retrieveCategoryContext(eventName, eventType)).toBe(patternBodiesById.get(patternId));
  });

  it('returns null for absent or unrecognized stage/category input', () => {
    expect(retrieveStageContext(null)).toBeNull();
    expect(retrieveStageContext('Discovery')).toBeNull();
    expect(retrieveCategoryContext('Unmapped buyer event')).toBeNull();
  });
});
