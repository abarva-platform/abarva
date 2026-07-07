import Link from 'next/link';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { AgentRail } from '@/components/admin/AgentRail';
import { resolveAdminTenant } from '@/lib/admin/admin-tenant';
import {
  loadOutputsDeliverablesExplorerModel,
  type OutputExplorerItem,
} from '@/lib/admin/outputs-deliverables-explorer';
import { getCurrentUser } from '@/lib/auth/current-user';
import { COLORS, TYPOGRAPHY } from '@/lib/design/design-tokens';

export const metadata = { title: 'Outputs · Admin · AbarVa' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const palette = {
  paper: COLORS.cream,
  ink: COLORS.ink,
  muted: `${COLORS.ink}99`,
  soft: `${COLORS.ink}b0`,
  line: `${COLORS.ink}1a`,
  card: COLORS.white,
  amber: COLORS.amberInk,
  coral: COLORS.coralInk,
};

function formatTime(iso: string | null): string {
  if (!iso) return 'No timestamp';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function statusTone(status: string): string {
  if (/approved|locked|signed|complete/i.test(status)) return palette.ink;
  if (/blocked|failed|rejected/i.test(status)) return palette.coral;
  if (/review|pending|draft|needs|not started/i.test(status)) return palette.amber;
  return palette.muted;
}

function originLabel(origin: OutputExplorerItem['origin']): string {
  return origin === 'move' ? 'Move' : 'Source';
}

function OutputRow({ item }: { item: OutputExplorerItem }) {
  return (
    <tr>
      <td>
        <span className="od-origin">{originLabel(item.origin)}</span>
      </td>
      <td>
        <Link className="od-title" href={item.outputHref}>
          {item.title}
        </Link>
        <p className="od-preview">{item.preview}</p>
      </td>
      <td>
        <Link className="od-parent" href={item.parentHref}>
          {item.parentLabel}
        </Link>
        <div className="od-meta">{item.stageLabel}</div>
      </td>
      <td>{item.typeLabel}</td>
      <td>
        <span className="od-status" style={{ color: statusTone(item.status) }}>
          {item.status}
        </span>
      </td>
      <td>{item.ownerLabel}</td>
      <td className="od-time">{formatTime(item.updatedAt)}</td>
    </tr>
  );
}

export default async function AdminOutputsExplorerPage() {
  const [tenant, user] = await Promise.all([
    resolveAdminTenant(),
    getCurrentUser().catch(() => null),
  ]);
  const model = await loadOutputsDeliverablesExplorerModel({ tenant, user });

  return (
    <AdminCanonShellV2
      tenantName={tenant.tenantName}
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open Data Loads"
          primaryActionHref="/admin/setup"
        />
      }
    >
      <main className="od-shell">
        <style>{pageCss}</style>
        <header className="od-header">
          <div>
            <p className="od-eyebrow">Admin · private outputs</p>
            <h1>Outputs and deliverables</h1>
            <p>
              A tenant-scoped read view of Move deliverables and Source event
              artifacts already present in the local read models.
            </p>
          </div>
          <div className="od-generated">
            <span>Snapshot</span>
            <strong>{formatTime(model.generatedAt)}</strong>
          </div>
        </header>

        <section className="od-metrics" aria-label="Outputs explorer summary">
          <Metric label="Total outputs" value={model.totals.totalOutputs} detail={`${model.totals.needsReview} need review`} />
          <Metric label="Move deliverables" value={model.totals.moveOutputs} detail={`${model.totals.parentMoves} parent Moves`} />
          <Metric label="Source artifacts" value={model.totals.sourceOutputs} detail={`${model.totals.parentSourceEvents} Source events`} />
        </section>

        {model.warnings.length > 0 ? (
          <section className="od-warning" aria-label="Data availability warnings">
            {model.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </section>
        ) : null}

        <section className="od-table-wrap" aria-label={`${model.tenantName} outputs and deliverables`}>
          {model.items.length === 0 ? (
            <div className="od-empty">
              <h2>No outputs found</h2>
              <p>
                No Move deliverables or Source artifact states were returned for
                this active tenant. This page does not create outputs or load data.
              </p>
            </div>
          ) : (
            <table className="od-table">
              <thead>
                <tr>
                  <th>Surface</th>
                  <th>Output</th>
                  <th>Parent</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Owner</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {model.items.map((item) => (
                  <OutputRow key={item.id} item={item} />
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </AdminCanonShellV2>
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="od-metric">
      <span>{label}</span>
      <strong>{value.toLocaleString()}</strong>
      <small>{detail}</small>
    </div>
  );
}

const pageCss = `
.od-shell {
  min-height: 100%;
  background: ${palette.paper};
  color: ${palette.ink};
  padding: 30px 34px 42px;
  font-family: ${TYPOGRAPHY.sans};
}
.od-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 20px;
  align-items: end;
  margin-bottom: 22px;
}
.od-eyebrow {
  margin: 0;
  font-family: ${TYPOGRAPHY.mono};
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
  color: ${palette.muted};
}
.od-header h1 {
  margin: 6px 0 0;
  font-family: ${TYPOGRAPHY.serif};
  font-size: 40px;
  font-weight: 400;
  line-height: 1.06;
  letter-spacing: 0;
}
.od-header p {
  margin: 12px 0 0;
  font-family: ${TYPOGRAPHY.sans};
  font-size: 15px;
  line-height: 1.5;
  color: ${palette.soft};
  max-width: 720px;
}
.od-generated {
  border: 1px solid ${palette.line};
  background: ${palette.card};
  padding: 11px 13px;
  min-width: 168px;
}
.od-generated span,
.od-metric span,
.od-metric small,
.od-meta,
.od-time {
  display: block;
  color: ${palette.muted};
  font-family: ${TYPOGRAPHY.mono};
  font-size: 11px;
}
.od-generated strong {
  display: block;
  margin-top: 4px;
  font-size: 13px;
}
.od-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.od-metric {
  border: 1px solid ${palette.line};
  background: ${palette.card};
  padding: 14px 16px;
}
.od-metric strong {
  display: block;
  margin: 8px 0 4px;
  font-size: 28px;
  line-height: 1;
  font-family: ${TYPOGRAPHY.serif};
  font-weight: 500;
}
.od-warning {
  border: 1px solid ${palette.amber}55;
  background: ${COLORS.amberSoft};
  color: ${palette.ink};
  padding: 12px 14px;
  margin-bottom: 16px;
}
.od-warning p {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
}
.od-table-wrap {
  border: 1px solid ${palette.line};
  background: ${palette.card};
  overflow-x: auto;
}
.od-table {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
  table-layout: fixed;
}
.od-table th {
  color: ${palette.muted};
  font-family: ${TYPOGRAPHY.mono};
  font-size: 10px;
  letter-spacing: 0;
  text-transform: uppercase;
  text-align: left;
  padding: 12px 14px;
  border-bottom: 1px solid ${palette.line};
}
.od-table td {
  vertical-align: top;
  padding: 14px;
  border-bottom: 1px solid ${palette.line};
  font-size: 13px;
  line-height: 1.45;
}
.od-table tr:last-child td {
  border-bottom: 0;
}
.od-origin {
  display: inline-flex;
  border: 1px solid ${palette.line};
  padding: 4px 7px;
  font-family: ${TYPOGRAPHY.mono};
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0;
}
.od-title,
.od-parent {
  color: ${palette.ink};
  font-weight: 700;
  text-decoration: none;
}
.od-title:hover,
.od-parent:hover {
  text-decoration: underline;
}
.od-preview {
  margin: 5px 0 0;
  color: ${palette.soft};
  font-size: 12px;
}
.od-status {
  font-family: ${TYPOGRAPHY.mono};
  font-size: 11px;
  font-weight: 700;
}
.od-empty {
  padding: 34px;
}
.od-empty h2 {
  margin: 0 0 8px;
  font-family: ${TYPOGRAPHY.serif};
  font-weight: 400;
}
.od-empty p {
  margin: 0;
  color: ${palette.soft};
  max-width: 620px;
  line-height: 1.55;
}
@media (max-width: 760px) {
  .od-shell {
    padding: 20px 16px 30px;
  }
  .od-header,
  .od-metrics {
    grid-template-columns: 1fr;
  }
}
`;
