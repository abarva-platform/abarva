/**
 * SetupAgentStrip · SETUP-1.3 (agent-anchored reshape)
 *
 * The agent-anchored header strip on /admin. Foregrounds the four
 * agents (Sentinel, Atlas, Nexus, Steward) — each with a live
 * one-liner state + "Open" CTA that goes to that agent's detail
 * surface.
 *
 * Per `feedback_agent_anchored_setup.md`: the page is about what
 * the agents reason — substrate is the drill-down, not the
 * headline.
 *
 * Three corpora that Sentinel cites across (today and projected):
 *   • worldview — AbarVa strategic theses (W1-W5; in production
 *     by Codex; ~80 chunks expected)
 *   • industry — vertical-specific patterns (152+ today, growing)
 *   • tenant — your loaded records (403 for Apex today)
 */

import Link from 'next/link';

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

export interface SetupAgentStripProps {
  tenantDisplayName: string;
  /** Total tenant records loaded (live or null for sparse tenants). */
  tenantRecords: number | null;
  /** Cross-program signals count — Atlas's substrate. */
  atlasSignalCount: number;
  /** High-severity cross-program signals (Atlas). */
  atlasHighSeverityCount: number;
  /** Active program count — Nexus's substrate. */
  nexusProgramCount: number;
  /** Compliance findings count — Steward's substrate. */
  stewardFindingCount: number;
  /** Capabilities grounded today (for Sentinel). */
  capabilitiesGrounded: number;
}

interface AgentSummary {
  agentName: 'Sentinel' | 'Atlas' | 'Nexus' | 'Steward';
  role: string;
  state: string;
  href: string;
  ctaLabel: string;
  testid: string;
}

function buildAgents(props: SetupAgentStripProps): AgentSummary[] {
  const recordsPhrase =
    props.tenantRecords === null
      ? 'tenant data not yet loaded'
      : `${props.tenantRecords.toLocaleString()} tenant records`;
  return [
    {
      agentName: 'Sentinel',
      role: 'Librarian · cites across corpora',
      state: `Grounding ${props.capabilitiesGrounded} of 4 capability families today · citing ${recordsPhrase}`,
      href: '/intelligence/ask',
      ctaLabel: 'Ask Sentinel',
      testid: 'admin-agent-card-sentinel',
    },
    {
      agentName: 'Atlas',
      role: 'Cross-program reasoning',
      state:
        props.atlasSignalCount > 0
          ? `${props.atlasSignalCount} signals tracked · ${props.atlasHighSeverityCount} HIGH severity open`
          : 'No cross-program signals yet · needs ≥2 active programs',
      href: '/admin/agents/atlas',
      ctaLabel: 'Open Atlas',
      testid: 'admin-agent-card-atlas',
    },
    {
      agentName: 'Nexus',
      role: 'Program lifecycle reasoning',
      state:
        props.nexusProgramCount > 0
          ? `${props.nexusProgramCount} active programs · pattern-matched to corpus archetypes`
          : 'No active programs in inventory',
      href: '/programs',
      ctaLabel: 'Open Nexus',
      testid: 'admin-agent-card-nexus',
    },
    {
      agentName: 'Steward',
      role: 'Governance + compliance',
      state:
        props.stewardFindingCount > 0
          ? `${props.stewardFindingCount} compliance findings tracked`
          : 'No compliance findings on file',
      href: '/admin/policies',
      ctaLabel: 'Open Steward',
      testid: 'admin-agent-card-steward',
    },
  ];
}

export function SetupAgentStrip(props: SetupAgentStripProps) {
  const agents = buildAgents(props);
  return (
    <section
      data-testid="admin-agent-strip"
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}11`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: SPACING.md,
          flexWrap: 'wrap',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 22,
            color: COLORS.ink,
            fontWeight: 700,
            lineHeight: 1.3,
          }}
        >
          The four agents reasoning across {props.tenantDisplayName}
        </h2>
        <p
          style={{
            margin: 0,
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}99`,
          }}
        >
          Citing across worldview · industry · tenant corpora
        </p>
      </div>
      <ul
        role="list"
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: SPACING.md,
        }}
      >
        {agents.map((a) => (
          <AgentCard key={a.agentName} agent={a} />
        ))}
      </ul>
    </section>
  );
}

function AgentCard({ agent }: { agent: AgentSummary }) {
  return (
    <li role="listitem" data-testid={agent.testid}>
      <div
        style={{
          background: COLORS.cream,
          border: `1px solid ${COLORS.ink}11`,
          borderRadius: RADIUS.md,
          padding: SPACING.md,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.xs,
          height: '100%',
          minHeight: '160px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: SPACING.sm }}>
          <p
            style={{
              margin: 0,
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 18,
              color: COLORS.ink,
              fontWeight: 700,
            }}
          >
            {agent.agentName}
          </p>
          <p
            style={{
              margin: 0,
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 10,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: COLORS.navy,
              fontWeight: 700,
            }}
          >
            {agent.role}
          </p>
        </div>
        <p
          style={{
            margin: 0,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: `${COLORS.ink}cc`,
            lineHeight: 1.5,
            flex: 1,
          }}
        >
          {agent.state}
        </p>
        <Link
          href={agent.href}
          data-testid={`${agent.testid}-cta`}
          style={{
            color: COLORS.navy,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            fontWeight: 600,
            textDecoration: 'none',
            border: `1px solid ${COLORS.navy}55`,
            borderRadius: RADIUS.pill,
            padding: `4px ${SPACING.md}`,
            alignSelf: 'flex-start',
            marginTop: SPACING.xs,
          }}
        >
          {agent.ctaLabel} →
        </Link>
      </div>
    </li>
  );
}
