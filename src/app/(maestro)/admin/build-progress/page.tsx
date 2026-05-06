import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { ContextBar } from '@/components/admin/ContextBar';
import { StewardEditorial } from '@/components/admin/StewardEditorial';
import { WaveTimeline } from '@/components/admin/build-progress/WaveTimeline';
import { SliceTable } from '@/components/admin/build-progress/SliceTable';
import { SliceDetailDrawer } from '@/components/admin/build-progress/SliceDetailDrawer';
import { CIMiniStrip } from '@/components/admin/build-progress/CIMiniStrip';
import { BacklogPreview } from '@/components/admin/build-progress/BacklogPreview';
import {
  buildBuildProgressPageView,
  type BuildProgressTab,
} from '@/lib/admin/build-progress-page-view';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

export const metadata = {
  title: 'Build Progress | AbarVa Setup',
};

interface BuildProgressSearchParams {
  tab?: string;
  wave?: string;
  slice?: string;
  manifest?: string;
}

function parseTab(raw: string | undefined, fallback: BuildProgressTab): BuildProgressTab {
  return raw === 'waves' || raw === 'slices' || raw === 'ci' || raw === 'backlog'
    ? raw
    : fallback;
}

type HrefOverrides = {
  tab?: string | null;
  wave?: string | null;
  slice?: string | null;
  manifest?: string | null;
};

function buildParamHref(
  base: BuildProgressSearchParams,
  overrides: HrefOverrides,
): string {
  const merged: Record<string, string> = {};
  for (const [k, v] of Object.entries(base)) {
    if (typeof v === 'string' && v.length > 0) merged[k] = v;
  }
  for (const [k, v] of Object.entries(overrides)) {
    if (v === null || v === undefined || v === '') {
      delete merged[k];
    } else {
      merged[k] = v;
    }
  }
  const qs = new URLSearchParams(merged).toString();
  return qs ? `/admin/build-progress?${qs}` : '/admin/build-progress';
}

