'use client';

// In-product action: trigger the Deliverable Intelligence Orchestrator and surface the
// result — the persisted artifact link on success, or the quality-gate blockers when the
// document is refused (Nexus never silently ships a weak deliverable).

import { useState } from 'react';

export interface GenerateDeliverableButtonProps {
  module: 'source' | 'moves' | 'tower' | 'intelligence';
  useCaseArchetype: string;
  deliverableType: string;
  sourceArtifactRef: string;
  decisionContext: string;
  clientDisplayName?: string;
  initiativeDisplayName?: string;
  label?: string;
}

interface GenerateResult {
  success: boolean;
  artifactId: string;
  blobUrl: string;
  sectionCount?: number;
  retrievedEvidence?: number;
  warnings?: string[];
}

interface BlockedResult {
  error: string;
  detail: string;
  blockers?: string[];
}

const NAVY = '#0C1A3A';
const TEAL = '#2DD4C8';

export function GenerateDeliverableButton(props: GenerateDeliverableButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [blocked, setBlocked] = useState<BlockedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);
    setBlocked(null);
    try {
      const res = await fetch('/api/v1/deliverables/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          module: props.module,
          useCaseArchetype: props.useCaseArchetype,
          deliverableType: props.deliverableType,
          sourceArtifactRef: props.sourceArtifactRef,
          decisionContext: props.decisionContext,
          clientDisplayName: props.clientDisplayName,
          initiativeDisplayName: props.initiativeDisplayName,
        }),
      });
      const data = (await res.json()) as Record<string, unknown>;
      if (res.status === 422) {
        setBlocked(data as unknown as BlockedResult);
      } else if (!res.ok) {
        throw new Error((data.detail as string) ?? `HTTP ${res.status}`);
      } else {
        setResult(data as unknown as GenerateResult);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'generation failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560 }}>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        style={{
          padding: '10px 18px', background: NAVY, color: '#fff', border: 'none',
          borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1, alignSelf: 'flex-start',
        }}
      >
        {loading ? 'Generating board-grade deliverable…' : (props.label ?? 'Generate board-grade deliverable')}
      </button>

      {loading && (
        <div style={{ fontSize: 12, color: '#706D66' }}>
          Multi-pass authoring (architect → draft → red-team → board-grade rewrite). This can take a couple of minutes.
        </div>
      )}

      {error && (
        <div style={{ padding: '10px 12px', background: 'rgba(179,38,30,0.06)', border: '1px solid rgba(179,38,30,0.3)', borderRadius: 6, color: '#B3261E', fontSize: 13 }}>
          {error}
        </div>
      )}

      {blocked && (
        <div style={{ padding: '12px 14px', background: 'rgba(244,180,0,0.08)', border: '1px solid rgba(244,180,0,0.4)', borderRadius: 8, fontSize: 13 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Held back by the quality gate</div>
          <div style={{ color: '#706D66', marginBottom: 8 }}>{blocked.detail}</div>
          {blocked.blockers?.length ? (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {blocked.blockers.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          ) : null}
        </div>
      )}

      {result && (
        <div style={{ padding: 16, background: 'rgba(45,212,200,0.06)', border: `1px solid ${TEAL}55`, borderRadius: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, fontFamily: 'Georgia, serif' }}>
            Board-grade deliverable ready
          </div>
          <div style={{ fontSize: 12, color: '#706D66', marginBottom: 10 }}>
            {result.sectionCount ?? 0} sections · {result.retrievedEvidence ?? 0} governed evidence items
            {result.warnings?.length ? ` · ${result.warnings.length} advisory note(s)` : ''}
          </div>
          <a
            href={`/api/v1/artifacts/${result.artifactId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', gap: 6, padding: '7px 14px', background: NAVY, color: '#fff', borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
          >
            Open deliverable →
          </a>
        </div>
      )}
    </div>
  );
}
