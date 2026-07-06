// Keystone proof: a live event resolves to the correct archetype from the
// classifier category, falls back to event_type only when needed, and REFUSES
// (never guesses) for categories with no shipped archetype.

import {
  archetypeReadyCategories,
  CATEGORY_TO_ARCHETYPE_ID,
  resolveArchetypeForEvent,
} from '../event-archetype-resolver';
import { SOURCE_CATEGORY_IDS } from '../../taxonomy/category-taxonomy';

describe('event → archetype resolution (classifier category)', () => {
  it('resolves ams → AMS_MANAGED_SERVICES', () => {
    const r = resolveArchetypeForEvent({ categoryId: 'ams' });
    expect(r.resolved).toBe(true);
    expect(r.archetypeId).toBe('AMS_MANAGED_SERVICES');
    expect(r.archetype?.id).toBe('AMS_MANAGED_SERVICES');
    expect(r.source).toBe('classifier_category');
  });

  it('resolves data_ai_platform → AI_DATA_PLATFORM and saas_renewal → CONTRACT_RENEWAL', () => {
    expect(resolveArchetypeForEvent({ categoryId: 'data_ai_platform' }).archetypeId).toBe('AI_DATA_PLATFORM');
    expect(resolveArchetypeForEvent({ categoryId: 'saas_renewal' }).archetypeId).toBe('CONTRACT_RENEWAL');
  });

  it('resolves the newly-shipped archetype categories', () => {
    expect(resolveArchetypeForEvent({ categoryId: 'cyber_grc' }).archetypeId).toBe('MSSP_CYBER');
    expect(resolveArchetypeForEvent({ categoryId: 'staff_aug_vs_managed_service' }).archetypeId).toBe(
      'STAFF_AUGMENTATION',
    );
    expect(resolveArchetypeForEvent({ categoryId: 'ai_engineering_partner' }).archetypeId).toBe(
      'DIGITAL_PRODUCT_ENGINEERING',
    );
    expect(resolveArchetypeForEvent({ categoryId: 'bpo_contact_centre' }).archetypeId).toBe('CONTACT_CENTER_CX');
    expect(resolveArchetypeForEvent({ categoryId: 'bpo_shared_services' }).archetypeId).toBe('BPO_SHARED_SERVICES');
  });
});

describe('event → archetype resolution (event_type fallback)', () => {
  it('uses event_type only when no classifier category is available', () => {
    const r = resolveArchetypeForEvent({ eventType: 'software' });
    expect(r.resolved).toBe(true);
    expect(r.archetypeId).toBe('ERP_SI_IMPLEMENTATION');
    expect(r.source).toBe('event_type_fallback');
    expect(r.reason).toMatch(/Re-run classification/i);
  });

  it('prefers the classifier category over event_type when both are present', () => {
    const r = resolveArchetypeForEvent({ categoryId: 'ams', eventType: 'software' });
    expect(r.archetypeId).toBe('AMS_MANAGED_SERVICES');
    expect(r.source).toBe('classifier_category');
  });

  it('refuses for an ambiguous/legacy event_type with no confident archetype', () => {
    expect(resolveArchetypeForEvent({ eventType: 'other' }).resolved).toBe(false);
    expect(resolveArchetypeForEvent({ eventType: 'staffing' }).resolved).toBe(false);
  });

  it('refuses cleanly when nothing is supplied', () => {
    const r = resolveArchetypeForEvent({});
    expect(r.resolved).toBe(false);
    expect(r.reason).toMatch(/cannot resolve/i);
  });
});

describe('resolver integrity', () => {
  it('maps every live classifier category id (no silent omissions)', () => {
    for (const id of SOURCE_CATEGORY_IDS) {
      expect(id in CATEGORY_TO_ARCHETYPE_ID).toBe(true);
    }
  });

  it('reports exactly the categories that currently have a shipped archetype', () => {
    expect(archetypeReadyCategories().sort()).toEqual([
      'ai_engineering_partner',
      'ams',
      'bpo_contact_centre',
      'bpo_shared_services',
      'cloud_finops',
      'cyber_grc',
      'data_ai_platform',
      'saas_renewal',
      'staff_aug_vs_managed_service',
    ]);
  });
});
