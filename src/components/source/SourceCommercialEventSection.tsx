'use client';

import React, { useState } from 'react';
import SourceCommercialHub from './SourceCommercialHub';
import { LinkedProgramBadge } from './LinkedProgramBadge';
import { buildLinkedProgramBadgeView } from '@/lib/source/linked-program-badge-view';

export interface SourceCommercialEventSectionProps {
  eventId: string;
  eventName: string;
  accountName: string;
}

const VENDOR_POOL = [
  'Vendor Alpha',
  'Vendor Beta',
  'Vendor Gamma',
  'Vendor Delta',
  'Vendor Epsilon',
];

/** Deterministic vendor list derived from eventId. */
function deriveVendorList(eventId: string): string[] {
  let hash = 0;
  for (let i = 0; i < eventId.length; i++) {
    hash = (hash * 31 + eventId.charCodeAt(i)) >>> 0;
  }
  const count = 3 + (hash % 3); // 3, 4, or 5 vendors
  const vendors: string[] = [];
  for (let i = 0; i < count; i++) {
    vendors.push(VENDOR_POOL[(hash + i) % VENDOR_POOL.length]);
  }
  return vendors;
}

const sectionStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E5DCD2',
  borderRadius: '8px',
  marginTop: '24px',
  fontFamily: "'DM Sans', sans-serif",
  overflow: 'hidden',
};

const headerRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 24px',
};

const headingStyle: React.CSSProperties = {
  color: '#13233A',
  fontSize: '16px',
  fontWeight: 600,
  margin: 0,
  lineHeight: 1.4,
};

const expandButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#2E6FD8',
  fontSize: '14px',
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 0',
  outline: 'none',
};

const chevronStyle = (expanded: boolean): React.CSSProperties => ({
  display: 'inline-block',
  transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
  transition: 'transform 0.2s ease',
  fontSize: '12px',
  lineHeight: 1,
});

const dividerStyle: React.CSSProperties = {
  borderTop: '1px solid #E5DCD2',
};

const caveatBannerStyle: React.CSSProperties = {
  backgroundColor: '#FBF7F0',
  borderTop: '1px solid #E5DCD2',
  padding: '10px 24px',
  fontSize: '12px',
  color: '#706D66',
  lineHeight: 1.5,
};

export function SourceCommercialEventSection({
  eventId,
  eventName,
}: SourceCommercialEventSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const vendorList = deriveVendorList(eventId);
  const badgeView = buildLinkedProgramBadgeView(eventId);

  return (
    <div style={sectionStyle}>
      {badgeView && (
        <div style={{ padding: '12px 24px 0 24px' }}>
          <LinkedProgramBadge view={badgeView} />
        </div>
      )}
      <div style={headerRowStyle}>
        <h2 style={headingStyle}>Commercial Intelligence</h2>
        <button
          style={expandButtonStyle}
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-controls="commercial-hub-panel"
        >
          {expanded ? 'Collapse' : 'View commercial intelligence'}
          <span style={chevronStyle(expanded)} aria-hidden="true">&#8250;</span>
        </button>
      </div>

      {expanded && (
        <div id="commercial-hub-panel">
          <div style={dividerStyle} />
          <SourceCommercialHub
            rfpId={eventId}
            vendorList={vendorList}
            eventLabel={eventName}
          />
          <div style={caveatBannerStyle}>
            Commercial intelligence is deterministic/seed-backed. Live vendor response ingestion not yet wired.
          </div>
        </div>
      )}
    </div>
  );
}

export default SourceCommercialEventSection;
