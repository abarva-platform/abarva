'use client';

// PROG16 · Source Event Chip.
//
// Compact chip surfaced on the Program Flagship page to indicate the
// linked Source AMS event. Shows commercial readiness state, top
// blocker, and a link to the source event.
//
// Design canon: white/off-white base, dark navy text, dark-blue accent,
// compact chip (NOT a large card). No teal, no sparkles, no avatars.
// Colors drawn from the AbarVa canon.

import React from 'react';
import Link from 'next/link';
import { type ProgramSourceLinkView } from '@/lib/programs/program-source-link-view';

interface SourceEventChipProps {
  view: ProgramSourceLinkView;
}

export function SourceEventChip({ view }: SourceEventChipProps) {
  return (
    <div
      data-component="SourceEventChip"
      data-source-event-id={view.sourceEventId}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '8px 14px',
        backgroundColor: '#F8F7F4',
        border: '1px solid #E8E6E1',
        borderLeft: '3px solid #1B2B5C',
        borderRadius: '4px',
        fontSize: '11px',
        color: '#0A0C12',
        fontFamily: 'DM Sans, sans-serif',
        maxWidth: '420px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            fontWeight: 600,
            color: '#1B2B5C',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            fontSize: '10px',
          }}
        >
          SOURCE EVENT
        </span>
        <span style={{ color: '#525866', fontSize: '10px' }}>
          · {view.commercialReadinessState.replace(/_/g, ' ')}
        </span>
      </div>
      <div style={{ fontWeight: 500, color: '#0A0C12', fontSize: '12px' }}>
        {view.sourceEventName}
      </div>
      <div style={{ color: '#525866', fontSize: '11px' }}>
        {view.topCommercialBlocker}
      </div>
      {view.routeHint ? (
        <Link
          href={view.routeHint}
          style={{ color: '#1B2B5C', fontSize: '11px', textDecoration: 'underline' }}
        >
          View commercial event →
        </Link>
      ) : (
        <span style={{ color: '#525866', fontSize: '10px' }}>
          {view.deterministicSeedCaveat}
        </span>
      )}
    </div>
  );
}
