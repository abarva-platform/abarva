'use client';

import type { CSSProperties, MouseEvent } from 'react';
import type { SourceWorkspaceVM } from '../buildViewModel';

type Gate = 'pass' | 'warn' | 'fail';

const COLORS: Record<Gate, string> = {
  pass: '#1d9e75',
  warn: '#ba7517',
  fail: '#a32d2d',
};

const TYPE = {
  serif: 'Georgia, serif',
  ui: 'DM Sans, Inter, system-ui, sans-serif',
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
};

const labelStyle: CSSProperties = {
  fontFamily: TYPE.mono,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '.1em',
  textTransform: 'uppercase',
};

function dot(state: Gate | 'available' | 'missing' | 'error') {
  const color =
    state === 'available'
      ? COLORS.pass
      : state === 'missing'
        ? COLORS.warn
        : state === 'error'
          ? COLORS.fail
          : COLORS[state];
  return (
    <span
      aria-hidden="true"
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: color,
        flex: '0 0 auto',
      }}
    />
  );
}

function gatePill(state: Gate, label: string = state) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        fontFamily: TYPE.mono,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '.08em',
        textTransform: 'uppercase',
        color: COLORS[state],
        whiteSpace: 'nowrap',
      }}
    >
      {dot(state)}
      {label}
    </span>
  );
}

function stop(e: MouseEvent) {
  e.stopPropagation();
}

