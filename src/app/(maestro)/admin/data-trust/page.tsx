import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { ContextBar } from '@/components/admin/ContextBar';
import { StewardEditorial } from '@/components/admin/StewardEditorial';
import { TrustLadder } from '@/components/admin/TrustLadder';
import { DataTrustTabs } from '@/components/admin/DataTrustTabs';
import { RungDatasetList } from '@/components/admin/RungDatasetList';
import { DatasetDetailDrawer } from '@/components/admin/DatasetDetailDrawer';
import { DataGovernancePanel } from '@/components/admin/DataGovernancePanel';
import { DataQualityPanel } from '@/components/admin/DataQualityPanel';
import { DataTrustActionStrip } from '@/components/admin/DataTrustActionStrip';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import {
  buildDataTrustPageView,
  resolveDataTrustTab,
  findDataTrustDataset,
} from '@/lib/admin/data-trust-page-view';

export const metadata = {
  title: 'Data Trust | Nexus Admin',
};

const BASE_URL = '/admin/data-trust';

interface DataTrustPageProps {
  searchParams?: Promise<{ tab?: string; dataset?: string }>;
}

function formatDate(iso: string): string {
  if (!iso || iso === '—') return '—';
  return iso.slice(0, 10);
}

export default async function DataTrustPage({ searchParams }: DataTrustPageProps) {
  const view = await buildDataTrustPageView();
  const params = (await searchParams) ?? {};
  const activeTab = resolveDataTrustTab(params.tab);
  const activeDataset = findDataTrustDataset(view, params.dataset);

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel={view.primaryAgentLabel}
          primaryActionLabel={view.primaryActionLabel}
          primaryActionHref={view.primaryActionHref}
        />
      }
    >
      <EditorialCanvas eyebrow={view.eyebrow} title={view.title} subtitle={view.subtitle}>
        <ContextBar
          tenant={view.context.tenant}
          mode={view.context.mode}
          agent={view.context.agent}
          data={view.context.data}
          liveStatus={view.context.liveStatus}
          liveStatusKind={view.context.liveStatusKind}
        />
        <StewardEditorial
          title={view.editorial.title}
          body={view.editorial.body}
          contextUsed={view.editorial.contextUsed}
          evidenceStrength={view.editorial.evidenceStrength}
          blocker={view.editorial.blocker}
          primaryAction={view.editorial.primaryAction}
        />
        <DataTrustActionStrip actions={view.actionStrip} />
        <DataTrustTabs tabs={view.tabs} activeTab={activeTab} baseUrl={BASE_URL} />

        {activeTab === 'trust_ladder' ? (
          <>
            <TrustLadder rungs={view.ladder} />
            <RungDatasetList
              ladder={view.ladder}
              datasetsByRung={view.datasetsByRung}
              baseUrl={BASE_URL}
              activeDatasetId={activeDataset?.id}
            />
            {activeDataset ? (
              <DatasetDetailDrawer
                dataset={activeDataset}
                closeHref={`${BASE_URL}?tab=trust_ladder`}
              />
            ) : null}
          </>
        ) : null}

        {activeTab === 'loaded_files' ? <LoadedFilesPanel files={view.loadedFiles} /> : null}

        {activeTab === 'promotion_queue' ? (
          <DataGovernancePanel requests={view.promotionRequests} />
        ) : null}

        {activeTab === 'quality_scorecard' ? (
          <DataQualityPanel rows={view.qualityScorecard} />
        ) : null}

        {activeTab === 'audit_trail' ? <AuditTrailPanel entries={view.auditTrail} /> : null}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

// ---------------------------------------------------------------------------
// Inline panels (Loaded Files + Audit Trail). These are server-rendered,
// stateless presentation panels that don't warrant their own files yet.
// ---------------------------------------------------------------------------

function statusToneFor(status: 'approved' | 'missing' | 'processing') {
  if (status === 'approved') return { bg: COLORS.mintSoft, fg: COLORS.mintInk, label: 'Approved' };
  if (status === 'processing')
    return { bg: COLORS.amberSoft, fg: COLORS.amberInk, label: 'Processing' };
  return { bg: COLORS.coralSoft, fg: COLORS.coralInk, label: 'Missing' };
}

