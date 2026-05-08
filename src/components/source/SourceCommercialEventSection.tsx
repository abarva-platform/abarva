'use client';

import React, { useState } from 'react';
import SourceCommercialHub from './SourceCommercialHub';
import { LinkedProgramBadge } from './LinkedProgramBadge';
import { buildLinkedProgramBadgeView } from '@/lib/source/linked-program-badge-view';
import { AmsVendorStorylinePanel } from './AmsVendorStorylinePanel';
import { AmsIntelligenceSignalsPanel } from './AmsIntelligenceSignalsPanel';
import { AmsBafoPanel } from './AmsBafoPanel';
import { buildAmsVendorStoryline, AMS_OUTSOURCING_2026_EVENT_ID } from '@/lib/source/ams-outsourcing-2026-view';
import { buildAmsIntelligenceSignals } from '@/lib/source/ams-intelligence-signals-view';
import { buildAmsBafoView } from '@/lib/source/ams-bafo-view';

export interface SourceCommercialEventSectionProps {
  eventId: string;
  eventName: string;
  accountName: string;
}

// SRC34/SRC35/SRC36/SRC37 — Active tabs for the AMS Outsourcing 2026 event
type AmsTab = 'vendors' | 'intelligence' | 'bafo';

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
  fontFamily: "'Inter', sans-serif",
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

// AMS Outsourcing 2026 — tabbed commercial intelligence surface (SRC34-37)
function AmsOutsourcingCommercialSection({ badgeView }: { badgeView: ReturnType<typeof buildLinkedProgramBadgeView> }) {
  const [activeTab, setActiveTab] = useState<AmsTab>('vendors');
  const storyline = buildAmsVendorStoryline();
  const signals = buildAmsIntelligenceSignals();
  const bafo = buildAmsBafoView();

  const tabs: Array<{ id: AmsTab; label: string; count?: number }> = [
    { id: 'vendors',       label: 'Vendors',          count: storyline.vendors.length },
    { id: 'intelligence',  label: 'Intelligence',      count: signals.signals.length },
    { id: 'bafo',          label: 'BAFO',              count: bafo.invitedVendors.length },
  ];

  return (
    <div style={sectionStyle}>
      {badgeView && (
        <div style={{ padding: '12px 24px 0 24px' }}>
          <LinkedProgramBadge view={badgeView} />
        </div>
      )}
      <div style={headerRowStyle}>
        <h2 style={headingStyle}>Commercial Intelligence</h2>
      </div>
      {/* Tab bar */}
      <div style={{
        display: 'flex',
        gap: '0',
        borderBottom: '1px solid #E5DCD2',
        paddingLeft: '24px',
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #1B2B5C' : '2px solid transparent',
              cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? '#1B2B5C' : '#706D66',
              padding: '10px 16px',
              marginBottom: '-1px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              outline: 'none',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            aria-selected={activeTab === tab.id}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '11px',
                fontWeight: 600,
                color: activeTab === tab.id ? '#1B2B5C' : '#9CA3AF',
                backgroundColor: activeTab === tab.id ? '#EFF6FF' : '#F3F4F6',
                borderRadius: '10px',
                padding: '1px 6px',
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
      {/* Tab content */}
      <div style={{ padding: '20px 24px' }}>
        {activeTab === 'vendors' && (
          <AmsVendorStorylinePanel storyline={storyline} />
        )}
        {activeTab === 'intelligence' && (
          <AmsIntelligenceSignalsPanel bundle={signals} />
        )}
        {activeTab === 'bafo' && (
          <AmsBafoPanel round={bafo} />
        )}
      </div>
      <div style={caveatBannerStyle}>
        Commercial intelligence is deterministic seed-backed. Live vendor response ingestion not yet wired.
      </div>
    </div>
  );
}

export function SourceCommercialEventSection({
  eventId,
  eventName,
}: SourceCommercialEventSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const vendorList = deriveVendorList(eventId);
  const badgeView = buildLinkedProgramBadgeView(eventId);

  // SRC34-37: Use rich tabbed view for the Apex Retail AMS Outsourcing 2026 event
  if (eventId === AMS_OUTSOURCING_2026_EVENT_ID) {
    return <AmsOutsourcingCommercialSection badgeView={badgeView} />;
  }

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
