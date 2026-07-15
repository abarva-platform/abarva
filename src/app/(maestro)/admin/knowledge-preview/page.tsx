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
  title: "Nexus Knowledge Preview | AbarVa Admin",
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
  const meridianScenarios = proof.scenarios.filter(
    (scenario) => scenario.tenantKey === "meridian-health",
  );
  const additionalScenarios = proof.scenarios.filter(
    (scenario) => scenario.tenantKey !== "meridian-health",
  );

  return (
    <main style={styles.page} data-knowledge-layer-live-preview="enabled">
      <section style={styles.hero} aria-label="Nexus Knowledge demo preview">
        <div style={styles.heroCopy}>
          <p style={styles.eyebrowLight}>Nexus Knowledge / Internal Preview</p>
          <h1 style={styles.h1}>Nexus knows the enterprise before aVa answers.</h1>
          <p style={styles.lede}>
            A live lab preview showing how governed enterprise context becomes
            a clear read on use cases, evidence, gaps, and module readiness for
            Home, Moves, and Intelligence.
          </p>
          <div style={styles.heroActions}>
            <span style={styles.successPill}>Preview ready</span>
            <span style={styles.mutedPill}>Hidden route</span>
            <span style={styles.mutedPill}>No runtime behavior change</span>
          </div>
        </div>
        <div style={styles.heroDiagram} aria-label="Context to module flow">
          <MiniFlow label="Enterprise context" />
          <FlowArrow />
          <MiniFlow label="Knowledge layer" emphasis />
          <FlowArrow />
          <div style={styles.moduleStack}>
            <span>Home</span>
            <span>Moves</span>
            <span>Intelligence</span>
          </div>
        </div>
      </section>

      <section style={styles.messagePanel} aria-label="Demo story">
        <p style={styles.eyebrow}>What this demonstrates</p>
        <h2 style={styles.h2}>Enterprise context becomes governed execution context.</h2>
        <p style={styles.ledeDark}>
          Nexus Knowledge assembles source-backed systems, data, process, risk,
          evidence, and relationship context into module-ready packets. Home can
          explain what is known, Moves can shape a governed execution path, and
          Intelligence can prepare a Claude-ready payload without changing the
          default product path.
        </p>
      </section>

      <section style={styles.platformFlow} aria-label="Enterprise context powers the platform">
        <div style={styles.sectionHeader}>
          <div>
            <p style={styles.eyebrow}>Enterprise context powers the platform</p>
            <h2 style={styles.h2}>One governed layer, multiple product surfaces.</h2>
          </div>
          <span style={styles.statusBadge}>Lab ready</span>
        </div>
        <div style={styles.flowGrid}>
          <FlowStep
            label="Home"
            body="Explains what the enterprise context can support today: facts, evidence, gaps, and relationship confidence."
          />
          <FlowStep
            label="Moves"
            body="Turns the context into phase-aware execution inputs: evidence, caveats, and next validations."
          />
          <FlowStep
            label="Intelligence"
            body="Prepares the governed context packet aVa needs before advisory reasoning begins."
          />
        </div>
      </section>

      <section style={styles.demoSection} aria-label="Meridian demo examples">
        <div style={styles.sectionHeader}>
          <div>
            <p style={styles.eyebrow}>Meeting-ready examples</p>
            <h2 style={styles.h2}>Meridian scenarios show the pattern clearly.</h2>
          </div>
          <span style={styles.subtleBadge}>Feature flag only</span>
        </div>
        <div style={styles.scenarioGrid}>
          {meridianScenarios.map((scenario) => (
            <DemoScenarioCard key={scenario.outputFile} scenario={scenario} />
          ))}
        </div>
      </section>

      <details style={styles.collapsedPanel}>
        <summary style={styles.summaryRow}>Show proof details and guardrails</summary>
        <div style={styles.proofVerdictRow}>
          <span style={styles.eyebrow}>Verification</span>
          <strong data-knowledge-preview-verdict={proof.verdict}>{proof.verdict}</strong>
        </div>
        <div style={styles.guardrailPanel} aria-label="Live preview guardrails">
          <Guardrail
            label="Route hidden from navigation"
            value={proof.truthSplit.routeHiddenFromNavigation}
          />
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
        </div>
        <div style={styles.secondaryScenarioGrid}>
          {additionalScenarios.map((scenario) => (
            <DemoScenarioCard key={scenario.outputFile} scenario={scenario} compact />
          ))}
        </div>
      </details>
    </main>
  );
}

