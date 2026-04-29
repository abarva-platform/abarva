'use client';

/**
 * CascadeImpactSection — REASON-34
 *
 * Collapsible "Cascade Impact" section that fetches cascade telemetry events
 * for a given instance and renders them as a directed graph via
 * `CascadeGraphSvg`.
 *
 * Client component so it can defer the fetch until the user expands the
 * section — avoids an extra server-round-trip for a supplementary panel.
 *
 * AbarVa palette only. Strict TypeScript — no `any`.
 */

import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { CascadeGraphSvg } from '@/components/_shared/CascadeGraphSvg';
import type {
  CascadeGraphSvgNode,
  CascadeGraphSvgEdge,
  CascadeEdgeSeverity,
} from '@/components/_shared/CascadeGraphSvg';
import type { LinkType } from '@/lib/reasoning/types';
import type { CascadeTelemetryEvent } from '@/lib/reasoning/cascade-telemetry';

// ─── API response shape ───────────────────────────────────────────────────────

interface CascadesApiResponse {
  events: CascadeTelemetryEvent[];
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CascadeImpactSectionProps {
  /** The instance id to filter cascade events by (source or target). */
  instanceId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Map the CascadeTelemetryEvent severity to the graph edge severity.
 * The telemetry event carries `severity` (blocking/accelerating/informational)
 * while the graph uses low/medium/high. We normalise here.
 */
function toEdgeSeverity(
  ev: CascadeTelemetryEvent,
): CascadeEdgeSeverity {
  // Prefer the risk-tier `impactSeverity` when set; fall back to `severity`.
  if (ev.impactSeverity === 'high' || ev.severity === 'high') return 'high';
  if (ev.impactSeverity === 'medium' || ev.severity === 'medium') return 'medium';
  return 'low';
}

/**
 * Derive graph nodes + edges from the filtered telemetry events.
 *
 * Nodes are unique instance ids; edges are deduplicated by
 * `source::target::linkType`. Label is the instance id (short) since the
 * telemetry buffer does not carry display names.
 */
function buildGraphData(events: CascadeTelemetryEvent[]): {
  nodes: CascadeGraphSvgNode[];
  edges: CascadeGraphSvgEdge[];
} {
  const nodeSet = new Set<string>();
  const edgeMap = new Map<
    string,
    CascadeGraphSvgEdge
  >();

  for (const ev of events) {
    nodeSet.add(ev.sourceInstanceId);
    nodeSet.add(ev.targetInstanceId);

    const key = `${ev.sourceInstanceId}::${ev.targetInstanceId}::${ev.linkType}`;
    if (!edgeMap.has(key)) {
      // Validate linkType against the known union; default to 'feeds' when
      // the telemetry carries an unexpected value so the graph never crashes.
      const VALID_LINK_TYPES: LinkType[] = [
        'unblocks',
        'depends-on',
        'feeds',
        'shares-vendor',
        'contradicts',
      ];
      const linkType: LinkType = VALID_LINK_TYPES.includes(
        ev.linkType as LinkType,
      )
        ? (ev.linkType as LinkType)
        : 'feeds';

      edgeMap.set(key, {
        source: ev.sourceInstanceId,
        target: ev.targetInstanceId,
        severity: toEdgeSeverity(ev),
        linkType,
      });
    }
  }

  const nodes: CascadeGraphSvgNode[] = Array.from(nodeSet).map((id) => ({
    id,
    label: id,
  }));

  return { nodes, edges: Array.from(edgeMap.values()) };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  const bars: CSSProperties[] = [
    { width: '100%', height: 12, borderRadius: 4 },
    { width: '80%', height: 12, borderRadius: 4 },
    { width: '60%', height: 12, borderRadius: 4 },
  ];
  return (
    <div
      aria-label="Loading cascade impact graph"
      aria-busy="true"
      style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}
    >
      {bars.map((style, i) => (
        <div
          key={i}
          style={{
            ...style,
            background: SHELL.CARD_LINE,
            animation: 'pulse 1.4s ease-in-out infinite',
          }}
        />
      ))}
      {/* Inline keyframes — avoids a stylesheet dependency in this component. */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CascadeImpactSection({ instanceId }: CascadeImpactSectionProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<CascadeGraphSvgNode[]>([]);
  const [edges, setEdges] = useState<CascadeGraphSvgEdge[]>([]);
  /** Tracks whether we've already fetched so we don't re-fetch on re-open. */
  const [fetched, setFetched] = useState(false);

  const fetchCascades = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const url = `/api/reasoning/cascades?instanceId=${encodeURIComponent(instanceId)}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = (await res.json()) as CascadesApiResponse;
      // Filter to events that involve this instance on either side.
      const relevant = json.events.filter(
        (ev) =>
          ev.sourceInstanceId === instanceId ||
          ev.targetInstanceId === instanceId,
      );
      const { nodes: n, edges: e } = buildGraphData(relevant);
      setNodes(n);
      setEdges(e);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }, [instanceId]);

  // Fetch when first expanded.
  useEffect(() => {
    if (open && !fetched) {
      void fetchCascades();
    }
  }, [open, fetched, fetchCascades]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  const SECTION: CSSProperties = {
    marginTop: 16,
    border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
    borderRadius: 10,
    background: SHELL.CARD_WHITE,
    overflow: 'hidden',
  };

  const TRIGGER: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '10px 14px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: SHELL.MONO,
    fontSize: 9,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: SHELL.INK_MUTED,
    textAlign: 'left',
  };

  const CHEVRON: CSSProperties = {
    display: 'inline-block',
    transition: 'transform 0.18s ease',
    transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
    fontStyle: 'normal',
    fontSize: 11,
    color: SHELL.INK_SOFT,
  };

  const BODY: CSSProperties = {
    padding: '0 14px 14px',
    borderTop: `1px solid ${SHELL.CARD_LINE_SOFT}`,
  };

  const EMPTY: CSSProperties = {
    fontFamily: SHELL.SANS,
    fontSize: 12,
    color: SHELL.INK_MUTED,
    background: SHELL.PAPER_SOFT,
    border: `1px dashed ${SHELL.CARD_LINE_SOFT}`,
    borderRadius: 8,
    padding: '12px 14px',
    marginTop: 12,
  };

  const ERROR: CSSProperties = {
    ...EMPTY,
    color: SHELL.RUST_TEXT,
    borderColor: SHELL.RUST_TEXT,
    background: SHELL.PEACH_BG,
  };

  return (
    <div style={SECTION} data-testid="cascade-impact-section">
      <button
        style={TRIGGER}
        aria-expanded={open}
        aria-controls="cascade-impact-body"
        onClick={() => setOpen((v: boolean) => !v)}
      >
        <span>Cascade Impact</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span aria-hidden>
            <i style={CHEVRON}>›</i>
          </span>
        </span>
      </button>

      {open && (
        <div id="cascade-impact-body" style={BODY}>
          {loading && <LoadingSkeleton />}
          {!loading && fetchError && (
            <div style={ERROR} role="alert">
              Failed to load cascade data: {fetchError}
            </div>
          )}
          {!loading && !fetchError && fetched && edges.length === 0 && (
            <div style={EMPTY}>No cascade impacts recorded</div>
          )}
          {!loading && !fetchError && edges.length > 0 && (
            <CascadeGraphSvg
              nodes={nodes}
              edges={edges}
              title="Cascade impact graph"
            />
          )}
        </div>
      )}
    </div>
  );
}

export default CascadeImpactSection;
