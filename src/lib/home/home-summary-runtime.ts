import type { AdminSetupControlResponse } from "@/lib/admin/setup-control";
import {
  explainModuleContext,
  getModuleContext,
} from "@/lib/enterprise-data/module-context-serving/module-context-serving";
import type { HomeDataQualityModel } from "@/lib/home/home-data-quality";
import type { HomeEnglishSummary } from "@/lib/home/home-english-summary";
import {
  buildHomeSummarySnapshot,
  buildHomeSummarySnapshotFromModuleContext,
  type HomeSummarySnapshot,
  type HomeSummarySnapshotMode,
} from "@/lib/home/home-summary-snapshot";
import { applyHomeSummaryClaudeRender } from "@/lib/home/home-summary-claude-render";
import type { HomeV6ContextBrowser } from "@/lib/home/v6-context-browser";

const HOME_CONTEXT_DOMAINS = [
  "enterprise_profile",
  "functions",
  "applications_systems",
  "vendors_contracts",
  "data_assets_integrations",
  "programs_priorities",
  "risks_controls",
  "metrics_outcomes",
  "relationships",
  "evidence_sources",
] as const;

export interface HomeRuntimeSummarySnapshotOptions {
  repoRoot?: string;
  tenantId?: string | null;
  tenantKey: string | null | undefined;
  displayName?: string | null;
  industry?: string | null;
  mode?: HomeSummarySnapshotMode;
  browser?: HomeV6ContextBrowser | null;
  setupControl?: AdminSetupControlResponse | null;
  dataQuality?: HomeDataQualityModel | null;
  englishSummary?: HomeEnglishSummary | null;
  generatedAt?: string;
}

export async function buildHomeRuntimeSummarySnapshot(
  options: HomeRuntimeSummarySnapshotOptions,
): Promise<HomeSummarySnapshot> {
  const tenantKey = options.tenantKey?.trim();
  const mode = options.mode ?? "active_home_context";
  const fallback = () =>
    buildHomeSummarySnapshot({
      repoRoot: options.repoRoot,
      tenantId: options.tenantId ?? null,
      tenantKey,
      displayName: options.displayName,
      industry: options.industry,
      mode,
      browser: options.browser ?? null,
      setupControl: options.setupControl ?? null,
      dataQuality: options.dataQuality ?? null,
      englishSummary: options.englishSummary ?? null,
      generatedAt: options.generatedAt,
    });
  const renderForHome = (snapshot: HomeSummarySnapshot) =>
    mode === "candidate_preview"
      ? snapshot
      : applyHomeSummaryClaudeRender({ snapshot });

  if (!tenantKey || mode === "candidate_preview") {
    return renderForHome(fallback());
  }

  const request = {
    tenantKey,
    moduleKey: "home" as const,
    purpose: "context_summary" as const,
    requestedDomains: [...HOME_CONTEXT_DOMAINS],
  };
  const [moduleContext, moduleContextExplanation] = await Promise.all([
    getModuleContext(request, {
      repoRoot: options.repoRoot ?? process.cwd(),
      generatedAt: options.generatedAt,
    }),
    explainModuleContext(request, {
      repoRoot: options.repoRoot ?? process.cwd(),
      generatedAt: options.generatedAt,
    }),
  ]).catch(() => [null, null] as const);

  if (
    !moduleContext ||
    !moduleContextExplanation ||
    moduleContext.sourceMode !== "active_tenant_access"
  ) {
    return renderForHome(fallback());
  }

  return renderForHome(
    buildHomeSummarySnapshotFromModuleContext({
      repoRoot: options.repoRoot,
      tenantId: options.tenantId ?? null,
      tenantKey,
      displayName: options.displayName,
      industry: options.industry,
      moduleContext,
      moduleContextExplanation,
      generatedAt: options.generatedAt,
    }),
  );
}
