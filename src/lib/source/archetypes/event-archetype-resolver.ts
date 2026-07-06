// Keystone: resolve a LIVE Source event to a SourceEventArchetype.
//
// The live classifier (src/lib/source/classifier) already emits an auditable
// SourceCategoryId. This module is the single, explicit bridge from that
// category to the archetype contract. It NEVER guesses: a category with no
// shipped archetype resolves to `null` with a stated reason, so the runtime
// refuses rather than running an event through the wrong DNA.
//
// As archetypes are added (4 → 12), extend CATEGORY_TO_ARCHETYPE_ID only. No
// other runtime code changes.

import type { SourceCategoryId } from '../taxonomy/category-taxonomy';
import { SOURCE_CATEGORY_IDS } from '../taxonomy/category-taxonomy';
import { getSourceArchetype } from './registry';
import type { SourceEventArchetype } from './types';

/**
 * Explicit category → archetype map. `null` = no shipped archetype yet (the
 * runtime must refuse for that category, not substitute a different one).
 *
 * Live classifier categories (9): ams, data_ai_platform, ai_engineering_partner,
 * saas_renewal, cloud_finops, bpo_contact_centre, bpo_shared_services, cyber_grc,
 * staff_aug_vs_managed_service.
 */
export const CATEGORY_TO_ARCHETYPE_ID: Record<SourceCategoryId, string | null> = {
  ams: 'AMS_MANAGED_SERVICES',
  data_ai_platform: 'AI_DATA_PLATFORM',
  saas_renewal: 'CONTRACT_RENEWAL',
  ai_engineering_partner: 'DIGITAL_PRODUCT_ENGINEERING',
  cloud_finops: 'CLOUD_FINOPS',
  bpo_contact_centre: 'CONTACT_CENTER_CX',
  bpo_shared_services: 'BPO_SHARED_SERVICES',
  cyber_grc: 'MSSP_CYBER',
  staff_aug_vs_managed_service: 'STAFF_AUGMENTATION',
};

/**
 * Some live events also carry a stored `source_events.event_type` string
 * ('managed_service', 'software', 'staffing', 'infrastructure', 'consulting',
 * 'other'). This is a coarser, legacy signal used ONLY as a fallback when no
 * classifier category is available. It maps to an archetype's own `eventType`.
 */
export const EVENT_TYPE_TO_ARCHETYPE_ID: Record<string, string | null> = {
  managed_service: 'CONTRACT_RENEWAL',
  software: 'ERP_SI_IMPLEMENTATION',
  // coarse / ambiguous legacy values — no confident archetype:
  infrastructure: null,
  staffing: null,
  consulting: null,
  other: null,
};

export type ArchetypeResolutionSource = 'classifier_category' | 'event_type_fallback' | 'unresolved';

export interface ArchetypeResolution {
  resolved: boolean;
  archetype: SourceEventArchetype | null;
  archetypeId: string | null;
  source: ArchetypeResolutionSource;
  /** The classifier category, if one was supplied. */
  categoryId: SourceCategoryId | null;
  /** Human-readable, auditable reason (always populated). */
  reason: string;
}

export interface ResolveArchetypeInput {
  /** Preferred signal — the live classifier's category id. */
  categoryId?: SourceCategoryId | null;
  /** Fallback signal — the stored source_events.event_type string. */
  eventType?: string | null;
}

function isCategoryId(x: string): x is SourceCategoryId {
  return (SOURCE_CATEGORY_IDS as readonly string[]).includes(x);
}

/**
 * Resolve an archetype for a live event. Classifier category wins; the stored
 * event_type is a fallback only. Returns an unresolved result (never throws,
 * never guesses) when no shipped archetype matches.
 */
export function resolveArchetypeForEvent(input: ResolveArchetypeInput): ArchetypeResolution {
  const categoryId = input.categoryId ?? null;

  // 1 · Preferred: classifier category.
  if (categoryId && isCategoryId(categoryId)) {
    const archId = CATEGORY_TO_ARCHETYPE_ID[categoryId];
    if (archId) {
      const archetype = getSourceArchetype(archId) ?? null;
      if (archetype) {
        return {
          resolved: true,
          archetype,
          archetypeId: archId,
          source: 'classifier_category',
          categoryId,
          reason: `Resolved archetype ${archId} from classifier category '${categoryId}'.`,
        };
      }
    }
    // category known but no shipped archetype → refuse explicitly.
    return {
      resolved: false,
      archetype: null,
      archetypeId: null,
      source: 'unresolved',
      categoryId,
      reason: `Classifier category '${categoryId}' has no shipped archetype yet. ` +
        `Refusing to run the event through a different archetype. Add it to CATEGORY_TO_ARCHETYPE_ID when shipped.`,
    };
  }

  // 2 · Fallback: stored event_type.
  const eventType = (input.eventType ?? '').trim();
  if (eventType) {
    const archId = EVENT_TYPE_TO_ARCHETYPE_ID[eventType];
    if (archId) {
      const archetype = getSourceArchetype(archId) ?? null;
      if (archetype) {
        return {
          resolved: true,
          archetype,
          archetypeId: archId,
          source: 'event_type_fallback',
          categoryId: null,
          reason: `Resolved archetype ${archId} from stored event_type '${eventType}' (classifier category unavailable). ` +
            `Re-run classification for a higher-confidence resolution.`,
        };
      }
    }
    return {
      resolved: false,
      archetype: null,
      archetypeId: null,
      source: 'unresolved',
      categoryId: null,
      reason: `Stored event_type '${eventType}' does not map to a shipped archetype. Classify the event first.`,
    };
  }

  // 3 · Nothing to resolve from.
  return {
    resolved: false,
    archetype: null,
    archetypeId: null,
    source: 'unresolved',
    categoryId: null,
    reason: 'No classifier category and no event_type supplied — cannot resolve an archetype.',
  };
}

/** Which live classifier categories currently have a shipped archetype. */
export function archetypeReadyCategories(): SourceCategoryId[] {
  return (SOURCE_CATEGORY_IDS as readonly SourceCategoryId[]).filter(
    (c) => CATEGORY_TO_ARCHETYPE_ID[c] != null,
  );
}
