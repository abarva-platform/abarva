/**
 * Source pattern index — server component
 *
 * Browseable directory of every typed lifecycle pattern in the AbarVa
 * reasoning layer (7 source-event + 6 program). Cards link out to the
 * detail page at `/source/patterns/[patternId]`. Supports optional URL
 * filters: `?domain=source|program`, `?tier=authoritative|validated|M`.
 */

import Link from 'next/link';
import type { LifecyclePatternSeed } from '@/lib/intelligence/seed-types';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import {
  deriveLifecyclePatternDomain,
  summarizePatternForCard,
  type LifecyclePatternDomain,
  type PatternCardSummary,
} from '@/lib/reasoning/pattern-card-helpers';
import { SHELL } from '@/lib/shell/shell-tokens';

export const metadata = {
  title: 'Pattern catalogue · AbarVa',
};

type DomainFilter = 'source' | 'program' | null;
type TierFilter = LifecyclePatternSeed['tier'] | null;

interface SearchParams {
  domain?: string;
  tier?: string;
}

export default async function SourcePatternIndexPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const domainFilter = parseDomainFilter(params.domain);
  const tierFilter = parseTierFilter(params.tier);

  const all = getAllLifecyclePatterns();
  const filtered = all.filter((p) => {
    if (domainFilter) {
      const dom = deriveLifecyclePatternDomain(p.patternId);
      if (domainFilter === 'source' && dom !== 'source-event') return false;
      if (domainFilter === 'program' && dom !== 'program') return false;
    }
    if (tierFilter && p.tier !== tierFilter) return false;
    return true;
  });

  const summaries = filtered.map(summarizePatternForCard);
  const sourceSummaries = summaries.filter((s) => s.domain === 'source-event');
  const programSummaries = summaries.filter((s) => s.domain === 'program');

  const totalCount = all.length;

  return (
    <main
      style={{
        background: SHELL.PAPER,
        minHeight: '100vh',
        padding: '40px 24px 80px',
        fontFamily: SHELL.SANS,
        color: SHELL.INK,
      }}
    >
      <div
        style={{
          maxWidth: 1040,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}
      >
        <Header totalCount={totalCount} />
        <FilterRow
          domainFilter={domainFilter}
          tierFilter={tierFilter}
          shownCount={summaries.length}
          totalCount={totalCount}
        />
        {sourceSummaries.length > 0 ? (
          <PatternGroup
            label="Source-event lifecycles"
            sublabel={`${sourceSummaries.length} pattern${
              sourceSummaries.length === 1 ? '' : 's'
            }`}
            cards={sourceSummaries}
          />
        ) : null}
        {programSummaries.length > 0 ? (
          <PatternGroup
            label="Program lifecycles"
            sublabel={`${programSummaries.length} pattern${
              programSummaries.length === 1 ? '' : 's'
            }`}
            cards={programSummaries}
          />
        ) : null}
        {summaries.length === 0 ? <EmptyState /> : null}
      </div>
    </main>
  );
}

// ── Filter parsing ──────────────────────────────────────────────────────────

function parseDomainFilter(raw: string | undefined): DomainFilter {
  if (raw === 'source' || raw === 'program') return raw;
  return null;
}

function parseTierFilter(raw: string | undefined): TierFilter {
  if (raw === 'authoritative' || raw === 'validated' || raw === 'M') return raw;
  return null;
}

// ── Sections ────────────────────────────────────────────────────────────────

function Header({ totalCount }: { totalCount: number }) {
  return (
    <header
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        paddingBottom: 20,
        borderBottom: `1px solid ${SHELL.CARD_LINE}`,
      }}
    >
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
        }}
      >
        Reasoning layer · doctrine
      </div>
      <h1
        style={{
          fontFamily: SHELL.SERIF,
          fontWeight: 400,
          fontSize: 42,
          lineHeight: 1.15,
          margin: 0,
          color: SHELL.INK,
        }}
      >
        Pattern catalogue
      </h1>
      <p
        style={{
          margin: '4px 0 0',
          fontFamily: SHELL.SANS,
          fontSize: 14,
          color: SHELL.INK_SOFT,
          lineHeight: 1.55,
        }}
      >
        {totalCount} lifecycle patterns. Each card links to authored doctrine —
        stages, gate criteria, expected artifacts, contradictions, and failure
        modes that the synthesis cites.
      </p>
    </header>
  );
}

function FilterRow({
  domainFilter,
  tierFilter,
  shownCount,
  totalCount,
}: {
  domainFilter: DomainFilter;
  tierFilter: TierFilter;
  shownCount: number;
  totalCount: number;
}) {
  const hasFilters = domainFilter !== null || tierFilter !== null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: SHELL.INK_MUTED,
        }}
      >
        Showing {shownCount} of {totalCount}
      </span>
      {domainFilter ? (
        <ActiveFilterChip
          label="Domain"
          value={domainFilter === 'source' ? 'source-event' : 'program'}
        />
      ) : null}
      {tierFilter ? <ActiveFilterChip label="Tier" value={tierFilter} /> : null}
      {hasFilters ? (
        <Link
          href="/source/patterns"
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12,
            color: SHELL.INK_MID,
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
        >
          Clear filters
        </Link>
      ) : null}
    </div>
  );
}

