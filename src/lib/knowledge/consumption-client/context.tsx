"use client";

/**
 * React context for the ConsumptionRuntime. The admin preview route resolves the
 * tenant server-side and passes down a validated fixture selection; this client
 * provider builds the runtime and exposes it. Components read the runtime via
 * `useConsumption()` and never construct a provider themselves.
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { FixtureScenario } from "../fixtures";
import { createFixtureRuntime, createHttpRuntime, type ConsumptionRuntime } from "./factory";

const ConsumptionContext = createContext<ConsumptionRuntime | null>(null);

export type ConsumptionSource =
  | { kind: "fixture"; tenantKey: string; scenario: FixtureScenario }
  | { kind: "http"; tenantKey: string; modelsEnabled?: boolean };

export function ConsumptionRuntimeProvider({
  source,
  children,
}: {
  source: ConsumptionSource;
  children: ReactNode;
}) {
  const runtime = useMemo<ConsumptionRuntime>(() => {
    if (source.kind === "fixture") {
      return createFixtureRuntime(source.tenantKey, source.scenario);
    }
    return createHttpRuntime(source.tenantKey, {
      modelsEnabled: source.modelsEnabled,
    });
  }, [source]);

  return (
    <ConsumptionContext.Provider value={runtime}>
      {children}
    </ConsumptionContext.Provider>
  );
}

export function useConsumption(): ConsumptionRuntime {
  const ctx = useContext(ConsumptionContext);
  if (!ctx) {
    throw new Error(
      "useConsumption must be used within a ConsumptionRuntimeProvider.",
    );
  }
  return ctx;
}
