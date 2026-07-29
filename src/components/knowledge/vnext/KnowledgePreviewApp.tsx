"use client";

/**
 * Client entry for the admin preview. Wires the ConsumptionRuntimeProvider (from
 * a fixture selection made in an explicitly-labeled admin-development control),
 * the shell state, and the shell itself.
 *
 * The fixture/scenario selector is the ONLY place a tenant is chosen by a human,
 * and only for fixture_only data. In production this control is absent and the
 * runtime binds to the server-resolved tenant + the HTTP consumption provider.
 */

import { useState } from "react";
import {
  ConsumptionRuntimeProvider,
  type ConsumptionSource,
} from "@/lib/knowledge/consumption-client";
import { FIXTURE_SCENARIOS, type FixtureScenario } from "@/lib/knowledge/fixtures";
import { KnowledgeShellStateProvider } from "./state";
import { KnowledgeShell } from "./KnowledgeShell";
import "./knowledge-vnext.css";

export interface FixtureTenantOption {
  tenantKey: string;
  displayName: string;
  industry: string;
}

export function KnowledgePreviewApp({
  fixtureTenants,
  defaultTenantKey,
  source,
  activationBlocked,
}: {
  fixtureTenants: FixtureTenantOption[];
  defaultTenantKey: string;
  source?: ConsumptionSource;
  activationBlocked?: {
    tenantKey: string;
    reason: string;
  };
}) {
  const [tenantKey, setTenantKey] = useState(defaultTenantKey);
  const [scenario, setScenario] = useState<FixtureScenario>("normal");
  const runtimeSource =
    source ?? { kind: "fixture" as const, tenantKey, scenario };

  if (activationBlocked) {
    return <ClientActivationBlocked {...activationBlocked} />;
  }

  return (
    <ConsumptionRuntimeProvider source={runtimeSource}>
      <KnowledgeShellStateProvider>
        <div className="kv-root">
          {runtimeSource.kind === "http" ? (
            <AdminHttpCanaryControl
              tenantKey={runtimeSource.tenantKey}
              modelsEnabled={runtimeSource.modelsEnabled === true}
            />
          ) : (
            <AdminFixtureControl
              fixtureTenants={fixtureTenants}
              tenantKey={tenantKey}
              scenario={scenario}
              onTenant={setTenantKey}
              onScenario={setScenario}
            />
          )}
          <KnowledgeShell />
        </div>
      </KnowledgeShellStateProvider>
    </ConsumptionRuntimeProvider>
  );
}

function ClientActivationBlocked({
  tenantKey,
  reason,
}: {
  tenantKey: string;
  reason: string;
}) {
  return (
    <div className="kv-root">
      <main className="kv-activation-block" aria-labelledby="knowledge-activation-title">
        <div className="kv-activation-panel">
          <p className="kv-eyebrow">Knowledge activation gate</p>
          <h1 id="knowledge-activation-title">Client Knowledge UI is not activated.</h1>
          <p>
            {reason} This page is blocked from showing raw projection inventory,
            parser sample rows, internal identifiers, disabled advisor rails, or
            any other operator-only diagnostics as a client experience.
          </p>
          <div className="kv-activation-grid" aria-label="Knowledge activation status">
            <div>
              <span className="kv-activation-kicker">Tenant</span>
              <strong>{tenantKey}</strong>
            </div>
            <div>
              <span className="kv-activation-kicker">Foundation data</span>
              <strong>Frozen and governed</strong>
            </div>
            <div>
              <span className="kv-activation-kicker">Client UI</span>
              <strong>Acceptance blocked</strong>
            </div>
            <div>
              <span className="kv-activation-kicker">Next proof</span>
              <strong>Design and content QA</strong>
            </div>
          </div>
          <p className="kv-activation-note">
            Operators can still run the explicit canary proof route when they need
            to verify baseline/API identity. Client review must use the approved
            Knowledge design surface after it passes product QA.
          </p>
        </div>
      </main>
    </div>
  );
}

function AdminHttpCanaryControl({
  tenantKey,
  modelsEnabled,
}: {
  tenantKey: string;
  modelsEnabled: boolean;
}) {
  return (
    <div className="kv-adminbar" role="region" aria-label="Admin HTTP canary control">
      <span className="kv-tag">Admin canary · HTTP provider</span>
      <span>Tenant: <strong>{tenantKey}</strong></span>
      <span>Fixtures prohibited</span>
      <span>aVa models: {modelsEnabled ? "enabled" : "disabled"}</span>
      <span style={{ opacity: 0.7 }}>
        Uses the active governed Knowledge Baseline via consumption APIs
      </span>
    </div>
  );
}

function AdminFixtureControl({
  fixtureTenants,
  tenantKey,
  scenario,
  onTenant,
  onScenario,
}: {
  fixtureTenants: FixtureTenantOption[];
  tenantKey: string;
  scenario: FixtureScenario;
  onTenant: (k: string) => void;
  onScenario: (s: FixtureScenario) => void;
}) {
  return (
    <div className="kv-adminbar" role="region" aria-label="Admin development control">
      <span className="kv-tag">Admin dev · fixtures only</span>
      <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
        Tenant
        <select className="kv-select" value={tenantKey} onChange={(e) => onTenant(e.target.value)} aria-label="Fixture tenant">
          {fixtureTenants.map((t) => (
            <option key={t.tenantKey} value={t.tenantKey}>{t.displayName} ({t.industry})</option>
          ))}
        </select>
      </label>
      <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
        Scenario
        <select className="kv-select" value={scenario} onChange={(e) => onScenario(e.target.value as FixtureScenario)} aria-label="Fixture scenario">
          {FIXTURE_SCENARIOS.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
      </label>
      <span style={{ opacity: 0.7 }}>Synthetic namespace · no tenant data · not activated for any client</span>
    </div>
  );
}
