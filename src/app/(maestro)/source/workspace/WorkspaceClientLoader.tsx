"use client";

import { useEffect, useMemo, useState } from "react";
import { WorkspaceClient } from "../preview/workspace/WorkspaceClient";
import { SourceWorkspaceLoadingShell } from "./SourceWorkspaceLoadingShell";
import type {
  SourceWorkspacePortfolioData,
  SourceWorkspaceProviderMode,
} from "../preview/workspace/live/portfolioAdapter";

interface PortfolioResponse {
  readonly portfolio: SourceWorkspacePortfolioData;
  readonly sourceProviderKey: SourceWorkspaceProviderMode;
}

function portfolioApiUrl(input: {
  readonly tenantKey: string;
  readonly asOfDateIso: string;
  readonly sourceProviderKey?: SourceWorkspaceProviderMode | null;
}) {
  const params = new URLSearchParams();
  if (input.tenantKey.trim()) params.set("client", input.tenantKey.trim());
  if (input.asOfDateIso.trim()) params.set("asOf", input.asOfDateIso.trim());
  if (input.sourceProviderKey?.trim()) {
    params.set("sourceProvider", input.sourceProviderKey.trim());
  }
  const query = params.toString();
  return `/api/source/workspace/portfolio${query ? `?${query}` : ""}`;
}

export function WorkspaceClientLoader({
  tenantName,
  tenantKey,
  asOfDateIso,
  sourceProviderKey,
  initialContractId,
  initialContractTab,
}: {
  readonly tenantName: string;
  readonly tenantKey: string;
  readonly asOfDateIso: string;
  readonly sourceProviderKey?: SourceWorkspaceProviderMode | null;
  readonly initialContractId?: string | null;
  readonly initialContractTab?: string | null;
}) {
  const [portfolio, setPortfolio] =
    useState<SourceWorkspacePortfolioData | null>(null);
  const [resolvedProvider, setResolvedProvider] =
    useState<SourceWorkspaceProviderMode | null>(sourceProviderKey ?? null);
  const [error, setError] = useState<string | null>(null);
  const url = useMemo(
    () => portfolioApiUrl({ tenantKey, asOfDateIso, sourceProviderKey }),
    [asOfDateIso, sourceProviderKey, tenantKey],
  );

  useEffect(() => {
    let cancelled = false;
    setPortfolio(null);
    setError(null);
    fetch(url, { headers: { Accept: "application/json" } })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.portfolio) {
          throw new Error(
            payload?.detail ??
              payload?.error ??
              `Source workspace returned ${response.status}`,
          );
        }
        return payload as PortfolioResponse;
      })
      .then((payload) => {
        if (cancelled) return;
        setPortfolio(payload.portfolio);
        setResolvedProvider(payload.sourceProviderKey);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Source workspace data could not be loaded.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

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
            Source workspace unavailable
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
    return <SourceWorkspaceLoadingShell tenantName={tenantName} />;
  }

  return (
    <WorkspaceClient
      portfolio={portfolio}
      tenantName={tenantName}
      sourceClientKey={tenantKey}
      sourceProviderKey={resolvedProvider}
      initialContractId={initialContractId}
      initialContractTab={initialContractTab}
    />
  );
}
