import {
  createAtlasObservation,
  getAtlasBenchmark,
  getAtlasPortfolioSummary,
  getAtlasSignalDetail,
  listAtlasObservations,
  listAtlasPrograms,
  listAtlasSignals,
  listAtlasUseCases,
} from '@/lib/atlas/repository';
import type { AtlasSignalSummary, AtlasTenancyCtx } from '@/lib/atlas/types';

export async function query_portfolio_aggregates(ctx: AtlasTenancyCtx) {
  return getAtlasPortfolioSummary(ctx);
}

export async function query_signals(
  ctx: AtlasTenancyCtx,
  options?: { severity?: AtlasSignalSummary['severity']; limit?: number },
) {
  const signals = await listAtlasSignals(ctx, options?.limit ?? 5);
  if (!options?.severity) return signals;
  return signals.filter((signal) => signal.severity === options.severity);
}

export async function query_signal_evidence(ctx: AtlasTenancyCtx, signalId: string) {
  return getAtlasSignalDetail(ctx, signalId);
}

export async function query_cohort_benchmarks(ctx: AtlasTenancyCtx, metricName: string) {
  return getAtlasBenchmark(ctx, metricName);
}

export async function query_use_cases(ctx: AtlasTenancyCtx) {
  return listAtlasUseCases(ctx);
}

export async function query_programs(ctx: AtlasTenancyCtx) {
  return listAtlasPrograms(ctx);
}

export async function get_scripted_opening(ctx: AtlasTenancyCtx) {
  const [portfolio, observations, signals] = await Promise.all([
    getAtlasPortfolioSummary(ctx),
    listAtlasObservations(ctx, 3),
    listAtlasSignals(ctx, 3),
  ]);

  return { portfolio, observations, signals };
}

export async function log_observation(
  ctx: AtlasTenancyCtx,
  input: Parameters<typeof createAtlasObservation>[0],
) {
  return createAtlasObservation({ ...input, ctx });
}
