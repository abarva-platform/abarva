import { getArchetype } from '@/lib/atlas/iac/retrieval';
import { CATEGORY_ARCHETYPE_MAP, categoryIdToArchetypeKey } from '../category-archetype-map';

describe('Atlas category to IAC archetype map', () => {
  it('maps every configured category to a real registered archetype', () => {
    for (const [categoryId, archetypeKey] of Object.entries(CATEGORY_ARCHETYPE_MAP)) {
      expect(categoryIdToArchetypeKey(categoryId)).toBe(archetypeKey);
      expect(getArchetype(archetypeKey)).not.toBeNull();
    }
  });
});

