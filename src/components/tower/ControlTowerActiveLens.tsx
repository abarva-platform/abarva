import React from 'react';
import type {
  ControlTowerActiveLensView,
  TowerLens,
} from '@/lib/tower/control-tower-active-lens-view';

interface ControlTowerActiveLensProps {
  view: ControlTowerActiveLensView;
}

export function ControlTowerActiveLens({ view }: ControlTowerActiveLensProps) {
  const STATUS_COLOR: Record<string, string> = {
    on_track: '#1B2B5C',
    at_risk: '#F59E0B',
    blocked: '#B91C1C',
    not_started: '#9AA3B2',
    deferred: '#525866',
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#ffffff', padding: '20px' }}>
      {/* Lens tabs */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '20px',
          borderBottom: '1px solid #E8E6E1',
          paddingBottom: '0',
          overflowX: 'auto',
        }}
      >
        {view.availableLenses.map((lens: TowerLens) => (
          <span
            key={lens}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: lens === view.activeLens ? 600 : 400,
              color: lens === view.activeLens ? '#1B2B5C' : '#525866',
              borderBottom:
                lens === view.activeLens ? '2px solid #1B2B5C' : '2px solid transparent',
              cursor: 'default',
              whiteSpace: 'nowrap',
            }}
          >
            {lens.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
        ))}
      </div>

      {/* Scorecards (max 5) */}
      {view.scorecards.length > 0 ? (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}
        >
          {view.scorecards.slice(0, 5).map((sc) => (
            <div
              key={sc.scorecardId}
              style={{
                padding: '12px 16px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E8E6E1',
                borderLeft: `3px solid ${STATUS_COLOR[sc.status] ?? '#525866'}`,
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#0A0C12' }}>
                  {sc.label}
                </div>
                <div style={{ fontSize: '11px', color: '#525866', marginTop: '2px' }}>
                  {sc.summary}
                </div>
                <div style={{ fontSize: '10px', color: '#9AA3B2', marginTop: '2px' }}>
                  Basis: {sc.evidenceBasis}
                </div>
              </div>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: STATUS_COLOR[sc.status] ?? '#525866',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  marginLeft: '16px',
                }}
              >
                {sc.status.replace(/_/g, ' ')}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            color: '#525866',
            fontSize: '13px',
            marginBottom: '16px',
          }}
        >
          No scorecard data for this tenant. Apex Retail is the recommended demo tenant.
        </div>
      )}

      {/* Pressure cards (max 3) */}
      {view.pressureCards.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          {view.pressureCards.slice(0, 3).map((pc) => (
            <div
              key={pc.pressureId}
              style={{
                padding: '12px',
                backgroundColor: '#FFF7ED',
                border: '1px solid #F59E0B',
                borderRadius: '4px',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#92400E',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                {pc.lens.replace(/_/g, ' ').toUpperCase()}
              </div>
              <div
                style={{ fontSize: '12px', fontWeight: 600, color: '#0A0C12', marginBottom: '4px' }}
              >
                {pc.label}
              </div>
              <div style={{ fontSize: '11px', color: '#525866' }}>{pc.pressureSummary}</div>
            </div>
          ))}
        </div>
      )}

      {/* Ask Atlas — deferred drawer trigger */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '10px', color: '#9AA3B2' }}>{view.deterministicSeedCaveat}</div>
        <button
          style={{
            padding: '6px 14px',
            backgroundColor: 'transparent',
            border: '1px solid #1B2B5C',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#1B2B5C',
            cursor: 'pointer',
          }}
        >
          Ask Atlas →
        </button>
      </div>
    </div>
  );
}
