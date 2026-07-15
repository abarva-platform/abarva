import { connection } from "next/server";
import type { CSSProperties } from "react";

import {
  buildKnowledgeLayerLivePreviewProof,
  isKnowledgeLayerLivePreviewRequested,
  KNOWLEDGE_LAYER_LIVE_PREVIEW_PROOF_TOKEN,
  KNOWLEDGE_LAYER_LIVE_PREVIEW_QUERY_PARAM,
  KNOWLEDGE_LAYER_LIVE_PREVIEW_ROUTE,
} from "../../../../lib/enterprise-knowledge/live-preview";

export const metadata = {
  title: "Knowledge Preview | AbarVa Admin",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageSearchParams {
  proof?: string | string[];
}

export default async function KnowledgePreviewPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  await connection();
  const params = searchParams ? await searchParams : {};
  const previewEnabled = isKnowledgeLayerLivePreviewRequested(params.proof);

  if (!previewEnabled) {
    return <DisabledKnowledgePreview />;
  }

  const proof = buildKnowledgeLayerLivePreviewProof({
    generatedAt: "2026-07-15T00:00:00.000Z",
  });

  return (
    <main style={styles.page} data-knowledge-layer-live-preview="enabled">
      <section style={styles.hero}>
        <div>
          <p style={styles.eyebrow}>Admin / Enterprise Knowledge / Proof-only route</p>
          <h1 style={styles.h1}>Knowledge Layer Live Preview</h1>
          <p style={styles.lede}>
            Hidden, read-only proof that Nexus Knowledge, Moves, and Intelligence
            can inspect the same governed context without changing default module
            behavior or tenant truth.
          </p>
        </div>
        <div style={styles.statusCard}>
          <span style={styles.statusDot} />
          <strong>{proof.verdict}</strong>
          <span>Explicit proof token accepted</span>
        </div>
      </section>

      <section style={styles.guardrailPanel} aria-label="Live preview guardrails">
        <Guardrail label="Route hidden from navigation" value={proof.truthSplit.routeHiddenFromNavigation} />
        <Guardrail label="Candidate promoted" value={proof.truthSplit.candidatePromoted} invert />
        <Guardrail
          label="Active Tenant Access updated"
          value={proof.truthSplit.activeTenantAccessUpdated}
          invert
        />
        <Guardrail
          label="Production tenant data written"
          value={proof.truthSplit.productionTenantDataWritten}
          invert
        />
        <Guardrail
          label="Module runtime consumption changed"
          value={proof.truthSplit.moduleRuntimeConsumptionChanged}
          invert
        />
        <Guardrail
          label="Default Claude behavior changed"
          value={proof.truthSplit.defaultClaudeBehaviorChanged}
          invert
        />
      </section>

      <section style={styles.platformFlow}>
        <p style={styles.eyebrow}>Enterprise context powers the platform</p>
        <h2 style={styles.h2}>One context layer, three proof surfaces</h2>
        <div style={styles.flowGrid}>
          <FlowStep label="Nexus Knowledge" body="Executive brief, context confidence, evidence, relationships, gaps, and profile drill-downs." />
          <FlowStep label="Moves" body="Phase-aware preview artifact with evidence, gaps, caveats, and append-only review controls." />
          <FlowStep label="Intelligence" body="Progressive context assembly with fast packet, deep packet, and Claude-ready payload prepared but not called by this proof." />
        </div>
      </section>

      <section style={styles.scenarioGrid} aria-label="Preview scenario proof cards">
        {proof.scenarios.map((scenario) => (
          <article key={scenario.outputFile} style={styles.scenarioCard}>
            <p style={styles.eyebrow}>{scenario.tenantKey}</p>
            <h3 style={styles.h3}>{scenario.title}</h3>
            <p style={styles.cardCopy}>{scenario.qualityAssessment}</p>
            <dl style={styles.metrics}>
              <Metric label="Shared profiles" value={scenario.sharedProfiles} />
              <Metric label="Shared relationships" value={scenario.sharedRelationships} />
              <Metric label="Shared evidence" value={scenario.sharedEvidenceRefs} />
              <Metric label="Confidence" value={scenario.confidenceOverall.home} />
            </dl>
          </article>
        ))}
      </section>

      <section style={styles.detailPanel}>
        <p style={styles.eyebrow}>Truth boundary</p>
        <h2 style={styles.h2}>This is live preview, not active promotion</h2>
        <p style={styles.ledeDark}>
          The preview route can show governed context only when the explicit token
          is present. It does not expose a nav item, does not write tenant data,
          does not promote candidates, and does not make modules read candidate
          data by default.
        </p>
      </section>
    </main>
  );
}

