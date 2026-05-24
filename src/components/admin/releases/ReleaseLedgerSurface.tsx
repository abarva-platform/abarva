import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { ReleaseLedgerView, ReleaseRecordView } from '@/lib/admin/release-ledger';

interface ReleaseLedgerSurfaceProps {
  view: ReleaseLedgerView;
  generatedAt: string;
}

const STATUS_TONE: Record<string, { background: string; color: string; label: string }> = {
  released: { background: COLORS.mintSoft, color: COLORS.mintInk, label: 'Released' },
  candidate: { background: COLORS.amberSoft, color: COLORS.amberInk, label: 'Candidate' },
  draft: { background: COLORS.skyPale, color: COLORS.navy, label: 'Draft' },
  'rolled-back': { background: COLORS.coralSoft, color: COLORS.coralInk, label: 'Rolled back' },
};

function statusTone(status: string) {
  return STATUS_TONE[status.toLowerCase()] ?? {
    background: COLORS.skyPale,
    color: COLORS.ink,
    label: status || 'Unknown',
  };
}

export function ReleaseLedgerSurface({ view, generatedAt }: ReleaseLedgerSurfaceProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
      <section
        aria-label="Release ledger summary"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: SPACING.md,
        }}
      >
        <Metric label="Total records" value={String(view.total)} />
        <Metric label="Released" value={String(view.released)} />
        <Metric label="Candidates" value={String(view.candidates)} />
        <Metric label="Rolled back" value={String(view.rolledBack)} />
      </section>

      {view.latest ? (
        <section
          style={{
            background: COLORS.white,
            border: `1px solid ${COLORS.ink}14`,
            borderRadius: RADIUS.md,
            padding: SPACING.lg,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 260px',
            gap: SPACING.lg,
          }}
        >
          <div>
            <Eyebrow>Latest change</Eyebrow>
            <h2
              style={{
                fontFamily: TYPOGRAPHY.serif,
                fontSize: 28,
                lineHeight: 1.12,
                margin: '8px 0',
                color: COLORS.ink,
              }}
            >
              {view.latest.title}
            </h2>
            <p style={bodyStyle}>{view.latest.summary}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
            <StatusPill status={view.latest.status} />
            <SmallFact label="Release ID" value={view.latest.releaseId} />
            <SmallFact label="Source" value={view.latest.sourcePath} />
          </div>
        </section>
      ) : null}

      <section
        style={{
          background: COLORS.amberSoft,
          border: `1px solid ${COLORS.ink}14`,
          borderRadius: RADIUS.md,
          padding: SPACING.md,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 260px',
          gap: SPACING.md,
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ ...blockTitleStyle, color: COLORS.amberInk }}>Refresh contract</div>
          <p style={{ ...bodyStyle, margin: '6px 0 0', color: COLORS.ink }}>
            This page is rebuilt from markdown release records on each request. It shows every
            recorded change that has landed in the deployed repo, but it is not a live GitHub,
            Vercel, or database deployment monitor.
          </p>
        </div>
        <SmallFact label="Ledger scanned" value={generatedAt} />
      </section>

      <section
        style={{
          background: COLORS.white,
          border: `1px solid ${COLORS.ink}14`,
          borderRadius: RADIUS.md,
          padding: SPACING.lg,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: SPACING.md }}>
          <div>
            <Eyebrow>Layer distribution</Eyebrow>
            <h2 style={sectionTitleStyle}>Impacted lanes</h2>
          </div>
          <p style={{ ...bodyStyle, maxWidth: 460, margin: 0 }}>
            Counts are read from each release record&apos;s Layer Impact section. New release-relevant
            PRs are expected to appear here because CI requires a release record before merge.
          </p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.md }}>
          {view.laneCounts.map((item) => (
            <span
              key={item.lane}
              style={{
                border: `1px solid ${COLORS.ink}14`,
                borderRadius: RADIUS.pill,
                padding: '7px 11px',
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: COLORS.ink,
                background: COLORS.cream,
              }}
            >
              {item.lane} · {item.count}
            </span>
          ))}
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
        {view.records.map((record) => (
          <ReleaseRecordCard key={record.slug} record={record} />
        ))}
      </section>
    </div>
  );
}

