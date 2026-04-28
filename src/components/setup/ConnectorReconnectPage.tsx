'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { SubNavStrip } from '@/components/shell/SubNavStrip';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { ConnectorDetail } from '@/lib/setup/shell-setup-fixture';

const SUB_NAV_ITEMS = [
  { key: 'connectors', label: 'Connectors', active: true, href: '/admin/connectors' },
  { key: 'users', label: 'Users', href: '/admin/users' },
  { key: 'audit', label: 'Audit log', href: '/admin/audit' },
  { key: 'policies', label: 'Policies', href: '/admin/policies' },
  { key: 'architecture', label: 'Architecture', href: '/admin/architecture' },
];

interface ConnectorReconnectPageProps {
  detail: ConnectorDetail;
}

export function ConnectorReconnectPage({ detail }: ConnectorReconnectPageProps) {
  const [authorized, setAuthorized] = useState(false);

  return (
    <AppShell
      surface="setup"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: `Setup · ${detail.name} · Reconnect`,
      }}
      middleStrip={<SubNavStrip items={SUB_NAV_ITEMS} />}
    >
      <AgentColumn
        agent={{ initials: 'St', name: 'Steward', role: 'Auth Governor' }}
        quote={`Reconnect flow for ${detail.name}. Current state: ${detail.status}. Re-authorize first, then confirm queued data flows resume from ${detail.lastSuccessfulSync ?? detail.lastSync}.`}
        agentContext="Steward · Setup · reconnect auth flow"
        actions={[
          { letter: 'A', text: `Authorize ${detail.name}`, detail: 'Open the consent path and refresh the token' },
          { letter: 'B', text: 'Review queued flows', detail: 'Confirm inbound and outbound sync scope before reconnecting' },
          { letter: 'C', text: 'Return to connector detail', detail: 'Verify health once re-auth completes' },
        ]}
        surface="setup"
      />

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: SHELL.PAPER,
          padding: '40px 60px',
        }}
      >
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          {/* Back link */}
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

          {/* Header */}
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
              OAuth re-authorization on the canonical route · estimated 60 seconds
            </p>

          {/* Steps list */}
          <div style={{ marginBottom: 0 }}>
            {detail.reconnectSteps.map((step, idx) => (
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
                {/* Number circle */}
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

                {/* Step text */}
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

          {/* Auth info box */}
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
          </div>

          {/* CTA or success state */}
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
              Authorize {detail.name} →
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
                  ✓ ServiceNow reconnected — sync will resume within 60 seconds.
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
                  → Return to connector detail
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
