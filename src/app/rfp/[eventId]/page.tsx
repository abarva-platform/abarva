// Vendor RFP overview.
//
// Server-rendered from the vendor session. Everything the vendor may see or do
// comes from `buildPortalView`, which composes the same `access.ts` decision the
// API routes enforce — so the page cannot offer an action the server will refuse.

import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { sessionCookieName } from '@/lib/source/vendor-portal/session';
import {
  resolveVendorBySession,
  listVendorEvents,
  countSubmissions,
  recordVendorEvent,
} from '@/lib/source/vendor-portal/dao';
import { buildPortalView, type RfpSection } from '@/lib/source/vendor-portal/portal-view';
import { loadRfpSections } from '@/lib/source/vendor-portal/rfp-sections';
import { AcknowledgementForm } from './acknowledgement-form';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function VendorRfpPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const jar = await cookies();
  const token = jar.get(sessionCookieName(eventId))?.value ?? '';
  const vendor = await resolveVendorBySession(eventId, token);
  if (!vendor) redirect(`/rfp/${eventId}/sign-in`);

  const [activity, submissionCount, sections] = await Promise.all([
    listVendorEvents(vendor.id),
    countSubmissions(vendor.id),
    loadRfpSections(eventId),
  ]);

  // The vendor opening the overview is itself an auditable act.
  await recordVendorEvent({
    vendorId: vendor.id,
    tenantKey: vendor.tenantKey,
    type: 'invitation_viewed',
  });

  const view = buildPortalView({
    eventName: sections.eventName,
    buyerDisplayName: sections.buyerDisplayName,
    vendorDisplayName: vendor.vendorDisplayName,
    invitationState: vendor.invitationState,
    acceptBy: vendor.acceptBy,
    respondBy: vendor.respondBy,
    sections: sections.sections,
    activity,
    submissionCount,
  });

  await headers(); // force dynamic rendering; the page is per-vendor

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <header style={S.header}>
          <p style={S.eyebrow}>Request for Proposal</p>
          <h1 style={S.h1}>{view.heading}</h1>
          <p style={S.sub}>
            Issued by {view.issuedBy} to {vendor.vendorDisplayName}
          </p>
        </header>

        <section style={S.cta}>
          <p style={S.ctaLabel}>What to do next</p>
          <p style={S.ctaText}>{view.primaryCallToAction}</p>
        </section>

        <section style={S.deadlines}>
          {view.deadlines.map((d) => (
            <div key={d.label} style={{ ...S.deadline, ...(d.isNext ? S.deadlineNext : {}) }}>
              <p style={S.deadlineLabel}>{d.label}</p>
              <p style={S.deadlineAt}>{d.at.toUTCString()}</p>
              <p style={S.deadlineMeta}>
                {d.passed
                  ? 'Closed'
                  : `${Math.max(0, Math.round(d.hoursRemaining))} hours remaining`}
              </p>
            </div>
          ))}
        </section>

        {view.access.canAcknowledge ? (
          <AcknowledgementForm eventId={eventId} />
        ) : null}

        <section style={S.block}>
          <h2 style={S.h2}>The solicitation</h2>
          <p style={S.note}>{view.packageExpectation}</p>
          {view.sections.length === 0 ? (
            <p style={S.empty}>
              Section summaries are not yet published for this solicitation. The full RFP package is
              the authoritative source.
            </p>
          ) : (
            <ol style={S.sectionList}>
              {view.sections.map((s: RfpSection) => (
                <li key={s.key} style={S.sectionItem}>
                  <p style={S.sectionTitle}>
                    {s.ordinal}. {s.title}
                    {s.requiresAction ? <span style={S.actionTag}>Action required</span> : null}
                  </p>
                  <p style={S.sectionSummary}>{s.summary}</p>
                </li>
              ))}
            </ol>
          )}
          {view.access.canDownloadPackage ? (
            <a href={`/api/v1/source/rfp/${eventId}/package`} style={S.download}>
              Download the RFP package
            </a>
          ) : (
            <p style={S.locked}>{view.blockedReason}</p>
          )}
        </section>

        <section style={S.block}>
          <h2 style={S.h2}>Your activity</h2>
          <p style={S.note}>
            Everything your organisation has done on this solicitation. Actions are recorded against
            your organisation, not an individual, because this login is shared.
          </p>
          {view.activity.length === 0 ? (
            <p style={S.empty}>No activity recorded yet.</p>
          ) : (
            <ul style={S.activityList}>
              {view.activity.map((a, i) => (
                <li key={`${a.label}-${i}`} style={S.activityItem}>
                  <span style={S.activityAt}>{a.at.toUTCString()}</span>
                  <span>{a.label}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#f7f5ef', fontFamily: 'Inter, "Segoe UI", system-ui, sans-serif', color: '#1b2b5c' },
  wrap: { maxWidth: 880, margin: '0 auto', padding: '44px 24px 90px' },
  header: { paddingBottom: 22, borderBottom: '1px solid #dde3ea' },
  eyebrow: { margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', color: '#5d6c80' },
  h1: { margin: '12px 0 0', fontFamily: 'Georgia, serif', fontWeight: 500, fontSize: 32, lineHeight: 1.2 },
  sub: { margin: '10px 0 0', fontSize: 14.5, color: '#5d6c80' },
  cta: { marginTop: 26, padding: '20px 24px', background: '#fdf6ea', border: '1px solid #e8cfa0', borderRadius: 14 },
  ctaLabel: { margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: '#8a6118' },
  ctaText: { margin: '9px 0 0', fontSize: 16, lineHeight: 1.55, color: '#6b4c18' },
  deadlines: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14, marginTop: 18 },
  deadline: { padding: '16px 18px', background: '#fff', border: '1px solid #dde3ea', borderRadius: 12 },
  deadlineNext: { borderColor: '#1b2b5c', boxShadow: 'inset 3px 0 0 #1b2b5c' },
  deadlineLabel: { margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', color: '#3d5570' },
  deadlineAt: { margin: '8px 0 0', fontSize: 14.5, fontWeight: 600 },
  deadlineMeta: { margin: '4px 0 0', fontSize: 13, color: '#5d6c80' },
  block: { marginTop: 34, padding: '24px 26px', background: '#fff', border: '1px solid #dde3ea', borderRadius: 14 },
  h2: { margin: 0, fontFamily: 'Georgia, serif', fontWeight: 500, fontSize: 22 },
  note: { margin: '10px 0 0', fontSize: 14, lineHeight: 1.6, color: '#5d6c80' },
  empty: { margin: '16px 0 0', fontSize: 14, color: '#8a97a8', fontStyle: 'italic' },
  sectionList: { margin: '18px 0 0', padding: 0, listStyle: 'none' },
  sectionItem: { padding: '14px 0', borderTop: '1px solid #eef1f5' },
  sectionTitle: { margin: 0, fontSize: 15.5, fontWeight: 700 },
  sectionSummary: { margin: '5px 0 0', fontSize: 14, lineHeight: 1.55, color: '#5d6c80' },
  actionTag: { marginLeft: 10, padding: '3px 9px', fontSize: 10.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#8a6118', background: '#fdf6ea', border: '1px solid #e8cfa0', borderRadius: 999 },
  download: { display: 'inline-block', marginTop: 20, padding: '11px 22px', background: '#1b2b5c', color: '#fff', textDecoration: 'none', borderRadius: 9, fontWeight: 700, fontSize: 14.5 },
  locked: { margin: '18px 0 0', padding: '12px 15px', fontSize: 13.5, lineHeight: 1.5, color: '#5d6c80', background: '#f4f6f9', border: '1px solid #dde3ea', borderRadius: 9 },
  activityList: { margin: '16px 0 0', padding: 0, listStyle: 'none' },
  activityItem: { display: 'flex', gap: 16, padding: '9px 0', borderTop: '1px solid #eef1f5', fontSize: 14 },
  activityAt: { minWidth: 210, color: '#8a97a8', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12.5 },
};