function DisabledKnowledgePreview() {
  return (
    <main style={styles.page} data-knowledge-layer-live-preview="disabled">
      <section style={styles.hero}>
        <div>
          <p style={styles.eyebrowLight}>Admin / Nexus Knowledge / Hidden route</p>
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

function DemoScenarioCard({
  scenario,
  compact = false,
}: {
  scenario: {
    outputFile: string;
    title: string;
    tenantKey: string;
    sharedProfiles: number;
    sharedRelationships: number;
    sharedEvidenceRefs: number;
    confidenceOverall: { home: string };
    qualityAssessment: string;
  };
  compact?: boolean;
}) {
  return (
    <article style={compact ? styles.compactScenarioCard : styles.scenarioCard}>
      <p style={styles.eyebrow}>{scenario.tenantKey}</p>
      <h3 style={styles.h3}>{scenario.title}</h3>
      <p style={styles.cardCopy}>{scenario.qualityAssessment}</p>
      <dl style={styles.metrics}>
        <Metric label="Profiles" value={scenario.sharedProfiles} />
        <Metric label="Relationships" value={scenario.sharedRelationships} />
        <Metric label="Evidence refs" value={scenario.sharedEvidenceRefs} />
        <Metric label="Confidence" value={scenario.confidenceOverall.home} />
      </dl>
    </article>
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

function MiniFlow({ label, emphasis = false }: { label: string; emphasis?: boolean }) {
  return <span style={emphasis ? styles.flowNodeEmphasis : styles.flowNode}>{label}</span>;
}

function FlowArrow() {
  return <span style={styles.flowArrow}>-&gt;</span>;
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
  heroCopy: {
    flex: "1 1 620px",
  },
  heroActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 22,
  },
  heroDiagram: {
    flex: "0 0 390px",
    alignSelf: "center",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: 12,
    padding: 20,
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr auto 1fr",
    alignItems: "center",
    gap: 10,
  },
  eyebrow: {
    margin: 0,
    color: "#087963",
    fontSize: 12,
    letterSpacing: "0.14em",
    fontWeight: 800,
    textTransform: "uppercase",
  },
  eyebrowLight: {
    margin: 0,
    color: "#78f4d9",
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
  successPill: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "8px 12px",
    background: "#dff8ee",
    color: "#08654f",
    fontSize: 13,
    fontWeight: 800,
  },
  mutedPill: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "8px 12px",
    background: "rgba(255,255,255,0.1)",
    color: "#eaf2ff",
    border: "1px solid rgba(255,255,255,0.16)",
    fontSize: 13,
    fontWeight: 700,
  },
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
  messagePanel: {
    maxWidth: 1160,
    margin: "0 auto 22px",
    background: "white",
    border: "1px solid #dde5f0",
    borderRadius: 12,
    padding: 28,
    boxShadow: "0 12px 34px rgba(11, 24, 55, 0.05)",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 18,
    marginBottom: 18,
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    padding: "9px 13px",
    background: "#dff8ee",
    color: "#08654f",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  subtleBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    padding: "9px 13px",
    background: "#eef4ff",
    color: "#29466f",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  guardrailPanel: {
    margin: "16px 0 0",
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
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 14,
  },
  demoSection: {
    maxWidth: 1160,
    margin: "0 auto 22px",
    background: "white",
    border: "1px solid #dde5f0",
    borderRadius: 12,
    padding: 26,
  },
  scenarioCard: {
    background: "white",
    border: "1px solid #dde5f0",
    borderRadius: 12,
    padding: 22,
    boxShadow: "0 12px 34px rgba(11, 24, 55, 0.06)",
  },
  compactScenarioCard: {
    background: "#fbfcff",
    border: "1px solid #dde5f0",
    borderRadius: 10,
    padding: 18,
  },
  collapsedPanel: {
    maxWidth: 1160,
    margin: "0 auto",
    background: "white",
    border: "1px solid #dde5f0",
    borderRadius: 12,
    padding: "0 22px 22px",
  },
  summaryRow: {
    cursor: "pointer",
    padding: "18px 0",
    color: "#071733",
    fontWeight: 800,
  },
  proofVerdictRow: {
    borderTop: "1px solid #e5ebf4",
    paddingTop: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  secondaryScenarioGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
    marginTop: 14,
  },
  cardCopy: { margin: 0, color: "#314360", fontSize: 15, lineHeight: 1.5 },
  metrics: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 10,
    margin: "16px 0 0",
  },
  flowNode: {
    minHeight: 62,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    color: "#dbe7ff",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 13,
    fontWeight: 800,
  },
  flowNodeEmphasis: {
    minHeight: 62,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    color: "#06231f",
    background: "#78f4d9",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 13,
    fontWeight: 900,
  },
  flowArrow: {
    color: "#78f4d9",
    fontWeight: 900,
  },
  moduleStack: {
    display: "grid",
    gap: 6,
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
