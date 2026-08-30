"use client";

import type { CSSProperties, ReactNode } from "react";

import {
  DataTable,
  type DataTableColumn,
  type DataTableRow,
} from "../DataTable";
import type { SourceWorkspaceVM } from "../buildViewModel";
import { COL } from "../viewModel";

export function VendorCanvas({ vm }: { vm: SourceWorkspaceVM }) {
  const category = vm.vendorCat ?? "Unclassified";
  const contractCount = vm.vendorContractRows.length;
  const primaryValue = vm.valueStrip.find((item) =>
    /annual contract value/i.test(item.label),
  );
  const committedValue = vm.valueStrip.find((item) =>
    /total committed/i.test(item.label),
  );
  const autoRenewValue = vm.valueStrip.find((item) =>
    /auto-renew/i.test(item.label),
  );
  const renewalValue = vm.valueStrip.find((item) =>
    /renewal exposure/i.test(item.label),
  );
  const weakSignalValue = vm.valueStrip.find((item) =>
    /weak leverage/i.test(item.label),
  );
  const actionableRenewalValue = renewalValue ?? null;
  const actionableWeakSignalValue =
    weakSignalValue && weakSignalValue.value !== "0" ? weakSignalValue : null;
  const metricCards = [
    primaryValue,
    committedValue,
    autoRenewValue,
    renewalValue,
    weakSignalValue,
  ].filter(isAvailableMetric);
  const showOverview = vm.vOverview || (vm.vOppsTab && !vm.vendorHasOpps);
  const miniStats = [
    primaryValue && isAvailableMetric(primaryValue)
      ? { label: "Annual value", value: primaryValue.value }
      : null,
    contractCount > 0
      ? { label: "Contracts", value: String(contractCount) }
      : null,
    actionableRenewalValue && isAvailableMetric(actionableRenewalValue)
      ? { label: "Renewal exposure", value: actionableRenewalValue.value }
      : null,
    actionableWeakSignalValue
      ? { label: "Weak leverage", value: actionableWeakSignalValue.value }
      : null,
    vm.vendorHasOpps
      ? { label: "Opportunities", value: String(vm.vendorOpps.length) }
      : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));
  const tabs = vm.tabs.filter(
    (tab) => tab.label !== "Opportunities" || vm.vendorHasOpps,
  );
  const hasSidePanels = hasDeterministicAlerts(vm) || vm.vendorHasOpps;

  return (
    <section data-testid="source-vendor360-exec-cockpit" style={SHELL}>
      <header style={HEADER}>
        <div style={IDENTITY}>
          <VendorMark name={vm.vendorName} />
          <div style={{ minWidth: 0 }}>
            <div style={CRUMBS}>Vendor 360 / {vm.vendorName}</div>
            <h1 style={TITLE}>{vm.vendorName}</h1>
            <div style={META}>
              <span>{category}</span>
              <span>Source</span>
              <span>{vm.tenantName}</span>
            </div>
            <div style={CHIP_ROW}>
              <Pill tone="green">Governed</Pill>
              <Pill>
                Tier{" "}
                {Math.max(
                  1,
                  vm.conc.byVendor.findIndex(
                    (row) => row.vendorRef === vm.vendorRef,
                  ) + 1 || 1,
                )}
              </Pill>
              <Pill>
                As of{" "}
                {new Date(vm.asOfDateIso).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </Pill>
            </div>
          </div>
        </div>
        <div style={CONTROL_ROW}>
          <ReadOnlyScope>All contract rows</ReadOnlyScope>
          <ReadOnlyScope>{vm.asOfDateIso.slice(0, 10)}</ReadOnlyScope>
        </div>
      </header>

      <section aria-label="Vendor headline metrics" style={SUMMARY_ROW}>
        <div style={METRIC_STRIP}>
          {metricCards.length ? (
            metricCards.map((item) => (
              <MetricCard
                key={item.label}
                label={item.label}
                value={item.value}
                sub={item.sub}
              />
            ))
          ) : (
            <div style={EMPTY_METRIC}>
              No populated vendor-level contract metrics in this view.
            </div>
          )}
        </div>
        <QuickActions
          hasOpportunities={vm.vendorHasOpps}
          onContracts={() =>
            vm.tabs.find((tab) => tab.label === "Contracts")?.onClick()
          }
          onDependencies={() =>
            vm.tabs.find((tab) => tab.label === "Dependencies")?.onClick()
          }
          onOpportunities={() =>
            vm.tabs.find((tab) => tab.label === "Opportunities")?.onClick()
          }
        />
      </section>

      <nav aria-label="Vendor 360 sections" style={TAB_ROW}>
        {tabs.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={tab.onClick}
            style={{
              ...TAB_BUTTON,
              borderBottomColor: tab.line,
              color: tab.fg,
              fontWeight: tab.weight,
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {showOverview ? (
        <div style={hasSidePanels ? MAIN_GRID : SINGLE_COLUMN_GRID}>
          <section style={LEFT_STACK}>
            <ContractTable vm={vm} />
            {miniStats.length ? (
              <section style={VALUE_SUMMARY}>
                {miniStats.map((stat) => (
                  <MiniStat
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                  />
                ))}
              </section>
            ) : null}
          </section>
          {hasSidePanels ? (
            <aside style={RIGHT_STACK}>
              <AlertsPanel vm={vm} />
              <AssistantPanel vm={vm} />
            </aside>
          ) : null}
        </div>
      ) : null}

      {vm.vContracts ? <ContractTable vm={vm} expanded /> : null}

      {vm.vDeps ? <DependenciesPanel vm={vm} /> : null}

      {vm.vOppsTab && vm.vendorHasOpps ? <OpportunitiesPanel vm={vm} /> : null}
    </section>
  );
}

function VendorMark({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div aria-hidden style={MARK}>
      {initials || "V"}
    </div>
  );
}

function Pill({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "green";
}) {
  return (
    <span
      style={{
        ...PILL,
        background: tone === "green" ? "rgba(29,158,117,.10)" : "#f4f7fb",
        borderColor:
          tone === "green" ? "rgba(29,158,117,.28)" : "rgba(10,31,68,.14)",
        color: tone === "green" ? "#176d52" : "#23395d",
      }}
    >
      {children}
    </span>
  );
}

function ReadOnlyScope({ children }: { children: ReactNode }) {
  return (
    <span style={SCOPE_BADGE}>
      <span>{children}</span>
    </span>
  );
}

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div style={METRIC_CARD}>
      <div style={METRIC_LABEL}>{label}</div>
      <div style={METRIC_VALUE}>{value}</div>
      <div style={METRIC_SUB}>{sub}</div>
    </div>
  );
}

function QuickActions({
  hasOpportunities,
  onContracts,
  onDependencies,
  onOpportunities,
}: {
  hasOpportunities: boolean;
  onContracts?: () => void;
  onDependencies?: () => void;
  onOpportunities?: () => void;
}) {
  const actions = [
    ["Contracts", onContracts],
    ["Relationships", onDependencies],
    ...(hasOpportunities
      ? ([["Opportunities", onOpportunities]] as const)
      : []),
  ] as const;

  return (
    <section aria-label="Quick actions" style={QUICK_ACTIONS}>
      <h2 style={PANEL_TITLE}>Quick actions</h2>
      <div style={QUICK_GRID}>
        {actions.map(([label, onClick]) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            style={QUICK_BUTTON}
          >
            <span>{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function ContractTable({
  vm,
  expanded = false,
}: {
  vm: SourceWorkspaceVM;
  expanded?: boolean;
}) {
  const sourceRows = expanded
    ? vm.vendorContractRows
    : vm.vendorContractRows.slice(0, 5);
  const optionalIndexes = [
    [5, { label: "Notice deadline", align: "right" }],
    [6, { label: "Expiry", align: "right" }],
    [7, { label: "Renewal" }],
    [8, { label: "Weak signals", align: "center" }],
  ] as const;
  const visibleOptionalIndexes = optionalIndexes.filter(([index]) =>
    sourceRows.some((row) => isAvailableCell(row.cells[index]?.text)),
  );
  const columns: DataTableColumn[] = [
    { label: "Contract" },
    { label: "Id" },
    { label: "Annual value", align: "right" },
    ...visibleOptionalIndexes.map(([, column]) => column),
  ];
  const rows = sourceRows.map((row) =>
    toCompactContractRow(
      row,
      visibleOptionalIndexes.map(([index]) => index),
    ),
  );

  return (
    <DataTable
      title={
        expanded
          ? "Contracts and renewal posture"
          : `Active contracts (${vm.vendorContractRows.length})`
      }
      note={
        expanded
          ? "Notice, expiry, renewal, and weak-signal posture for this vendor."
          : "Click a row to open Contract 360."
      }
      columns={columns}
      rows={rows}
      footnote={
        expanded
          ? undefined
          : `Showing ${Math.min(5, vm.vendorContractRows.length)} of ${vm.vendorContractRows.length} contracts`
      }
    />
  );
}

function toCompactContractRow(
  row: DataTableRow,
  optionalIndexes: readonly number[],
): DataTableRow {
  return {
    ...row,
    cells: [
      row.cells[1],
      row.cells[2],
      row.cells[3],
      ...optionalIndexes.map((index) => row.cells[index]),
    ].filter(Boolean),
  };
}

function AlertsPanel({ vm }: { vm: SourceWorkspaceVM }) {
  const alerts = [
    ...vm.vendorComposition
      .filter((contract) => contract.renewalExposed)
      .slice(0, 2)
      .map((contract) => ({
        tone: COL.amber,
        title: `${contract.id} renewal exposure`,
        body: contract.renewalLabel,
        onClick: contract.onClick,
      })),
    ...vm.vendorOpps.slice(0, 2).map((opportunity) => ({
      tone: COL.blue,
      title: "Sourcing opportunity identified",
      body: `${opportunity.ref} · ${opportunity.exposed}`,
      onClick: opportunity.onClick,
    })),
  ];

  if (!alerts.length) return null;

  return (
    <section style={SIDE_PANEL}>
      <PanelHeader
        title="Key alerts"
        action={alerts.length ? `${alerts.length} open` : "Clear"}
      />
      <div style={ALERT_LIST}>
        {alerts.map((alert) => (
          <button
            key={`${alert.title}-${alert.body}`}
            type="button"
            onClick={alert.onClick}
            style={ALERT_ROW}
          >
            <span aria-hidden style={{ ...ALERT_DOT, background: alert.tone }}>
              !
            </span>
            <span style={{ minWidth: 0 }}>
              <strong style={ALERT_TITLE}>{alert.title}</strong>
              <span style={ALERT_BODY}>{alert.body}</span>
            </span>
            <span style={ALERT_LINK}>View</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function AssistantPanel({ vm }: { vm: SourceWorkspaceVM }) {
  if (!vm.vendorOpps.length) return null;

  const insights = vm.vendorOpps.slice(0, 3).map((opportunity) => ({
    title: opportunity.reasons,
    body: opportunity.why,
    cta: "View details",
    onClick: opportunity.onClick,
  }));

  return (
    <section style={SIDE_PANEL}>
      <PanelHeader
        title="aVa insights"
        action={vm.vendorHasOpps ? "Evidence-backed" : "No claim"}
      />
      <div style={ASSISTANT_LIST}>
        {insights.map((insight) => (
          <button
            key={insight.title}
            type="button"
            onClick={insight.onClick}
            style={ASSISTANT_CARD}
          >
            <span aria-hidden style={SPARK}>
              *
            </span>
            <span style={{ minWidth: 0 }}>
              <strong style={ALERT_TITLE}>{insight.title}</strong>
              <span style={ALERT_BODY}>{insight.body}</span>
              <span style={ASSISTANT_CTA}>{insight.cta} -&gt;</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function DependenciesPanel({ vm }: { vm: SourceWorkspaceVM }) {
  const dependencies = vm.vendorDependencyMap;
  type DepColumn = { label: string; content: ReactNode };
  const columns: Array<DepColumn | null> = [
    dependencies.contracts.length
      ? {
          label: "Contracts",
          content: dependencies.contracts.map((contract) => (
            <DepChip key={contract.id} onClick={contract.onClick}>
              {contract.name}
            </DepChip>
          )),
        }
      : null,
    dependencies.criticalApplications > 0
      ? {
          label: "Critical applications",
          content: (
            <DepChip tone={COL.blue}>
              {dependencies.criticalApplications} business-critical
            </DepChip>
          ),
        }
      : null,
    dependencies.platforms.length
      ? {
          label: "Platforms",
          content: dependencies.platforms.map((platform) => (
            <DepChip key={platform}>{platform}</DepChip>
          )),
        }
      : null,
    dependencies.initiatives.length
      ? {
          label: "Transformation initiatives",
          content: dependencies.initiatives.map((initiative, index) => (
            <DepChip key={`${initiative.name}-${index}`} tone={COL.amber}>
              {initiative.name} · {initiative.status}
            </DepChip>
          )),
        }
      : null,
  ];
  const populatedColumns = columns.filter((column): column is DepColumn =>
    Boolean(column),
  );

  return (
    <section style={PANEL}>
      <PanelHeader
        title="Relationships"
        action={dependencies.vendorRef ?? "Vendor"}
      />
      <div style={DEPENDENCY_GRID}>
        {populatedColumns.length ? (
          populatedColumns.map((column) => (
            <DepCol key={column.label} label={column.label}>
              {column.content}
            </DepCol>
          ))
        ) : (
          <div style={EMPTY_SIDE_COPY}>
            No vendor relationship rows are populated in this view.
          </div>
        )}
      </div>
    </section>
  );
}

function OpportunitiesPanel({ vm }: { vm: SourceWorkspaceVM }) {
  return (
    <section style={PANEL}>
      <PanelHeader
        title="Opportunities"
        action={`${vm.vendorOpps.length} populated`}
      />
      {vm.vendorHasOpps ? (
        <div style={OPPORTUNITY_LIST}>
          {vm.vendorOpps.map((opportunity) => (
            <button
              key={opportunity.ref}
              type="button"
              onClick={opportunity.onClick}
              style={OPPORTUNITY_ROW}
            >
              <span>
                <strong style={ALERT_TITLE}>{opportunity.reasons}</strong>
                <span style={ALERT_BODY}>{opportunity.why}</span>
              </span>
              <span style={OPPORTUNITY_VALUE}>{opportunity.exposed}</span>
            </button>
          ))}
        </div>
      ) : (
        <div style={EMPTY_SIDE_COPY}>
          No deterministic opportunities flagged for this vendor.
        </div>
      )}
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={MINI_STAT}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PanelHeader({ title, action }: { title: string; action: string }) {
  return (
    <div style={PANEL_HEADER}>
      <h2 style={PANEL_TITLE}>{title}</h2>
      <span style={PANEL_ACTION}>{action}</span>
    </div>
  );
}

function DepCol({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div style={DEP_LABEL}>{label}</div>
      <div style={DEP_STACK}>{children}</div>
    </div>
  );
}

function DepChip({
  children,
  onClick,
  tone,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={onClick ? "sw-hover-cream" : undefined}
      style={{
        ...DEP_CHIP,
        borderColor: tone ?? "rgba(10,31,68,.14)",
        color: tone ?? "#23395d",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {children}
    </button>
  );
}

const SHELL: CSSProperties = {
  display: "grid",
  gap: 14,
  color: "#06172f",
};

const HEADER: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 24,
  background: "#fff",
  border: "1px solid rgba(10,31,68,.12)",
  borderRadius: 8,
  padding: "20px 22px",
};

const IDENTITY: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 18,
  minWidth: 0,
};

const MARK: CSSProperties = {
  width: 78,
  height: 78,
  borderRadius: 22,
  display: "grid",
  placeItems: "center",
  flex: "0 0 auto",
  background: "linear-gradient(135deg,#0a0a0b,#2c2c2a)",
  color: "#fff",
  fontSize: 24,
  fontWeight: 850,
  letterSpacing: 0,
};

const CRUMBS: CSSProperties = {
  color: "#5f5e5a",
  fontSize: 12,
  fontWeight: 650,
  marginBottom: 6,
};

const TITLE: CSSProperties = {
  margin: 0,
  color: "#06172f",
  fontSize: 28,
  fontWeight: 800,
  letterSpacing: 0,
  lineHeight: 1.08,
};

const META: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 9,
  color: "#53657f",
  fontSize: 12.5,
  marginTop: 7,
};

const CHIP_ROW: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 7,
  marginTop: 12,
};

const PILL: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 24,
  border: "1px solid",
  borderRadius: 999,
  padding: "0 10px",
  fontSize: 11.5,
  fontWeight: 750,
};

const CONTROL_ROW: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "flex-end",
  gap: 10,
};

const SCOPE_BADGE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 38,
  border: "1px solid rgba(10,31,68,.16)",
  borderRadius: 6,
  background: "#f7f9fc",
  color: "#06172f",
  padding: "0 12px",
  fontSize: 12.5,
  fontWeight: 650,
};

const SUMMARY_ROW: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr) minmax(300px,400px)",
  gap: 14,
};

const METRIC_STRIP: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
  background: "#fff",
  border: "1px solid rgba(10,31,68,.12)",
  borderRadius: 8,
  overflow: "hidden",
};

const METRIC_CARD: CSSProperties = {
  minHeight: 82,
  padding: "14px 15px",
  borderRight: "1px solid rgba(10,31,68,.10)",
};

const METRIC_LABEL: CSSProperties = {
  color: "#06172f",
  fontSize: 11.5,
  fontWeight: 750,
  lineHeight: 1.25,
};

const METRIC_VALUE: CSSProperties = {
  color: "#06172f",
  fontSize: 22,
  fontWeight: 850,
  lineHeight: 1.05,
  marginTop: 8,
};

const METRIC_SUB: CSSProperties = {
  color: "#53657f",
  fontSize: 11.5,
  lineHeight: 1.35,
  marginTop: 5,
};

const EMPTY_METRIC: CSSProperties = {
  color: "#7a8799",
  fontSize: 12.5,
  lineHeight: 1.45,
  padding: 16,
};

const QUICK_ACTIONS: CSSProperties = {
  background: "#fff",
  border: "1px solid rgba(10,31,68,.12)",
  borderRadius: 8,
  padding: "15px 16px",
};

const QUICK_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(82px,1fr))",
  gap: 8,
  marginTop: 12,
};

const QUICK_BUTTON: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  alignContent: "center",
  gap: 7,
  border: "1px solid rgba(10,31,68,.12)",
  borderRadius: 7,
  background: "#f7f9fc",
  color: "#06172f",
  minHeight: 42,
  padding: "0 10px",
  fontSize: 11.5,
  fontWeight: 700,
  cursor: "pointer",
};

const TAB_ROW: CSSProperties = {
  display: "flex",
  gap: 2,
  overflowX: "auto",
  background: "#fff",
  border: "1px solid rgba(10,31,68,.10)",
  borderRadius: 8,
  padding: "0 12px",
};

const TAB_BUTTON: CSSProperties = {
  border: "none",
  borderBottom: "2px solid transparent",
  background: "transparent",
  color: "#53657f",
  cursor: "pointer",
  fontSize: 12.5,
  minHeight: 42,
  padding: "0 14px",
  whiteSpace: "nowrap",
};

const MAIN_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr) minmax(320px,400px)",
  gap: 14,
  alignItems: "start",
};

const SINGLE_COLUMN_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr)",
  gap: 14,
  alignItems: "start",
};

const LEFT_STACK: CSSProperties = {
  display: "grid",
  gap: 14,
  minWidth: 0,
};

const RIGHT_STACK: CSSProperties = {
  display: "grid",
  gap: 14,
  minWidth: 0,
};

const PANEL: CSSProperties = {
  background: "#fff",
  border: "1px solid rgba(10,31,68,.12)",
  borderRadius: 8,
  overflow: "hidden",
};

const SIDE_PANEL: CSSProperties = {
  ...PANEL,
  padding: "15px 16px",
};

const PANEL_HEADER: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: 12,
};

const PANEL_TITLE: CSSProperties = {
  margin: 0,
  color: "#06172f",
  fontSize: 13.5,
  fontWeight: 850,
};

const PANEL_ACTION: CSSProperties = {
  color: "#005bd3",
  fontSize: 11.5,
  fontWeight: 750,
};

const VALUE_SUMMARY: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
  background: "#fff",
  border: "1px solid rgba(10,31,68,.12)",
  borderRadius: 8,
  padding: "13px 16px",
};

const MINI_STAT: CSSProperties = {
  display: "grid",
  gap: 4,
  color: "#53657f",
  fontSize: 11.5,
  borderRight: "1px solid rgba(10,31,68,.10)",
};

const ALERT_LIST: CSSProperties = {
  display: "grid",
  marginTop: 12,
};

const ALERT_ROW: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "26px minmax(0,1fr) auto",
  alignItems: "start",
  gap: 10,
  border: "none",
  borderTop: "1px solid rgba(10,31,68,.09)",
  background: "transparent",
  color: "#06172f",
  cursor: "pointer",
  padding: "12px 0",
  textAlign: "left",
};

