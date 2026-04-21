'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CohortPeerVisualization } from '@/components/atlas/CohortPeerVisualization';
import { EvidenceChainCard } from '@/components/atlas/EvidenceChainCard';
import type { AtlasSignalDetail } from '@/lib/atlas/types';

const INK = '#F8FAFC';
const MUTE = '#CBD5E1';
const SOFT = '#94A3B8';
const TEAL = '#14B8A6';
const CRITICAL = '#DC2626';

function dollars(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'n/a';
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}

export function AtlasSignalDetailPanel({
  signalId,
  open,
  onClose,
  onAskAtlas,
}: {
  signalId: string | null;
  open: boolean;
  onClose: () => void;
  onAskAtlas: (message: string) => void;
}) {
  const [signal, setSignal] = useState<AtlasSignalDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!open || !signalId) return;
      setLoading(true);
      const res = await fetch(`/api/v1/atlas/signals/${encodeURIComponent(signalId)}`, { cache: 'no-store' });
      const json = (await res.json().catch(() => ({}))) as { signal?: AtlasSignalDetail };
      if (!cancelled) {
        setSignal(res.ok ? (json.signal ?? null) : null);
        setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, signalId]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2,6,23,0.4)',
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 60,
      }}
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: 400,
          height: '100vh',
          background: 'linear-gradient(180deg, rgba(30,41,59,0.98), rgba(15,23,42,0.98))',
          borderLeft: '0.5px solid rgba(148,163,184,0.22)',
          boxShadow: '0 22px 70px rgba(2,6,23,0.46)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ height: 8, background: CRITICAL }} />

        <div style={{ padding: 20, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
          <div>
            <div
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: TEAL,
              }}
            >
              Signal detail
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: MUTE }}>Overlay context preserved</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              border: '0.5px solid rgba(148,163,184,0.22)',
              background: 'transparent',
              color: MUTE,
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px', display: 'grid', gap: 18 }}>
          {loading || !signal ? (
            <div style={{ fontSize: 13, color: SOFT }}>{loading ? 'Loading signal detail…' : 'Signal detail unavailable.'}</div>
          ) : (
            <>
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ fontSize: 28, lineHeight: 1, fontWeight: 800, color: INK }}>{dollars(signal.impactUsd)}</div>
                <div style={{ fontSize: 18, lineHeight: 1.3, fontWeight: 700, color: INK }}>{signal.headline}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12, color: MUTE }}>
                  <span>{signal.signalTitle}</span>
                  {signal.cohortLabel && <span>{signal.cohortLabel}</span>}
                  {typeof signal.percentile === 'number' && <span>{signal.percentile}th percentile</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                <div
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: TEAL,
                  }}
                >
                  Evidence chain
                </div>
                {signal.evidence.map((item) => (
                  <EvidenceChainCard key={item.id} evidence={item} />
                ))}
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                <div
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: TEAL,
                  }}
                >
                  Cohort context
                </div>
                <div style={{ maxHeight: 260, overflowY: 'auto', paddingRight: 2 }}>
                  <CohortPeerVisualization benchmark={signal.benchmark} />
                </div>
              </div>

              {signal.recommendedActions.length > 0 && (
                <div style={{ display: 'grid', gap: 8 }}>
                  <div
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: TEAL,
                    }}
                  >
                    Recommended action
                  </div>
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 16,
                      border: '0.5px solid rgba(148,163,184,0.18)',
                      background: 'rgba(15,23,42,0.42)',
                      fontSize: 13,
                      color: MUTE,
                      lineHeight: 1.55,
                    }}
                  >
                    {signal.recommendedActions.join(' · ')}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div
          style={{
            padding: 20,
            borderTop: '0.5px solid rgba(148,163,184,0.16)',
            display: 'grid',
            gap: 10,
            background: 'rgba(15,23,42,0.92)',
          }}
        >
          <Link
            href={signal ? `/programs/new?source=tower_signal&signalId=${encodeURIComponent(signal.id)}` : '/programs/new?source=tower_signal'}
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '14px 16px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(20,184,166,0.96), rgba(37,99,235,0.92))',
              color: '#03121A',
              textDecoration: 'none',
              fontWeight: 800,
            }}
          >
            Originate program
          </Link>
          <button
            type="button"
            onClick={() => signal && onAskAtlas(`Walk me through ${signal.signalTitle}`)}
            style={{
              padding: '12px 16px',
              borderRadius: 16,
              border: '0.5px solid rgba(148,163,184,0.22)',
              background: 'transparent',
              color: INK,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Ask Atlas about this signal
          </button>
        </div>
      </div>
    </div>
  );
}