export function ContextLens({ vm }: { vm: SourceWorkspaceVM }) {
  const cockpit = vm.cockpit;
  const proof = cockpit.proofLayers;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        fontFamily: TYPE.ui,
      }}
    >
      <section
        style={{
          background: '#0a0a0b',
          borderRadius: 8,
          color: '#fff',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,320px),1fr))',
            gap: 0,
          }}
        >
          <div style={{ padding: '28px 30px 30px' }}>
            <div
              style={{
                ...labelStyle,
                color: 'rgba(255,255,255,.58)',
                marginBottom: 12,
              }}
            >
              {cockpit.verdict.eyebrow}
            </div>
            <h2
              style={{
                fontFamily: TYPE.serif,
                fontSize: 'clamp(30px,3.1vw,50px)',
                fontWeight: 500,
                lineHeight: 1.02,
                letterSpacing: 0,
                margin: '0 0 18px',
                maxWidth: 820,
              }}
            >
              {cockpit.verdict.headline}
            </h2>
            <p
              style={{
                margin: '0 0 22px',
                color: 'rgba(255,255,255,.78)',
                fontSize: 15,
                lineHeight: 1.55,
                maxWidth: 760,
              }}
            >
              {cockpit.verdict.decidingAxis}
            </p>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                border: '1px solid rgba(255,255,255,.22)',
                borderRadius: 4,
                color: 'rgba(255,255,255,.72)',
                fontFamily: TYPE.mono,
                fontSize: 10.5,
                padding: '6px 8px',
                maxWidth: '100%',
              }}
            >
              {cockpit.verdict.bindingChip}
            </div>
          </div>
          <div
            style={{
              borderLeft: '1px solid rgba(255,255,255,.12)',
              display: 'grid',
              gridTemplateRows: 'repeat(3,1fr)',
            }}
          >
            {cockpit.verdict.supports.map((support) => (
              <div
                key={support.label}
                style={{
                  padding: '21px 24px',
                  borderTop: '1px solid rgba(255,255,255,.12)',
                }}
              >
                <div
                  style={{
                    ...labelStyle,
                    color: 'rgba(255,255,255,.5)',
                    marginBottom: 9,
                  }}
                >
                  {support.label}
                </div>
                <div
                  style={{
                    color: '#fff',
                    fontFamily: TYPE.mono,
                    fontSize: 24,
                    fontWeight: 800,
                    lineHeight: 1.1,
                    marginBottom: 8,
                  }}
                >
                  {support.value}
                </div>
                <div
                  style={{
                    color: 'rgba(255,255,255,.68)',
                    fontSize: 12.5,
                    lineHeight: 1.45,
                  }}
                >
                  {support.note}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        style={{
          background: '#fff',
          border: '1px solid rgba(10,10,11,.12)',
          borderRadius: 8,
          padding: '13px 18px',
          display: 'flex',
          gap: 18,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          {dot(vm.portfolioIsEmpty ? 'missing' : 'available')}
          <strong style={{ fontSize: 13, color: '#0a0a0b' }}>
            {cockpit.banner.datasetLabel}
          </strong>
        </div>
        <span style={{ fontFamily: TYPE.mono, fontSize: 11, color: '#5f5e5a' }}>
          {cockpit.banner.v4ContractCount} contracts
        </span>
        <span style={{ fontFamily: TYPE.mono, fontSize: 11, color: '#5f5e5a' }}>
          {cockpit.banner.v4VendorCount} vendors
        </span>
        <span style={{ fontFamily: TYPE.mono, fontSize: 11, color: '#5f5e5a' }}>
          as of {cockpit.verdict.eyebrow.replace(/^Position as of /, '')}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: TYPE.mono,
            fontSize: 10.5,
            color: '#888780',
            minWidth: 0,
          }}
        >
          load run {cockpit.banner.activeLoadRunId ?? 'not established'}
        </span>
      </section>

      <section
        style={{
          background: '#fff',
          border: '1px solid rgba(10,10,11,.12)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '19px 22px 15px',
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 16,
            borderBottom: '1px solid rgba(10,10,11,.1)',
          }}
        >
          <div>
            <div style={{ ...labelStyle, color: '#888780', marginBottom: 7 }}>
              01 action queue
            </div>
            <h3
              style={{
                fontFamily: TYPE.serif,
                fontSize: 25,
                fontWeight: 500,
                lineHeight: 1.12,
                margin: 0,
                color: '#0a0a0b',
              }}
            >
              One primary task, then the next two decisions.
            </h3>
          </div>
          <div style={{ fontFamily: TYPE.mono, fontSize: 11, color: '#888780' }}>
            ordered by deadline, then value
          </div>
        </div>
        {cockpit.actionQueue.length === 0 ? (
          <div style={{ padding: 22, color: '#5f5e5a', fontSize: 13 }}>
            No Source rows returned / nothing below is estimated in its place.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            {cockpit.actionQueue.map((row, index) => (
              <button
                key={row.contractId}
                onClick={() => vm.openCockpitContract(row.contractId)}
                style={{
                  width: '100%',
                  border: 'none',
                  borderTop:
                    index === 0 ? 'none' : '1px solid rgba(10,10,11,.08)',
                  background: '#fff',
                  display: 'grid',
                  gridTemplateColumns:
                    'minmax(250px,1.15fr) minmax(260px,1.2fr) 130px 140px 110px 146px',
                  gap: 16,
                  minWidth: 1120,
                  alignItems: 'center',
                  padding: '16px 22px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: '#0a0a0b',
                }}
              >
                <span style={{ minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 15,
                      fontWeight: 800,
                      lineHeight: 1.25,
                    }}
                  >
                    {row.actionVerb}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      color: '#5f5e5a',
                      fontSize: 12.5,
                      marginTop: 4,
                    }}
                  >
                    {row.counterparty} · {row.contractNumber}
                  </span>
                </span>
                <span style={{ color: '#2c2c2a', fontSize: 12.8, lineHeight: 1.4 }}>
                  {row.why}
                </span>
                <span
                  style={{
                    fontFamily: TYPE.mono,
                    fontSize: 13,
                    fontWeight: 800,
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.annualValueLabel}
                </span>
                <span
                  style={{
                    fontFamily: TYPE.mono,
                    fontSize: 12,
                    color: '#2c2c2a',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.deadlineLabel}
                </span>
                {gatePill(row.gate, row.gateLabel)}
                <span onClick={stop}>
                  <button
                    onClick={() =>
                      vm.startCockpitOptimization(
                        row.contractId,
                        row.opportunityId,
                      )
                    }
                    style={{
                      border: '1px solid #0a0a0b',
                      background: '#0a0a0b',
                      color: '#fff',
                      borderRadius: 6,
                      padding: '8px 11px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    Open workflow →
                  </button>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section
        style={{
          background: '#fff',
          border: '1px solid rgba(10,10,11,.12)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '18px 22px 14px',
            borderBottom: '1px solid rgba(10,10,11,.1)',
          }}
        >
          <div style={{ ...labelStyle, color: '#888780', marginBottom: 7 }}>
            02 top contracts
          </div>
          <h3
            style={{
              fontFamily: TYPE.serif,
              fontSize: 25,
              fontWeight: 500,
              margin: 0,
              color: '#0a0a0b',
            }}
          >
            The peer set stays visible without leading the page.
          </h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: 980,
              fontSize: 12.5,
            }}
          >
            <thead>
              <tr style={{ color: '#888780', background: '#fbfaf7' }}>
                {[
                  'Counterparty · number',
                  'Annual value',
                  'Term',
                  'Renewal / expiry',
                  'Gate',
                  'Source doc',
                  'Confidence',
                ].map((head) => (
                  <th
                    key={head}
                    style={{
                      ...labelStyle,
                      textAlign: head === 'Annual value' ? 'right' : 'left',
                      padding: '11px 14px',
                      borderBottom: '1px solid rgba(10,10,11,.1)',
                    }}
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cockpit.topContracts.map((row) => (
                <tr
                  key={row.contractId}
                  onClick={() => vm.openCockpitContract(row.contractId)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid rgba(10,10,11,.08)' }}>
                    <strong style={{ color: '#0a0a0b' }}>{row.counterparty}</strong>
                    <span style={{ color: '#888780' }}> · {row.contractNumber}</span>
                  </td>
                  <td
                    style={{
                      padding: '13px 14px',
                      borderBottom: '1px solid rgba(10,10,11,.08)',
                      textAlign: 'right',
                      fontFamily: TYPE.mono,
                      fontWeight: 800,
                    }}
                  >
                    {row.annualValueLabel}
                  </td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid rgba(10,10,11,.08)', color: '#2c2c2a' }}>
                    {row.termLabel}
                  </td>
                  <td
                    style={{
                      padding: '13px 14px',
                      borderBottom: '1px solid rgba(10,10,11,.08)',
                      color: row.renewalLabel.startsWith('Notice passed')
                        ? COLORS.warn
                        : '#2c2c2a',
                    }}
                  >
                    {row.renewalLabel}
                  </td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid rgba(10,10,11,.08)' }}>
                    {gatePill(row.gate, row.gateLabel)}
                  </td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid rgba(10,10,11,.08)', maxWidth: 220 }}>
                    <span style={{ fontFamily: TYPE.mono, color: '#5f5e5a' }}>
                      {row.sourceDocumentLabel}
                    </span>
                    {row.sourceDocumentNeed ? (
                      <span
                        style={{
                          display: 'block',
                          color: '#888780',
                          fontSize: 11.5,
                          marginTop: 3,
                          lineHeight: 1.35,
                        }}
                      >
                        {row.sourceDocumentNeed}
                      </span>
                    ) : null}
                  </td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid rgba(10,10,11,.08)' }}>
                    <span style={{ fontFamily: TYPE.mono, color: COLORS[row.confidenceGate], fontWeight: 800 }}>
                      {row.confidenceLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,320px),1fr))',
          gap: 18,
        }}
      >
        <div
          style={{
            background: '#fff',
            border: '1px solid rgba(10,10,11,.12)',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '17px 22px',
              borderBottom: '1px solid rgba(10,10,11,.1)',
            }}
          >
            <div style={{ ...labelStyle, color: '#888780', marginBottom: 7 }}>
              03 proof layers
            </div>
            <h3
              style={{
                fontFamily: TYPE.serif,
                fontSize: 25,
                fontWeight: 500,
                margin: 0,
                color: '#0a0a0b',
              }}
            >
              Explainable enough for the Chief Procurement Officer.
            </h3>
          </div>

          <details open style={{ borderBottom: '1px solid rgba(10,10,11,.08)' }}>
            <summary style={summaryStyle}>Evidence behind the verdict</summary>
            <div style={proofGridStyle}>
              {proof.evidenceBehindVerdict.map((entry) => (
                <div key={entry.label} style={proofItemStyle}>
                  <div style={{ fontWeight: 800, color: '#0a0a0b', marginBottom: 5 }}>
                    {entry.label}
                  </div>
                  <div style={{ fontFamily: TYPE.mono, fontSize: 11, color: '#5f5e5a', lineHeight: 1.45 }}>
                    {entry.binding} · grain: {entry.grain}
                  </div>
                  <div style={{ marginTop: 8, fontFamily: TYPE.mono, fontSize: 12, fontWeight: 800 }}>
                    {entry.value}
                  </div>
                </div>
              ))}
            </div>
          </details>

          <details open style={{ borderBottom: '1px solid rgba(10,10,11,.08)' }}>
            <summary style={summaryStyle}>Source systems, grain, freshness</summary>
            <div style={{ padding: '0 22px 18px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                <tbody>
                  {proof.sourceSystems.map((row) => (
                    <tr key={`${row.binding}-${row.name}`}>
                      <td style={proofCellStyle}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          {dot(row.state)}
                          <strong>{row.name}</strong>
                        </span>
                      </td>
                      <td style={proofCellStyle}>{row.binding}</td>
                      <td style={proofCellStyle}>{row.grain}</td>
                      <td style={{ ...proofCellStyle, textAlign: 'right', fontFamily: TYPE.mono }}>
                        {row.rowCount}
                      </td>
                      <td style={proofCellStyle}>{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          <details style={{ borderBottom: '1px solid rgba(10,10,11,.08)' }}>
            <summary style={summaryStyle}>Reconciliation and audit trail</summary>
            <div style={{ padding: '0 22px 18px', fontSize: 12.5, color: '#2c2c2a', lineHeight: 1.55 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10, marginBottom: 12 }}>
                <Metric label="legacy contracts" value={String(proof.reconciliation.legacyContractCount)} />
                <Metric label="legacy vendors" value={String(proof.reconciliation.legacyVendorCount)} />
                <Metric label="v4 contracts" value={String(proof.reconciliation.v4ContractCount)} />
                <Metric label="v4 vendors" value={String(proof.reconciliation.v4VendorCount)} />
              </div>
              {proof.reconciliation.mismatchWarning ?? 'Explore and V4 snapshot counts reconcile for this governed read.'}
            </div>
          </details>

          <details>
            <summary style={summaryStyle}>Source mapping table</summary>
            <div style={{ padding: '0 22px 18px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
                <tbody>
                  {proof.sourceMappingTable.map((row) => (
                    <tr key={row.bindingName}>
                      <td style={proofCellStyle}>{row.bindingName}</td>
                      <td style={proofCellStyle}>{row.grain}</td>
                      <td style={{ ...proofCellStyle, textAlign: 'right', fontFamily: TYPE.mono }}>
                        {row.rowCount}
                      </td>
                      <td style={proofCellStyle}>{gatePill(row.state === 'available' ? 'pass' : row.state === 'error' ? 'fail' : 'warn', row.state)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>

        <aside
          style={{
            background: '#fff',
            border: '1px solid rgba(10,10,11,.12)',
            borderRadius: 8,
            padding: '18px 18px 20px',
            alignSelf: 'start',
          }}
        >
          <div style={{ ...labelStyle, color: '#888780', marginBottom: 12 }}>
            lineage rail
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {proof.lineageRail.map((line) => (
              <div
                key={line}
                style={{
                  fontFamily: TYPE.mono,
                  fontSize: 11.2,
                  lineHeight: 1.5,
                  color: '#2c2c2a',
                  borderTop: '1px solid rgba(10,10,11,.08)',
                  paddingTop: 12,
                }}
              >
                {line}
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}

const summaryStyle: CSSProperties = {
  padding: '15px 22px',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 800,
  color: '#0a0a0b',
};

const proofGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
  gap: 0,
  padding: '0 22px 18px',
};

const proofItemStyle: CSSProperties = {
  borderTop: '1px solid rgba(10,10,11,.08)',
  padding: '14px 14px 14px 0',
  fontSize: 12.5,
};

const proofCellStyle: CSSProperties = {
  padding: '10px 10px 10px 0',
  borderTop: '1px solid rgba(10,10,11,.08)',
  fontSize: 12,
  color: '#2c2c2a',
  verticalAlign: 'top',
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: '1px solid rgba(10,10,11,.1)',
        borderRadius: 6,
        padding: '10px 12px',
      }}
    >
      <div style={{ ...labelStyle, color: '#888780', fontSize: 9 }}>
        {label}
      </div>
      <div style={{ fontFamily: TYPE.mono, fontSize: 17, fontWeight: 800, marginTop: 5 }}>
        {value}
      </div>
    </div>
  );
}
