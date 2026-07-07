import {
  COLORS,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
} from "@/lib/design/design-tokens";
import type {
  ReleaseLedgerView,
  ReleaseRecordView,
} from "@/lib/admin/release-ledger";

interface ReleaseLedgerSurfaceProps {
  view: ReleaseLedgerView;
  generatedAt: string;
}

const STATUS_TONE: Record<
  string,
  { background: string; color: string; label: string }
> = {
  released: {
    background: COLORS.mintSoft,
    color: COLORS.mintInk,
    label: "Released",
  },
  candidate: {
    background: COLORS.amberSoft,
    color: COLORS.amberInk,
    label: "Candidate",
  },
  draft: { background: COLORS.skyPale, color: COLORS.navy, label: "Draft" },
  "rolled-back": {
    background: COLORS.coralSoft,
    color: COLORS.coralInk,
    label: "Rolled back",
  },
};

function statusTone(status: string) {
  return (
    STATUS_TONE[status.toLowerCase()] ?? {
      background: COLORS.skyPale,
      color: COLORS.ink,
      label: status || "Unknown",
    }
  );
}

export function ReleaseLedgerSurface({
  view,
  generatedAt,
}: ReleaseLedgerSurfaceProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SPACING.lg }}>
      <section
        aria-label="Release ledger summary"
        style={{
          background: COLORS.white,
          border: `1px solid ${COLORS.ink}14`,
          borderRadius: RADIUS.md,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: SPACING.lg,
            flexWrap: "wrap",
            padding: SPACING.lg,
            borderBottom: `1px solid ${COLORS.ink}12`,
          }}
        >
          <div style={{ minWidth: 0, flex: "1 1 520px" }}>
            <Eyebrow>Current ledger</Eyebrow>
            <h2 style={sectionTitleStyle}>Recorded release changes</h2>
            <p style={{ ...bodyStyle, margin: "8px 0 0", maxWidth: 620 }}>
              Each entry is a release record with a plain-English impact note,
              layer mapping, rollout and rollback path, and validation evidence.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(78px, 1fr))",
              gap: SPACING.sm,
              minWidth: 188,
              flex: "0 1 220px",
            }}
          >
            <Metric label="Total" value={String(view.total)} />
            <Metric label="Released" value={String(view.released)} />
            <Metric label="Candidate" value={String(view.candidates)} />
            <Metric label="Rollback" value={String(view.rolledBack)} />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: SPACING.md,
            padding: SPACING.lg,
            background: COLORS.cream,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ ...blockTitleStyle, color: COLORS.amberInk }}>
              Refresh contract
            </div>
            <p style={{ ...bodyStyle, margin: "6px 0 0" }}>
              This page is rebuilt from markdown release records on each
              request. It shows every recorded change in the deployed repo. It
              is not live GitHub, Azure, or database telemetry, and it cannot
              display an unrecorded change.
            </p>
          </div>
          <CompactFact label="Last scanned" value={generatedAt} />
        </div>
      </section>

      {view.latest ? <LatestRelease record={view.latest} /> : <EmptyLedger />}

      <section
        style={{
          background: COLORS.white,
          border: `1px solid ${COLORS.ink}14`,
          borderRadius: RADIUS.md,
          padding: SPACING.lg,
        }}
      >
        <div
          style={{ display: "flex", flexDirection: "column", gap: SPACING.sm }}
        >
          <Eyebrow>Layer distribution</Eyebrow>
          <div style={{ display: "flex", flexWrap: "wrap", gap: SPACING.sm }}>
            {view.laneCounts.length ? (
              view.laneCounts.map((item) => (
                <span key={item.lane} style={laneChipStyle}>
                  <span>{item.lane}</span>
                  <strong>{item.count}</strong>
                </span>
              ))
            ) : (
              <span style={mutedStyle}>No impacted lanes captured yet.</span>
            )}
          </div>
        </div>
      </section>

      <section
        aria-label="Release records"
        style={{ display: "flex", flexDirection: "column", gap: SPACING.md }}
      >
        {view.records.map((record) => (
          <ReleaseRecordCard key={record.slug} record={record} />
        ))}
      </section>
    </div>
  );
}

function LatestRelease({ record }: { record: ReleaseRecordView }) {
  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.md,
        padding: SPACING.lg,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: SPACING.md,
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0, maxWidth: 660 }}>
          <Eyebrow>Latest change</Eyebrow>
          <h2
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 30,
              lineHeight: 1.08,
              margin: "8px 0",
              color: COLORS.ink,
            }}
          >
            {record.title}
          </h2>
          <p style={{ ...bodyStyle, margin: 0 }}>
            {record.summary || "No summary captured."}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: SPACING.sm,
            minWidth: 220,
          }}
        >
          <StatusPill status={record.status} />
          <CompactFact label="Release ID" value={record.releaseId} />
          <CompactFact label="Source" value={record.sourcePath} />
        </div>
      </div>
    </section>
  );
}

function EmptyLedger() {
  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.md,
        padding: SPACING.lg,
      }}
    >
      <Eyebrow>No records</Eyebrow>
      <p style={{ ...bodyStyle, margin: "8px 0 0" }}>
        No markdown release records were found under docs/releases/records.
      </p>
    </section>
  );
}

