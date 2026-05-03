import { deriveDisplayCode, deriveMapLabel } from '@/lib/programs/transformers';

describe('strategic move transformer helpers', () => {
  it('derives display code from industry code, name, and year', () => {
    const code = deriveDisplayCode(
      { name: 'Healthcare Data Analytics Modernization', createdAt: '2026-05-01T00:00:00.000Z' },
      { industryCode: 'MH', slug: 'meridian-health' },
    );
    expect(code).toBe('MH-HEALTHCARE-2026');
  });

  it('derives compact map labels', () => {
    expect(
      deriveMapLabel({ name: 'Healthcare Data Analytics Modernization for Agentic Care' }),
    ).toBe('HDAM');
  });
});

