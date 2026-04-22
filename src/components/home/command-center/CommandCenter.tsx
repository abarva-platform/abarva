'use client';

import { useState } from 'react';
import { ITStackGrid } from './ITStackGrid';
import { VendorsGrid } from './VendorsGrid';
import { UploadedDataGrid } from './UploadedDataGrid';
import { EyebrowLabel } from '@/components/shared/typography/EyebrowLabel';
import { SectionHeading } from '@/components/shared/typography/SectionHeading';
import { Body } from '@/components/shared/typography/Body';
import { COLORS, TRANSITIONS, FOCUS_RING } from '@/lib/design-system';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// Fix Spec v4 §10/§11/§12 · Command-center grid tab switcher.
//
// One section on the authenticated home that renders the IT Stack /
// Vendors / Uploaded Data grids under a tab affordance. Default lands
// on IT Stack (richest demo content). Each grid is self-contained; the
// switcher just swaps the active panel.

type Tab = 'it-stack' | 'vendors' | 'uploaded-data';

interface Props {
  tenantKey: string | null;
}

const TABS: Array<{ key: Tab; label: string; hint: string }> = [
  { key: 'it-stack', label: 'IT Stack', hint: 'Systems, segments, health · renewal cadence' },
  { key: 'vendors', label: 'Vendors', hint: 'Tier · spend · risk · AI exposure' },
  { key: 'uploaded-data', label: 'Uploaded Data', hint: 'Quality · sensitivity · chain of custody' },
];

export function CommandCenter({ tenantKey }: Props) {
  const [active, setActive] = useState<Tab>('it-stack');
  const reducedMotion = useReducedMotion();

  const current = TABS.find((t) => t.key === active) ?? TABS[0];

  return (
    <section aria-labelledby="command-center-heading" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <EyebrowLabel tone="teal" size="sm" id="command-center-heading">COMMAND CENTER · TENANT INVENTORY</EyebrowLabel>
          <SectionHeading size="md" style={{ marginTop: 6 }}>Your enterprise · surfaced as data, not documents.</SectionHeading>
          <Body size="sm" tone="secondary" style={{ marginTop: 4, maxWidth: 720 }}>
            {current.hint}
          </Body>
        </div>
      </div>

      <nav role="tablist" aria-label="Command center views" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '0.5px solid rgba(255,255,255,0.08)', paddingBottom: 10 }}>
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(tab.key)}
              style={{
                padding: '8px 16px',
                background: isActive ? 'rgba(45,212,200,0.12)' : 'transparent',
                border: `0.5px solid ${isActive ? 'rgba(45,212,200,0.4)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 999,
                color: isActive ? COLORS.teal : 'rgba(245,245,240,0.8)',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                outline: 'none',
                transition: reducedMotion ? undefined : `background-color ${TRANSITIONS.hover}, color ${TRANSITIONS.hover}, border-color ${TRANSITIONS.hover}, box-shadow ${TRANSITIONS.focus}`,
              }}
              onFocus={(e) => { e.currentTarget.style.boxShadow = FOCUS_RING.brand; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div role="tabpanel" aria-labelledby="command-center-heading">
        {active === 'it-stack' ? <ITStackGrid tenantKey={tenantKey} limit={20} /> : null}
        {active === 'vendors' ? <VendorsGrid tenantKey={tenantKey} limit={20} /> : null}
        {active === 'uploaded-data' ? <UploadedDataGrid tenantKey={tenantKey} limit={20} /> : null}
      </div>
    </section>
  );
}
