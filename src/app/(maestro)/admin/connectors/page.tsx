import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { ContextBar } from '@/components/admin/ContextBar';
import { StewardEditorial } from '@/components/admin/StewardEditorial';
import { ConnectorsList } from '@/components/admin/ConnectorsList';
import { ConnectorsActionStrip } from '@/components/admin/connectors/ConnectorsActionStrip';
import { ConnectorCategoryGroup } from '@/components/admin/connectors/ConnectorCategoryGroup';
import { ConnectorDetailDrawer } from '@/components/admin/connectors/ConnectorDetailDrawer';
import { PilotBlockerDrilldown } from '@/components/admin/connectors/PilotBlockerDrilldown';
import { RequirementsMatrix } from '@/components/admin/connectors/RequirementsMatrix';
import {
  buildConnectorsPageView,
  type ConnectorTab,
} from '@/lib/admin/connectors-page-view';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

export const metadata = {
  title: 'Connectors | AbarVa Setup',
};

interface ConnectorsSearchParams {
  connector?: string;
  tab?: string;
  blockers?: string;
  category?: string;
}

function parseTab(raw: string | undefined, fallback: ConnectorTab): ConnectorTab {
  return raw === 'health' || raw === 'requirements' || raw === 'configuration' || raw === 'logs'
    ? raw
    : fallback;
}

type HrefOverrides = {
  connector?: string | null;
  tab?: string | null;
  blockers?: string | null;
  category?: string | null;
};

function buildParamHref(
  base: ConnectorsSearchParams,
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
  return qs ? `/admin/connectors?${qs}` : '/admin/connectors';
}

export default async function ConnectorsPage({
  searchParams,
}: {
  searchParams: Promise<ConnectorsSearchParams>;
}) {
  const view = await buildConnectorsPageView();
  const params = await searchParams;
  const activeTab = parseTab(params.tab, view.defaultTab);
  const selectedId = params.connector;
  const blockersExpanded = params.blockers === 'open';

  const selected =
    selectedId && view.connectorDetailMap[selectedId]
      ? view.connectors.find((c) => c.id === selectedId) ?? null
      : null;
  const selectedDetail = selected ? view.connectorDetailMap[selected.id] : null;

  const buildSelectHref = (connectorId: string) =>
    buildParamHref(params, { connector: connectorId });
  const buildToggleBlockersHref = () =>
    buildParamHref(params, { blockers: blockersExpanded ? null : 'open' });
  const buildTabHref = (tab: ConnectorTab) => buildParamHref(params, { tab });

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

        <ConnectorsActionStrip actions={view.actions} />

        <PilotBlockerDrilldown
          blockers={view.pilotBlockers}
          expanded={blockersExpanded}
          toggleHref={buildToggleBlockersHref()}
          buildSelectHref={buildSelectHref}
        />

        <nav
          data-component="ConnectorsTabs"
          aria-label="Connector views"
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

        {activeTab === 'health' ? (
          <section data-tab-panel="health">
            {view.categories.map((cat) => (
              <ConnectorCategoryGroup
                key={cat.kind}
                category={cat}
                selectedConnectorId={selectedId}
                buildSelectHref={buildSelectHref}
              />
            ))}
            <ConnectorsList connectors={view.connectors} caveat={view.caveat} />
          </section>
        ) : null}

        {activeTab === 'requirements' ? (
          <section data-tab-panel="requirements">
            <RequirementsMatrix
              connectors={view.connectors}
              detailMap={view.connectorDetailMap}
            />
            <p
              style={{
                marginTop: SPACING.md,
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                color: `${COLORS.ink}80`,
                fontStyle: 'italic',
              }}
            >
              {view.caveat}
            </p>
          </section>
        ) : null}

        {activeTab === 'configuration' ? (
          <section data-tab-panel="configuration">
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                background: COLORS.white,
                borderRadius: RADIUS.lg,
                border: `1px solid ${COLORS.ink}10`,
              }}
            >
              {view.connectors.map((c, idx) => {
                const detail = view.connectorDetailMap[c.id];
                if (!detail) return null;
                return (
                  <li
                    key={c.id}
                    data-connector-id={c.id}
                    style={{
                      padding: SPACING.md,
                      borderTop: idx === 0 ? 'none' : `1px solid ${COLORS.ink}10`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        justifyContent: 'space-between',
                        marginBottom: SPACING.sm,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.serif,
                          fontSize: 16,
                          fontWeight: 700,
                          color: COLORS.ink,
                        }}
                      >
                        {c.label}
                      </span>
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 11,
                          color: `${COLORS.ink}80`,
                        }}
                      >
                        {detail.configFields.length} field
                        {detail.configFields.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <ul
                      style={{
                        listStyle: 'none',
                        padding: 0,
                        margin: 0,
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 12,
                      }}
                    >
                      {detail.configFields.map((field) => (
                        <li
                          key={field.key}
                          data-config-key={field.key}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '180px 1fr 80px',
                            gap: SPACING.sm,
                            padding: '4px 0',
                            color: `${COLORS.ink}cc`,
                          }}
                        >
                          <span>{field.key}</span>
                          <span>{field.maskedValue ?? '— not set —'}</span>
                          <span style={{ textAlign: 'right' }}>
                            {field.required ? 'required' : 'optional'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {activeTab === 'logs' ? (
          <section data-tab-panel="logs">
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                background: COLORS.white,
                borderRadius: RADIUS.lg,
                border: `1px solid ${COLORS.ink}10`,
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 12,
              }}
            >
              {view.connectors.flatMap((c) => {
                const detail = view.connectorDetailMap[c.id];
                if (!detail) return [];
                return detail.errorLog.map((event, idx) => (
                  <li
                    key={`${c.id}:${idx}`}
                    data-connector-id={c.id}
                    data-log-level={event.level}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '160px 60px 200px 1fr',
                      gap: SPACING.sm,
                      padding: SPACING.sm,
                      borderTop: `1px solid ${COLORS.ink}0a`,
                      color: `${COLORS.ink}cc`,
                    }}
                  >
                    <span>{event.timestamp}</span>
                    <span
                      style={{
                        fontWeight: 700,
                        color:
                          event.level === 'error'
                            ? COLORS.coralInk
                            : event.level === 'warn'
                              ? COLORS.amberInk
                              : COLORS.mintInk,
                      }}
                    >
                      {event.level.toUpperCase()}
                    </span>
                    <span style={{ color: COLORS.ink }}>{c.label}</span>
                    <span style={{ fontFamily: TYPOGRAPHY.sans }}>{event.message}</span>
                  </li>
                ));
              })}
            </ul>
          </section>
        ) : null}

        {selected && selectedDetail ? (
          <div data-section="connector-drawer-host" style={{ marginTop: SPACING.lg }}>
            <ConnectorDetailDrawer
              connector={selected}
              detail={selectedDetail}
              hardGateReason={view.hardGateReason}
              closeHref={buildParamHref(params, { connector: null })}
            />
          </div>
        ) : null}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
