// Wave 1 PR-3 (2026-05-30) · This component used to render its own AppShell +
// SubNavStrip. Per SETUP_AUDIT_2026-05-30_VERDICT §5.3, the canonical Setup
// surface uses AdminCanonShellV2 + AdminSidebar — the legacy 5-tab
// SUB_NAV_ITEMS pattern is dead. This file now exports the *content only*;
// /admin/connectors/[connectorId]/reconnect/page.tsx wraps it.
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { ConnectorDetail } from '@/lib/setup/shell-setup-fixture';

interface ConnectorReconnectPageProps {
  detail: ConnectorDetail;
}

export function ConnectorReconnectPage({ detail }: ConnectorReconnectPageProps) {
  const [authorized, setAuthorized] = useState(false);
  const reconnectProfile = detail.reconnectProfile;
  const modeLabel = detail.dataMode === 'seeded' ? 'Seeded fixture' : 'Live signal';

  if (!reconnectProfile) {
    return null;
  }

  return (
    <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: SHELL.PAPER,
          padding: '40px 60px',
        }}
      >
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ marginBottom: 22 }}>
            <Link
              href={`/admin/connectors/${detail.id}`}
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 11,
                color: SHELL.INK_SOFT,
                textDecoration: 'none',
                letterSpacing: '0.04em',
              }}
            >
              ← {detail.name} detail
            </Link>
          </div>

          <h1
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 24,
              fontWeight: 700,
              color: SHELL.INK,
              margin: '0 0 8px 0',
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
            }}
          >
            Reconnect {detail.name}
          </h1>
          <p
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 14,
              color: SHELL.INK_SOFT,
              margin: '0 0 28px 0',
              lineHeight: 1.5,
            }}
          >
            {reconnectProfile.summary} · {reconnectProfile.estimate.toLowerCase()}
          </p>

          <div style={{ marginBottom: 0 }}>
            {reconnectProfile.steps.map((step, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: '12px 0',
                  borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: SHELL.PAPER_DEEP,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontFamily: SHELL.MONO,
                      fontSize: 13,
                      fontWeight: 600,
                      color: SHELL.INK,
                      lineHeight: 1,
                    }}
                  >
                    {idx + 1}
                  </span>
                </div>

                <span
                  style={{
                    fontFamily: SHELL.SANS,
                    fontSize: 14,
                    color: SHELL.INK,
                    lineHeight: 1.5,
                    paddingTop: 5,
                  }}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              background: SHELL.PAPER_SOFT,
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 8,
              padding: '16px 20px',
              marginTop: 24,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 13,
                color: SHELL.INK,
                marginBottom: 6,
                lineHeight: 1.4,
              }}
            >
              Authorizing as Apex Retail Group admin
            </div>
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                color: SHELL.INK_MUTED,
                lineHeight: 1.3,
              }}
            >
              Canonical return: /admin/connectors/{detail.id} · {detail.endpoint}
            </div>
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                color: SHELL.INK_MUTED,
                lineHeight: 1.3,
                marginTop: 6,
              }}
            >
              Mode: {modeLabel} · no live API call is made from this setup surface
            </div>
          </div>

          {!authorized ? (
            <button
              type="button"
              onClick={() => setAuthorized(true)}
              style={{
                display: 'block',
                width: '100%',
                fontFamily: SHELL.MONO,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: SHELL.PAPER,
                background: SHELL.INK,
                border: 'none',
                borderRadius: 8,
                padding: '14px 24px',
                cursor: 'pointer',
                textAlign: 'center',
                lineHeight: 1,
              }}
            >
              {reconnectProfile.callToAction} {'->'}
            </button>
          ) : (
            <div>
              <div
                style={{
                  background: SHELL.MINT_BG,
                  border: `1px solid ${SHELL.MINT_LINE}`,
                  borderRadius: 8,
                  padding: '16px 20px',
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontFamily: SHELL.SANS,
                    fontSize: 14,
                    color: SHELL.MINT_TEXT,
                    lineHeight: 1.5,
                  }}
                >
                  {reconnectProfile.successMessage}
                </span>
              </div>
              <div>
                <Link
                  href={`/admin/connectors/${detail.id}`}
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 10,
                    color: SHELL.INK_SOFT,
                    textDecoration: 'none',
                    letterSpacing: '0.08em',
                  }}
                >
                  {'->'} Return to connector detail
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
