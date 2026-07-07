import { AdminCanonShellV2 } from "@/components/admin/AdminCanonShellV2";
import { AgentRail } from "@/components/admin/AgentRail";
import { resolveAdminTenant } from "@/lib/admin/admin-tenant";
import {
  buildAdminOpsSurfaceModel,
  type AdminOpsOperation,
  type AdminOpsRisk,
  type AdminOpsStatus,
} from "@/lib/admin/ops-surface";
import { COLORS, TYPOGRAPHY } from "@/lib/design/design-tokens";

export const metadata = { title: "Ops Console · Admin · AbarVa" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

const palette = {
  paper: COLORS.cream,
  card: COLORS.white,
  ink: COLORS.ink,
  muted: `${COLORS.ink}99`,
  soft: `${COLORS.ink}b0`,
  line: `${COLORS.ink}1a`,
  amber: COLORS.amberInk,
  amberSoft: COLORS.amberSoft,
  coral: COLORS.coralInk,
};

const statusLabel: Record<AdminOpsStatus, string> = {
  ready: "Ready",
  gated: "Approval gated",
  blocked: "Blocked",
  external: "External",
};

const riskLabel: Record<AdminOpsRisk, string> = {
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
};

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusTone(status: AdminOpsStatus): string {
  if (status === "ready") return palette.ink;
  if (status === "blocked") return palette.coral;
  if (status === "external") return palette.muted;
  return palette.amber;
}

function OperationCard({ operation }: { operation: AdminOpsOperation }) {
  return (
    <article className="ops-card">
      <div className="ops-card-head">
        <div>
          <p className="ops-kicker">{operation.category}</p>
          <h2>{operation.title}</h2>
        </div>
        <div className="ops-badges" aria-label={`${operation.title} status`}>
          <span style={{ color: statusTone(operation.status) }}>
            {statusLabel[operation.status]}
          </span>
          <span>{riskLabel[operation.risk]}</span>
        </div>
      </div>
      <p className="ops-purpose">{operation.purpose}</p>
      <dl className="ops-details">
        <div>
          <dt>Execution path</dt>
          <dd>{operation.executionPath}</dd>
        </div>
        <div>
          <dt>Approval path</dt>
          <dd>{operation.approvalPath}</dd>
        </div>
        <div>
          <dt>Rollback</dt>
          <dd>{operation.rollback}</dd>
        </div>
      </dl>
      <div className="ops-columns">
        <Checklist
          title="Audit evidence"
          items={operation.auditEvidence}
        />
        <Checklist
          title="Validation"
          items={operation.validation}
        />
      </div>
      <div className="ops-foot">
        <span>{operation.dryRunRequired ? "Dry-run required" : "Dry-run optional"}</span>
        <span>{operation.id}</span>
      </div>
    </article>
  );
}

function Checklist({
  title,
  items,
}: {
  title: string;
  items: ReadonlyArray<string>;
}) {
  return (
    <div className="ops-list">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default async function AdminOpsConsolePage() {
  const tenant = await resolveAdminTenant();
  const model = buildAdminOpsSurfaceModel();

  return (
    <AdminCanonShellV2
      tenantName={tenant.tenantName}
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open Production Readiness"
          primaryActionHref="/admin/production-readiness"
        />
      }
    >
      <main className="ops-shell">
        <style>{pageCss}</style>
        <header className="ops-hero">
          <div>
            <p className="ops-eyebrow">Admin · governed operations</p>
            <h1>Ops Console</h1>
            <p>
              Operational actions for {tenant.tenantName}, organized by approval,
              dry-run, validation, rollback, and audit evidence. This page does
              not execute production jobs directly.
            </p>
          </div>
          <div className="ops-snapshot">
            <span>Snapshot</span>
            <strong>{formatTime(model.generatedAt)}</strong>
          </div>
        </header>

        <section className="ops-metrics" aria-label="Ops console summary">
          <Metric label="Ready" value={model.statusCounts.ready} />
          <Metric label="Approval gated" value={model.statusCounts.gated} />
          <Metric label="Blocked" value={model.statusCounts.blocked} />
          <Metric label="External" value={model.statusCounts.external} />
        </section>

        <section className="ops-control-panel" aria-label="Required operation controls">
          <Checklist title="Required controls" items={model.requiredControls} />
          <Checklist title="Blocked until" items={model.blockedUntil} />
        </section>

        <section className="ops-grid" aria-label="Governed operational actions">
          {model.operations.map((operation) => (
            <OperationCard key={operation.id} operation={operation} />
          ))}
        </section>
      </main>
    </AdminCanonShellV2>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="ops-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

const pageCss = `
.ops-shell {
  min-height: 100%;
  background: ${palette.paper};
  color: ${palette.ink};
  padding: 30px 34px 42px;
  font-family: ${TYPOGRAPHY.sans};
}
.ops-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 20px;
  align-items: end;
  margin-bottom: 22px;
}
.ops-eyebrow,
.ops-kicker,
.ops-snapshot span,
.ops-metric span,
.ops-card dt,
.ops-foot {
  font-family: ${TYPOGRAPHY.mono};
  font-size: 11px;
  letter-spacing: 0;
  text-transform: uppercase;
  color: ${palette.muted};
}
.ops-eyebrow,
.ops-kicker {
  margin: 0;
  font-weight: 800;
}
.ops-hero h1 {
  margin: 7px 0 0;
  font-family: ${TYPOGRAPHY.serif};
  font-size: 38px;
  line-height: 1.08;
  font-weight: 400;
  letter-spacing: 0;
}
.ops-hero p {
  margin: 12px 0 0;
  max-width: 760px;
  color: ${palette.soft};
  font-size: 15px;
  line-height: 1.55;
}
.ops-snapshot,
.ops-metric,
.ops-card,
.ops-control-panel {
  border: 1px solid ${palette.line};
  background: ${palette.card};
}
.ops-snapshot {
  min-width: 172px;
  padding: 12px 14px;
}
.ops-snapshot strong {
  display: block;
  margin-top: 5px;
  font-size: 14px;
}
.ops-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}
.ops-metric {
  padding: 13px 14px;
}
.ops-metric strong {
  display: block;
  margin-top: 6px;
  font-size: 24px;
  line-height: 1;
}
.ops-control-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  padding: 17px;
  margin-bottom: 18px;
}
.ops-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.ops-card {
  padding: 18px;
}
.ops-card-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: start;
}
.ops-card h2 {
  margin: 5px 0 0;
  font-family: ${TYPOGRAPHY.serif};
  font-size: 24px;
  line-height: 1.15;
  font-weight: 400;
  letter-spacing: 0;
}
.ops-badges {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}
.ops-badges span {
  border: 1px solid ${palette.line};
  padding: 5px 7px;
  font-family: ${TYPOGRAPHY.mono};
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  white-space: nowrap;
}
.ops-purpose {
  margin: 12px 0 0;
  color: ${palette.soft};
  font-size: 14px;
  line-height: 1.5;
}
.ops-details {
  display: grid;
  gap: 10px;
  margin: 16px 0;
}
.ops-details div {
  border-top: 1px solid ${palette.line};
  padding-top: 10px;
}
.ops-card dt {
  margin-bottom: 4px;
  font-weight: 800;
}
.ops-card dd {
  margin: 0;
  color: ${palette.ink};
  font-size: 13px;
  line-height: 1.45;
}
.ops-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.ops-list h3 {
  margin: 0 0 8px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0;
}
.ops-list ul {
  margin: 0;
  padding-left: 17px;
  color: ${palette.soft};
  font-size: 13px;
  line-height: 1.45;
}
.ops-list li + li {
  margin-top: 5px;
}
.ops-foot {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
  border-top: 1px solid ${palette.line};
  padding-top: 10px;
}
@media (max-width: 980px) {
  .ops-hero,
  .ops-control-panel,
  .ops-grid {
    grid-template-columns: 1fr;
  }
  .ops-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .ops-card-head,
  .ops-columns {
    grid-template-columns: 1fr;
  }
  .ops-badges {
    align-items: flex-start;
  }
}
@media (max-width: 560px) {
  .ops-shell {
    padding: 22px 18px 32px;
  }
  .ops-metrics {
    grid-template-columns: 1fr;
  }
  .ops-hero h1 {
    font-size: 32px;
  }
}
`;
