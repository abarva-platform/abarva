import type { ReactNode } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { DEFAULT_AGENT_CARDS, type AgentCardModel, type AgentChoiceModel } from '@/lib/admin/admin-shell-config';

export interface AgentRailProps {
  primaryAgentLabel: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  agents?: ReadonlyArray<AgentCardModel>;
  choices?: ReadonlyArray<AgentChoiceModel>;
}

const POSTURE_COLOR: Record<string, { fg: string; bg: string }> = {
  BLOCKED: { fg: COLORS.coralInk, bg: COLORS.coralSoft },
  PARTIAL: { fg: COLORS.amberInk, bg: COLORS.amberSoft },
  THIN: { fg: COLORS.amberInk, bg: COLORS.amberSoft },
  READY: { fg: COLORS.mintInk, bg: COLORS.mintSoft },
};

export function AgentRail({
  primaryAgentLabel,
  primaryActionLabel,
  primaryActionHref,
  agents = DEFAULT_AGENT_CARDS,
  choices = [],
}: AgentRailProps): ReactNode {
  return (
    <aside
      style={{
        width: '320px',
        padding: SPACING.lg,
        background: COLORS.cream,
        borderLeft: `1px solid ${COLORS.ink}10`,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.lg,
      }}
    >
      <div
        style={{
          padding: SPACING.md,
          borderRadius: RADIUS.lg,
          background: COLORS.ink,
          color: COLORS.cream,
          fontFamily: TYPOGRAPHY.sans,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600 }}>Primary agent · {primaryAgentLabel}</div>
        <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>Context-first · not chatbot-first</div>
      </div>

      <a
        href={primaryActionHref}
        style={{
          display: 'block',
          padding: `${SPACING.md} ${SPACING.lg}`,
          background: COLORS.navy,
          color: COLORS.cream,
          borderRadius: RADIUS.md,
          fontFamily: TYPOGRAPHY.sans,
          fontWeight: 600,
          fontSize: 14,
          textDecoration: 'none',
          textAlign: 'center',
        }}
      >
        {primaryActionLabel}
      </a>

      <section>
        <h3
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 18,
            color: COLORS.ink,
            margin: 0,
            marginBottom: SPACING.sm,
          }}
        >
          Agent Rail
        </h3>
        <p style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 12, color: `${COLORS.ink}80`, lineHeight: 1.5, marginTop: 0 }}>
          Context-first agent guidance. Agents show the object, stage, evidence state, blockers, and next action.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm, marginTop: SPACING.md }}>
          {agents.map((a) => {
            const posture = POSTURE_COLOR[a.posture] ?? POSTURE_COLOR.THIN;
            return (
              <div
                key={a.id}
                style={{
                  padding: SPACING.md,
                  borderRadius: RADIUS.md,
                  background: COLORS.white,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  fontFamily: TYPOGRAPHY.sans,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: COLORS.ink }}>{a.label}</div>
                  <div style={{ fontSize: 11, color: `${COLORS.ink}80`, marginTop: 2 }}>{a.governs}</div>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: RADIUS.pill,
                    background: posture.bg,
                    color: posture.fg,
                  }}
                >
                  {a.posture}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {choices.length > 0 ? (
        <section>
          <h4 style={{ fontFamily: TYPOGRAPHY.serif, fontSize: 15, color: COLORS.ink, margin: 0 }}>
            {choices.length} choices + custom
          </h4>
          <p style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 11, color: `${COLORS.ink}80`, marginTop: 4, lineHeight: 1.4 }}>
            Only appears when it moves work forward. Never filler.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: SPACING.sm }}>
            {choices.map((c) => (
              <a
                key={c.id}
                href={c.href}
                style={{
                  display: 'block',
                  padding: '6px 12px',
                  borderRadius: RADIUS.pill,
                  border: `1px solid ${COLORS.ink}20`,
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: COLORS.ink,
                  textDecoration: 'none',
                }}
              >
                {c.label}
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </aside>
  );
}
