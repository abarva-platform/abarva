/**
 * W5-PR-3 · Template · `system.daily_digest`
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
import type { DailyDigestPayload } from '@/lib/admin/broker/notification-digest-broker';

export type DailyDigestEmailPayload = DailyDigestPayload;

const REASON =
  'you are subscribed to system.daily_digest events for this workspace';

function moduleSummary(moduleCounts: Record<string, number>): string {
  const entries = Object.entries(moduleCounts).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });
  if (entries.length === 0) return 'No module activity';
  return entries.map(([module, count]) => `${module}: ${count}`).join(' · ');
}

export function subject(payload: DailyDigestEmailPayload, tenant: TenantBrand): string {
  return `[${tenant.name}] Daily digest: ${payload.totalEvents} signals`;
}

export function html(payload: DailyDigestEmailPayload, tenant: TenantBrand): string {
  const topEvents = payload.topEvents.length > 0
    ? [
        '<ol style="margin:0 0 16px 20px;padding:0;">',
        ...payload.topEvents.map((event) =>
          `<li style="margin:0 0 8px 0;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;line-height:1.5;color:#1A1A1A;"><strong>${escapeHtml(event.title)}</strong><br/><span style="color:#5B6C8A;">${escapeHtml(event.sourceModule)} · ${escapeHtml(event.severity)} · ${escapeHtml(formatTs(event.createdAt))}</span></li>`,
        ),
        '</ol>',
      ].join('')
    : renderParagraph('No notify-worthy events were recorded in this window.');

  const bodyHtml = [
    renderHeadline('Your daily Trust Plane digest'),
    renderParagraph(
      `Steward captured <strong>${payload.totalEvents}</strong> notification signals between ${escapeHtml(formatTs(payload.periodStartIso))} and ${escapeHtml(formatTs(payload.periodEndIso))}.`,
    ),
    renderMetaBlock([
      { label: 'Critical', value: String(payload.criticalCount) },
      { label: 'Warnings', value: String(payload.warningCount) },
      { label: 'Modules', value: moduleSummary(payload.moduleCounts) },
      { label: 'Tenant timezone', value: payload.tenantTimezone },
    ]),
    topEvents,
    renderCtaButton('Open inbox', payload.ctaHref),
  ].join('');

  return renderEmailShell({
    tenant,
    bodyHtml,
    reason: REASON,
    producedAtIso: payload.producedAtIso,
    eventId: payload.eventId,
  });
}

export function text(payload: DailyDigestEmailPayload, tenant: TenantBrand): string {
  const eventLines = payload.topEvents.length > 0
    ? payload.topEvents.map(
        (event) =>
          `- ${event.title} (${event.sourceModule} · ${event.severity} · ${formatTs(event.createdAt)})`,
      )
    : ['- No notify-worthy events were recorded in this window.'];

  return [
    `${tenant.name} · ${tenant.industryTag}`,
    'Your daily Trust Plane digest',
    '',
    `Signals: ${payload.totalEvents}`,
    `Critical: ${payload.criticalCount}`,
    `Warnings: ${payload.warningCount}`,
    `Modules: ${moduleSummary(payload.moduleCounts)}`,
    `Window: ${formatTs(payload.periodStartIso)} to ${formatTs(payload.periodEndIso)}`,
    '',
    ...eventLines,
    '',
    `Open inbox: ${payload.ctaHref}`,
    renderTextFooter({
      reason: REASON,
      producedAtIso: payload.producedAtIso,
      eventId: payload.eventId,
    }),
  ].join('\n');
}
