import { notFound } from 'next/navigation';
import { PageShell } from '@/components/shared/layout/PageShell';
import { Body } from '@/components/shared/typography/Body';
import { EyebrowLabel } from '@/components/shared/typography/EyebrowLabel';
import { MetaLabel } from '@/components/shared/typography/MetaLabel';
import { PageTitle } from '@/components/shared/typography/PageTitle';
import { SectionHeading } from '@/components/shared/typography/SectionHeading';
import { EntityLink } from '@/components/shared/entities/EntityLink';
import { ExecutiveCard } from '@/components/shared/entities/ExecutiveCard';
import { getActiveClientRow } from '@/lib/active-client';
import { getPersonById } from '@/lib/db/person';
import {
  loadExecutiveProfileDetail,
  type ExecutiveCareerEntry,
  type ExecutiveInteractionLogEntry,
  type ExecutiveProfileDetail,
  type ExecutiveProfileRelationship,
  type ExecutivePublicStatementEntry,
} from '@/lib/executive-profiles/loadExecutiveProfile';
import { getPendingRealWorldExecutiveProfile } from '@/lib/executive-profiles/pendingRealWorldProfiles';

export const dynamic = 'force-dynamic';

const PANEL = 'rgba(255,255,255,0.03)';
const BORDER = '0.5px solid rgba(255,255,255,0.08)';
const MUTED = 'rgba(245,245,240,0.72)';
const TEAL = '#14B8A6';

type KeyValue = Record<string, unknown>;