function ReleaseRecordCard({ record }: { record: ReleaseRecordView }) {
  return (
    <article
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.md,
        padding: SPACING.lg,
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 280px',
        gap: SPACING.lg,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' }}>
          <StatusPill status={record.status} />
          <span style={metaStyle}>{record.dateLabel}</span>
          <span style={metaStyle}>{record.releaseId}</span>
        </div>
        <h3
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 24,
            lineHeight: 1.18,
            color: COLORS.ink,
            margin: '10px 0 8px',
          }}
        >
          {record.title}
        </h3>
        <p style={bodyStyle}>{record.summary || 'No summary captured.'}</p>

        <DetailGrid record={record} />
      </div>

      <aside
        aria-label={`${record.releaseId} audit evidence`}
        style={{
          borderLeft: `1px solid ${COLORS.ink}14`,
          paddingLeft: SPACING.lg,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.md,
        }}
      >
        <SmallFact label="Source record" value={record.sourcePath} />
        <ListBlock title="QA / validation" items={record.qaValidation.slice(0, 4)} empty="No QA note." />
        <ListBlock title="Audit evidence" items={record.auditEvidence.slice(0, 5)} empty="No evidence note." />
      </aside>
    </article>
  );
}

function DetailGrid({ record }: { record: ReleaseRecordView }) {
  const details = [
    { title: 'Layer impact', items: record.layerImpact },
    { title: 'Client applicability', items: record.clientApplicability },
    { title: 'Changes included', items: record.changesIncluded },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: SPACING.md,
        marginTop: SPACING.md,
      }}
    >
      {details.map((detail) => (
        <ListBlock
          key={detail.title}
          title={detail.title}
          items={detail.items.slice(0, 5)}
          empty="Not captured."
        />
      ))}
      <TextBlock title="Rollout" value={record.rolloutPlan} />
      <TextBlock title="Rollback" value={record.rollbackPlan} />
      <TextBlock title="Known gaps" value={record.knownGaps} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
      }}
    >
      <div style={metaStyle}>{label}</div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 32,
          fontWeight: 700,
          color: COLORS.ink,
          marginTop: 4,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone = statusTone(status);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: RADIUS.pill,
        padding: '5px 10px',
        background: tone.background,
        color: tone.color,
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      {tone.label}
    </span>
  );
}

function ListBlock({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div>
      <div style={blockTitleStyle}>{title}</div>
      {items.length ? (
        <ul style={{ margin: '6px 0 0', paddingLeft: 16, ...bodyStyle }}>
          {items.map((item) => (
            <li key={item} style={{ marginBottom: 5 }}>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ ...bodyStyle, margin: '6px 0 0' }}>{empty}</p>
      )}
    </div>
  );
}

function TextBlock({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <div style={blockTitleStyle}>{title}</div>
      <p style={{ ...bodyStyle, margin: '6px 0 0' }}>{value || 'Not captured.'}</p>
    </div>
  );
}

function SmallFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={blockTitleStyle}>{label}</div>
      <div style={{ ...bodyStyle, fontFamily: TYPOGRAPHY.mono, fontSize: 11 }}>{value}</div>
    </div>
  );
}

function Eyebrow({ children }: { children: string }) {
  return <div style={metaStyle}>{children}</div>;
}

const metaStyle = {
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: `${COLORS.ink}80`,
};

const bodyStyle = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 13,
  lineHeight: 1.55,
  color: `${COLORS.ink}cc`,
};

const sectionTitleStyle = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 24,
  lineHeight: 1.15,
  color: COLORS.ink,
  margin: '6px 0 0',
};

const blockTitleStyle = {
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: COLORS.navy,
};
