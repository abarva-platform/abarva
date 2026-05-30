/**
 * W4-PR-6 · Template · `isolation.anomaly`
 *
 * Fires when the per-user RLS / tenant resolver detects a cross-tenant
 * resolution mismatch — the kind of event that lights up the isolation
 * lane and is also written to the tenant audit log.
 *
 * Severity: critical. Channel: email_now + in_app. Mandatory. The
 * email body is matter-of-fact; never sensational. PII is masked —
 * we expose tenant slugs, never user identifiers.
 */

import {
  renderCtaButton,
  renderEmailShell,
  renderHeadline,
  renderMetaBlock,
  renderParagraph,
  renderTextFooter,
} from './_shared/EmailShell';
import { escapeHtml, formatTs, type TenantBrand } from './_shared/utils';

export type IsolationAnomalySeverity = 'warn' | 'critical';

/** Payload shape for the isolation.anomaly event. */
export interface IsolationAnomalyPayload {
  eventId: string;
  /** Severity rating the resolver assigned. */
  severity: IsolationAnomalySeverity;
  /** Anonymized tenant slug the caller intended to reach. */
  intendedTenantSlug: string;
  /** Anonymized tenant slug the resolver actually returned. */
  resolvedTenantSlug: string;
  /** Short detector name, e.g. "rls.cross_tenant_read". */
  detector: string;
  /** ISO timestamp the event was produced. */
  producedAtIso: string;
  /** Optional CTA override. Defaults to admin audit isolation tab. */
  ctaHref?: string;
}

const REASON =
  'you are a tenant admin subscribed to isolation.anomaly events for this workspace';

export function subject(_payload: IsolationAnomalyPayload, tenant: TenantBrand): string {
  return `[${tenant.name}] Tenant isolation anomaly detected`;
}

export function html(payload: IsolationAnomalyPayload, tenant: TenantBrand): string {
  const cta = payload.ctaHref ?? '/admin/audit?tab=isolation';
  const severityLabel = payload.severity === 'critical' ? 'Critical' : 'Warning';

  const bodyHtml = [
    renderHeadline('We detected a cross-tenant resolution mismatch'),
    renderParagraph(
      'Our isolation resolver returned a different tenant context than the caller requested. The request was halted before any data left the tenant boundary; this email exists so your audit chain stays complete.',
    ),
    renderMetaBlock([
      { label: 'Severity', value: severityLabel },
      { label: 'Detector', value: payload.detector },
      { label: 'Intended tenant', value: payload.intendedTenantSlug },
      { label: 'Resolved tenant', value: payload.resolvedTenantSlug },
      { label: 'Detected', value: formatTs(payload.producedAtIso) },
    ]),
    renderCtaButton('Open Isolation lane', cta),
    renderParagraph(
      `This event also appears in your tenant audit log under detector <code style="font-family:'JetBrains Mono','SF Mono',Menlo,Monaco,Consolas,monospace;font-size:13px;color:#1A1A1A;">${escapeHtml(payload.detector)}</code>. No tenant-scoped data was disclosed.`,
    ),
  ].join('');

  return renderEmailShell({
    tenant,
    bodyHtml,
    reason: REASON,
    producedAtIso: payload.producedAtIso,
    eventId: payload.eventId,
  });
}

export function text(payload: IsolationAnomalyPayload, tenant: TenantBrand): string {
  const cta = payload.ctaHref ?? '/admin/audit?tab=isolation';
  const severityLabel = payload.severity === 'critical' ? 'Critical' : 'Warning';
  return [
    `${tenant.name} · ${tenant.industryTag}`,
    'Tenant isolation anomaly detected',
    '',
    'Our isolation resolver returned a different tenant context than the caller requested. The request was halted before any data left the tenant boundary; this email exists so your audit chain stays complete.',
    '',
    `Severity: ${severityLabel}`,
    `Detector: ${payload.detector}`,
    `Intended tenant: ${payload.intendedTenantSlug}`,
    `Resolved tenant: ${payload.resolvedTenantSlug}`,
    `Detected: ${formatTs(payload.producedAtIso)}`,
    '',
    `Open Isolation lane: ${cta}`,
    '',
    `This event also appears in your tenant audit log under detector ${payload.detector}. No tenant-scoped data was disclosed.`,
    renderTextFooter({
      reason: REASON,
      producedAtIso: payload.producedAtIso,
      eventId: payload.eventId,
    }),
  ].join('\n');
}