const ALERT_DOT: CSSProperties = {
  display: "grid",
  placeItems: "center",
  width: 21,
  height: 21,
  borderRadius: 999,
  color: "#fff",
  fontSize: 12,
  fontWeight: 850,
};

const ALERT_TITLE: CSSProperties = {
  display: "block",
  color: "#06172f",
  fontSize: 12.5,
  lineHeight: 1.35,
};

const ALERT_BODY: CSSProperties = {
  display: "block",
  color: "#53657f",
  fontSize: 11.5,
  lineHeight: 1.4,
  marginTop: 3,
};

const ALERT_LINK: CSSProperties = {
  color: "#005bd3",
  fontSize: 11.5,
  fontWeight: 750,
};

const ASSISTANT_LIST: CSSProperties = {
  display: "grid",
  gap: 8,
  marginTop: 12,
};

const ASSISTANT_CARD: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "24px minmax(0,1fr)",
  gap: 10,
  border: "1px solid rgba(10,31,68,.10)",
  borderRadius: 8,
  background: "#fff",
  color: "#06172f",
  cursor: "pointer",
  padding: "12px",
  textAlign: "left",
};

const SPARK: CSSProperties = {
  color: "#0066cc",
  fontSize: 18,
  lineHeight: 1,
};

const ASSISTANT_CTA: CSSProperties = {
  display: "block",
  color: "#005bd3",
  fontSize: 11.5,
  fontWeight: 750,
  marginTop: 8,
};

