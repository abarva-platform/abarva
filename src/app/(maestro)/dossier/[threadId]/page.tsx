import { connection } from 'next/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDecisionThreadDossier, linkKey, type DecisionSurface, type DecisionThreadLinkRow } from '@/lib/decisions/auto-linker';

export const metadata = { title: 'Decision Dossier · AbarVa' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ threadId: string }>;
}

const SECTION_ORDER: Array<{
  key: DecisionSurface;
  label: string;
  title: string;
  empty: string;
}> = [
  {
    key: 'intelligence',
    label: 'Intelligence',
    title: 'Rationale',
    empty: 'No Intelligence session is linked yet. The dossier will show the original Sentinel rationale once a decision starts from Intelligence.',
  },
  {
    key: 'moves',
    label: 'Moves',
    title: 'Business Case',
    empty: 'No Move is linked yet. Create or open a Move from the decision flow to attach sponsor, value, and gate context.',
  },
  {
    key: 'source',
    label: 'Source',
    title: 'Commercial Path',
    empty: 'No Source event is linked yet. Trigger Source from the Move or link a confirmed sourcing event to show scope, vendor path, and hard-question transcript.',
  },
  {
    key: 'tower',
    label: 'Tower',
    title: 'Measurement Plan',
    empty: 'No Tower measurement view is linked yet. Tower attaches once KPI tracking or value-state observation begins.',
  },
];

