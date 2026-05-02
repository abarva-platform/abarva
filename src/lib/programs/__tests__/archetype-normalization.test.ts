import { normalizeProgramArchetype } from '../archetype-normalization';

describe('normalizeProgramArchetype', () => {
  it('keeps canonical archetype values', () => {
    expect(normalizeProgramArchetype('platform_modernization')).toBe('platform_modernization');
  });

  it('maps business labels to DB-safe archetypes', () => {
    expect(normalizeProgramArchetype('AMS Consolidation')).toBe('operational_optimization');
    expect(normalizeProgramArchetype('Healthcare Data Analytics Modernization')).toBe(
      'platform_modernization',
    );
    expect(normalizeProgramArchetype('AI-assisted product delivery')).toBe(
      'ai_product_enablement',
    );
  });

  it('returns null for function codes or unknown labels instead of violating DB checks', () => {
    expect(normalizeProgramArchetype('FRONT_OFFICE')).toBeNull();
    expect(normalizeProgramArchetype('')).toBeNull();
    expect(normalizeProgramArchetype(null)).toBeNull();
  });
});
