// I6 · Evidence Dataset Drawer (server component).
//
// Renders the deterministic EvidenceDatasetDrawerView built by I6 view
// helper. No client interactivity, no hooks, no live retrieval, no
// model invocation. Surface only — read model is the source of truth.
//
// Imports are restricted to the I6 view helper module and the AbarVa
// design tokens. The drawer is mounted (when the canonical pattern
// detail surface exists) below the existing pattern detail body.

import type {
  EvidenceDatasetDrawerView,
  EvidenceDatasetEntry,
  EvidenceFreshnessLabel,
  EvidenceUsabilityLabel,
} from '@/lib/intelligence/evidence-dataset-drawer-view';
import { COLORS, FONT } from '@/lib/design/abarva-theme';

export interface EvidenceDatasetDrawerProps {
  view: EvidenceDatasetDrawerView;
}

const USABILITY_TONE: Record<
  EvidenceUsabilityLabel,
  { fg: string; bg: string }
> = {
  usable_as_evidence: { fg: COLORS.navy, bg: COLORS.navySoft },
  partial: { fg: COLORS.amber, bg: COLORS.amberSoft },
  blocked: { fg: COLORS.red, bg: COLORS.redSoft },
  no_evidence_loaded: { fg: COLORS.muted, bg: COLORS.surface2 },
};

const FRESHNESS_LABEL: Record<EvidenceFreshnessLabel, string> = {
  fresh: 'fresh',
  aging: 'aging',
  stale: 'stale',
  unknown: 'unknown',
};

export function EvidenceDatasetDrawer({ view }: EvidenceDatasetDrawerProps) {
  return (
    <section
      data-evidence-dataset-drawer="i6"
      aria-label={`Evidence dataset drawer · ${view.patternLabel}`}
      style={{
        marginTop: 16,
        padding: 'clamp(16px, 3vw, 24px)',
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderTop: `3px solid ${COLORS.navy}`,
        borderRadius: 12,
        fontFamily: FONT.body,
        color: COLORS.ink,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      <DrawerHeader view={view} />

      <DrawerSplit
        internal={view.internalEntries}
        external={view.externalEntries}
      />

      <DrawerFooter view={view} />
    </section>
  );
}

// --- Header ---------------------------------------------------------

function DrawerHeader({ view }: { view: EvidenceDatasetDrawerView }) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: COLORS.mutedSoft,
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          Evidence dataset drawer · {view.patternKey}
        </div>
        <h2
          style={{
            margin: 0,
            fontFamily: FONT.body,
            fontSize: 18,
            fontWeight: 600,
            lineHeight: 1.3,
            color: COLORS.ink,
            letterSpacing: '-0.005em',
          }}
        >
          {view.patternLabel}
        </h2>
      </div>
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: COLORS.muted,
          fontWeight: 600,
        }}
      >
        {view.totalEntries} dataset entr{view.totalEntries === 1 ? 'y' : 'ies'}
      </div>
    </header>
  );
}

// --- Two-section body ------------------------------------------------

function DrawerSplit({
  internal,
  external,
}: {
  internal: readonly EvidenceDatasetEntry[];
  external: readonly EvidenceDatasetEntry[];
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 16,
      }}
    >
      <DrawerColumn
        eyebrow="Internal sources"
        caption="Tenant artifacts, program evidence, and dataset domain lineage."
        entries={internal}
      />
      <DrawerColumn
        eyebrow="External sources"
        caption="Pattern packs and industry benchmarks. Reference only — never live retrieval."
        entries={external}
      />
    </div>
  );
}

