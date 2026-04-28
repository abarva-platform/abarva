'use client';

import React, { useState } from 'react';
import type { AtlasSampleInsight } from '@/lib/public-site/atlas-public-scope';
import { CANONICAL_URLS } from '@/lib/public-site/canonical-urls';

interface PublicAtlasProps {
  insights: AtlasSampleInsight[];
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
      title={`Confidence: ${pct}%`}
    >
      <div
        style={{
          flex: 1,
          height: '3px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: 'rgba(255,255,255,0.7)',
            borderRadius: '2px',
          }}
        />
      </div>
      <span
        style={{
          fontFamily: 'var(--pub-font-mono, "JetBrains Mono", ui-monospace, monospace)',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.55)',
          flexShrink: 0,
        }}
      >
        {pct}%
      </span>
    </div>
  );
}

function InsightCard({ insight }: { insight: AtlasSampleInsight }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="pub-atlas-insight-card"
      onClick={() => setExpanded((v) => !v)}
      style={{
        background: 'var(--pub-navy, #0c1a3a)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '10px',
        padding: '24px',
        cursor: 'pointer',
        transition: 'border-color 200ms ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.3)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.12)';
      }}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setExpanded((v) => !v);
        }
      }}
    >
      {/* Q label */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
        <span
          style={{
            fontFamily: 'var(--pub-font-mono, "JetBrains Mono", ui-monospace, monospace)',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--pub-signal, #0066CC)',
            background: 'rgba(0,102,204,0.15)',
            padding: '2px 7px',
            borderRadius: '4px',
            flexShrink: 0,
            marginTop: '2px',
          }}
        >
          Q
        </span>
        <p
          style={{
            fontFamily: 'var(--pub-font-sans, sans-serif)',
            fontSize: '15px',
            fontWeight: 600,
            color: '#ffffff',
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          {insight.question}
        </p>
      </div>

      {/* A section — always visible but truncated unless expanded */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <span
          style={{
            fontFamily: 'var(--pub-font-mono, "JetBrains Mono", ui-monospace, monospace)',
            fontSize: '11px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.5)',
            background: 'rgba(255,255,255,0.08)',
            padding: '2px 7px',
            borderRadius: '4px',
            flexShrink: 0,
            alignSelf: 'flex-start',
            marginTop: '2px',
          }}
        >
          A
        </span>
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontFamily: 'var(--pub-font-sans, sans-serif)',
              fontSize: '14px',
              lineHeight: 1.65,
              color: 'rgba(255,255,255,0.75)',
              margin: 0,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: expanded ? 'unset' : 2,
              WebkitBoxOrient: 'vertical',
            } as React.CSSProperties}
          >
            {insight.answer}
          </p>
          {!expanded && (
            <span
              style={{
                fontFamily: 'var(--pub-font-sans, sans-serif)',
                fontSize: '12px',
                color: 'var(--pub-signal, #0066CC)',
                marginTop: '4px',
                display: 'block',
              }}
            >
              Read more ↓
            </span>
          )}
        </div>
      </div>

      {/* Patterns + confidence */}
      {expanded && (
        <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {insight.patterns.map((slug) => (
              <span
                key={slug}
                style={{
                  fontFamily: 'var(--pub-font-mono, "JetBrains Mono", ui-monospace, monospace)',
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.45)',
                  background: 'rgba(255,255,255,0.06)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                }}
              >
                {slug}
              </span>
            ))}
          </div>
          <ConfidenceBar value={insight.confidence} />
        </div>
      )}
    </div>
  );
}

export function PublicAtlas({ insights }: PublicAtlasProps) {
  return (
    <div className="pub-atlas-hero">
      {/* Intro copy */}
      <p
        style={{
          fontFamily: 'var(--pub-font-sans, sans-serif)',
          fontSize: '17px',
          lineHeight: 1.65,
          color: 'var(--pub-slate, #5F5E5A)',
          maxWidth: '640px',
          margin: '0 auto 48px',
          textAlign: 'center',
        }}
      >
        Atlas synthesizes answers from the full AbarVa knowledge corpus — 60 patterns, 30 signals,
        and 10 contradictions — and cites every claim. These are three representative questions from
        practitioners in private beta.
      </p>

      {/* Sample insight cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px',
          marginBottom: '48px',
        }}
      >
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>

      {/* CTA */}
      <div
        style={{
          textAlign: 'center',
          padding: '40px 32px',
          background: 'rgba(12,26,58,0.04)',
          border: '1px solid rgba(12,26,58,0.1)',
          borderRadius: '12px',
          maxWidth: '520px',
          margin: '0 auto',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--pub-font-sans, sans-serif)',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--pub-stone, #888780)',
            marginBottom: '8px',
          }}
        >
          Private beta
        </p>
        <h2
          style={{
            fontFamily: 'var(--pub-font-serif, serif)',
            fontSize: 'clamp(22px, 3vw, 28px)',
            fontWeight: 500,
            color: 'var(--pub-ink, #000)',
            marginBottom: '12px',
            lineHeight: 1.25,
          }}
        >
          Atlas is in private beta.
        </h2>
        <p
          style={{
            fontFamily: 'var(--pub-font-sans, sans-serif)',
            fontSize: '15px',
            color: 'var(--pub-slate, #5F5E5A)',
            lineHeight: 1.6,
            marginBottom: '24px',
          }}
        >
          We&apos;re onboarding a small cohort of practitioners. If your organization is running or
          planning an AI program, we&apos;d like to hear from you.
        </p>
        <a
          href={CANONICAL_URLS.contact}
          style={{
            display: 'inline-block',
            fontFamily: 'var(--pub-font-sans, sans-serif)',
            fontSize: '15px',
            fontWeight: 600,
            color: '#ffffff',
            background: 'var(--pub-navy, #0c1a3a)',
            borderRadius: '8px',
            padding: '12px 28px',
            textDecoration: 'none',
          }}
        >
          Request early access →
        </a>
      </div>
    </div>
  );
}
