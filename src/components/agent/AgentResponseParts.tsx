'use client';

import type { CSSProperties } from 'react';
import type {
  AgentBarChartPart,
  AgentCitationsPart,
  AgentMetricStripPart,
  AgentNextActionPart,
  AgentResponsePart,
  AgentResponseTone,
  AgentTablePart,
  AgentTextPart,
} from '@/lib/agent/response-parts';

export function AgentResponseParts({ parts }: { parts: AgentResponsePart[] }) {
  return (
    <div style={PARTS_STACK_STYLE}>
      {parts.map((part, index) => (
        <ResponsePart key={`${part.type}-${index}`} part={part} />
      ))}
    </div>
  );
}

function ResponsePart({ part }: { part: AgentResponsePart }) {
  switch (part.type) {
    case 'text':
      return <TextPart part={part} />;
    case 'metricStrip':
      return <MetricStripPart part={part} />;
    case 'table':
      return <TablePart part={part} />;
    case 'barChart':
      return <BarChartPart part={part} />;
    case 'citations':
      return <CitationsPart part={part} />;
    case 'nextAction':
      return <NextActionPart part={part} />;
  }
}

function TextPart({ part }: { part: AgentTextPart }) {
  return (
    <section style={SECTION_STYLE}>
      {part.title ? <div style={SECTION_TITLE_STYLE}>{part.title}</div> : null}
      <p style={TEXT_STYLE}>{part.text}</p>
    </section>
  );
}

