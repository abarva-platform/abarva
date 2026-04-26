'use client';

import React, { useState } from 'react';
import {
  COMMERCIAL_HUB_TABS,
  buildCommercialHubViewModel,
} from '@/lib/source/source-commercial-hub-view';

export interface SourceCommercialHubProps {
  rfpId: string;
  vendorList: string[];
  eventId?: string;
  eventLabel?: string;
  // Panel slots — callers inject the actual panel components
  summarySlot?: React.ReactNode;
  pricingSlot?: React.ReactNode;
  bafoSlot?: React.ReactNode;
  risksSlot?: React.ReactNode;
  readinessSlot?: React.ReactNode;
  missionsSlot?: React.ReactNode;
  signalsSlot?: React.ReactNode;
}

const containerStyle: React.CSSProperties = {
  backgroundColor: '#FAFAF9',
  minHeight: '100%',
  fontFamily: "'DM Sans', sans-serif",
};

const headerStyle: React.CSSProperties = {
  padding: '24px 32px 0 32px',
};

const titleStyle: React.CSSProperties = {
  color: '#0F0E0D',
  fontSize: '22px',
  fontWeight: 600,
  margin: 0,
  lineHeight: 1.3,
};

const subtitleStyle: React.CSSProperties = {
  color: '#706D66',
  fontSize: '14px',
  marginTop: '4px',
  marginBottom: 0,
};

const tabBarStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  gap: 0,
  borderBottom: '1px solid #E8E6E3',
  backgroundColor: '#FAFAF9',
  padding: '0 32px',
  marginTop: '20px',
};

function tabButtonStyle(active: boolean, hovered: boolean): React.CSSProperties {
  return {
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid #1E3A5F' : '2px solid transparent',
    color: active ? '#1E3A5F' : hovered ? '#3D3B38' : '#706D66',
    fontSize: '14px',
    fontWeight: active ? 600 : 400,
    padding: '10px 16px',
    cursor: 'pointer',
    lineHeight: 1.4,
    transition: 'color 0.15s, border-bottom-color 0.15s',
    outline: 'none',
    marginBottom: '-1px',
    whiteSpace: 'nowrap',
  };
}

const panelAreaStyle: React.CSSProperties = {
  padding: '24px 32px',
};

const placeholderStyle: React.CSSProperties = {
  color: '#706D66',
  fontSize: '14px',
  padding: '32px 0',
};

export function SourceCommercialHub({
  rfpId,
  vendorList: _vendorList,
  eventId: _eventId,
  eventLabel,
  summarySlot,
  pricingSlot,
  bafoSlot,
  risksSlot,
  readinessSlot,
  missionsSlot,
  signalsSlot,
}: SourceCommercialHubProps) {
  const viewModel = buildCommercialHubViewModel(rfpId, eventLabel);
  const [activeTabId, setActiveTabId] = useState<string>(viewModel.defaultTabId);
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);

  const slotMap: Record<string, React.ReactNode | undefined> = {
    summary: summarySlot,
    pricing: pricingSlot,
    bafo: bafoSlot,
    risks: risksSlot,
    readiness: readinessSlot,
    missions: missionsSlot,
    signals: signalsSlot,
  };

  const activeSlot = slotMap[activeTabId];

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Commercial Intelligence</h1>
        <p style={subtitleStyle}>
          {eventLabel ? eventLabel : 'Procurement commercial analysis across all dimensions'}
        </p>
      </div>

      <div style={tabBarStyle} role="tablist" aria-label="Commercial intelligence tabs">
        {COMMERCIAL_HUB_TABS.map((tab) => (
          <button
            key={tab.tabId}
            role="tab"
            aria-selected={activeTabId === tab.tabId}
            aria-controls={`panel-${tab.tabId}`}
            id={`tab-${tab.tabId}`}
            style={tabButtonStyle(
              activeTabId === tab.tabId,
              hoveredTabId === tab.tabId,
            )}
            onClick={() => setActiveTabId(tab.tabId)}
            onMouseEnter={() => setHoveredTabId(tab.tabId)}
            onMouseLeave={() => setHoveredTabId(null)}
            title={tab.description}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        style={panelAreaStyle}
        role="tabpanel"
        id={`panel-${activeTabId}`}
        aria-labelledby={`tab-${activeTabId}`}
      >
        {activeSlot !== undefined ? (
          activeSlot
        ) : (
          <div style={placeholderStyle}>Panel loading...</div>
        )}
      </div>
    </div>
  );
}

export default SourceCommercialHub;
