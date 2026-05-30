/**
 * W4-PR-6 · Notification email template registry.
 *
 * Maps an event type → `{subject, html, text}` template triple. The
 * dispatcher resolves a template by event type; if the event type is
 * not in the registry, dispatching to email is rejected and the event
 * falls through to `in_app` only (per Wave 4 doctrine — we do not
 * email half-baked templates).
 *
 * Adding a new event type:
 *   1. Author `src/lib/notifications/templates/<event-slug>.tsx` with
 *      `subject`, `html`, `text` exports and a `<Event>Payload` type.
 *   2. Add it to `templateRegistry` below.
 *   3. Add a shape test case + snapshot fixture.
 *
 * Source: docs/build/ENTERPRISE_COMMS_SPINE_2026-05-30.md §4 (channel)
 * + §5 (compliance).
 */

import type { TenantBrand } from './_shared/utils';

import * as approvalRequested from './approval-requested';
import * as connectorFailed from './connector-failed';
import * as isolationAnomaly from './isolation-anomaly';
import * as authInviteAccepted from './auth-invite-accepted';
import * as programGateDecision from './program-gate-decision';
import * as dailyDigest from './daily-digest';

/** Payload union for the templated events. */
export type TemplatedEventType =
  | 'approval.requested'
  | 'connector.failed'
  | 'isolation.anomaly'
  | 'auth.invite_accepted'
  | 'program.gate_decision'
  | 'system.daily_digest';

/**
 * Generic template triple. Each template module exports exactly this
 * shape with a concrete payload type; we erase to `unknown` at the
 * registry boundary because the dispatcher does not know the event
 * type at compile time.
 */
export interface TemplateTriple<TPayload = unknown> {
  subject: (payload: TPayload, tenant: TenantBrand) => string;
  html: (payload: TPayload, tenant: TenantBrand) => string;
  text: (payload: TPayload, tenant: TenantBrand) => string;
}

/**
 * The registry. Values are typed as the generic triple so the map is
 * homogeneous; callers should pre-validate payload shape against the
 * concrete `<Event>Payload` type exported from each template module.
 */
const templateRegistry: Record<TemplatedEventType, TemplateTriple> = {
  'approval.requested': approvalRequested as unknown as TemplateTriple,
  'connector.failed': connectorFailed as unknown as TemplateTriple,
  'isolation.anomaly': isolationAnomaly as unknown as TemplateTriple,
  'auth.invite_accepted': authInviteAccepted as unknown as TemplateTriple,
  'program.gate_decision': programGateDecision as unknown as TemplateTriple,
  'system.daily_digest': dailyDigest as unknown as TemplateTriple,
};

/** Type-guard for known event types. */
export function isTemplatedEventType(value: string): value is TemplatedEventType {
  return value in templateRegistry;
}

/**
 * Resolve a template triple by event type. Returns `null` for any
 * event type not in the registry — the dispatcher treats that as
 * "in_app only, do not email".
 */
export function getTemplate(eventType: string): TemplateTriple | null {
  if (!isTemplatedEventType(eventType)) return null;
  return templateRegistry[eventType];
}

/**
 * Strict resolver. Throws if the event type is unknown — used by the
 * worker once routing has already confirmed the event is templatable,
 * so a miss here is a bug, not user input.
 */
export function requireTemplate(eventType: string): TemplateTriple {
  const found = getTemplate(eventType);
  if (!found) {
    throw new Error(
      `Notification email template missing for event type "${eventType}". ` +
        `Add the template to src/lib/notifications/templates/ and register it in index.ts.`,
    );
  }
  return found;
}

/** Enumerate every templated event type — used by tests. */
export const TEMPLATED_EVENT_TYPES: readonly TemplatedEventType[] = [
  'approval.requested',
  'connector.failed',
  'isolation.anomaly',
  'auth.invite_accepted',
  'program.gate_decision',
  'system.daily_digest',
] as const;

export type { TenantBrand };
export type { ApprovalRequestedPayload } from './approval-requested';
export type { ConnectorFailedPayload } from './connector-failed';
export type { IsolationAnomalyPayload } from './isolation-anomaly';
export type { AuthInviteAcceptedPayload } from './auth-invite-accepted';
export type {
  ProgramGateDecisionPayload,
  ProgramGateDecisionVerdict,
} from './program-gate-decision';
export type { DailyDigestEmailPayload } from './daily-digest';
