/**
 * W4-PR-2 · Persona-default subscription resolver
 *
 * Encodes the Spine §3 matrix: given a (tenant, user, role, event_type)
 * tuple, does this user receive this event by default — even if they
 * have not explicitly subscribed?
 *
 * The broker calls `userMatchesPersonaDefault()` for every candidate
 * subscriber when fanning out an event. If the function returns true,
 * the user is added to the recipient set, the event is delivered via
 * the registry's `defaultChannels`, and a `notification_preferences`
 * row is auto-created on first send so the user can later override.
 *
 * Personas (Spine §3, 8 total):
 *
 *   tenant_admin         · platform-admin or tenant_admin role
 *   steward              · operates the data fabric (sme + steward flag)
 *   security_compliance  · owns security / privacy / SR 11-7 / SOC 2
 *   program_owner        · sponsor of a Move, owns gates / approvals
 *   source_lead          · sourcing decision-room owner
 *   cxo_subscriber       · CXO seat — strategic / executive subset
 *   founder              · platform-admin override (Anand)
 *   incident_response    · on-call for incidents / isolation breaches
 *
 * Persona inputs are resolved upstream — typically:
 *   • Role comes from `getUserTenantRole()` (Clerk tenantRoles map).
 *   • Persona flags come from a future `user_personas` table or
 *     Clerk `publicMetadata.personas` array. For Phase 1 we honour
 *     a thin overlay: tenant_admin is implicit for the admin role,
 *     founder is implicit for the platform-admin allowlist, and the
 *     remaining personas are explicit opt-in via the personas list.
 *
 * Honesty: this resolver returns a deterministic boolean. It does NOT
 * query the database. The broker is responsible for fetching user role
 * + personas via existing helpers (`getUserTenantRole`,
 * `getUserPersonas`) and passing them in.
 */

import type { NotificationSourceModule } from '@/lib/admin/broker/notifications-types';
import {
  lookupEventDefinition,
  type EventDefinition,
} from './registry';

// ─────────────────────────────────────────────────────────────────────────────
// Persona contract
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationPersona =
  | 'tenant_admin'
  | 'steward'
  | 'security_compliance'
  | 'program_owner'
  | 'source_lead'
  | 'cxo_subscriber'
  | 'founder'
  | 'incident_response';

export const ALL_PERSONAS: readonly NotificationPersona[] = [
  'tenant_admin',
  'steward',
  'security_compliance',
  'program_owner',
  'source_lead',
  'cxo_subscriber',
  'founder',
  'incident_response',
] as const;

/**
 * Persona resolution input for a single user. The broker assembles
 * this from Clerk + tenant_roles + (eventually) user_personas.
 */
