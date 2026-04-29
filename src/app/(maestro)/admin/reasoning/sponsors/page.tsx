// /admin/reasoning/sponsors — Sponsor directory.
//
// Server component. Collects all sponsors from SOURCE_EVENT_INSTANCES and
// APEX_RETAIL_PROGRAM_INSTANCES, groups them by sponsor ID (same person may
// sponsor multiple instances), and renders an alphabetical directory with
// instance portfolios.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Sponsor directory · AbarVa Admin',
};

// ─── Data model ───────────────────────────────────────────────────────────────

type InstanceType = 'Source' | 'Program';

interface SponsoredInstance {
  id: string;
  name: string;
  type: InstanceType;
  /** currentStage for source events, phase label for programs */
  stageSummary: string;
}

interface SponsorRecord {
  sponsorId: string;
  sponsorName: string;
  sponsorTitle: string;
  instances: SponsoredInstance[];
}

const PHASE_LABELS = ['Originate', 'Discovery', 'Synthesis', 'Design', 'Build', 'Activate', 'Operate'];

function collectSponsors(): SponsorRecord[] {
  const byId = new Map<string, SponsorRecord>();

  function upsert(
    sponsorId: string,
    sponsorName: string,
    sponsorTitle: string,
    instance: SponsoredInstance,
  ): void {
    if (!byId.has(sponsorId)) {
      byId.set(sponsorId, { sponsorId, sponsorName, sponsorTitle, instances: [] });
    }
    byId.get(sponsorId)!.instances.push(instance);
  }

  // Source event instances
  for (const inst of SOURCE_EVENT_INSTANCES) {
    const { sponsor } = inst;
    upsert(sponsor.id, sponsor.name, sponsor.title, {
      id: inst.id,
      name: inst.name,
      type: 'Source',
      stageSummary: inst.currentStage,
    });
  }

  // Program instances
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const { sponsor } = inst;
    const phaseLabel = PHASE_LABELS[inst.currentPhase] ?? `P${inst.currentPhase}`;
    upsert(sponsor.id, sponsor.name, sponsor.title, {
      id: inst.id,
      name: inst.name,
      type: 'Program',
      stageSummary: `Phase ${inst.currentPhase} · ${phaseLabel}`,
    });
  }

  // Sort alphabetically by sponsor name
  return Array.from(byId.values()).sort((a, b) =>
    a.sponsorName.localeCompare(b.sponsorName),
  );
}

// ─── Components ───────────────────────────────────────────────────────────────

function TypePill({ type }: { type: InstanceType }) {
  const isSource = type === 'Source';
  return (
    <span
      style={{
        display: 'inline-block',
        background: isSource ? COLORS.skyPale : COLORS.mintSoft,
        color: isSource ? COLORS.navy : COLORS.mintInk,
        borderRadius: RADIUS.pill,
        padding: '2px 9px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        flexShrink: 0,
      }}
    >
      {type}
    </span>
  );
}

function InstanceRow({ instance }: { instance: SponsoredInstance }) {
  return (
    <a
      href={`/admin/reasoning/instances/${instance.id}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.sm,
        padding: `${SPACING.xs} 0`,
        textDecoration: 'none',
        color: COLORS.ink,
      }}
    >
      <TypePill type={instance.type} />
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: COLORS.ink,
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {instance.name}
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: `${COLORS.ink}88`,
          flexShrink: 0,
        }}
      >
        {instance.stageSummary}
      </span>
    </a>
  );
}

function SponsorCard({ record }: { record: SponsorRecord }) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      {/* Sponsor header */}
      <div
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}0d`,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: SPACING.md,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 15,
              fontWeight: 700,
              color: COLORS.ink,
              letterSpacing: '-0.01em',
            }}
          >
            {record.sponsorName}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 13,
              fontStyle: 'italic',
              color: `${COLORS.ink}88`,
            }}
          >
            {record.sponsorTitle}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 10,
              color: `${COLORS.ink}66`,
              letterSpacing: '0.03em',
            }}
          >
            {record.sponsorId}
          </span>
        </div>
        <span
          style={{
            background: COLORS.skyPale,
            color: COLORS.navy,
            borderRadius: RADIUS.pill,
            padding: '3px 11px',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.02em',
            flexShrink: 0,
          }}
        >
          {record.instances.length} instance{record.instances.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Instance list */}
      <div
        style={{
          padding: `${SPACING.sm} ${SPACING.lg}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {record.instances.map((inst) => (
          <div
            key={inst.id}
            style={{
              borderBottom: `1px solid ${COLORS.ink}08`,
            }}
          >
            <InstanceRow instance={inst} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryStrip({
  sponsors,
  sourceCount,
  programCount,
}: {
  sponsors: SponsorRecord[];
  sourceCount: number;
  programCount: number;
}) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.lg,
        flexWrap: 'wrap',
      }}
    >
      {[
        { label: 'unique sponsors', value: sponsors.length },
        { label: 'source events', value: sourceCount },
        { label: 'programs', value: programCount },
      ].map(({ label, value }) => (
        <span
          key={label}
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: `${COLORS.ink}99`,
          }}
        >
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 15,
              fontWeight: 700,
              color: COLORS.ink,
              marginRight: 5,
            }}
          >
            {value}
          </span>
          {label}
        </span>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SponsorsPage() {
  const sponsors = collectSponsors();
  const sourceCount = SOURCE_EVENT_INSTANCES.length;
  const programCount = APEX_RETAIL_PROGRAM_INSTANCES.length;

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="All instances"
          primaryActionHref="/admin/reasoning/instances"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Sponsor directory"
        subtitle="All program and source event sponsors with their portfolio responsibilities."
      >
        <SummaryStrip
          sponsors={sponsors}
          sourceCount={sourceCount}
          programCount={programCount}
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))',
            gap: SPACING.md,
          }}
        >
          {sponsors.map((record) => (
            <SponsorCard key={record.sponsorId} record={record} />
          ))}
        </div>
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
