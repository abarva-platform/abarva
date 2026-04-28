'use client';

import { useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { StageTrackerStrip } from '@/components/shell/StageTrackerStrip';
import { LinkedProgramChip } from '@/components/shell/LinkedProgramChip';
import { SentinelAgentColumn } from '@/components/source/SentinelAgentColumn';
import { SHELL } from '@/lib/shell/shell-tokens';
import { SOURCE_INDEX_VIEW, AMS_SOURCE_EVENT } from '@/lib/source/shell-source-fixture';

// ─── Types ────────────────────────────────────────────────────────────────────

type VendorKey = 'A' | 'B' | 'C';
type ResponseType = 'full' | 'pricing' | 'technical' | 'withdrawal';
type Soc2Status = 'submitted' | 'pending';

interface VendorResponseModalProps {
  onClose: () => void;
}

// ─── VendorResponseModal ──────────────────────────────────────────────────────

function VendorResponseModal({ onClose }: VendorResponseModalProps) {
  const [vendor, setVendor] = useState<VendorKey | null>(null);
  const [responseType, setResponseType] = useState<ResponseType | null>(null);
  const [price, setPrice] = useState('');
  const [priceUnit, setPriceUnit] = useState('');
  const [keyTerms, setKeyTerms] = useState('');
  const [soc2, setSoc2] = useState<Soc2Status | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const vendors: { key: VendorKey; label: string }[] = [
    { key: 'A', label: 'Vendor A · TechCorp' },
    { key: 'B', label: 'Vendor B · DataStream' },
    { key: 'C', label: 'Vendor C · CloudBase' },
  ];

  const responseTypes: { key: ResponseType; label: string }[] = [
    { key: 'full', label: 'Full BAFO response' },
    { key: 'pricing', label: 'Pricing only' },
    { key: 'technical', label: 'Technical clarification' },
    { key: 'withdrawal', label: 'Withdrawal' },
  ];

  const vendorName = vendor === 'A' ? 'Vendor A · TechCorp'
    : vendor === 'B' ? 'Vendor B · DataStream'
    : vendor === 'C' ? 'Vendor C · CloudBase'
    : '';

  const isWithdrawal = responseType === 'withdrawal';
  const isVendorB = vendor === 'B';
  const canSubmit = vendor !== null && responseType !== null;

  function handleSubmit() {
    if (!canSubmit) return;
    console.log('BAFO response recorded', { vendor, responseType, price, priceUnit, keyTerms, soc2 });
    setSubmitted(true);
    setTimeout(() => onClose(), 1500);
  }

  // Pill button style helpers
  function pillStyle(selected: boolean): React.CSSProperties {
    return {
      fontFamily: SHELL.SANS,
      fontSize: 12,
      color: selected ? SHELL.CARD_WHITE : SHELL.INK_SOFT,
      background: selected ? SHELL.INK : SHELL.CARD_WHITE,
      border: `1px solid ${selected ? SHELL.INK : SHELL.CARD_LINE}`,
      borderRadius: 5,
      padding: '5px 12px',
      cursor: 'pointer',
      transition: 'all 0.1s',
      whiteSpace: 'nowrap' as const,
    };
  }

  function labelStyle(): React.CSSProperties {
    return {
      fontFamily: SHELL.MONO,
      fontSize: 9,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.14em',
      color: SHELL.INK_MUTED,
      marginBottom: 6,
      display: 'block',
    };
  }

  function inputStyle(): React.CSSProperties {
    return {
      fontFamily: SHELL.SANS,
      fontSize: 13,
      color: SHELL.INK,
      background: SHELL.CARD_WHITE,
      border: `1px solid ${SHELL.CARD_LINE}`,
      borderRadius: 5,
      padding: '7px 10px',
      width: '100%',
      boxSizing: 'border-box' as const,
      outline: 'none',
    };
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(12,26,58,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: SHELL.PAPER,
          border: `1px solid ${SHELL.CARD_LINE}`,
          borderRadius: 10,
          maxWidth: 540,
          width: '100%',
          padding: '24px 28px',
          boxShadow: '0 8px 32px rgba(12,26,58,0.18)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED, letterSpacing: '0.14em', marginBottom: 4 }}>
            BAFO RESPONSE
          </div>
          <div style={{ fontFamily: SHELL.SERIF, fontSize: 20, color: SHELL.INK, fontWeight: 400, lineHeight: 1.2 }}>
            Record vendor response
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: SHELL.CARD_LINE, marginBottom: 20 }} />

        {/* Field: Vendor */}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle()}>VENDOR</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {vendors.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setVendor(key)}
                style={pillStyle(vendor === key)}
              >
                {label}
                {key === 'B' && vendor === 'B' && (
                  <span style={{ marginLeft: 5, color: SHELL.PEACH_TEXT }}>⚠</span>
                )}
              </button>
            ))}
          </div>
          {isVendorB && (
            <div
              style={{
                marginTop: 8,
                background: `${SHELL.PEACH_BG}`,
                border: `1px solid ${SHELL.PEACH_LINE}`,
                borderRadius: 5,
                padding: '7px 10px',
                fontFamily: SHELL.SANS,
                fontSize: 11,
                color: SHELL.PEACH_TEXT,
              }}
            >
              ⚠ Vendor B has an open SOC-2 attestation gap — steward flag active
            </div>
          )}
        </div>

        {/* Field: Response type */}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle()}>RESPONSE TYPE</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {responseTypes.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setResponseType(key)}
                style={pillStyle(responseType === key)}
              >
                {label}
              </button>
            ))}
          </div>
          {isWithdrawal && vendor && (
            <div
              style={{
                marginTop: 8,
                background: SHELL.PEACH_BG,
                border: `1px solid ${SHELL.PEACH_LINE}`,
                borderRadius: 5,
                padding: '7px 10px',
                fontFamily: SHELL.SANS,
                fontSize: 11,
                color: SHELL.PEACH_TEXT,
              }}
            >
              Marking {vendorName} as withdrawn from BAFO. This cannot be undone.
            </div>
          )}
        </div>

        {/* Field: Price summary (hide if withdrawal) */}
        {!isWithdrawal && (
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle()}>HEADLINE PRICE</label>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  placeholder="e.g. $1.2M"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  style={inputStyle()}
                />
              </div>
              <div style={{ flex: 2 }}>
                <input
                  type="text"
                  placeholder="e.g. per year · 3-year contract"
                  value={priceUnit}
                  onChange={(e) => setPriceUnit(e.target.value)}
                  style={inputStyle()}
                />
              </div>
            </div>
          </div>
        )}

        {/* Field: Key terms */}
        {!isWithdrawal && (
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle()}>KEY TERMS SUMMARY (optional)</label>
            <textarea
              rows={3}
              placeholder="Summarise key commercial terms, SLAs, exclusions..."
              value={keyTerms}
              onChange={(e) => setKeyTerms(e.target.value)}
              style={{
                ...inputStyle(),
                resize: 'vertical',
                lineHeight: 1.5,
              }}
            />
          </div>
        )}

        {/* Field: SOC-2 status (Vendor B only) */}
        {isVendorB && (
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle()}>SOC-2 STATUS</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setSoc2('submitted')}
                style={pillStyle(soc2 === 'submitted')}
              >
                Report submitted ✓
              </button>
              <button
                onClick={() => setSoc2('pending')}
                style={pillStyle(soc2 === 'pending')}
              >
                Still pending
              </button>
            </div>
            {soc2 === 'submitted' && (
              <div
                style={{
                  marginTop: 8,
                  background: SHELL.MINT_BG,
                  border: `1px solid ${SHELL.MINT_LINE}`,
                  borderRadius: 5,
                  padding: '7px 10px',
                  fontFamily: SHELL.SANS,
                  fontSize: 11,
                  color: SHELL.MINT_TEXT,
                }}
              >
                SOC-2 gap resolved — Vendor B evaluation can proceed
              </div>
            )}
          </div>
        )}

        {/* Nexus parsing note */}
        <div
          style={{
            background: SHELL.PAPER_SOFT,
            borderRadius: 6,
            padding: '10px 14px',
            marginBottom: 22,
          }}
        >
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 8,
              color: SHELL.INK_MUTED,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginRight: 8,
            }}
          >
            NEXUS
          </span>
          <span
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 11,
              color: SHELL.INK_MUTED,
            }}
          >
            Nexus will extract scoring signals from this response and update the vendor comparison matrix.
          </span>
        </div>

        {/* Success message */}
        {submitted && (
          <div
            style={{
              marginBottom: 16,
              fontFamily: SHELL.MONO,
              fontSize: 11,
              color: SHELL.MINT_TEXT,
              letterSpacing: '0.04em',
            }}
          >
            ✓ {vendorName} response recorded · Nexus will process and update rankings
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 11,
              color: SHELL.INK_SOFT,
              background: 'none',
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 5,
              padding: '8px 18px',
              cursor: 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitted}
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 11,
              color: (!canSubmit || submitted) ? SHELL.INK_MUTED : SHELL.CARD_WHITE,
              background: (!canSubmit || submitted) ? SHELL.GRAY_BG : SHELL.INK,
              border: `1px solid ${(!canSubmit || submitted) ? SHELL.GRAY_LINE : SHELL.INK}`,
              borderRadius: 5,
              padding: '8px 18px',
              cursor: (!canSubmit || submitted) ? 'default' : 'pointer',
              letterSpacing: '0.04em',
              transition: 'all 0.1s',
            }}
          >
            Submit response
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SourceEmptyState ─────────────────────────────────────────────────────────

