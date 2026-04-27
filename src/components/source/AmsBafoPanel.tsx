// SRC37 — AMS BAFO Panel
// Displays the BAFO round status: invited vendors, excluded vendors,
// selection committee, and next steps.
// Design canon: #F8F7F4 bg, Georgia headers, DM Sans body, navy accent.
// No teal, no sparkles, no fabricated dollar amounts.

import React from 'react';
import type { BafoRound, BafoVendorResponseStatus } from '@/lib/source/ams-bafo-view';

interface AmsBafoPanelProps {
  round: BafoRound;
}

const RESPONSE_STATUS_STYLE: Record<BafoVendorResponseStatus, { bg: string; text: string }> = {
  invited:      { bg: '#EFF6FF', text: '#1D4ED8' },
  submitted:    { bg: '#F0FDF4', text: '#15803D' },
  under_review: { bg: '#FFF7ED', text: '#C2410C' },
  accepted:     { bg: '#F0FDF4', text: '#15803D' },
  declined:     { bg: '#FEF2F2', text: '#991B1B' },
};

export function AmsBafoPanel({ round }: AmsBafoPanelProps) {
  return (
    <div
      data-component="AmsBafoPanel"
      data-round-id={round.roundId}
      style={{ display: 'grid', gap: '20px' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{
            fontFamily: 'Georgia, serif',
            fontWeight: 400,
            fontSize: '15px',
            color: '#0A0C12',
            margin: '0 0 4px 0',
          }}>
            {round.roundLabel}
          </h3>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '12px',
            color: '#525866',
          }}>
            {round.eventName} · Deadline: {round.deadline}
          </div>
        </div>
        <div style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '12px',
          fontWeight: 600,
          color: '#1B2B5C',
          backgroundColor: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: '4px',
          padding: '4px 12px',
        }}>
          {round.statusLabel}
        </div>
      </div>

      {/* Selection committee */}
      <div>
        <div style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '10px',
          fontWeight: 700,
          color: '#525866',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '8px',
        }}>
          Selection Committee
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '8px',
        }}>
          {round.selectionCommittee.map((member) => (
            <div
              key={member.memberId}
              style={{
                backgroundColor: '#F8F7F4',
                border: '1px solid #E8E6E1',
                borderRadius: '4px',
                padding: '10px 12px',
              }}
            >
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                fontWeight: 600,
                color: '#0A0C12',
              }}>
                {member.name}
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '11px',
                color: '#525866',
                marginTop: '2px',
              }}>
                {member.role}
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '10px',
                color: '#706D66',
                marginTop: '2px',
              }}>
                {member.organisation}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invited vendors */}
      <div>
        <div style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '10px',
          fontWeight: 700,
          color: '#525866',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '8px',
        }}>
          Invited to BAFO ({round.invitedVendors.length})
        </div>
        <div style={{ display: 'grid', gap: '12px' }}>
          {round.invitedVendors.map((vendor) => {
            const statusStyle = RESPONSE_STATUS_STYLE[vendor.responseStatus];
            return (
              <div
                key={vendor.vendorId}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E8E6E1',
                  borderLeft: '3px solid #1B2B5C',
                  borderRadius: '6px',
                  padding: '14px 16px',
                  display: 'grid',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{
                      fontFamily: 'Georgia, serif',
                      fontWeight: 400,
                      fontSize: '14px',
                      color: '#0A0C12',
                    }}>
                      {vendor.vendorLabel}
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      color: '#525866',
                      marginTop: '2px',
                    }}>
                      Invited {vendor.inviteDate} · Response due {vendor.responseDeadline}
                    </div>
                  </div>
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: statusStyle.text,
                    backgroundColor: statusStyle.bg,
                    borderRadius: '4px',
                    padding: '2px 8px',
                    whiteSpace: 'nowrap',
                  }}>
                    {vendor.responseStatusLabel}
                  </div>
                </div>

                {/* Negotiation points */}
                <div>
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: '#525866',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '4px',
                  }}>
                    Key negotiation points
                  </div>
                  <ul style={{
                    margin: 0,
                    paddingLeft: '14px',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '12px',
                    color: '#0A0C12',
                    lineHeight: 1.5,
                  }}>
                    {vendor.keyNegotiationPoints.map((point, i) => (
                      <li key={i} style={{ marginBottom: '2px' }}>{point}</li>
                    ))}
                  </ul>
                </div>

                {/* Pricing band */}
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '11px',
                  color: '#525866',
                }}>
                  <span>Pricing band before BAFO: <strong style={{ color: '#0A0C12' }}>{vendor.pricingBandBefore}</strong></span>
                  {vendor.pricingBandAfter && (
                    <span>After BAFO: <strong style={{ color: '#0A0C12' }}>{vendor.pricingBandAfter}</strong></span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Excluded vendors */}
      {round.notInvitedVendors.length > 0 && (
        <div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '10px',
            fontWeight: 700,
            color: '#525866',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '8px',
          }}>
            Not Invited to BAFO ({round.notInvitedVendors.length})
          </div>
          <div style={{ display: 'grid', gap: '8px' }}>
            {round.notInvitedVendors.map((vendor) => (
              <div
                key={vendor.vendorId}
                style={{
                  backgroundColor: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderLeft: '3px solid #9CA3AF',
                  borderRadius: '4px',
                  padding: '10px 14px',
                  display: 'grid',
                  gap: '4px',
                }}
              >
                <div style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#374151',
                }}>
                  {vendor.vendorLabel}
                </div>
                <div style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '12px',
                  color: '#6B7280',
                  lineHeight: 1.4,
                }}>
                  {vendor.exclusionReason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next steps */}
      {round.nextSteps.length > 0 && (
        <div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '10px',
            fontWeight: 700,
            color: '#525866',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '8px',
          }}>
            Next steps
          </div>
          <ol style={{
            margin: 0,
            paddingLeft: '16px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '12px',
            color: '#0A0C12',
            lineHeight: 1.6,
          }}>
            {round.nextSteps.map((step, i) => (
              <li key={i} style={{ marginBottom: '4px' }}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Caveat */}
      <div style={{
        fontFamily: 'DM Sans, sans-serif',
        fontSize: '11px',
        color: '#706D66',
        backgroundColor: '#FBF7F0',
        border: '1px solid #E5DCD2',
        borderRadius: '4px',
        padding: '8px 12px',
        lineHeight: 1.5,
      }}>
        {round.evidenceCaveat}
      </div>
    </div>
  );
}
