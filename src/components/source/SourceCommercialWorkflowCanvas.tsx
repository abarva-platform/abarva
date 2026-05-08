'use client';

import React, { useState } from 'react';

export type CommercialWorkflowStageId =
  | 'brief'
  | 'pricing'
  | 'comparison'
  | 'risk'
  | 'bafo'
  | 'readiness'
  | 'missions'
  | 'signals'
  | 'decision';

export interface CommercialWorkflowStage {
  id: CommercialWorkflowStageId;
  label: string;
  shortLabel: string;
  description: string;
}

export const COMMERCIAL_WORKFLOW_STAGES: ReadonlyArray<CommercialWorkflowStage> = [
  {
    id: 'brief',
    label: 'Event commercial brief',
    shortLabel: 'Brief',
    description: 'What is the commercial posture for this sourcing event?',
  },
  {
    id: 'pricing',
    label: 'Pricing normalization',
    shortLabel: 'Pricing',
    description: 'Are vendor rate cards normalised and comparable?',
  },
  {
    id: 'comparison',
    label: 'Vendor comparison',
    shortLabel: 'Compare',
    description: 'How do vendors stack up across normalised dimensions?',
  },
  {
    id: 'risk',
    label: 'Commercial risk',
    shortLabel: 'Risk',
    description: 'What commercial exceptions and gaps require resolution?',
  },
  {
    id: 'bafo',
    label: 'BAFO / negotiation',
    shortLabel: 'BAFO',
    description: 'What levers and asks shape the best-and-final round?',
  },
  {
    id: 'readiness',
    label: 'Readiness',
    shortLabel: 'Ready',
    description: 'Is commercial intelligence complete enough to recommend an award?',
  },
  {
    id: 'missions',
    label: 'Missions / actions',
    shortLabel: 'Actions',
    description: 'What does each agent need to do next?',
  },
  {
    id: 'signals',
    label: 'Tower / Intelligence signals',
    shortLabel: 'Signals',
    description: 'What pattern signals and alerts inform this event?',
  },
  {
    id: 'decision',
    label: 'Before executive decision',
    shortLabel: 'Decision',
    description: 'What inputs are missing before the executive can decide?',
  },
];

export interface SourceCommercialWorkflowCanvasProps {
  rfpId: string;
  vendorList: string[];
  eventLabel?: string;
  defaultStageId?: CommercialWorkflowStageId;
  briefSlot?: React.ReactNode;
  pricingSlot?: React.ReactNode;
  comparisonSlot?: React.ReactNode;
  riskSlot?: React.ReactNode;
  bafoSlot?: React.ReactNode;
  readinessSlot?: React.ReactNode;
  missionsSlot?: React.ReactNode;
  signalsSlot?: React.ReactNode;
  decisionSlot?: React.ReactNode;
}

const FONT_STACK = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const wrapperStyle: React.CSSProperties = {
  backgroundColor: '#FBFAF7',
  padding: '24px',
  borderRadius: '16px',
  fontFamily: FONT_STACK,
  color: '#1F2433',
};

const headerStyle: React.CSSProperties = {
  marginBottom: '20px',
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#525866',
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  fontWeight: 500,
  margin: 0,
  marginBottom: '8px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '24px',
  color: '#0A0C12',
  fontWeight: 600,
  margin: 0,
  marginBottom: '6px',
  lineHeight: 1.25,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#1F2433',
  margin: 0,
  lineHeight: 1.45,
};

const navWrapperStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '4px',
  overflowX: 'auto',
  whiteSpace: 'nowrap',
  borderBottom: '1px solid #E8E6E1',
  paddingBottom: '12px',
  marginBottom: '16px',
};

function navButtonStyle(active: boolean): React.CSSProperties {
  return {
    height: '28px',
    padding: '0 12px',
    fontSize: '13px',
    fontWeight: active ? 600 : 500,
    color: active ? '#FFFFFF' : '#525866',
    backgroundColor: active ? '#1B2B5C' : 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: FONT_STACK,
    lineHeight: 1,
    transition: 'background-color 0.12s, color 0.12s',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };
}

const stageDescriptionStyle: React.CSSProperties = {
  marginBottom: '20px',
};

const stageLabelStyle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 600,
  color: '#0A0C12',
  margin: 0,
  marginBottom: '4px',
};

const stageDescriptionTextStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#1F2433',
  margin: 0,
  lineHeight: 1.45,
};

const panelAreaStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E8E6E1',
  borderRadius: '12px',
  padding: '20px',
  minHeight: '160px',
  marginBottom: '20px',
};

const placeholderStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#525866',
  margin: 0,
  lineHeight: 1.5,
};

const footerStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#525866',
  margin: 0,
  lineHeight: 1.5,
  paddingTop: '12px',
  borderTop: '1px solid #E8E6E1',
};

function getSlot(
  stageId: CommercialWorkflowStageId,
  props: SourceCommercialWorkflowCanvasProps
): React.ReactNode {
  switch (stageId) {
    case 'brief':
      return props.briefSlot;
    case 'pricing':
      return props.pricingSlot;
    case 'comparison':
      return props.comparisonSlot;
    case 'risk':
      return props.riskSlot;
    case 'bafo':
      return props.bafoSlot;
    case 'readiness':
      return props.readinessSlot;
    case 'missions':
      return props.missionsSlot;
    case 'signals':
      return props.signalsSlot;
    case 'decision':
      return props.decisionSlot;
    default:
      return undefined;
  }
}

export function SourceCommercialWorkflowCanvas(
  props: SourceCommercialWorkflowCanvasProps
): React.ReactElement {
  const { rfpId, eventLabel, defaultStageId } = props;
  const [activeStageId, setActiveStageId] = useState<CommercialWorkflowStageId>(
    defaultStageId || 'brief'
  );

  const activeStage =
    COMMERCIAL_WORKFLOW_STAGES.find((stage) => stage.id === activeStageId) ||
    COMMERCIAL_WORKFLOW_STAGES[0];

  const slot = getSlot(activeStage.id, props);

  return (
    <section style={wrapperStyle} aria-label="Commercial intelligence canvas">
      <header style={headerStyle}>
        <p style={eyebrowStyle}>Commercial intelligence canvas</p>
        <h2 style={titleStyle}>{eventLabel || rfpId}</h2>
        <p style={subtitleStyle}>Nine-stage commercial sourcing workflow.</p>
      </header>

      <nav style={navWrapperStyle} aria-label="Commercial workflow stages">
        {COMMERCIAL_WORKFLOW_STAGES.map((stage) => {
          const isActive = stage.id === activeStage.id;
          return (
            <button
              key={stage.id}
              type="button"
              style={navButtonStyle(isActive)}
              onClick={() => setActiveStageId(stage.id)}
              aria-pressed={isActive}
              aria-label={stage.label}
            >
              {stage.shortLabel}
            </button>
          );
        })}
      </nav>

      <div style={stageDescriptionStyle}>
        <p style={stageLabelStyle}>{activeStage.label}</p>
        <p style={stageDescriptionTextStyle}>{activeStage.description}</p>
      </div>

      <div style={panelAreaStyle}>
        {slot !== undefined ? (
          slot
        ) : (
          <p style={placeholderStyle}>
            Panel content for this stage is provided by the host event surface.
          </p>
        )}
      </div>

      <p style={footerStyle}>
        Commercial intelligence canvas is deterministic and seed-backed. Live
        vendor ingestion is deferred. Savings figures are not fabricated.
      </p>
    </section>
  );
}

export default SourceCommercialWorkflowCanvas;