function SourceEmptyState() {
  return (
    <AppShell
      surface="source"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Source · No active events',
      }}
    >
      <AgentColumn
        agent={{ initials: 'St', name: 'Steward', role: 'Source Coordinator' }}
        quote="No source events have been created for this tenant yet. Source events track structured procurement and vendor activity — from initial planning through award and onboarding."
        agentContext="Steward · Source · No events · Apr 27 2026"
        actions={[
          { letter: 'A', text: 'Originate a source event', detail: 'Start a new vendor consolidation or procurement exercise' },
          { letter: 'B', text: 'Browse event templates', detail: 'Pre-configured event structures for common source types' },
          { letter: 'C', text: 'Import from prior system', detail: 'Link existing procurement records from ServiceNow or SAP' },
        ]}
        surface="source"
      />
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: SHELL.PAPER,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 48px',
        }}
      >
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: SHELL.INK_MUTED,
            marginBottom: 12,
          }}
        >
          Source
        </div>
        <h2
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 24,
            fontWeight: 700,
            color: SHELL.INK,
            margin: '0 0 12px',
            textAlign: 'center',
          }}
        >
          No source events yet
        </h2>
        <p
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 14,
            color: SHELL.INK_MUTED,
            margin: '0 0 28px',
            textAlign: 'center',
            maxWidth: 400,
            lineHeight: 1.6,
          }}
        >
          Source events track vendor consolidation, RFP processes, and procurement exercises from plan through award.
        </p>
        <a
          href="/source/new"
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: SHELL.PAPER,
            background: SHELL.INK,
            padding: '10px 20px',
            borderRadius: 6,
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          + Originate source event
        </a>
      </div>
    </AppShell>
  );
}