export interface UserPersonaContext {
  /** Clerk user id. */
  userId: string;
  /** Tenant role (or 'platform_admin' / null for non-tenant users). */
  tenantRole: 'tenant_admin' | 'sponsor' | 'sme' | 'viewer' | 'platform_admin' | null;
  /**
   * Explicit personas the user opted into (or was assigned to). The
   * broker derives this from `publicMetadata.personas` or a future
   * `user_personas` table. Empty list is fine; tenant_admin / founder
   * are derived from `tenantRole` directly.
   */
  personas: readonly NotificationPersona[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-persona event matchers — the Spine §3 matrix in code.
//
// Each entry returns true when this persona should receive the event
// by default. The matcher gets the full event definition so it can
// branch on sourceModule / severity / category.
// ─────────────────────────────────────────────────────────────────────────────

type PersonaMatcher = (def: EventDefinition) => boolean;

const PERSONA_MATRIX: Record<NotificationPersona, PersonaMatcher> = {
  /**
   * Tenant admins receive every governance + security + critical event
   * + the 5 mandatory urgent events. They are the operating owner of
   * the tenant; they get the firehose for category=governance/security
   * but escape transactional digest spam.
   */
  tenant_admin(def) {
    if (def.category === 'security') return true;
    if (def.category === 'governance') return true;
    if (def.severity === 'critical') return true;
    // Tenant admins also receive the 5 mandatory urgent events.
    return URGENT_ADMIN_EVENTS.has(def.eventType);
  },

  /**
   * Stewards own the data fabric. They get connector + context +
   * substrate signals plus any operational event from Setup.
   */
  steward(def) {
    if (def.eventType === 'connector.failed') return true;
    if (def.eventType.startsWith('intelligence.context_')) return true;
    if (def.eventType === 'intelligence.grounding_gap') return true;
    if (def.sourceModule === 'setup' && def.category === 'operational') return true;
    return false;
  },

  /**
   * Security / compliance owners get every security-category event,
   * every isolation/egress event, every policy mutation, every
   * incident, plus role changes.
   */
  security_compliance(def) {
    if (def.category === 'security') return true;
    if (def.eventType.startsWith('isolation.')) return true;
    if (def.eventType.startsWith('egress.')) return true;
    if (def.eventType.startsWith('policy.')) return true;
    if (def.eventType === 'auth.role_changed') return true;
    if (def.eventType === 'rls.policy_change') return true;
    if (def.eventType === 'system.incident_declared') return true;
    return false;
  },

  /**
   * Program owners (sponsors) receive Moves + Source events tied to
   * the gate / approval lifecycle. The broker is responsible for
   * scoping these to the programs the user actually owns — this
   * matcher only returns true on event_type membership; ownership
   * scoping is a broker-level join.
   */
  program_owner(def) {
    if (def.sourceModule === 'moves') return true;
    if (def.eventType === 'source.approval_needed') return true;
    if (def.eventType === 'source.decision_recorded') return true;
    return false;
  },

  /**
   * Source leads own the sourcing decision room.
   */
  source_lead(def) {
    return def.sourceModule === 'source';
  },

  /**
   * CXO subscribers get the executive digest channel + portfolio
   * health changes + regulatory risk. They are NOT a recipient for
   * raw operational events; they receive curated tower output.
   */
  cxo_subscriber(def) {
    if (def.sourceModule === 'tower') return true;
    if (def.eventType === 'billing.alert') return true;
    if (def.eventType === 'system.incident_declared') return true;
    if (def.eventType === 'system.weekly_digest') return true;
    return false;
  },

  /**
   * Founder persona — receives a curated cross-tenant feed of
   * critical events. The broker MUST gate on tenant matching even
   * for founder; this persona unlocks fan-out at the persona-default
   * layer only.
   */
  founder(def) {
    return def.severity === 'critical';
  },

  /**
   * Incident-response oncall — gets every security-class event and
   * every incident declaration. Quiet-hours override is broker-side.
   */
  incident_response(def) {
    if (def.category === 'security') return true;
    if (def.eventType === 'system.incident_declared') return true;
    if (def.eventType.startsWith('isolation.')) return true;
    return false;
  },
};

/**
 * The 5 mandatory urgent events tenant admins auto-subscribe to per
 * founder doctrine. Mirrors `DEFAULT_ADMIN_MANDATORY_EVENT_TYPES` from
 * `notifications-types.ts` — kept in sync via test.
 */
const URGENT_ADMIN_EVENTS: ReadonlySet<string> = new Set([
  'approval.requested',
  'approval.escalated',
  'connector.failed',
  'rls.policy_change',
  'billing.alert',
]);

// ─────────────────────────────────────────────────────────────────────────────
// Public API — what the broker calls.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derive the effective persona list for a user. Combines explicit
 * `personas` from the context with role-implied personas:
 *
 *   - role === 'tenant_admin' implies the tenant_admin persona
 *   - role === 'platform_admin' implies both tenant_admin + founder
 *
 * Returns a deduped list so downstream matchers don't double-fan.
 */
export function effectivePersonas(ctx: UserPersonaContext): readonly NotificationPersona[] {
  const set = new Set<NotificationPersona>(ctx.personas);
  if (ctx.tenantRole === 'tenant_admin') set.add('tenant_admin');
  if (ctx.tenantRole === 'platform_admin') {
    set.add('tenant_admin');
    set.add('founder');
  }
  return Array.from(set);
}

/**
 * Returns true when this user receives this event by persona default.
 * Returns false if the event is unregistered (registry is the gate).
 */
export function userMatchesPersonaDefault(
  ctx: UserPersonaContext,
  eventType: string,
): boolean {
  const def = lookupEventDefinition(eventType);
  if (!def) return false;
  const personas = effectivePersonas(ctx);
  for (const p of personas) {
    if (PERSONA_MATRIX[p](def)) return true;
  }
  return false;
}

/**
 * Predicate — does this persona, by itself, match this event?
 * Exposed for testing the matrix without assembling a user context.
 */
export function personaMatchesEvent(
  persona: NotificationPersona,
  eventType: string,
): boolean {
  const def = lookupEventDefinition(eventType);
  if (!def) return false;
  return PERSONA_MATRIX[persona](def);
}

/**
 * Returns the list of event_types this persona would receive by
 * default. Useful for the preferences page "events your role gets by
 * default" panel.
 */
export function eventsForPersona(
  persona: NotificationPersona,
  registry: Record<string, EventDefinition>,
): readonly string[] {
  const matcher = PERSONA_MATRIX[persona];
  return Object.values(registry)
    .filter(matcher)
    .map((def) => def.eventType);
}

/**
 * Sanity helper — does the persona apply at all to events from this
 * module? Used by the broker to short-circuit fan-out for events that
 * no persona cares about (rare but possible during registry expansion).
 */
export function personaAppliesToModule(
  persona: NotificationPersona,
  sourceModule: NotificationSourceModule,
): boolean {
  // Cheap structural test — does ANY registered event in this module
  // match the persona? The broker uses this to avoid spinning subscribers
  // for impossible (persona, module) pairs.
  // We import the registry lazily inside the function body to avoid a
  // circular reference on the persona-default ↔ registry boundary.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { NOTIFICATION_REGISTRY } = require('./registry') as {
    NOTIFICATION_REGISTRY: Record<string, EventDefinition>;
  };
  const matcher = PERSONA_MATRIX[persona];
  return Object.values(NOTIFICATION_REGISTRY).some(
    (def) => def.sourceModule === sourceModule && matcher(def),
  );
}