export default async function DecisionDossierPage({ params }: PageProps) {
  await connection();
  const { threadId } = await params;
  const dossier = await getDecisionThreadDossier(threadId).catch((error) => ({
    error: error instanceof Error ? error.message : 'Unknown dossier load error',
  }));

  if (!dossier || 'error' in dossier) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>
          <Link href="/admin/dossiers" style={backLinkStyle}>Dossiers</Link>
          <h1 style={titleStyle}>Decision Dossier unavailable</h1>
          <p style={subtitleStyle}>
            {dossier && 'error' in dossier ? dossier.error : 'No dossier exists for this thread.'}
          </p>
        </div>
      </main>
    );
  }

  if (!dossier.thread) notFound();

  const artifactLinks = dossier.links.filter((link) => link.surface === 'artifact' || link.surface === 'watchlist');
  const totalProofPoints = Object.values(dossier.proofPointCounts).reduce((sum, count) => sum + count, 0);

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <Link href="/admin/dossiers" style={backLinkStyle}>Dossiers</Link>
            <div style={eyebrowStyle}>Unified decision dossier</div>
            <h1 style={titleStyle}>{dossier.thread.title}</h1>
            <p style={subtitleStyle}>
              One continuity spine for Intelligence rationale, Moves business case, Source commercial path,
              and Tower measurement. Every section is linked to Evidence Ledger proof points when the surface has them.
            </p>
          </div>
          <div style={statusPanelStyle}>
            <Metric label="Owner" value={dossier.thread.primary_owner_role} />
            <Metric label="Status" value={dossier.thread.status.replace(/_/g, ' ')} />
            <Metric label="Proof points" value={String(totalProofPoints)} />
          </div>
        </header>

        <section style={timelineStyle} aria-label="Decision continuity path">
          {SECTION_ORDER.map((section) => {
            const count = dossier.links.filter((link) => link.surface === section.key).length;
            return (
              <div key={section.key} style={stepStyle}>
                <div style={stepLabelStyle}>{section.label}</div>
                <div style={stepCountStyle}>{count}</div>
              </div>
            );
          })}
        </section>

        <section style={optionsSectionStyle}>
          <div style={sectionTopStyle}>
            <div>
              <div style={eyebrowStyle}>Key Design Decision</div>
              <h2 style={sectionTitleStyle}>Selected and rejected options</h2>
            </div>
            <span style={badgeStyle}>
              {dossier.options.length} option{dossier.options.length === 1 ? '' : 's'}
            </span>
          </div>
          {dossier.options.length === 0 ? (
            <p style={emptyStyle}>
              No KDD options are recorded yet. Use a Move phase gate to record the selected path and rejected alternatives.
            </p>
          ) : (
            <div style={optionGridStyle}>
              {dossier.options.map((option) => (
                <article
                  key={option.id}
                  style={option.is_selected ? selectedOptionStyle : optionStyle}
                >
                  <div style={optionHeaderStyle}>
                    <strong>{option.label}</strong>
                    <span style={option.is_selected ? selectedBadgeStyle : rejectedBadgeStyle}>
                      {option.is_selected ? 'Selected' : 'Rejected'}
                    </span>
                  </div>
                  {option.rationale_for ? (
                    <p style={optionTextStyle}>
                      <b>For:</b> {option.rationale_for}
                    </p>
                  ) : null}
                  {option.rationale_against ? (
                    <p style={optionTextStyle}>
                      <b>Against:</b> {option.rationale_against}
                    </p>
                  ) : null}
                  {option.decided_by ? (
                    <div style={metaStyle}>
                      Recorded by {option.decided_by}
                      {option.decided_at ? ` on ${new Date(option.decided_at).toLocaleDateString()}` : ''}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>

        <section style={sectionGridStyle}>
          {SECTION_ORDER.map((section) => {
            const links = dossier.links.filter((link) => link.surface === section.key);
            return (
              <DossierSection
                key={section.key}
                surface={section.key}
                label={section.label}
                title={section.title}
                empty={section.empty}
                links={links}
                proofPointCounts={dossier.proofPointCounts}
              />
            );
          })}
        </section>

        <section style={artifactSectionStyle}>
          <div>
            <div style={eyebrowStyle}>Artifacts</div>
            <h2 style={sectionTitleStyle}>Linked board packs and reviews</h2>
          </div>
          {artifactLinks.length === 0 ? (
            <p style={emptyStyle}>
              No generated board packs are attached yet. Packet 20 export support can attach dossier packs here.
            </p>
          ) : (
            <div style={cardGridStyle}>
              {artifactLinks.map((link) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  proofPointCount={dossier.proofPointCounts[linkKey(link)] ?? 0}
                />
              ))}
            </div>
          )}
          <Link
            href={`/admin/pilot-package?thread=${encodeURIComponent(dossier.thread.id)}`}
            style={buttonStyle}
          >
            Export as Board Pack
          </Link>
        </section>
      </div>
    </main>
  );
}

function DossierSection({
  surface,
  label,
  title,
  empty,
  links,
  proofPointCounts,
}: {
  surface: DecisionSurface;
  label: string;
  title: string;
  empty: string;
  links: DecisionThreadLinkRow[];
  proofPointCounts: Record<string, number>;
}) {
  return (
    <article style={sectionStyle}>
      <div style={sectionTopStyle}>
        <div>
          <div style={eyebrowStyle}>{label}</div>
          <h2 style={sectionTitleStyle}>{title}</h2>
        </div>
        <span style={badgeStyle}>{links.length} link{links.length === 1 ? '' : 's'}</span>
      </div>
      {links.length === 0 ? (
        <p style={emptyStyle}>{empty}</p>
      ) : (
        <div style={linkListStyle}>
          {links.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              proofPointCount={proofPointCounts[linkKey(link)] ?? 0}
            />
          ))}
        </div>
      )}
      <Link
        href={`/evidence-ledger?surface=${encodeURIComponent(surface)}`}
        style={subtleLinkStyle}
      >
        Browse {label} evidence
      </Link>
    </article>
  );
}

function LinkCard({
  link,
  proofPointCount,
}: {
  link: DecisionThreadLinkRow;
  proofPointCount: number;
}) {
  return (
    <a href={hrefForLink(link)} style={linkCardStyle}>
      <div style={linkCardTitleStyle}>{labelForLink(link)}</div>
      <div style={metaStyle}>{link.link_reason ?? 'Linked to decision thread'}</div>
      <div style={proofStyle}>{proofPointCount} proof point{proofPointCount === 1 ? '' : 's'}</div>
    </a>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={metricStyle}>
      <div style={metricValueStyle}>{value}</div>
      <div style={metaStyle}>{label}</div>
    </div>
  );
}

function hrefForLink(link: DecisionThreadLinkRow): string {
  if (link.surface === 'moves') return `/strategic-moves/${link.artifact_ref}`;
  if (link.surface === 'source') return `/source/events/${link.artifact_ref}`;
  if (link.surface === 'tower') return `/tower?decision=${encodeURIComponent(link.artifact_ref)}`;
  if (link.surface === 'artifact') return `/api/v1/artifacts/${link.artifact_ref}/promote`;
  if (link.surface === 'watchlist') return `/tower?watchlist=${encodeURIComponent(link.artifact_ref)}`;
  return `/intelligence/decision?session=${encodeURIComponent(link.artifact_ref)}`;
}

function labelForLink(link: DecisionThreadLinkRow): string {
  return `${link.surface.toUpperCase()} · ${link.artifact_ref.slice(0, 18)}`;
}

const pageStyle = { minHeight: '100vh', background: '#F8F7F4', color: '#111827', padding: '32px 28px 56px' } as const;
const shellStyle = { maxWidth: 1180, margin: '0 auto' } as const;
const headerStyle = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 24, alignItems: 'start' } as const;
const backLinkStyle = { color: '#4b5563', fontSize: 13, fontWeight: 720, textDecoration: 'none' } as const;
const eyebrowStyle = { marginTop: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#667085', fontWeight: 800 } as const;
const titleStyle = { margin: '8px 0 8px', fontFamily: 'Georgia, serif', fontSize: 44, lineHeight: 1.06, fontWeight: 400 } as const;
const subtitleStyle = { margin: 0, maxWidth: 760, fontSize: 15, lineHeight: 1.55, color: '#475467' } as const;
const statusPanelStyle = { display: 'grid', gap: 10, background: '#fff', border: '1px solid #d7d2c6', borderRadius: 8, padding: 16 } as const;
const metricStyle = { display: 'grid', gap: 4, borderBottom: '1px solid #ece7dd', paddingBottom: 9 } as const;
const metricValueStyle = { fontSize: 18, fontWeight: 850, textTransform: 'capitalize' } as const;
const metaStyle = { color: '#667085', fontSize: 12, lineHeight: 1.4 } as const;
const timelineStyle = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginTop: 24 } as const;
const stepStyle = { background: '#fff', border: '1px solid #d7d2c6', borderRadius: 8, padding: 14 } as const;
const stepLabelStyle = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#667085', fontWeight: 800 } as const;
const stepCountStyle = { marginTop: 6, fontSize: 24, fontWeight: 900 } as const;
const optionsSectionStyle = { background: '#fff', border: '1px solid #d7d2c6', borderRadius: 8, padding: 18, marginTop: 14 } as const;
const optionGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10, marginTop: 14 } as const;
const optionStyle = { display: 'grid', gap: 8, border: '1px solid #e4e0d7', borderRadius: 8, padding: 14, background: '#fffdf8' } as const;
const selectedOptionStyle = { ...optionStyle, border: '1px solid #98d9bd', background: '#effaf5' } as const;
const optionHeaderStyle = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 } as const;
const selectedBadgeStyle = { display: 'inline-flex', border: '1px solid #98d9bd', borderRadius: 999, padding: '3px 8px', background: '#dff4ea', color: '#067647', fontSize: 11, fontWeight: 850, whiteSpace: 'nowrap' } as const;
const rejectedBadgeStyle = { display: 'inline-flex', border: '1px solid #d0d5dd', borderRadius: 999, padding: '3px 8px', background: '#f9fafb', color: '#475467', fontSize: 11, fontWeight: 850, whiteSpace: 'nowrap' } as const;
const optionTextStyle = { margin: 0, color: '#344054', fontSize: 13, lineHeight: 1.45 } as const;
const sectionGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14, marginTop: 14 } as const;
const sectionStyle = { background: '#fff', border: '1px solid #d7d2c6', borderRadius: 8, padding: 18, minHeight: 260 } as const;
const sectionTopStyle = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 } as const;
const sectionTitleStyle = { margin: '6px 0 0', fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 400 } as const;
const badgeStyle = { display: 'inline-flex', border: '1px solid #d0d5dd', borderRadius: 999, padding: '4px 9px', fontSize: 12, color: '#344054', background: '#f9fafb', fontWeight: 750 } as const;
const emptyStyle = { margin: '16px 0', color: '#667085', lineHeight: 1.55, fontSize: 14 } as const;
const linkListStyle = { display: 'grid', gap: 9, marginTop: 14 } as const;
const cardGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, margin: '14px 0' } as const;
const linkCardStyle = { display: 'grid', gap: 5, border: '1px solid #e4e0d7', borderRadius: 7, padding: 12, color: '#111827', textDecoration: 'none', background: '#fffdf8' } as const;
const linkCardTitleStyle = { fontWeight: 850, fontSize: 13 } as const;
const proofStyle = { color: '#175cd3', fontSize: 12, fontWeight: 800 } as const;
const subtleLinkStyle = { display: 'inline-flex', marginTop: 14, color: '#344054', fontSize: 13, fontWeight: 800, textDecoration: 'none' } as const;
const artifactSectionStyle = { background: '#fff', border: '1px solid #d7d2c6', borderRadius: 8, padding: 18, marginTop: 14 } as const;
const buttonStyle = { display: 'inline-flex', marginTop: 8, border: '1px solid #111827', borderRadius: 7, background: '#111827', color: '#fff', padding: '10px 14px', fontWeight: 850, textDecoration: 'none' } as const;
