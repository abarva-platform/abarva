'use client';

import { useState } from 'react';

const TEAL = '#14B8A6';
const INK = '#F5F5F0';
const BG_DARK = '#0A0A0A';
const BORDER = '0.5px solid rgba(255,255,255,0.08)';

interface ChunkDetail {
  source_key: string;
  title: string;
  publisher: string;
  source_url: string | null;
  license_class: string;
  attribution: string | null;
  section: string | null;
  page_number: number | null;
  chunk_text: string;
}

export interface CitationPillProps {
  sourceKey: string;
  section?: string;
  page?: string | number;
}

export function CitationPill({ sourceKey, section, page }: CitationPillProps) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<ChunkDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ source_key: sourceKey });
      if (section) qs.set('section', section);
      if (page) qs.set('page', String(page));
      const res = await fetch(`/api/knowledge/chunk?${qs.toString()}`);
      if (!res.ok) {
        setError(`${res.status} ${res.statusText}`);
        return;
      }
      const json = (await res.json()) as { chunk: ChunkDetail | null };
      setDetail(json.chunk ?? null);
      if (!json.chunk) setError('Chunk not found');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  function handleClick() {
    setOpen(true);
    if (!detail && !loading) void load();
  }

  const label = section ? `${sourceKey} § ${section}` : page ? `${sourceKey}, p.${page}` : sourceKey;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title={label}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '1px 8px',
          margin: '0 2px',
          background: 'rgba(20,184,166,0.08)',
          border: `0.5px solid ${TEAL}`,
          borderRadius: 999,
          color: TEAL,
          fontSize: 11,
          fontWeight: 600,
          fontFamily: 'JetBrains Mono, monospace',
          cursor: 'pointer',
          verticalAlign: 'baseline',
          letterSpacing: '-0.01em',
        }}
      >
        <span style={{ fontSize: 9, opacity: 0.9 }}>◈</span>
        {label}
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 500,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(540px, 90vw)',
              height: '100vh',
              background: BG_DARK,
              borderLeft: BORDER,
              color: INK,
              overflow: 'auto',
              padding: '28px 28px 48px',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: TEAL, letterSpacing: '0.14em' }}>
                SOURCE
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'rgba(245,245,240,0.72)', cursor: 'pointer', fontSize: 18 }}
              >
                ×
              </button>
            </div>

            {loading && <div style={{ color: 'rgba(245,245,240,0.72)' }}>Loading…</div>}
            {error && <div style={{ color: '#FF6B4A', fontSize: 13 }}>Error: {error}</div>}

            {detail && (
              <>
                <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.3, marginBottom: 6 }}>
                  {detail.title}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(245,245,240,0.72)', marginBottom: 4 }}>
                  {detail.publisher}
                  {detail.license_class ? ` · ${detail.license_class.replace(/_/g, ' ')}` : ''}
                </div>
                {(detail.section || detail.page_number) && (
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: TEAL, marginBottom: 20 }}>
                    {detail.section ? `§ ${detail.section}` : `page ${detail.page_number}`}
                  </div>
                )}

                <div
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: BORDER,
                    borderRadius: 10,
                    padding: 18,
                    fontSize: 13,
                    lineHeight: 1.65,
                    whiteSpace: 'pre-wrap',
                    marginBottom: 20,
                  }}
                >
                  {detail.chunk_text}
                </div>

                {detail.attribution && (
                  <div style={{ fontSize: 11, color: 'rgba(245,245,240,0.72)', fontStyle: 'italic', marginBottom: 16 }}>
                    {detail.attribution}
                  </div>
                )}

                {detail.source_url && (
                  <a
                    href={detail.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      padding: '8px 16px',
                      border: `1px solid ${TEAL}`,
                      borderRadius: 6,
                      color: TEAL,
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Open source →
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