export default async function PersonProfilePage({
  params,
}: {
  params: Promise<{ personId: string }>;
}) {
  const { personId } = await params;

  const [activeClient, profile, person] = await Promise.all([
    getActiveClientRow(),
    loadExecutiveProfileDetail({ personId }),
    getPersonById(personId).catch(() => null),
  ]);

  const pendingRealWorld = getPendingRealWorldExecutiveProfile(personId);

  if (!profile && !person && !pendingRealWorld) notFound();

  if (pendingRealWorld || (profile && isRealWorldProfile(profile))) {
    const displayName = pendingRealWorld?.fullName ?? profile?.full_name ?? 'Executive profile';
    return (
      <PageShell width="narrow" padding="comfortable">
        <EthicsGateCard displayName={displayName} />
      </PageShell>
    );
  }

  if (!profile) {
    return (
      <PageShell width="narrow" padding="comfortable">
        <ProfilePendingCard
          displayName={person?.name ?? 'This stakeholder'}
          title={person?.communication_style?.title as string | undefined}
          organization={person?.organization ?? null}
        />
      </PageShell>
    );
  }

  if (profile.profile_type === 'composite_tenant' && activeClient?.id && profile.client_id && profile.client_id !== activeClient.id) {
    return (
      <PageShell width="narrow" padding="comfortable">
        <TenantScopeCard displayName={profile.preferred_name ?? profile.full_name} clientName={activeClient.name} />
      </PageShell>
    );
  }

  const displayName = profile.preferred_name ?? profile.full_name;
  const reportsTo = optionalString(profile.reporting_structure?.reports_to);
  const directReports = optionalNumber(profile.reporting_structure?.direct_reports_count);
  const orgScope = optionalString(profile.reporting_structure?.organizational_scope);
  const tenureLabel = formatTenureLabel(profile.current_tenure_start);
  const styleCards = buildObservedCards(profile.communication_style, [
    ['preferred_modality', 'Preferred modality'],
    ['information_density', 'Information density'],
    ['evidence_preference', 'Evidence preference'],
    ['decision_time_horizon', 'Decision horizon'],
    ['meeting_style', 'Meeting style'],
    ['written_style_observations', 'Written style observations'],
  ]);
  const decisionCards = buildObservedCards(profile.decision_patterns, [
    ['risk_tolerance', 'Risk tolerance'],
    ['horizon_preference', 'Horizon preference'],
    ['consensus_building', 'Consensus building'],
    ['pushback_patterns', 'Pushback patterns'],
    ['acceleration_patterns', 'Acceleration patterns'],
    ['typical_first_questions', 'Typical first questions'],
  ]);
  const priorities = recordList(profile.known_priorities);
  const constraints = recordList(profile.known_constraints);
  const influentialVoices = recordList(profile.influential_voices);
  const sourceMaterial = recordList(profile.source_material);
  const relationshipSummary = profile.relationships.filter((item) => item.related_profile_name);
  const currentPath = `/persons/${encodeURIComponent(personId)}`;

  return (
    <PageShell width="standard" padding="comfortable">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 34 }}>
        <header style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <EntityLink href="/intelligence/people" variant="ghost">
              ← People intelligence
            </EntityLink>
            <EyebrowLabel tone="teal" size="sm">
              {profile.profile_type === 'composite_tenant' ? 'TENANT PROFILE' : 'REAL-WORLD PROFILE'}
              {activeClient ? ` · ${activeClient.name.toUpperCase()}` : ''}
            </EyebrowLabel>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(320px, 0.9fr)', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <PageTitle size="display">{displayName}</PageTitle>
              {profile.pronouns ? (
                <MetaLabel>{profile.pronouns}</MetaLabel>
              ) : null}
              <Body size="lg" tone="secondary" style={{ maxWidth: 820 }}>
                {profile.current_remit ?? 'Current remit has not yet been attached to this profile.'}
              </Body>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
                {reportsTo ? (
                  <MetaLabel>Reports to {reportsTo}</MetaLabel>
                ) : null}
                {typeof directReports === 'number' ? (
                  <MetaLabel>{directReports} direct reports</MetaLabel>
                ) : null}
                {orgScope ? (
                  <MetaLabel>{orgScope}</MetaLabel>
                ) : null}
              </div>
            </div>

            <ExecutiveCard
              name={profile.full_name}
              preferredName={profile.preferred_name}
              title={profile.current_role_title}
              organization={profile.current_company}
              tenureLabel={tenureLabel}
              focus={firstPriorityLabel(priorities)}
              roleTag={profile.profile_type === 'composite_tenant' ? 'EXECUTIVE PROFILE' : 'REAL-WORLD PROFILE'}
              size="prominent"
            />
          </div>
        </header>

        <section>
          <EyebrowLabel tone="teal" size="sm">CURRENT REMIT</EyebrowLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)', gap: 20, marginTop: 12 }}>
            <Panel>
              <Body size="md">
                {profile.current_remit ?? 'This profile has not yet been given a remit narrative.'}
              </Body>
            </Panel>
            <Panel>
              <SectionHeading size="md" style={{ marginBottom: 10 }}>
                Reporting structure
              </SectionHeading>
              <KeyValueRows
                rows={[
                  ['Reports to', reportsTo],
                  ['Direct reports', typeof directReports === 'number' ? String(directReports) : null],
                  ['Scope', orgScope],
                ]}
              />
            </Panel>
          </div>
          <TwoColumnChips
            leftTitle="Strategic priorities personally owned"
            leftItems={profile.strategic_priorities_personally_owned}
            rightTitle="Initiatives personally sponsored"
            rightItems={profile.initiatives_personally_sponsored}
          />
        </section>

        <ObservedCardGrid
          eyebrow="COMMUNICATION STYLE · OBSERVED PATTERNS"
          sublabel="Observed from seeded public material and working-context notes."
          items={styleCards}
        />

        <ObservedCardGrid
          eyebrow="DECISION PATTERNS"
          sublabel="How this executive tends to pressure-test and accelerate decisions."
          items={decisionCards}
        />

        <section>
          <EyebrowLabel tone="teal" size="sm">CAREER TRAJECTORY</EyebrowLabel>
          <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 14 }}>
            Prior roles that shape the current operating lens
          </SectionHeading>
          <Timeline items={profile.career_history} />
        </section>

        <section>
          <EyebrowLabel tone="teal" size="sm">PUBLIC STATEMENTS AND COMMITMENTS</EyebrowLabel>
          <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 14 }}>
            What they have actually said in source material
          </SectionHeading>
          <StatementList items={profile.public_statements} />
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <Panel>
            <EyebrowLabel tone="teal" size="sm">KNOWN PRIORITIES</EyebrowLabel>
            <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 14 }}>
              Current priorities the system should respect
            </SectionHeading>
            <EvidenceList items={priorities} empty="No explicit priority rows are attached yet." />
          </Panel>
          <Panel>
            <EyebrowLabel tone="teal" size="sm">KNOWN CONSTRAINTS</EyebrowLabel>
            <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 14 }}>
              Constraints and watch-outs
            </SectionHeading>
            <EvidenceList items={constraints} empty="No explicit constraints are attached yet." />
          </Panel>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <Panel>
            <EyebrowLabel tone="teal" size="sm">RELATIONSHIP NETWORK</EyebrowLabel>
            <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 14 }}>
              Key relationships around this executive
            </SectionHeading>
            {relationshipSummary.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {relationshipSummary.map((relationship) => (
                  <div key={`${relationship.related_profile_id}-${relationship.relationship_type}`} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Body size="sm" weight={600}>
                      {relationship.related_profile_name}
                    </Body>
                    <MetaLabel>{humanize(relationship.relationship_type)} · {relationship.confidence.toUpperCase()} CONFIDENCE</MetaLabel>
                    {relationship.relationship_context ? (
                      <Body size="sm" tone="secondary">{relationship.relationship_context}</Body>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <Body size="sm" tone="muted">No profile-to-profile relationships are attached yet.</Body>
            )}
          </Panel>

          <Panel>
            <EyebrowLabel tone="teal" size="sm">INFLUENTIAL VOICES</EyebrowLabel>
            <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 14 }}>
              People or contexts likely to shape how they land decisions
            </SectionHeading>
            <EvidenceList items={influentialVoices} empty="No influential voice rows are attached yet." />
          </Panel>
        </section>

        {profile.persona_overrides ? (
          <section>
            <EyebrowLabel tone="teal" size="sm">DEMO PERSONA CONFIGURATION</EyebrowLabel>
            <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 14 }}>
              Composite-only guidance for tenant maestro interactions
            </SectionHeading>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              <ListPanel title="Frames to open with" items={profile.persona_overrides.specific_frames_to_open_with} />
              <ListPanel title="Topics to lead with" items={profile.persona_overrides.topics_to_lead_with} />
              <ListPanel title="Sensitivities to acknowledge" items={profile.persona_overrides.sensitivities_to_acknowledge} />
              <ListPanel title="Avoid framings" items={profile.persona_overrides.avoid_framings} />
            </div>
          </section>
        ) : null}

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <Panel>
            <EyebrowLabel tone="teal" size="sm">SOURCE MATERIAL</EyebrowLabel>
            <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 14 }}>
              Every claim grounded in source material
            </SectionHeading>
            <SourceList items={sourceMaterial} />
          </Panel>
          <Panel>
            <EyebrowLabel tone="teal" size="sm">PROFILE USE AND GOVERNANCE</EyebrowLabel>
            <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 14 }}>
              What this profile is for, and what it is not for
            </SectionHeading>
            <Body size="sm" tone="secondary" style={{ marginBottom: 10 }}>
              {profile.profile_use_statement}
            </Body>
            <Body size="sm" tone="secondary" style={{ marginBottom: 14 }}>
              {profile.profile_non_use_statement}
            </Body>
            <KeyValueRows
              rows={[
                ['Reviewed by', profile.human_reviewed_by],
                ['Human review date', formatDate(profile.human_reviewed_at)],
                ['Last refreshed', formatDate(profile.last_refreshed_at)],
                ['Confidence', profile.confidence?.toUpperCase() ?? null],
              ]}
            />
          </Panel>
        </section>

        {profile.interaction_log.length > 0 ? (
          <section>
            <EyebrowLabel tone="teal" size="sm">INTERACTION LOG</EyebrowLabel>
            <SectionHeading size="md" style={{ marginTop: 10, marginBottom: 14 }}>
              Logged touchpoints attached to this profile
            </SectionHeading>
            <InteractionList items={profile.interaction_log} />
          </section>
        ) : null}

        <footer
          style={{
            padding: 18,
            borderRadius: 18,
            border: BORDER,
            background: 'rgba(20,184,166,0.08)',
          }}
        >
          <Body size="sm" tone="secondary">
            This surface is designed for meeting preparation, program stakeholder context, and briefing continuity.
            It is not a psychological profile and should not be exported outside scoped tenant work.
          </Body>
          <div style={{ marginTop: 10 }}>
            <EntityLink href={currentPath} variant="ghost">Canonical route</EntityLink>
          </div>
        </footer>
      </div>
    </PageShell>
  );
}