function MetricStripPart({ part }: { part: AgentMetricStripPart }) {
  return (
    <section style={SECTION_STYLE} data-testid="agent-response-metric-strip">
      {part.title ? <div style={SECTION_TITLE_STYLE}>{part.title}</div> : null}
      <div style={METRIC_GRID_STYLE}>
        {part.metrics.map((metric) => (
          <div key={metric.label} style={METRIC_CARD_STYLE}>
            <span style={METRIC_LABEL_STYLE}>{metric.label}</span>
            <strong style={{ ...METRIC_VALUE_STYLE, color: toneColor(metric.tone) }}>
              {metric.value}
            </strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function TablePart({ part }: { part: AgentTablePart }) {
  return (
    <section style={SECTION_STYLE} data-testid="agent-response-table">
      <div style={SECTION_TITLE_STYLE}>{part.title}</div>
      <div style={TABLE_WRAP_STYLE}>
        <table style={TABLE_STYLE}>
          <thead>
            <tr>
              {part.columns.map((column) => (
                <th key={column} style={TH_STYLE}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {part.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {part.columns.map((column, columnIndex) => (
                  <td key={`${column}-${columnIndex}`} style={TD_STYLE}>
                    {row[columnIndex] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {part.caption ? <p style={CAPTION_STYLE}>{part.caption}</p> : null}
    </section>
  );
}

function BarChartPart({ part }: { part: AgentBarChartPart }) {
  const max = Math.max(...part.bars.map((bar) => bar.value), 1);
  return (
    <section style={SECTION_STYLE} data-testid="agent-response-bar-chart">
      <div style={SECTION_TITLE_STYLE}>{part.title}</div>
      <div style={BAR_STACK_STYLE}>
        {part.bars.map((bar) => (
          <div key={bar.label} style={BAR_ROW_STYLE}>
            <span style={BAR_LABEL_STYLE}>{bar.label}</span>
            <div style={BAR_TRACK_STYLE} aria-hidden="true">
              <span
                style={{
                  ...BAR_FILL_STYLE,
                  width: `${Math.max(6, Math.round((bar.value / max) * 100))}%`,
                  background: toneColor(bar.tone),
                }}
              />
            </div>
            <span style={BAR_VALUE_STYLE}>
              {bar.displayValue ?? formatNumber(bar.value, part.unit)}
            </span>
          </div>
        ))}
      </div>
      {part.caption ? <p style={CAPTION_STYLE}>{part.caption}</p> : null}
    </section>
  );
}

function CitationsPart({ part }: { part: AgentCitationsPart }) {
  return (
    <section style={SECTION_STYLE} data-testid="agent-response-citations">
      <div style={SECTION_TITLE_STYLE}>{part.title ?? 'Evidence used'}</div>
      <div style={CITATION_STACK_STYLE}>
        {part.citations.map((citation) => (
          <article key={`${citation.label}-${citation.sourceDoc ?? ''}`} style={CITATION_STYLE}>
            <div style={CITATION_LABEL_STYLE}>{citation.label}</div>
            <p style={CAPTION_STYLE}>{citation.excerpt}</p>
            <div style={CITATION_META_STYLE}>
              {citation.sourceDoc ?? 'source'} - confidence {citation.confidence}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function NextActionPart({ part }: { part: AgentNextActionPart }) {
  return (
    <section style={NEXT_ACTION_STYLE} data-testid="agent-response-next-action">
      <div style={SECTION_TITLE_STYLE}>{part.label}</div>
      <p style={TEXT_STYLE}>{part.detail}</p>
      {part.confidence ? <p style={CAPTION_STYLE}>Confidence: {part.confidence}</p> : null}
    </section>
  );
}

function toneColor(tone: AgentResponseTone = 'neutral'): string {
  switch (tone) {
    case 'good':
      return '#227853';
    case 'warning':
      return '#9a5d00';
    case 'danger':
      return '#9b3f2e';
    case 'info':
      return '#315f86';
    case 'neutral':
    default:
      return '#263040';
  }
}

function formatNumber(value: number, unit?: string): string {
  if (unit === 'usd') return `$${Math.round(value).toLocaleString('en-US')}`;
  return value.toLocaleString('en-US');
}

const PARTS_STACK_STYLE: CSSProperties = { display: 'grid', gap: 12, width: '100%' };
const SECTION_STYLE: CSSProperties = { display: 'grid', gap: 8 };
const NEXT_ACTION_STYLE: CSSProperties = {
  display: 'grid',
  gap: 8,
  border: '1px solid rgba(38,48,64,0.18)',
  borderRadius: 8,
  padding: 10,
  background: 'rgba(255,255,255,0.58)',
};
const SECTION_TITLE_STYLE: CSSProperties = { fontSize: 11, fontWeight: 750, color: '#263040', letterSpacing: 0 };
const TEXT_STYLE: CSSProperties = { margin: 0, fontSize: 12.5, lineHeight: 1.55, color: '#263040', whiteSpace: 'pre-wrap' };
const CAPTION_STYLE: CSSProperties = { margin: 0, fontSize: 11.5, lineHeight: 1.45, color: 'rgba(38,48,64,0.72)' };
const METRIC_GRID_STYLE: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(86px, 1fr))', gap: 6 };
const METRIC_CARD_STYLE: CSSProperties = { border: '1px solid rgba(38,48,64,0.14)', borderRadius: 7, padding: '7px 8px', background: 'rgba(255,255,255,0.62)' };
const METRIC_LABEL_STYLE: CSSProperties = { display: 'block', fontSize: 9.5, color: 'rgba(38,48,64,0.66)' };
const METRIC_VALUE_STYLE: CSSProperties = { display: 'block', marginTop: 3, fontSize: 13, lineHeight: 1.2 };
const TABLE_WRAP_STYLE: CSSProperties = { overflowX: 'auto', border: '1px solid rgba(38,48,64,0.14)', borderRadius: 7, background: '#fff' };
const TABLE_STYLE: CSSProperties = { width: '100%', borderCollapse: 'collapse', minWidth: 420 };
const TH_STYLE: CSSProperties = { padding: '7px 8px', textAlign: 'left', fontSize: 10, color: 'rgba(38,48,64,0.72)', background: 'rgba(38,48,64,0.05)', borderBottom: '1px solid rgba(38,48,64,0.12)' };
const TD_STYLE: CSSProperties = { padding: 8, fontSize: 11.5, lineHeight: 1.45, color: '#263040', borderTop: '1px solid rgba(38,48,64,0.08)', verticalAlign: 'top' };
const BAR_STACK_STYLE: CSSProperties = { display: 'grid', gap: 8 };
const BAR_ROW_STYLE: CSSProperties = { display: 'grid', gridTemplateColumns: '92px minmax(96px, 1fr) auto', alignItems: 'center', gap: 8 };
const BAR_LABEL_STYLE: CSSProperties = { fontSize: 11, color: '#263040' };
const BAR_TRACK_STYLE: CSSProperties = { height: 10, background: 'rgba(38,48,64,0.10)', borderRadius: 999, overflow: 'hidden' };
const BAR_FILL_STYLE: CSSProperties = { display: 'block', height: '100%', borderRadius: 999 };
const BAR_VALUE_STYLE: CSSProperties = { fontSize: 10.5, color: 'rgba(38,48,64,0.72)', whiteSpace: 'nowrap' };
const CITATION_STACK_STYLE: CSSProperties = { display: 'grid', gap: 7 };
const CITATION_STYLE: CSSProperties = { borderLeft: '3px solid rgba(49,95,134,0.48)', paddingLeft: 8 };
const CITATION_LABEL_STYLE: CSSProperties = { fontSize: 11, fontWeight: 700, color: '#263040' };
const CITATION_META_STYLE: CSSProperties = { fontSize: 10, color: 'rgba(38,48,64,0.58)' };
