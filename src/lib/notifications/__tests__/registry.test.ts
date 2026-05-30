/**
 * W4-PR-2 · Registry hygiene tests
 *
 * Verifies:
 *   • Exactly 42 events ship — the count Spine §2 declares.
 *   • Every entry uses valid enum values.
 *   • No duplicate event_types.
 *   • Lock-step between the per-module counts and Spine §2.
 *   • The DEFAULT_ADMIN_MANDATORY_EVENT_TYPES list lines up with the
 *     registry (every mandatory event_type is registered).
 */

import {
  NOTIFICATION_REGISTRY,
  REGISTERED_EVENT_TYPES,
  lookupEventDefinition,
} from '../registry';
import { DEFAULT_ADMIN_MANDATORY_EVENT_TYPES } from '@/lib/admin/broker/notifications-types';

const VALID_SOURCE_MODULES = new Set([
  'setup',
  'moves',
  'source',
  'intelligence',
  'tower',
  'system',
]);
const VALID_SEVERITIES = new Set(['info', 'warn', 'critical']);
const VALID_CATEGORIES = new Set([
  'operational',
  'governance',
  'security',
  'business',
  'digest',
]);
const VALID_AUDIT_CLASSES = new Set([
  'transactional',
  'security',
  'compliance',
  'marketing',
]);
const VALID_DEFAULT_CHANNELS = new Set(['email', 'in_app']);
const VALID_FREQUENCIES = new Set([
  'immediate',
  'digest_daily',
  'digest_weekly',
  'none',
]);
const VALID_PII_CLASSES = new Set(['none', 'redacted', 'personal_redacted']);
const VALID_RETENTION = new Set([90, 2555]);

describe('NOTIFICATION_REGISTRY hygiene', () => {
  const entries = Object.values(NOTIFICATION_REGISTRY);

  it('ships exactly 42 events per Spine §2', () => {
    expect(entries).toHaveLength(42);
    expect(REGISTERED_EVENT_TYPES.size).toBe(42);
  });

  it('has no duplicate event_types', () => {
    const seen = new Set<string>();
    for (const def of entries) {
      expect(seen.has(def.eventType)).toBe(false);
      seen.add(def.eventType);
    }
  });

  it('uses the eventType field as the map key', () => {
    for (const [key, def] of Object.entries(NOTIFICATION_REGISTRY)) {
      expect(def.eventType).toBe(key);
    }
  });

  it('uses only valid sourceModule values', () => {
    for (const def of entries) {
      expect(VALID_SOURCE_MODULES.has(def.sourceModule)).toBe(true);
    }
  });

  it('uses only valid severity values', () => {
    for (const def of entries) {
      expect(VALID_SEVERITIES.has(def.severity)).toBe(true);
    }
  });

  it('uses only valid category values', () => {
    for (const def of entries) {
      expect(VALID_CATEGORIES.has(def.category)).toBe(true);
    }
  });

  it('uses only valid auditClass values', () => {
    for (const def of entries) {
      expect(VALID_AUDIT_CLASSES.has(def.auditClass)).toBe(true);
    }
  });

  it('uses only Phase 1 defaultChannels (email or in_app)', () => {
    for (const def of entries) {
      for (const ch of def.defaultChannels) {
        expect(VALID_DEFAULT_CHANNELS.has(ch)).toBe(true);
      }
      // At least one default channel — otherwise the broker enqueues nothing.
      expect(def.defaultChannels.length).toBeGreaterThan(0);
    }
  });

  it('uses only valid defaultFrequency values', () => {
    for (const def of entries) {
      expect(VALID_FREQUENCIES.has(def.defaultFrequency)).toBe(true);
    }
  });

  it('uses only valid piiClass values', () => {
    for (const def of entries) {
      expect(VALID_PII_CLASSES.has(def.piiClass)).toBe(true);
    }
  });

  it('uses retentionDays aligned to auditClass per Spine §5', () => {
    for (const def of entries) {
      expect(VALID_RETENTION.has(def.retentionDays)).toBe(true);
      if (def.auditClass === 'transactional') {
        expect(def.retentionDays).toBe(90);
      } else if (def.auditClass === 'security' || def.auditClass === 'compliance') {
        expect(def.retentionDays).toBe(2555);
      }
    }
  });

  it('matches the Spine §2 per-module count breakdown', () => {
    const counts: Record<string, number> = {
      setup: 0,
      moves: 0,
      source: 0,
      intelligence: 0,
      tower: 0,
      system: 0,
    };
    for (const def of entries) counts[def.sourceModule] += 1;
    expect(counts).toEqual({
      setup: 8,
      moves: 8,
      source: 7,
      intelligence: 6,
      tower: 4,
      system: 9,
    });
  });

  it('every DEFAULT_ADMIN_MANDATORY_EVENT_TYPE is registered', () => {
    for (const ev of DEFAULT_ADMIN_MANDATORY_EVENT_TYPES) {
      const def = lookupEventDefinition(ev);
      expect(def).not.toBeNull();
    }
  });
});

describe('lookupEventDefinition', () => {
  it('returns the definition for a registered event_type', () => {
    const def = lookupEventDefinition('approval.requested');
    expect(def).not.toBeNull();
    expect(def?.eventType).toBe('approval.requested');
  });
  it('returns null for an unregistered event_type', () => {
    expect(lookupEventDefinition('nonexistent.event')).toBeNull();
  });
});