function ReleaseRecordCard({ record }: { record: ReleaseRecordView }) {
  return (
    <article
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.md,
        overflow: "hidden",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: SPACING.md,
          flexWrap: "wrap",
          padding: SPACING.lg,
          borderBottom: `1px solid ${COLORS.ink}12`,
        }}
      >
        <div style={{ minWidth: 0, flex: "1 1 420px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: SPACING.sm,
              flexWrap: "wrap",
            }}
          >
            <StatusPill status={record.status} />
            <span style={metaStyle}>{record.dateLabel}</span>
            <span style={metaStyle}>{record.releaseId}</span>
          </div>
          <h3
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 25,
              lineHeight: 1.12,
              color: COLORS.ink,
              margin: "10px 0 8px",
            }}
          >
            {record.title}
          </h3>
          <p style={{ ...bodyStyle, margin: 0 }}>
            {record.summary || "No summary captured."}
          </p>
        </div>
        <div style={{ flex: "0 1 260px", minWidth: 220 }}>
          <CompactFact label="Source record" value={record.sourcePath} />
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: SPACING.lg,
          padding: SPACING.lg,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: SPACING.md,
            minWidth: 0,
          }}
        >
          <RecordSection
            title="Layer impact"
            items={record.layerImpact}
            empty="No layer impact captured."
          />
          <RecordSection
            title="Client applicability"
            items={record.clientApplicability}
            empty="No applicability captured."
          />
          <RecordSection
            title="Changes included"
            items={record.changesIncluded}
            empty="No changes captured."
          />
        </div>

        <aside
          aria-label={`${record.releaseId} validation and rollout`}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: SPACING.md,
            borderLeft: `1px solid ${COLORS.ink}12`,
            paddingLeft: SPACING.lg,
            minWidth: 0,
          }}
        >
          <RecordSection
            title="QA / validation"
            items={record.qaValidation}
            empty="No QA note."
            compact
          />
          <RecordSection
            title="Audit evidence"
            items={record.auditEvidence}
            empty="No evidence note."
            compact
          />
          <TextSection title="Rollout" value={record.rolloutPlan} />
          <TextSection title="Rollback" value={record.rollbackPlan} />
          <TextSection title="Known gaps" value={record.knownGaps} />
        </aside>
      </div>
    </article>
  );
}

function RecordSection({
  title,
  items,
  empty,
  compact = false,
}: {
  title: string;
  items: string[];
  empty: string;
  compact?: boolean;
}) {
  return (
    <section style={{ minWidth: 0 }}>
      <div style={blockTitleStyle}>{title}</div>
      {items.length ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: compact ? 6 : 8,
            marginTop: 8,
          }}
        >
          {items.map((item) => (
            <div key={item} style={itemRowStyle}>
              {item}
            </div>
          ))}
        </div>
      ) : (
        <p style={{ ...mutedStyle, margin: "8px 0 0" }}>{empty}</p>
      )}
    </section>
  );
}

function TextSection({ title, value }: { title: string; value: string }) {
  return (
    <section style={{ minWidth: 0 }}>
      <div style={blockTitleStyle}>{title}</div>
      <p style={{ ...bodyStyle, margin: "8px 0 0" }}>
        {value || "Not captured."}
      </p>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: `1px solid ${COLORS.ink}12`,
        borderRadius: RADIUS.sm,
        padding: "10px 12px",
        background: COLORS.cream,
        minHeight: 58,
      }}
    >
      <div style={metricLabelStyle}>{label}</div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 22,
          lineHeight: 1,
          fontWeight: 800,
          color: COLORS.ink,
          marginTop: 5,
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
        display: "inline-flex",
        alignItems: "center",
        borderRadius: RADIUS.pill,
        padding: "5px 10px",
        background: tone.background,
        color: tone.color,
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {tone.label}
    </span>
  );
}

function CompactFact({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={blockTitleStyle}>{label}</div>
      <div
        style={{
          ...bodyStyle,
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          marginTop: 4,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </div>
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
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  color: `${COLORS.ink}80`,
};

const metricLabelStyle = {
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  color: `${COLORS.ink}80`,
};

const bodyStyle = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 13,
  lineHeight: 1.55,
  color: `${COLORS.ink}cc`,
};

const mutedStyle = {
  ...bodyStyle,
  color: `${COLORS.ink}99`,
};

const sectionTitleStyle = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 28,
  lineHeight: 1.1,
  color: COLORS.ink,
  margin: "6px 0 0",
};

const blockTitleStyle = {
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  color: COLORS.navy,
};

const laneChipStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: SPACING.sm,
  border: `1px solid ${COLORS.ink}14`,
  borderRadius: RADIUS.pill,
  padding: "7px 10px",
  background: COLORS.cream,
  color: COLORS.ink,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  overflowWrap: "anywhere" as const,
};

const itemRowStyle = {
  border: `1px solid ${COLORS.ink}10`,
  borderRadius: RADIUS.sm,
  background: COLORS.cream,
  padding: "9px 10px",
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 13,
  lineHeight: 1.45,
  color: `${COLORS.ink}cc`,
  overflowWrap: "anywhere" as const,
};