function isRealWorldProfile(profile: ExecutiveProfileDetail): boolean {
  return profile.profile_type === 'real_world' || Boolean(profile.metadata?.ethics_review_required);
}

function ProfilePendingCard({
  displayName,
  title,
  organization,
}: {
  displayName: string;
  title?: string | null;
  organization?: string | null;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <EyebrowLabel tone="teal" size="sm">EXECUTIVE PROFILE</EyebrowLabel>
      <PageTitle size="page">{displayName}</PageTitle>
      <Body size="lg" tone="secondary">
        This person resolves as a stakeholder, but the deeper executive profile has not been modeled yet. The route is
        in place so linked stakeholder cards no longer dead-end.
      </Body>
      <Panel>
        <KeyValueRows
          rows={[
            ['Current title', title ?? null],
            ['Organization', organization ?? null],
            ['Status', 'Profile not yet populated'],
          ]}
        />
      </Panel>
      <Body size="sm" tone="muted">
        Once an executive profile row is seeded for this person, the page will expand to communication patterns,
        decision patterns, career trajectory, source material, and governance.
      </Body>
    </div>
  );
}

function TenantScopeCard({
  displayName,
  clientName,
}: {
  displayName: string;
  clientName: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <EyebrowLabel tone="teal" size="sm">TENANT-BOUNDED PROFILE</EyebrowLabel>
      <PageTitle size="page">{displayName}</PageTitle>
      <Body size="lg" tone="secondary">
        This executive profile exists, but it is not available under the current active client scope.
      </Body>
      <Panel>
        <Body size="sm" tone="secondary">
          Active client: {clientName}. Switch tenant context before viewing stakeholder detail that belongs to another
          composite organization.
        </Body>
      </Panel>
    </div>
  );
}