function LoadedFilesPanel({
  files,
}: {
  files: Awaited<ReturnType<typeof buildDataTrustPageView>>['loadedFiles'];
}) {
  const segments: ReadonlyArray<'Business' | 'IT & Technology' | 'Third Party'> = [
    'Business',
    'IT & Technology',
    'Third Party',
  ];

  return (
    <section
      data-loaded-files-panel="true"
      aria-label="Loaded files"
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}10`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
      }}
    >
      <header>
        <h3
          style={{
            margin: 0,
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 18,
            color: COLORS.ink,
            fontWeight: 400,
          }}
        >
          Loaded files
        </h3>
        <p
          style={{
            margin: `${SPACING.xs} 0 0 0`,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}99`,
          }}
        >
          Source artifacts grouped by segment (absorbed from legacy
          /platform/admin/data).
        </p>
      </header>
      {segments.map((seg) => {
        const rows = files.filter((f) => f.segment === seg);
        return (
          <div key={seg} data-loaded-files-segment={seg}>
            <h4
              style={{
                margin: `0 0 ${SPACING.sm} 0`,
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: `${COLORS.ink}80`,
              }}
            >
              {seg} ({rows.length})
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {rows.map((f) => {
                const tone = statusToneFor(f.status);
                return (
                  <li
                    key={f.id}
                    data-loaded-file-id={f.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: SPACING.md,
                      padding: SPACING.sm,
                      borderBottom: `1px solid ${COLORS.ink}08`,
                    }}
                  >
                    <span
                      style={{
                        flex: 1,
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 13,
                        fontWeight: 600,
                        color: COLORS.ink,
                      }}
                    >
                      {f.name}
                    </span>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 11,
                        color: `${COLORS.ink}80`,
                      }}
                    >
                      {f.category}
                    </span>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 11,
                        color: `${COLORS.ink}80`,
                      }}
                    >
                      {f.owner}
                    </span>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 11,
                        color: `${COLORS.ink}80`,
                      }}
                    >
                      {formatDate(f.lastUpdated)}
                    </span>
                    <span
                      data-loaded-file-status={f.status}
                      style={{
                        padding: '2px 10px',
                        borderRadius: RADIUS.pill,
                        background: tone.bg,
                        color: tone.fg,
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 11,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {tone.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </section>
  );
}

function AuditTrailPanel({
  entries,
}: {
  entries: Awaited<ReturnType<typeof buildDataTrustPageView>>['auditTrail'];
}) {
  return (
    <section
      data-audit-trail-panel="true"
      aria-label="Dataset trust audit trail"
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}10`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
      }}
    >
      <header>
        <h3
          style={{
            margin: 0,
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 18,
            color: COLORS.ink,
            fontWeight: 400,
          }}
        >
          Audit trail
        </h3>
        <p
          style={{
            margin: `${SPACING.xs} 0 0 0`,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}99`,
          }}
        >
          Last {entries.length} dataset-trust events. Deterministic seed; no
          live event store yet (Wave 27).
        </p>
      </header>
      <ol
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.xs,
        }}
      >
        {entries.map((e) => (
          <li
            key={e.id}
            data-audit-entry-id={e.id}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: SPACING.md,
              padding: SPACING.xs,
              borderBottom: `1px solid ${COLORS.ink}05`,
            }}
          >
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: `${COLORS.ink}80`,
                whiteSpace: 'nowrap',
              }}
            >
              {formatDate(e.at)}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                fontWeight: 600,
                color: COLORS.ink,
                whiteSpace: 'nowrap',
              }}
            >
              {e.actor}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: COLORS.navy,
                textTransform: 'uppercase',
              }}
            >
              {e.role}
            </span>
            <span
              style={{
                flex: 1,
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                color: `${COLORS.ink}cc`,
              }}
            >
              {e.action}
              {e.datasetId ? ` · ${e.datasetId}` : ''}
              {e.rung ? ` · ${e.rung}` : ''}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