export default async function BuildProgressPage({
  searchParams,
}: {
  searchParams: Promise<BuildProgressSearchParams>;
}) {
  const view = await buildBuildProgressPageView();
  const params = await searchParams;
  const activeTab = parseTab(params.tab, view.defaultTab);
  const expandedWaveId = params.wave ?? null;
  const selectedSliceId = params.slice ?? null;
  const manifestOpen = params.manifest === 'open';

  const selectedSlice = selectedSliceId ? view.findSliceDetail(selectedSliceId) : null;

  const buildTabHref = (tab: BuildProgressTab) =>
    buildParamHref(params, { tab, slice: null, manifest: null });
  const buildExpandHref = (waveId: string) =>
    buildParamHref(params, {
      wave: expandedWaveId === waveId ? null : waveId,
    });
  const buildSliceHref = (sliceId: string) => buildParamHref(params, { slice: sliceId });
  const closeSliceHref = buildParamHref(params, { slice: null });
  const toggleManifestHref = buildParamHref(params, {
    manifest: manifestOpen ? null : 'open',
  });

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

        <nav
          data-component="BuildProgressActionStrip"
          aria-label="Build progress actions"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: SPACING.sm,
            background: COLORS.white,
            borderRadius: RADIUS.lg,
            border: `1px solid ${COLORS.ink}10`,
            padding: SPACING.md,
            marginBottom: SPACING.md,
            fontFamily: TYPOGRAPHY.sans,
          }}
        >
          {view.actionStrip.map((action) => {
            if (action.status === 'blocked') {
              return (
                <button
                  key={action.id}
                  type="button"
                  disabled
                  data-action={action.id}
                  data-status="blocked"
                  title={action.reason ?? undefined}
                  aria-disabled="true"
                  style={{
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '10px 14px',
                    borderRadius: RADIUS.md,
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    border: `1px solid ${COLORS.ink}1f`,
                    gap: 2,
                    background: COLORS.cream,
                    color: `${COLORS.ink}80`,
                    cursor: 'not-allowed',
                  }}
                >
                  {action.label}
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 10,
                      letterSpacing: 0,
                      textTransform: 'none',
                      fontWeight: 400,
                      color: `${COLORS.ink}80`,
                      marginTop: 2,
                    }}
                  >
                    {action.hint}
                  </span>
                </button>
              );
            }
            return (
              <a
                key={action.id}
                href={action.href ?? '#'}
                data-action={action.id}
                data-status="available"
                style={{
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '10px 14px',
                  borderRadius: RADIUS.md,
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  border: `1px solid ${COLORS.ink}1f`,
                  gap: 2,
                  textDecoration: 'none',
                  background: COLORS.white,
                  color: COLORS.navy,
                }}
              >
                {action.label}
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 10,
                    letterSpacing: 0,
                    textTransform: 'none',
                    fontWeight: 400,
                    color: `${COLORS.ink}80`,
                    marginTop: 2,
                  }}
                >
                  {action.hint}
                </span>
              </a>
            );
          })}
        </nav>

        <nav
          data-component="BuildProgressTabs"
          aria-label="Build progress views"
          style={{
            display: 'flex',
            gap: SPACING.xs,
            borderBottom: `1px solid ${COLORS.ink}14`,
            marginBottom: SPACING.md,
            fontFamily: TYPOGRAPHY.mono,
          }}
        >
          {view.tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <a
                key={tab.id}
                href={buildTabHref(tab.id)}
                data-tab={tab.id}
                data-active={isActive ? 'true' : 'false'}
                style={{
                  padding: `${SPACING.sm} ${SPACING.md}`,
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  color: isActive ? COLORS.navy : `${COLORS.ink}80`,
                  textDecoration: 'none',
                  borderBottom: isActive
                    ? `2px solid ${COLORS.navy}`
                    : '2px solid transparent',
                  marginBottom: -1,
                }}
              >
                {tab.label}
              </a>
            );
          })}
        </nav>

        {activeTab === 'waves' ? (
          <section data-tab-panel="waves">
            <WaveTimeline
              waves={view.waves}
              waveDetailMap={view.waveDetailMap}
              slicesByWave={view.slicesByWave}
              expandedWaveId={expandedWaveId}
              buildExpandHref={buildExpandHref}
              buildSliceHref={buildSliceHref}
              slicesShipped={view.slicesShipped}
              slicesPlanned={view.slicesPlanned}
            />
          </section>
        ) : null}

        {activeTab === 'slices' ? (
          <section data-tab-panel="slices">
            <SliceTable
              slices={view.slicesIndex}
              selectedSliceId={selectedSliceId}
              buildSliceHref={buildSliceHref}
            />
          </section>
        ) : null}

        {activeTab === 'ci' ? (
          <section data-tab-panel="ci">
            <CIMiniStrip runs={view.ciSnapshot} />
          </section>
        ) : null}

        {activeTab === 'backlog' ? (
          <section data-tab-panel="backlog">
            <BacklogPreview waves={view.backlog} />
          </section>
        ) : null}

        {selectedSlice ? (
          <SliceDetailDrawer slice={selectedSlice} closeHref={closeSliceHref} />
        ) : null}

        {manifestOpen ? (
          <section
            data-section="build-manifest"
            style={{
              marginTop: SPACING.lg,
              background: COLORS.white,
              borderRadius: RADIUS.lg,
              border: `1px solid ${COLORS.ink}14`,
              padding: SPACING.lg,
            }}
          >
            <header
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: SPACING.sm,
              }}
            >
              <h3
                style={{
                  fontFamily: TYPOGRAPHY.serif,
                  fontSize: 16,
                  margin: 0,
                  color: COLORS.ink,
                  fontWeight: 700,
                }}
              >
                Build manifest snapshot
              </h3>
              <a
                href={toggleManifestHref}
                data-manifest-close="true"
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: `${COLORS.ink}80`,
                  textDecoration: 'none',
                  fontWeight: 700,
                }}
              >
                Close
              </a>
            </header>
            <pre
              data-manifest-json="true"
              style={{
                margin: 0,
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: `${COLORS.ink}cc`,
                background: COLORS.cream,
                padding: SPACING.md,
                borderRadius: RADIUS.md,
                overflowX: 'auto',
                lineHeight: 1.5,
              }}
            >
              {JSON.stringify(
                {
                  waves: view.waves,
                  slicesShipped: view.slicesShipped,
                  slicesPlanned: view.slicesPlanned,
                },
                null,
                2,
              )}
            </pre>
          </section>
        ) : null}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
