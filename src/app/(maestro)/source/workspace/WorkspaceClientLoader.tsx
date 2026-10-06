"use client";

import { useEffect, useMemo, useState } from "react";
import { WorkspaceClient } from "../preview/workspace/WorkspaceClient";
import { SourceWorkspaceLoadingShell } from "./SourceWorkspaceLoadingShell";
import type {
  SourceWorkspaceImpactLayer,
  SourceWorkspaceImpactMode,
  SourceWorkspacePortfolioData,
  SourceWorkspaceProviderMode,
} from "../preview/workspace/live/portfolioAdapter";

interface PortfolioResponse {
  readonly portfolio: SourceWorkspacePortfolioData;
  readonly sourceProviderKey: SourceWorkspaceProviderMode;
  readonly impactMode?: SourceWorkspaceImpactMode;
}

interface ImpactResponse {
  readonly impact: SourceWorkspaceImpactLayer;
  readonly sourceProviderKey: SourceWorkspaceProviderMode;
  readonly impactMode?: SourceWorkspaceImpactMode;
}

type ImpactLoadState = "loading" | "ready" | "error";
const PORTFOLIO_RETRY_ATTEMPTS = 2;
const PORTFOLIO_RETRY_DELAY_MS = 800;
/**
 * A stalled impact read must become a state the operator can act on.
 *
 * The evidence badge has three states and only ever had two exits: `fetch`
 * carries no timeout, so a request that never settles leaves "Evidence depth
 * updating" on screen indefinitely, with zero spend, depth and action rows
 * beneath it. A spinner that cannot time out reports a failure as progress.
 */
const IMPACT_TIMEOUT_MS = 20_000;

export function initialPortfolioImpactModeForWorkspaceTab(
  workspaceTab?: string | null,
): SourceWorkspaceImpactMode {
  // The first paint is the governed portfolio shell. Impact/action rows are
  // hydrated after it is visible; the shell already labels that state rather
  // than pretending the rows are absent.
  void workspaceTab;
  return "deferred";
}

function portfolioApiUrl(input: {
  readonly tenantKey: string;
  readonly asOfDateIso: string;
  readonly sourceProviderKey?: SourceWorkspaceProviderMode | null;
  readonly impactMode?: SourceWorkspaceImpactMode;
  readonly responseScope?: "portfolio" | "impact";
}) {
  const params = new URLSearchParams();
  if (input.tenantKey.trim()) params.set("client", input.tenantKey.trim());
  if (input.asOfDateIso.trim()) params.set("asOf", input.asOfDateIso.trim());
  if (input.sourceProviderKey?.trim()) {
    params.set("sourceProvider", input.sourceProviderKey.trim());
  }
  if (input.impactMode) params.set("impact", input.impactMode);
  if (input.responseScope) params.set("scope", input.responseScope);
  const query = params.toString();
  return `/api/source/workspace/portfolio${query ? `?${query}` : ""}`;
}

async function fetchPortfolio(
  url: string,
  remaining = PORTFOLIO_RETRY_ATTEMPTS,
): Promise<PortfolioResponse> {
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.portfolio) {
      const error = new Error(
        payload?.detail ??
          payload?.error ??
          `Source workspace returned ${response.status}`,
      ) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }
    return payload as PortfolioResponse;
  } catch (error) {
    const status =
      error && typeof error === "object" && "status" in error
        ? Number((error as { status?: unknown }).status)
        : null;
    const retryable = status == null || status >= 500;
    if (!retryable || remaining <= 0) throw error;
    await new Promise((resolve) =>
      window.setTimeout(resolve, PORTFOLIO_RETRY_DELAY_MS),
    );
    return fetchPortfolio(url, remaining - 1);
  }
}

/**
 * The impact read is retried and bounded exactly as the portfolio read is.
 *
 * It was neither. `fetchPortfolio` gained retry when transient portfolio reads
 * were failing; the second read on the same page did not, so a transient fault
 * that the totals recovered from silently took the whole evidence layer down
 * with it. That asymmetry is the defect: two reads of the same API, one
 * resilient and one not, on a surface whose headline numbers therefore load
 * while its evidence does not.
 */
async function fetchImpact(
  url: string,
  remaining = PORTFOLIO_RETRY_ATTEMPTS,
): Promise<ImpactResponse> {
  try {
    const response = await fetchWithTimeout(url, IMPACT_TIMEOUT_MS);
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.impact) {
      const error = new Error(
        payload?.detail ??
          payload?.error ??
          `Source workspace impact returned ${response.status}`,
      ) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }
    return payload as ImpactResponse;
  } catch (error) {
    const status =
      error && typeof error === "object" && "status" in error
        ? Number((error as { status?: unknown }).status)
        : null;
    const retryable = status == null || status >= 500;
    if (!retryable || remaining <= 0) throw error;
    await new Promise((resolve) =>
      window.setTimeout(resolve, PORTFOLIO_RETRY_DELAY_MS),
    );
    return fetchImpact(url, remaining - 1);
  }
}