function EthicsGateCard({ displayName }: { displayName: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <EyebrowLabel tone="amber" size="sm">ETHICS REVIEW HOLD</EyebrowLabel>
      <PageTitle size="page">{displayName}</PageTitle>
      <Body size="lg" tone="secondary">
        Real-world executive profiles are intentionally withheld until Anand clears the ethics review set. This route
        is live so the product handles the profile class explicitly instead of leaking or 404ing.
      </Body>
      <Panel>
        <Body size="sm" tone="secondary">
          Current behavior: composite executive profiles render in full; real-world executive profiles resolve to this
          governance notice until the ethics hold is removed.
        </Body>
      </Panel>
    </div>
  );
}

function ObservedCardGrid({
  eyebrow,
  sublabel,
  items,
}: {
  eyebrow: string;
  sublabel: string;
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <section>
      <EyebrowLabel tone="teal" size="sm">{eyebrow}</EyebrowLabel>
      <MetaLabel style={{ display: 'block', marginTop: 8 }}>{sublabel}</MetaLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 16 }}>
        {items.map((item) => (
          <Panel key={item.label}>
            <MetaLabel style={{ color: TEAL }}>{item.label}</MetaLabel>
            <Body size="sm" style={{ marginTop: 8 }}>
              {item.value}
            </Body>
          </Panel>
        ))}
      </div>
    </section>
  );
}

