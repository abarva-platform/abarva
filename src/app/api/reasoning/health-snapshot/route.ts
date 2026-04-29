// GET /api/reasoning/health-snapshot
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function computeScore(gatesMet: number, gatesTotal: number, activeContradictions: number): number {
  return Math.round(
    (gatesMet / Math.max(gatesTotal, 1)) * 60 +
      (1 - Math.min(activeContradictions / 5, 1)) * 30 +
      10,
  );
}

export async function GET() {
  const rows = buildHealthBoardRows();
  const total = rows.length;
  const healthy = rows.filter((r) => r.healthLabel === 'healthy').length;
  const warning = rows.filter((r) => r.healthLabel === 'warning').length;
  const critical = rows.filter((r) => r.healthLabel === 'critical').length;
  const unknown = rows.filter((r) => r.healthLabel === 'unknown').length;
  const totalContradictions = rows.reduce((s, r) => s + r.activeContradictions, 0);
  const avgScore = Math.round(
    rows.reduce((s, r) => s + computeScore(r.gatesMet, r.gatesTotal, r.activeContradictions), 0) /
      Math.max(total, 1),
  );

  const sorted = [...rows].sort((a, b) => {
    const sa = computeScore(a.gatesMet, a.gatesTotal, a.activeContradictions);
    const sb = computeScore(b.gatesMet, b.gatesTotal, b.activeContradictions);
    return sb - sa;
  });

  return Response.json({
    total,
    healthy,
    warning,
    critical,
    unknown,
    totalContradictions,
    avgScore,
    top5: sorted.slice(0, 5).map((r) => ({
      id: r.id,
      label: r.label,
      score: computeScore(r.gatesMet, r.gatesTotal, r.activeContradictions),
      healthLabel: r.healthLabel,
      activeContradictions: r.activeContradictions,
    })),
    atRisk: sorted
      .filter((r) => r.healthLabel !== 'healthy')
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        label: r.label,
        healthLabel: r.healthLabel,
        activeContradictions: r.activeContradictions,
      })),
  });
}