/** `fetch` with an abort, so a stalled read rejects instead of hanging. */
async function fetchWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timer);
  }
}

export function WorkspaceClientLoader({
  tenantName,
  tenantKey,
  asOfDateIso,
  sourceProviderKey,
  initialContractId,
  initialContractTab,
  initialWorkspaceTab,
}: {
  readonly tenantName: string;
  readonly tenantKey: string;
  readonly asOfDateIso: string;
  readonly sourceProviderKey?: SourceWorkspaceProviderMode | null;
  readonly initialContractId?: string | null;
  readonly initialContractTab?: string | null;
  readonly initialWorkspaceTab?: string | null;
}) {
  const [portfolio, setPortfolio] =
    useState<SourceWorkspacePortfolioData | null>(null);
  const [resolvedProvider, setResolvedProvider] =
    useState<SourceWorkspaceProviderMode | null>(sourceProviderKey ?? null);
  const [impactLoadState, setImpactLoadState] =
    useState<ImpactLoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const initialImpactMode = useMemo(
    () => initialPortfolioImpactModeForWorkspaceTab(initialWorkspaceTab),
    [initialWorkspaceTab],
  );
  const initialPortfolioUrl = useMemo(
    () =>
      portfolioApiUrl({
        tenantKey,
        asOfDateIso,
        sourceProviderKey,
        impactMode: initialImpactMode,
      }),
    [asOfDateIso, initialImpactMode, sourceProviderKey, tenantKey],
  );
  const fullUrl = useMemo(
    () =>
      portfolioApiUrl({
        tenantKey,
        asOfDateIso,
        sourceProviderKey,
        impactMode: "full",
        responseScope: "impact",
      }),
    [asOfDateIso, sourceProviderKey, tenantKey],
  );

  useEffect(() => {
    let cancelled = false;
    setPortfolio(null);
    setError(null);
    setImpactLoadState("loading");

    fetchPortfolio(initialPortfolioUrl)
      .then((payload) => {
        if (cancelled) return;
        const fullImpactPromise =
          initialImpactMode === "full"
            ? Promise.resolve({
                impact: payload.portfolio.impact,
                sourceProviderKey: payload.sourceProviderKey,
              })
            : fetchImpact(fullUrl);
        setPortfolio(payload.portfolio);
        setResolvedProvider(payload.sourceProviderKey);

        fullImpactPromise
          .then((impactPayload) => {
            if (cancelled) return;
            setPortfolio((current) =>
              current
                ? {
                    ...current,
                    impact: impactPayload.impact,
                  }
                : current,
            );
            setResolvedProvider(impactPayload.sourceProviderKey);
            setImpactLoadState("ready");
          })
          .catch(() => {
            if (cancelled) return;
            setImpactLoadState("error");
          });
      })
      .catch((err) => {
        if (cancelled) return;
        // The badge is a separate state machine from `error`, and leaving it
        // on "loading" here was its third missing exit.
        setImpactLoadState("error");
        setError(
          err instanceof Error
            ? err.message
            : "Source data could not be loaded.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [fullUrl, initialImpactMode, initialPortfolioUrl]);

  if (error) {
    return (
      <section
        role="alert"
        style={{
          flex: 1,
          display: "grid",
          placeItems: "center",
          minHeight: "100%",
          background: "#f5f1eb",
          color: "#0a0a0b",
          padding: 32,
        }}
      >
        <div
          style={{
            maxWidth: 560,
            border: "1px solid rgba(158, 42, 43, .35)",
            borderRadius: 8,
            background: "#fff",
            padding: 24,
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              color: "#9e2a2b",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: ".12em",
              textTransform: "uppercase",
            }}
          >
            Source unavailable
          </p>
          <h1 style={{ margin: 0, fontSize: 24 }}>
            Contract book could not load.
          </h1>
          <p style={{ margin: "12px 0 0", color: "#5f5e5a", lineHeight: 1.55 }}>
            {error}
          </p>
        </div>
      </section>
    );
  }

  if (!portfolio) {
    return <SourceWorkspaceLoadingShell contractId={initialContractId} />;
  }

  return (
    <WorkspaceClient
      portfolio={portfolio}
      tenantName={tenantName}
      sourceClientKey={tenantKey}
      sourceProviderKey={resolvedProvider}
      impactLoadState={impactLoadState}
      initialContractId={initialContractId}
      initialContractTab={initialContractTab}
      initialWorkspaceTab={initialWorkspaceTab}
    />
  );
}