function Timeline({ items }: { items: ExecutiveCareerEntry[] }) {
  if (items.length === 0) {
    return <Body size="sm" tone="muted">No prior career history has been attached yet.</Body>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {items.map((entry) => (
        <Panel key={entry.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <Body size="md" weight={600}>{entry.role}</Body>
              <Body size="sm" tone="secondary">{entry.company}</Body>
            </div>
            <MetaLabel>
              {formatDateRange(entry.tenure_start, entry.tenure_end)}
              {entry.exit_context ? ` · ${humanize(entry.exit_context)}` : ''}
            </MetaLabel>
          </div>
          {entry.notable_accomplishments.length > 0 ? (
            <ul style={{ margin: '12px 0 0', paddingLeft: 18, color: MUTED }}>
              {entry.notable_accomplishments.map((item) => (
                <li key={item} style={{ marginBottom: 6 }}>
                  <Body size="sm" tone="secondary" as="span">{item}</Body>
                </li>
              ))}
            </ul>
          ) : null}
        </Panel>
      ))}
    </div>
  );
}

function StatementList({ items }: { items: ExecutivePublicStatementEntry[] }) {
  if (items.length === 0) {
    return <Body size="sm" tone="muted">No public statement rows are attached yet.</Body>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {items.map((statement) => (
        <Panel key={statement.id}>
          <Body size="sm">{statement.statement_summary}</Body>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 10 }}>
            <MetaLabel>{statement.source}</MetaLabel>
            {statement.statement_date ? <MetaLabel>{formatDate(statement.statement_date)}</MetaLabel> : null}
            {statement.commitment_quality ? (
              <EyebrowLabel tone={statement.commitment_quality === 'quantified' ? 'teal' : 'muted'} size="xs">
                {statement.commitment_quality.toUpperCase()}
              </EyebrowLabel>
            ) : null}
          </div>
          {statement.topic_tags.length > 0 ? (
            <ChipRow items={statement.topic_tags} style={{ marginTop: 10 }} />
          ) : null}
        </Panel>
      ))}
    </div>
  );
}