function DisabledKnowledgePreview() {
  return (
    <main style={styles.page} data-knowledge-layer-live-preview="disabled">
      <section style={styles.hero}>
        <div>
          <p style={styles.eyebrow}>Admin / Enterprise Knowledge / Proof-only route</p>
          <h1 style={styles.h1}>Knowledge Layer Preview Disabled</h1>
          <p style={styles.lede}>
            This route is hidden and defaults to a guardrail-only view. Add{" "}
            <code style={styles.code}>
              ?{KNOWLEDGE_LAYER_LIVE_PREVIEW_QUERY_PARAM}=
              {KNOWLEDGE_LAYER_LIVE_PREVIEW_PROOF_TOKEN}
            </code>{" "}
            to run the lab-only preview proof.
          </p>
        </div>
        <div style={styles.statusCard}>
          <span style={styles.warnDot} />
          <strong>Disabled</strong>
          <span>No proof token supplied</span>
        </div>
      </section>
      <section style={styles.guardrailPanel} aria-label="Disabled preview guardrails">
        <Guardrail label="Default route behavior unchanged" value />
        <Guardrail label="Navigation exposed" value={false} invert />
        <Guardrail label="Tenant data written" value={false} invert />
        <Guardrail label="Candidate promoted" value={false} invert />
      </section>
      <section style={styles.detailPanel}>
        <p style={styles.eyebrow}>Route</p>
        <h2 style={styles.h2}>{KNOWLEDGE_LAYER_LIVE_PREVIEW_ROUTE}</h2>
        <p style={styles.ledeDark}>
          This page exists for operator proof only. It is deliberately not part
          of product navigation.
        </p>
      </section>
    </main>
  );
}

function Guardrail({
  label,
  value,
  invert = false,
}: {
  label: string;
  value: boolean;
  invert?: boolean;
}) {
  const passed = invert ? !value : value;
  return (
    <div style={styles.guardrail}>
      <span style={passed ? styles.statusDot : styles.warnDot} />
      <span>{label}</span>
      <strong>{String(value)}</strong>
    </div>
  );
}

function FlowStep({ label, body }: { label: string; body: string }) {
  return (
    <article style={styles.flowStep}>
      <h3 style={styles.h3}>{label}</h3>
      <p style={styles.cardCopy}>{body}</p>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    color: "#071733",
    padding: "48px 28px 72px",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  hero: {
    maxWidth: 1160,
    margin: "0 auto 22px",
    display: "flex",
    justifyContent: "space-between",
    gap: 24,
    alignItems: "stretch",
    background: "#071733",
    color: "white",
    borderRadius: 12,
    padding: 32,
  },
  eyebrow: {
    margin: 0,
    color: "#087963",
    fontSize: 12,
    letterSpacing: "0.14em",
    fontWeight: 800,
    textTransform: "uppercase",
  },
  h1: { margin: "10px 0 12px", fontSize: 46, lineHeight: 1.05, letterSpacing: 0 },
  h2: { margin: "8px 0 10px", fontSize: 28, lineHeight: 1.15, letterSpacing: 0 },
  h3: { margin: "8px 0 8px", fontSize: 20, lineHeight: 1.2, letterSpacing: 0 },
  lede: { margin: 0, color: "#d9e5fa", fontSize: 18, lineHeight: 1.55, maxWidth: 800 },
  ledeDark: { margin: 0, color: "#30415f", fontSize: 17, lineHeight: 1.55, maxWidth: 900 },
  statusCard: {
    minWidth: 260,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 10,
    padding: 18,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    background: "#2ab57d",
    display: "inline-block",
  },
  warnDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    background: "#c78122",
    display: "inline-block",
  },
  code: {
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 6,
    padding: "2px 6px",
    color: "white",
  },
  guardrailPanel: {
    maxWidth: 1160,
    margin: "0 auto 22px",
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,
  },
  guardrail: {
    background: "white",
    border: "1px solid #dde5f0",
    borderRadius: 10,
    padding: 14,
    display: "grid",
    gridTemplateColumns: "18px 1fr auto",
    alignItems: "center",
    gap: 10,
    boxShadow: "0 10px 28px rgba(11, 24, 55, 0.06)",
  },
  platformFlow: {
    maxWidth: 1160,
    margin: "0 auto 22px",
    background: "white",
    border: "1px solid #dde5f0",
    borderRadius: 12,
    padding: 26,
  },
  flowGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 14,
  },
  flowStep: {
    border: "1px solid #e5ebf4",
    borderRadius: 10,
    padding: 18,
    background: "#fbfcff",
  },
  scenarioGrid: {
    maxWidth: 1160,
    margin: "0 auto 22px",
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 14,
  },
  scenarioCard: {
    background: "white",
    border: "1px solid #dde5f0",
    borderRadius: 12,
    padding: 22,
    boxShadow: "0 12px 34px rgba(11, 24, 55, 0.06)",
  },
  cardCopy: { margin: 0, color: "#314360", fontSize: 15, lineHeight: 1.5 },
  metrics: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 10,
    margin: "16px 0 0",
  },
  detailPanel: {
    maxWidth: 1160,
    margin: "0 auto",
    background: "white",
    border: "1px solid #dde5f0",
    borderRadius: 12,
    padding: 26,
  },
};
