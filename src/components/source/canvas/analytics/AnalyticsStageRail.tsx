'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import { ANALYTICS } from './analytics-tokens';
import { SOURCE_STAGE_LABELS, SOURCE_STAGE_ORDER } from '@/lib/source/constants';
import type { SourceStageKey } from '@/lib/source/types';

interface AnalyticsStageRailProps {
  eventId: string;
  eventName: string;
  eventMeta: string;
  /** The stage on screen. */
  viewStage: SourceStageKey;
  /** The event's live progress stage (drives done / current / upcoming). */
  currentStage: SourceStageKey;
}

/**
 * The left rail — event header + the 11-stage journey. aVa drives 1–9, Atlas
 * 10–11. A "Templates & deliverables" link sits below. Read-only in this slice
 * (the analytics canvas ships dark); each stage links by ?stage=.
 */
export function AnalyticsStageRail({
  eventId,
  eventName,
  eventMeta,
  viewStage,
  currentStage,
}: AnalyticsStageRailProps) {
  const currentIndex = SOURCE_STAGE_ORDER.indexOf(currentStage);

  const railStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  };

  return (
    <aside data-testid="analytics-stage-rail">
      <div style={{ marginBottom: 14 }}>
        <Link
          href="/source/events"
          style={{
            fontSize: 12,
            color: ANALYTICS.MUTED,
            textDecoration: 'none',
            display: 'inline-block',
            marginBottom: 10,
          }}
        >
          ← All Source events
        </Link>
        <div
          style={{
            fontFamily: ANALYTICS.SERIF,
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: '-0.3px',
            color: ANALYTICS.INK,
            lineHeight: 1.2,
          }}
        >
          {eventName}
        </div>
        <div style={{ fontSize: 11.5, color: ANALYTICS.MUTED, marginTop: 3 }}>
          {eventMeta}
        </div>
      </div>

      <div
        style={{
          fontSize: 11,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          color: ANALYTICS.FAINT,
          fontWeight: 600,
          margin: '0 0 8px 2px',
        }}
      >
        Stages
      </div>

      <div style={railStyle}>
        {SOURCE_STAGE_ORDER.map((stageKey, i) => {
          const done = i < currentIndex;
          const current = stageKey === viewStage;
          const label = SOURCE_STAGE_LABELS[stageKey];
          return (
            <Link
              key={stageKey}
              href={`/source/events/${eventId}?stage=${stageKey}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '7px 9px',
                borderRadius: ANALYTICS.RADIUS_SM,
                textDecoration: 'none',
                background: current ? ANALYTICS.CARD : 'transparent',
                boxShadow: current ? ANALYTICS.SHADOW_SM : 'none',
                border: current ? `1px solid ${ANALYTICS.LINE}` : '1px solid transparent',
              }}
            >
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  fontFamily: ANALYTICS.MONO,
                  fontSize: 9,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: done
                    ? ANALYTICS.INK
                    : current
                      ? ANALYTICS.BLUE
                      : ANALYTICS.CARD,
                  color: done || current ? '#fff' : ANALYTICS.FAINT,
                  border: done || current ? 'none' : `1.5px solid ${ANALYTICS.LINE_STRONG}`,
                }}
              >
                {done ? '✓' : String(i + 1).padStart(2, '0')}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: current ? 600 : 500,
                  color: current || done ? ANALYTICS.INK : ANALYTICS.MUTED,
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 14,
          paddingTop: 12,
          borderTop: `1px solid ${ANALYTICS.LINE_SOFT}`,
        }}
      >
        <button
          type="button"
          title="Templates & deliverables library (coming with the analytics layer)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 8px',
            borderRadius: ANALYTICS.RADIUS_SM,
            border: 'none',
            background: 'none',
            width: '100%',
            textAlign: 'left',
            cursor: 'pointer',
            fontFamily: ANALYTICS.SANS,
            fontSize: 13.5,
            fontWeight: 500,
            color: ANALYTICS.INK_2,
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: ANALYTICS.CARD,
              border: `1px solid ${ANALYTICS.LINE}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: ANALYTICS.MUTED,
              flexShrink: 0,
            }}
          >
            ▤
          </span>
          Templates &amp; deliverables
        </button>
      </div>

      <div
        style={{
          marginTop: 14,
          fontSize: 11.5,
          color: ANALYTICS.FAINT,
          lineHeight: 1.5,
        }}
      >
        <b style={{ color: ANALYTICS.MUTED }}>aVa</b> guides steps 1–9 ·{' '}
        <b style={{ color: ANALYTICS.MUTED }}>Atlas</b> takes over for transition &amp;
        value (10–11)
      </div>
    </aside>
  );
}