const EMPTY_SIDE_COPY: CSSProperties = {
  color: "#7a8799",
  fontSize: 12.5,
  lineHeight: 1.45,
  padding: "12px 0",
};

const DEPENDENCY_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4,minmax(0,1fr))",
  gap: 14,
  padding: 16,
};

const DEP_LABEL: CSSProperties = {
  color: "#5f5e5a",
  fontSize: 10,
  fontWeight: 850,
  letterSpacing: ".08em",
  textTransform: "uppercase",
  marginBottom: 8,
};

const DEP_STACK: CSSProperties = {
  display: "grid",
  gap: 7,
};

const DEP_CHIP: CSSProperties = {
  border: "1px solid rgba(10,31,68,.14)",
  borderRadius: 7,
  background: "#fff",
  padding: "8px 10px",
  textAlign: "left",
  fontSize: 12.5,
  lineHeight: 1.35,
};

const OPPORTUNITY_LIST: CSSProperties = {
  display: "grid",
  gap: 10,
  padding: 16,
};

const OPPORTUNITY_ROW: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr) auto",
  gap: 14,
  border: "1px solid rgba(10,31,68,.10)",
  borderRadius: 8,
  background: "#fff",
  padding: "13px 14px",
  textAlign: "left",
  cursor: "pointer",
};

const OPPORTUNITY_VALUE: CSSProperties = {
  color: "#06172f",
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 12,
  fontWeight: 850,
  whiteSpace: "nowrap",
};

type ValueStripItem = SourceWorkspaceVM["valueStrip"][number];

function isAvailableMetric(
  item: ValueStripItem | undefined,
): item is ValueStripItem {
  return Boolean(item && item.value.trim() && item.value !== "Not established");
}

function isAvailableCell(value: ReactNode): boolean {
  if (value == null || typeof value === "boolean") return false;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "string") return true;
  const trimmed = value.trim();
  return Boolean(
    trimmed &&
    trimmed !== "—" &&
    trimmed !== "-" &&
    trimmed !== "Not established" &&
    trimmed !== "Not verified" &&
    trimmed !== "Unresolved",
  );
}

function hasDeterministicAlerts(vm: SourceWorkspaceVM): boolean {
  return (
    vm.vendorComposition.some((contract) => contract.renewalExposed) ||
    vm.vendorOpps.length > 0
  );
}