function EvidenceList({
  items,
  empty,
}: {
  items: Array<Record<string, unknown>>;
  empty: string;
}) {
  if (items.length === 0) {
    return <Body size="sm" tone="muted">{empty}</Body>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((item, index) => {
        const description =
          optionalString(item.priority_description)
          ?? optionalString(item.constraint_description)
          ?? optionalString(item.voice_description)
          ?? optionalString(item.source_reference)
          ?? optionalString(item.source)
          ?? `Item ${index + 1}`;
        const source = optionalString(item.source) ?? optionalString(item.source_reference);
        const confidence = optionalString(item.confidence);
        return (
          <div key={`${description}-${index}`} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Body size="sm">{description}</Body>
            {(source || confidence) ? (
              <MetaLabel>
                {source ?? 'Seeded context'}
                {confidence ? ` · ${confidence.toUpperCase()} CONFIDENCE` : ''}
              </MetaLabel>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function SourceList({ items }: { items: Array<Record<string, unknown>> }) {
  if (items.length === 0) {
    return <Body size="sm" tone="muted">No source material rows are attached yet.</Body>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((item, index) => {
        const type = optionalString(item.source_type);
        const reference = optionalString(item.source_reference) ?? 'Source reference pending';
        const date = optionalString(item.ingestion_date);
        const confidence = optionalString(item.confidence);
        return (
          <div key={`${reference}-${index}`} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Body size="sm">{reference}</Body>
            <MetaLabel>
              {[type, date ? formatDate(date) : null, confidence ? `${confidence.toUpperCase()} CONFIDENCE` : null]
                .filter(Boolean)
                .join(' · ')}
            </MetaLabel>
          </div>
        );
      })}
    </div>
  );
}

function InteractionList({ items }: { items: ExecutiveInteractionLogEntry[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((item) => (
        <Panel key={item.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <Body size="sm" weight={600}>{item.summary}</Body>
            <MetaLabel>{formatDate(item.interaction_date)} · {humanize(item.interaction_type)}</MetaLabel>
          </div>
          {item.outcome ? (
            <Body size="sm" tone="secondary" style={{ marginTop: 8 }}>
              Outcome · {item.outcome}
            </Body>
          ) : null}
          {item.next_step ? (
            <Body size="sm" tone="secondary" style={{ marginTop: 6 }}>
              Next step · {item.next_step}
            </Body>
          ) : null}
        </Panel>
      ))}
    </div>
  );
}

function ListPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <Panel>
      <MetaLabel style={{ color: TEAL }}>{title}</MetaLabel>
      {items.length > 0 ? (
        <ul style={{ margin: '12px 0 0', paddingLeft: 18, color: MUTED }}>
          {items.map((item) => (
            <li key={item} style={{ marginBottom: 6 }}>
              <Body size="sm" tone="secondary" as="span">{item}</Body>
            </li>
          ))}
        </ul>
      ) : (
        <Body size="sm" tone="muted" style={{ marginTop: 10 }}>
          No items attached.
        </Body>
      )}
    </Panel>
  );
}

function TwoColumnChips({
  leftTitle,
  leftItems,
  rightTitle,
  rightItems,
}: {
  leftTitle: string;
  leftItems: string[];
  rightTitle: string;
  rightItems: string[];
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 16 }}>
      <Panel>
        <MetaLabel style={{ color: TEAL }}>{leftTitle}</MetaLabel>
        <ChipRow items={leftItems} style={{ marginTop: 12 }} />
      </Panel>
      <Panel>
        <MetaLabel style={{ color: TEAL }}>{rightTitle}</MetaLabel>
        <ChipRow items={rightItems} style={{ marginTop: 12 }} />
      </Panel>
    </div>
  );
}

function ChipRow({ items, style }: { items: string[]; style?: React.CSSProperties }) {
  if (items.length === 0) {
    return <Body size="sm" tone="muted" style={style}>No items attached yet.</Body>;
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, ...style }}>
      {items.map((item) => (
        <span
          key={item}
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            letterSpacing: '0.04em',
            borderRadius: 999,
            border: '0.5px solid rgba(20,184,166,0.28)',
            background: 'rgba(20,184,166,0.08)',
            color: MUTED,
            padding: '6px 10px',
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function KeyValueRows({ rows }: { rows: Array<[string, string | null]> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.map(([label, value]) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <MetaLabel style={{ color: TEAL }}>{label}</MetaLabel>
          <Body size="sm" tone={value ? 'secondary' : 'muted'}>
            {value ?? 'Not attached'}
          </Body>
        </div>
      ))}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 18,
        borderRadius: 18,
        border: BORDER,
        background: PANEL,
      }}
    >
      {children}
    </div>
  );
}

function buildObservedCards(
  source: KeyValue | null | undefined,
  keys: Array<[string, string]>,
): Array<{ label: string; value: string }> {
  if (!source) return [];
  return keys
    .map(([key, label]) => {
      const value = formatUnknownValue(source[key]);
      return value ? { label, value } : null;
    })
    .filter((item): item is { label: string; value: string } => Boolean(item));
}

function formatUnknownValue(value: unknown): string | null {
  if (typeof value === 'string') return humanize(value);
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    const flattened = value
      .map((item) => (typeof item === 'string' ? humanize(item) : typeof item === 'number' ? String(item) : null))
      .filter((item): item is string => Boolean(item));
    return flattened.length > 0 ? flattened.join(' · ') : null;
  }
  return null;
}

function recordList(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    : [];
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function optionalNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function firstPriorityLabel(items: Array<Record<string, unknown>>): string | null {
  return items
    .map((item) => optionalString(item.priority_description) ?? optionalString(item.constraint_description))
    .find((value): value is string => Boolean(value))
    ?? null;
}

function humanize(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatTenureLabel(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `SINCE ${date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()}`;
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatDateRange(start: string | null, end: string | null): string {
  const startText = formatDate(start)?.replace(/, \d{4}$/, '') ?? 'Start unknown';
  const endText = end ? formatDate(end)?.replace(/, \d{4}$/, '') ?? end : 'Present';
  return `${startText} – ${endText}`;
}