function PatternGroup({
  label,
  sublabel,
  cards,
}: {
  label: string;
  sublabel: string;
  cards: PatternCardSummary[];
}) {
  return (
    <section>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
          marginBottom: 12,
        }}
      >
        <h2
          style={{
            fontFamily: SHELL.SERIF,
            fontWeight: 400,
            fontSize: 26,
            margin: 0,
            color: SHELL.INK,
          }}
        >
          {label}
        </h2>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: SHELL.INK_MUTED,
          }}
        >
          {sublabel}
        </span>
      </div>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 12,
        }}
      >
        {cards.map((card) => (
          <li key={card.patternId} style={{ margin: 0 }}>
            <PatternCard card={card} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function PatternCard({ card }: { card: PatternCardSummary }) {
  return (
    <Link
      href={card.href}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '14px 16px',
        border: `1px solid ${SHELL.CARD_LINE}`,
        background: SHELL.CARD_WHITE,
        borderRadius: 8,
        textDecoration: 'none',
        color: 'inherit',
        height: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
        }}
      >
        <IdChip patternId={card.patternId} />
        <DomainChip domain={card.domain} />
        <TierChip tier={card.tier} />
      </div>
      <div
        style={{
          fontFamily: SHELL.SERIF,
          fontWeight: 400,
          fontSize: 22,
          lineHeight: 1.2,
          color: SHELL.INK,
        }}
      >
        {card.title}
      </div>
      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 13,
          lineHeight: 1.55,
          color: SHELL.INK_MID,
        }}
      >
        {card.applicabilitySummary}
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          fontFamily: SHELL.MONO,
          fontSize: 10.5,
          color: SHELL.INK_SOFT,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginTop: 'auto',
          paddingTop: 6,
          borderTop: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        }}
      >
        <span>{card.stageCount} stages</span>
        <span>·</span>
        <span>{card.gateCriteriaCount} gates</span>
        <span>·</span>
        <span>{card.expectedArtifactCount} artifacts</span>
      </div>
      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 12,
          color: SHELL.INK_SOFT,
        }}
      >
        Typical duration: {card.durationLabel}
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        border: `1px dashed ${SHELL.CARD_LINE}`,
        borderRadius: 8,
        background: SHELL.PAPER_SOFT,
        padding: '24px 20px',
        textAlign: 'center',
        fontFamily: SHELL.SANS,
        fontSize: 14,
        color: SHELL.INK_SOFT,
      }}
    >
      No patterns match the current filter. Clear filters to browse the full
      catalogue.
    </div>
  );
}

// ── Chips ───────────────────────────────────────────────────────────────────

function IdChip({ patternId }: { patternId: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 999,
        background: SHELL.PAPER_SOFT,
        padding: '2px 8px',
        fontFamily: SHELL.MONO,
        fontSize: 9.5,
        fontWeight: 600,
        color: SHELL.INK_MID,
        letterSpacing: '0.04em',
      }}
    >
      {patternId}
    </span>
  );
}

function DomainChip({ domain }: { domain: LifecyclePatternDomain }) {
  const palette = (() => {
    if (domain === 'source-event') {
      return { bg: SHELL.BLUE_BG, line: SHELL.BLUE_LINE, text: SHELL.INK_MID };
    }
    if (domain === 'program') {
      return { bg: SHELL.MINT_BG, line: SHELL.MINT_LINE, text: SHELL.MINT_TEXT };
    }
    return { bg: SHELL.GRAY_BG, line: SHELL.GRAY_LINE, text: SHELL.GRAY_TEXT };
  })();
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        border: `1px solid ${palette.line}`,
        background: palette.bg,
        color: palette.text,
        borderRadius: 999,
        padding: '2px 8px',
        fontFamily: SHELL.MONO,
        fontSize: 9.5,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        fontWeight: 600,
      }}
    >
      {domain}
    </span>
  );
}

function TierChip({ tier }: { tier: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        border: `1px solid ${SHELL.PEACH_LINE}`,
        background: SHELL.PEACH_BG,
        color: SHELL.PEACH_TEXT,
        borderRadius: 999,
        padding: '2px 8px',
        fontFamily: SHELL.MONO,
        fontSize: 9.5,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        fontWeight: 600,
      }}
    >
      {tier}
    </span>
  );
}

function ActiveFilterChip({ label, value }: { label: string; value: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 999,
        background: SHELL.CARD_WHITE,
        padding: '3px 10px',
        fontFamily: SHELL.SANS,
        fontSize: 11,
        color: SHELL.INK,
      }}
    >
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: SHELL.INK_MUTED,
        }}
      >
        {label}
      </span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </span>
  );
}
