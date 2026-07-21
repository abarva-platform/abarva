import type { Metadata } from "next";
import { currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

import { HomeKnowledgeDesignContractSurface } from "@/components/home/HomeKnowledgeDesignContractSurface";
import { HomeSurface } from "@/components/home/HomeSurface";
import { cachedInventorySnapshot } from "@/app/(maestro)/admin/_cached-helpers";
import { AppShell } from "@/components/shell/AppShell";
import { getActiveClientRow } from "@/lib/active-client";
import { buildAdminSetupControlReadModel } from "@/lib/admin/setup-control";
import { getTenantSourceFiles } from "@/lib/context-ingestion/tenant-context-read-model";
import {
  canonicalClientDisplayName,
  getClientOption,
  inferClientKeyFromEmail,
} from "@/lib/client-config";
import { ACTIVE_CLIENT_COOKIE } from "@/lib/tenant/resolveTenant";
import { clientKeyToInventorySubstrateKey } from "@/lib/agent/tools/intelligence/_shared";
import { buildHomeDataQualityModel } from "@/lib/home/home-data-quality";
import { buildHomeEnglishSummary } from "@/lib/home/home-english-summary";
import { applyHomeSummaryClaudeRender } from "@/lib/home/home-summary-claude-render";
import {
  buildHomeSummarySnapshot,
  buildHomeSummarySnapshotFromModuleContext,
} from "@/lib/home/home-summary-snapshot";
import { readHomeKnowledgeDesignContractForTenant } from "@/lib/home/home-knowledge-design-contract";
import { getLocalCxoRuntimeBrowser } from "@/lib/home/local-cxo-runtime";
import { getHomeV6ContextBrowser } from "@/lib/home/v6-context-browser";
import { getHomeV7ContextBrowser } from "@/lib/home/v7-context-browser";
import { getIntelligenceBindingPayload } from "@/lib/intelligence/binding/binding-payload";
import type {
  ModuleContextReadRequest,
  ModuleContextRequestedDomain,
} from "@/lib/enterprise-data/contracts/module-context-apis";
import {
  explainModuleContext,
  getModuleContext,
} from "@/lib/enterprise-data/module-context-serving/module-context-serving";
import {
  applyStoredKnowledgeDimensionNarratives,
  getStoredKnowledgeHomeInsightSummary,
} from "@/lib/enterprise-knowledge/narratives/knowledge-narrative-store";

export const metadata: Metadata = {
  title: "Knowledge · Enterprise Context | AbarVa",
  description:
    "Browse governed enterprise context, source-backed evidence, gaps, relationships, and module readiness.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const HOME_OPTIONAL_DATA_TIMEOUT_MS = 3_000;
const HOME_OPTIONAL_RENDER_TIMEOUT_MS = 4_500;

type HomePageProps = {
  searchParams?: Promise<{
    client?: string | string[];
    dimension?: string | string[];
    tab?: string | string[];
    candidatePreview?: string | string[];
  }>;
};

function firstSearchParam(
  value: string | string[] | null | undefined,
): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function bindingTenantKey(value: string | null | undefined): string | null {
  const key = value?.trim().toLowerCase();
  if (!key) return null;
  if (key === "arcturus" || key === "firstcapital") return "first-capital";
  if (key === "meridian") return "meridian-health";
  if (key === "apexretail") return "apex-retail";
  if (key === "skyharbor") return "skyharbor-air";
  if (key === "lakeshore") return "lakeshore-holdings";
  if (key === "airline-demo" || key === "airline demo") return "skyharbor-air";
  if (key === "healthcare-demo" || key === "healthcare demo") {
    return "meridian-health";
  }
  if (key === "retail-demo" || key === "retail demo") return "apex-retail";
  if (key === "financial-services-demo" || key === "financial services demo") {
    return "first-capital";
  }
  if (key.includes("skyharbor") || key.includes("airline")) {
    return "skyharbor-air";
  }
  if (key.includes("meridian") || key.includes("healthcare")) {
    return "meridian-health";
  }
  if (key.includes("apex") || key.includes("retail")) {
    return "apex-retail";
  }
  if (
    key.includes("arcturus") ||
    key.includes("first-capital") ||
    key.includes("first capital") ||
    key.includes("financial")
  ) {
    return "first-capital";
  }
  if (key.includes("lakeshore")) return "lakeshore-holdings";
  return key;
}

async function withHomePageTimeout<T>(
  label: string,
  promise: Promise<T>,
  fallback: T,
  timeoutMs = HOME_OPTIONAL_DATA_TIMEOUT_MS,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeout = setTimeout(() => {
          console.warn(
            `[home] ${label} exceeded ${timeoutMs}ms; rendering Knowledge fallback.`,
          );
          resolve(fallback);
        }, timeoutMs);
      }),
    ]);
  } catch (error) {
    console.warn(
      `[home] ${label} failed; rendering Knowledge fallback.`,
      error,
    );
    return fallback;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

const HOME_KNOWLEDGE_DOMAINS: ModuleContextRequestedDomain[] = [
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
];

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const requestedClient = firstSearchParam(params?.client);
  const requestedDimension = firstSearchParam(params?.dimension);
  const requestedTab = firstSearchParam(params?.tab);
  const candidatePreviewParam = firstSearchParam(params?.candidatePreview);
  const candidatePreviewEnabled = candidatePreviewParam === "true";
  const [activeClient, clerkUser, cookieStore] = await Promise.all([
    getActiveClientRow(requestedClient).catch(() => null),
    currentUser().catch(() => null),
    cookies().catch(() => null),
  ]);
  const cookieClientKey = cookieStore?.get(ACTIVE_CLIENT_COOKIE)?.value ?? null;
  const clerkEmail =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses?.[0]?.emailAddress ??
    null;
  const metadataClientKey =
    (clerkUser?.publicMetadata?.clientId as string | undefined) ??
    (clerkUser?.publicMetadata?.defaultClientId as string | undefined) ??
    null;
  const inferredClientKey =
    metadataClientKey ?? inferClientKeyFromEmail(clerkEmail);
  const homeTenantKey =
    bindingTenantKey(requestedClient) ??
    bindingTenantKey(cookieClientKey) ??
    bindingTenantKey(inferredClientKey) ??
    bindingTenantKey(activeClient?.key) ??
    bindingTenantKey(activeClient?.name);
  const displayClientKey =
    cookieClientKey ??
    inferredClientKey ??
    activeClient?.key ??
    homeTenantKey ??
    requestedClient;
  const activeTenantName =
    canonicalClientDisplayName({
      key: displayClientKey,
      name: activeClient?.name,
    }) ??
    activeClient?.name ??
    "Your workspace";

  const clientOption = displayClientKey
    ? getClientOption(displayClientKey)
    : null;
  const designContract =
    readHomeKnowledgeDesignContractForTenant(homeTenantKey);
  if (homeTenantKey === "meridian-health" && designContract.pack) {
    return (
      <AppShell
        surface="home"
        topBarProps={{
          tenantName: activeTenantName,
          showLocked: Boolean(activeClient?.key),
          context: clientOption?.vertical
            ? `Knowledge · ${clientOption.vertical}`
            : "Knowledge",
        }}
        hasTenantKey={Boolean(activeClient?.key)}
      >
        <main
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            background: "#FBFAF7",
          }}
        >
          <HomeKnowledgeDesignContractSurface
            pack={designContract.pack}
            selectedDimension={requestedDimension}
            selectedSource={designContract.diagnostics.selectedSource}
            selectedTab={requestedTab}
          />
        </main>
      </AppShell>
    );
  }

  const binding = getIntelligenceBindingPayload(homeTenantKey);
  const moduleContextRequest =
    homeTenantKey || activeClient?.key || requestedClient
      ? ({
          tenantKey:
            homeTenantKey ??
            bindingTenantKey(activeClient?.key ?? requestedClient) ??
            activeClient?.key ??
            requestedClient ??
            "skyharbor-air",
          moduleKey: "home",
          purpose: "context_summary",
          mode: candidatePreviewEnabled ? "candidate_preview" : "active",
          requestedDomains: HOME_KNOWLEDGE_DOMAINS,
          evidencePolicy: "lineage_required",
          relationshipPolicy: "validated_and_candidates",
          actorKey: "home-knowledge-default",
        } satisfies ModuleContextReadRequest)
      : null;
  const moduleContextBundle = moduleContextRequest
    ? await withHomePageTimeout(
        "module context",
        Promise.all([
          getModuleContext(moduleContextRequest, { repoRoot: process.cwd() }),
          explainModuleContext(moduleContextRequest, {
            repoRoot: process.cwd(),
          }),
        ]),
        null,
      )
    : null;
  const moduleContext = moduleContextBundle?.[0] ?? null;
  const moduleContextExplanation = moduleContextBundle?.[1] ?? null;
  const localBrowser = getLocalCxoRuntimeBrowser(
    activeClient?.key ?? homeTenantKey,
  );
  const preferredLocalBrowser =
    localBrowser?.cxoContentSource === "canonical-v3-approved-content" ||
    localBrowser?.runtimeSource === "local-v3-active"
      ? localBrowser
      : null;
  const v7Browser = preferredLocalBrowser
    ? null
    : await withHomePageTimeout(
        "V7 context browser",
        getHomeV7ContextBrowser({
          tenantKey: activeClient?.key ?? homeTenantKey,
        }),
        null,
      );
  const browser =
    preferredLocalBrowser ??
    v7Browser ??
    localBrowser ??
    getHomeV6ContextBrowser(activeClient?.key ?? homeTenantKey);
  const [inventorySnapshot, sourceFiles] =
    clientOption && activeClient?.key
      ? await Promise.all([
          withHomePageTimeout(
            "inventory snapshot",
            cachedInventorySnapshot(
              clientKeyToInventorySubstrateKey(clientOption.id),
            ),
            null,
          ),
          withHomePageTimeout(
            "tenant source files",
            getTenantSourceFiles(activeClient.id),
            [],
          ),
        ])
      : [null, []];
  const setupControl =
    clientOption && activeClient?.key
      ? buildAdminSetupControlReadModel({
          tenantKey: clientOption.id,
          displayName: activeTenantName,
          coverName: clientOption.name,
          snapshot: inventorySnapshot,
          sourceFiles,
        })
      : null;
  const dataQuality = buildHomeDataQualityModel({
    tenantKey: activeClient?.key ?? homeTenantKey,
    tenantDisplayName: activeTenantName,
    candidatePreviewEnabled,
    setupControl,
    browser,
  });
  const englishSummary = buildHomeEnglishSummary(dataQuality);
  const baseSummarySnapshot =
    moduleContext && moduleContextExplanation
      ? buildHomeSummarySnapshotFromModuleContext({
          tenantId: activeClient?.id ?? null,
          tenantKey:
            homeTenantKey ??
            bindingTenantKey(activeClient?.key ?? requestedClient) ??
            activeClient?.key ??
            requestedClient ??
            moduleContext.tenantKey,
          displayName: activeTenantName,
          industry: clientOption?.vertical ?? null,
          moduleContext,
          moduleContextExplanation,
          repoRoot: process.cwd(),
        })
      : buildHomeSummarySnapshot({
          repoRoot: process.cwd(),
          tenantId: activeClient?.id ?? null,
          tenantKey: homeTenantKey ?? activeClient?.key ?? requestedClient,
          displayName: activeTenantName,
          industry: clientOption?.vertical ?? null,
          mode: candidatePreviewEnabled
            ? "candidate_preview"
            : "active_home_context",
          browser,
          setupControl,
          dataQuality,
          englishSummary,
        });
  const renderedSummarySnapshot =
    candidatePreviewEnabled || !moduleContext
      ? baseSummarySnapshot
      : await withHomePageTimeout(
          "Claude summary render",
          applyHomeSummaryClaudeRender({ snapshot: baseSummarySnapshot }),
          baseSummarySnapshot,
          HOME_OPTIONAL_RENDER_TIMEOUT_MS,
        );
  const summarySnapshot = applyStoredKnowledgeDimensionNarratives(
    renderedSummarySnapshot,
    homeTenantKey ?? activeClient?.key ?? requestedClient,
  );
  const homeInsightSummary = getStoredKnowledgeHomeInsightSummary(
    homeTenantKey ?? activeClient?.key ?? requestedClient,
  );

  return (
    <AppShell
      surface="home"
      topBarProps={{
        tenantName: activeTenantName,
        showLocked: Boolean(activeClient?.key),
        context: clientOption?.vertical
          ? `Knowledge · ${clientOption.vertical}`
          : "Knowledge",
      }}
      hasTenantKey={Boolean(activeClient?.key)}
    >
      <main
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          background: "#FBFAF7",
        }}
      >
        <HomeSurface
          candidatePreviewEnabled={candidatePreviewEnabled}
          clientKey={activeClient?.key ?? homeTenantKey}
          moduleContext={moduleContext}
          moduleContextExplanation={moduleContextExplanation}
          knowledgeCutover={{
            defaultUsesKnowledgeLayer: Boolean(moduleContext),
            fallbackUsed: !moduleContext,
            sourceMode: moduleContext?.sourceMode ?? "active_not_available",
          }}
          payload={binding}
          setupControl={setupControl}
          dataQuality={dataQuality}
          englishSummary={englishSummary}
          homeInsightSummary={homeInsightSummary}
          summarySnapshot={summarySnapshot}
          v6Browser={browser}
        />
      </main>
    </AppShell>
  );
}