function DrawerColumn({
  eyebrow,
  caption,
  entries,
}: {
  eyebrow: string;
  caption: string;
  entries: readonly EvidenceDatasetEntry[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: COLORS.muted,
            fontWeight: 700,
          }}
        >
          {eyebrow} · {entries.length}
        </div>
        <div
          style={{
            fontSize: 11,
            color: COLORS.mutedSoft,
            fontStyle: 'italic',
            marginTop: 2,
          }}
        >
          {caption}
        </div>
      </div>
      {entries.length === 0 ? (
        <EmptyEntries />
      ) : (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {entries.map((entry) => (
            <li key={entry.id}>
              <DatasetEntryCard entry={entry} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DatasetEntryCard({ entry }: { entry: EvidenceDatasetEntry }) {
  const tone = USABILITY_TONE[entry.usability];
  return (
    <article
      data-evidence-dataset-entry={entry.id}
      style={{
        padding: 12,
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderLeft: `3px solid ${tone.fg}`,
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: COLORS.ink,
            fontWeight: 600,
            lineHeight: 1.35,
          }}
        >
          {entry.sourceLabel}
        </span>
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            letterSpacing: '0.12em',
            color: COLORS.mutedSoft,
          }}
        >
          {entry.id}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <Chip
          label={`source · ${formatSourceKind(entry.sourceKind)}`}
          color={COLORS.muted}
          background={COLORS.surface2}
        />
        <Chip
          label={`usability · ${formatUsability(entry.usability)}`}
          color={tone.fg}
          background={tone.bg}
        />
        <Chip
          label={`freshness · ${FRESHNESS_LABEL[entry.freshness]}`}
          color={COLORS.muted}
          background={COLORS.surface2}
        />
      </div>

      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 11,
          color: COLORS.body,
          background: COLORS.surface2,
          border: `1px solid ${COLORS.borderSoft}`,
          padding: '4px 8px',
          borderRadius: 4,
          wordBreak: 'break-all',
        }}
      >
        {entry.citationLocator}
      </div>

      {entry.qualityNotes.length > 0 ? (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {entry.qualityNotes.map((note) => (
            <li
              key={note}
              style={{
                fontSize: 12,
                color: COLORS.muted,
                fontStyle: 'italic',
                lineHeight: 1.45,
              }}
            >
              {note}
            </li>
          ))}
        </ul>
      ) : null}

      {entry.missingCitations.length > 0 ? (
        <div
          style={{
            background: COLORS.redSoft,
            border: `1px solid ${COLORS.red}`,
            borderRadius: 6,
            padding: '6px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: COLORS.red,
              fontWeight: 700,
            }}
          >
            Missing citations · {entry.missingCitations.length}
          </div>
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {entry.missingCitations.map((m) => (
              <li
                key={m}
                style={{
                  fontSize: 12,
                  color: COLORS.red,
                  lineHeight: 1.4,
                }}
              >
                · {m}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

function EmptyEntries() {
  return (
    <div
      style={{
        padding: '12px 14px',
        background: COLORS.surface,
        border: `1px dashed ${COLORS.border}`,
        borderRadius: 8,
        fontSize: 12,
        color: COLORS.muted,
        lineHeight: 1.5,
        fontStyle: 'italic',
      }}
    >
      No entries seeded for this section yet.
    </div>
  );
}

// --- Footer ---------------------------------------------------------

function DrawerFooter({ view }: { view: EvidenceDatasetDrawerView }) {
  return (
    <footer
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        paddingTop: 12,
        borderTop: `1px dashed ${COLORS.border}`,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
        }}
      >
        <BreakdownBlock
          eyebrow="Usability"
          rows={[
            ['usable as evidence', view.usabilityBreakdown.usable_as_evidence, COLORS.navy],
            ['partial', view.usabilityBreakdown.partial, COLORS.amber],
            ['blocked', view.usabilityBreakdown.blocked, COLORS.red],
            ['no evidence loaded', view.usabilityBreakdown.no_evidence_loaded, COLORS.muted],
          ]}
        />
        <BreakdownBlock
          eyebrow="Freshness"
          rows={[
            ['fresh', view.freshnessBreakdown.fresh, COLORS.navy],
            ['aging', view.freshnessBreakdown.aging, COLORS.amber],
            ['stale', view.freshnessBreakdown.stale, COLORS.red],
            ['unknown', view.freshnessBreakdown.unknown, COLORS.muted],
          ]}
        />
        <BreakdownBlock
          eyebrow="Citation gaps"
          rows={[
            [
              'missing citations across entries',
              view.totalMissingCitations,
              view.totalMissingCitations > 0 ? COLORS.red : COLORS.muted,
            ],
          ]}
        />
      </div>
      <div
        style={{
          fontSize: 11,
          color: COLORS.mutedSoft,
          fontStyle: 'italic',
          lineHeight: 1.5,
        }}
      >
        {view.honestDisclaimer}
      </div>
    </footer>
  );
}

function BreakdownBlock({
  eyebrow,
  rows,
}: {
  eyebrow: string;
  rows: ReadonlyArray<readonly [string, number, string]>;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
          fontWeight: 700,
        }}
      >
        {eyebrow}
      </div>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {rows.map(([label, count, color]) => (
          <li
            key={label}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 8,
              fontSize: 12,
              color: COLORS.muted,
            }}
          >
            <span>{label}</span>
            <span
              style={{
                fontFamily: FONT.mono,
                fontWeight: 700,
                color,
              }}
            >
              {count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- Chip primitive --------------------------------------------------

function Chip({
  label,
  color,
  background,
}: {
  label: string;
  color: string;
  background: string;
}) {
  return (
    <span
      style={{
        fontFamily: FONT.mono,
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: 999,
        background,
        color,
      }}
    >
      {label}
    </span>
  );
}

// --- Formatters ------------------------------------------------------

function formatSourceKind(kind: string): string {
  return kind.replace(/_/g, ' ');
}

function formatUsability(label: EvidenceUsabilityLabel): string {
  return label.replace(/_/g, ' ');
}