// ─── SourceIndexPage ──────────────────────────────────────────────────────────

export function SourceIndexPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isDemoEmpty = searchParams?.get('demo') === 'empty';
  const [showVendorResponse, setShowVendorResponse] = useState(false);
  const firstEventRowRef = useRef<HTMLDivElement>(null);

  if (isDemoEmpty) return <SourceEmptyState />;

  return (
    <AppShell
      surface="source"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Source · AMS Vendor Consolidation 2026 · BAFO',
      }}
      middleStrip={
        <StageTrackerStrip
          stages={AMS_SOURCE_EVENT.stages}
          activeStage={AMS_SOURCE_EVENT.activeStage}
        />
      }
    >
      <SentinelAgentColumn
        quote={SOURCE_INDEX_VIEW.agentQuote}
        agentContext={SOURCE_INDEX_VIEW.agentContext}
        actions={SOURCE_INDEX_VIEW.actions}
        onActionClick={(letter) => {
          if (letter === 'A') {
            firstEventRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else if (letter === 'B') {
            router.push('/source/events/apex-retail-ams-outsourcing-2026');
          } else if (letter === 'C') {
            firstEventRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }}
      />

      {/* Work pane */}
      <div style={{ flex: 1, overflowY: 'auto', background: SHELL.PAPER, padding: '24px 32px' }}>

        {/* Event header section */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: SHELL.INK_MUTED,
              marginBottom: 6,
            }}
          >
            {AMS_SOURCE_EVENT.displayId} · ACTIVE EVENT
          </div>
          <h1
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 22,
              fontWeight: 700,
              color: SHELL.INK,
              margin: '0 0 8px 0',
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
            }}
          >
            <Link
              href={`/source/${AMS_SOURCE_EVENT.id}`}
              style={{ color: 'inherit', textDecoration: 'none' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none'; }}
            >
              {AMS_SOURCE_EVENT.name}
            </Link>
          </h1>
          <p
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.INK_SOFT,
              margin: '0 0 8px 0',
              lineHeight: 1.5,
            }}
          >
            {AMS_SOURCE_EVENT.description}
          </p>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: SHELL.INK_MUTED,
              letterSpacing: '0.06em',
            }}
          >
            Stage 7 of 10 · BAFO
          </div>
        </div>

        {/* Linked program chip */}
        <div style={{ marginBottom: 24 }}>
          <LinkedProgramChip
            direction="source-to-program"
            linkedId="APX-CDP-2026"
            linkedName="Apex Retail CDP Activation"
            linkedPhase="P3 Design"
            href="/programs/apx-cdp-2026"
          />
        </div>

        {/* Vendor summary */}
        <div ref={firstEventRowRef} style={{ marginBottom: 24 }}>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: SHELL.INK_MUTED,
              marginBottom: 8,
            }}
          >
            BAFO · 3 VENDORS SUBMITTED
          </div>

          {/* Vendor A */}
          <div
            style={{
              height: 40,
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.INK,
              borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
            }}
          >
            Vendor A — pricing $2.1M/yr · normalized baseline
          </div>

          {/* Vendor B — SOC-2 gap flagged, peach tint */}
          <div
            style={{
              height: 40,
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.INK,
              background: `${SHELL.PEACH_BG}4d`,
              borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
            }}
          >
            Vendor B — pricing $2.3M/yr · SOC-2 gap flagged
          </div>

          {/* Vendor C — 14% below median, mint tint */}
          <div
            style={{
              height: 40,
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.INK,
              background: `${SHELL.MINT_BG}4d`,
              borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
            }}
          >
            Vendor C — pricing $1.8M/yr · 14% below median
          </div>

          {/* Record BAFO response trigger */}
          <button
            onClick={() => setShowVendorResponse(true)}
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: SHELL.INK_SOFT,
              background: 'none',
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 5,
              padding: '5px 12px',
              cursor: 'pointer',
              marginTop: 12,
            }}
          >
            + Record BAFO response
          </button>
        </div>

        {/* Program impact cross-link */}
        <div style={{ marginBottom: 24 }}>
          <p
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.INK_SOFT,
              margin: '0 0 10px 0',
              lineHeight: 1.55,
              maxWidth: 640,
            }}
          >
            This sourcing event directly affects P3 Design scope for APX-CDP-2026. Vendor architecture
            decisions must be aligned before the Design gate clears.
          </p>
          <LinkedProgramChip
            direction="source-to-program"
            linkedId="APX-CDP-2026"
            linkedName="Apex Retail CDP Activation"
            linkedPhase="P3 Design"
            href="/programs/apx-cdp-2026"
          />
        </div>

        {/* Risk flag */}
        <div
          style={{
            marginBottom: 24,
            background: `${SHELL.PEACH_BG}66`,
            borderLeft: `3px solid ${SHELL.PEACH_LINE}`,
            padding: '10px 14px',
          }}
        >
          <span
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.PEACH_TEXT,
            }}
          >
            ⚠ Steward flag: Vendor B SOC-2 Type II attestation gap · must resolve before Award stage
          </span>
        </div>

        {/* Action queue placeholder */}
        <div
          style={{
            background: SHELL.GRAY_BG,
            border: `1px solid ${SHELL.CARD_LINE}`,
            borderRadius: 8,
            padding: 16,
          }}
        >
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: SHELL.INK_MUTED,
              fontStyle: 'italic',
            }}
          >
            Source action queue — cross-vendor next moves · P15
          </span>
        </div>

        {/* Originate new event link */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${SHELL.CARD_LINE}` }}>
          <a href="/source/new" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: SHELL.MONO, fontSize: 11, color: SHELL.INK_SOFT, textDecoration: 'none',
          }}>
            <span>+</span>
            <span>Originate new source event</span>
          </a>
        </div>

      </div>

      {/* VendorResponseModal */}
      {showVendorResponse && (
        <VendorResponseModal onClose={() => setShowVendorResponse(false)} />
      )}
    </AppShell>
  );
}
