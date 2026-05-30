/**
 * W4-PR-6 · Template · `connector.failed`
 *
 * Fires when a Source connector stops pulling data — auth expired,
 * provider returned 5xx beyond retry budget, schema drift broke the
 * parser. The tenant admin needs to act before the substrate goes
 * stale.
 *
 * Severity: critical. Channel: email_now + in_app. Mandatory.
 */

import {
  renderCtaButton,
  renderEmailShell,
  renderHeadline,
  renderMetaBlock,
  renderParagraph,
  renderTextFooter,
} from './_shared/EmailShell';
import { escapeHtml, formatTs, truncate, type TenantBrand } from './_shared/utils';

/** Payload shape for the connector.failed event. */
export interface ConnectorFailedPayload {
  eventId: string;
  /** Stable connector id; powers the CTA anchor. */
  connectorId: string;
  /** Display name (e.g. "Snowflake · Sales mart"). */
  connectorName: string;
  /** ISO timestamp of last successful pull (null if never succeeded). */
  lastSuccessIso: string | null;
  /** Short reason from the provider / parser (one line). */
  failureReason: string;
  /** Suggested action shown to the admin. */
  suggestedAction: string;
  /** ISO timestamp the event was produced. */
  producedAtIso: string;
  /** Optional CTA override. Defaults to admin connectors deep link. */
  ctaHref?: string;
}

const REASON =
  'you are a tenant admin subscribed to connector.failed events for this workspace';

export function subject(payload: ConnectorFailedPayload, tenant: TenantBrand): string {
  return `[${tenant.name}] Connector failed: ${payload.connectorName}`;
}

export function html(payload: ConnectorFailedPayload, tenant: TenantBrand): string {
  const cta = payload.ctaHref ?? `/admin/connectors#connector-${encodeURIComponent(payload.connectorId)}`;
  const lastSuccess = payload.lastSuccessIso
    ? formatTs(payload.lastSuccessIso)
    : 'never (first attempt)';

  const bodyHtml = [
    renderHeadline(`Connector ${payload.connectorName} stopped working`),
    renderParagraph(
      `Your Source connector <strong>${escapeHtml(payload.connectorName)}</strong> failed and will not pull new data until it is fixed. The substrate continues to serve cached rows.`,
    ),
    renderMetaBlock([
      { label: 'Connector', value: payload.connectorName },
      { label: 'Last success', value: lastSuccess },
      { label: 'Failure reason', value: truncate(payload.failureReason) },
      { label: 'Suggested action', value: truncate(payload.suggestedAction) },
      { label: 'Detected', value: formatTs(payload.producedAtIso) },
    ]),
    renderCtaButton('Open Connectors', cta),
    renderParagraph(
      'If this is expected (planned maintenance, provider outage), no action is required — the broker will re-attempt every 15 minutes.',
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

export function text(payload: ConnectorFailedPayload, tenant: TenantBrand): string {
  const cta = payload.ctaHref ?? `/admin/connectors#connector-${payload.connectorId}`;
  const lastSuccess = payload.lastSuccessIso
    ? formatTs(payload.lastSuccessIso)
    : 'never (first attempt)';
  return [
    `${tenant.name} · ${tenant.industryTag}`,
    `Connector ${payload.connectorName} stopped working`,
    '',
    `Your Source connector "${payload.connectorName}" failed and will not pull new data until it is fixed. The substrate continues to serve cached rows.`,
    '',
    `Last success: ${lastSuccess}`,
    `Failure reason: ${truncate(payload.failureReason)}`,
    `Suggested action: ${truncate(payload.suggestedAction)}`,
    `Detected: ${formatTs(payload.producedAtIso)}`,
    '',
    `Open Connectors: ${cta}`,
    '',
    'If this is expected (planned maintenance, provider outage), no action is required.',
    renderTextFooter({
      reason: REASON,
      producedAtIso: payload.producedAtIso,
      eventId: payload.eventId,
    }),
  ].join('\n');
}
