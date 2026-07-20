// Dedicated layered/swimlane renderers for the four architecture-view exhibit
// kinds, replacing the generic flow-diagram fallback those kinds previously
// rendered through. Each kind gets its own layout matching its required
// elements; physical_architecture carries a legend (illustrative/selected/
// client-confirmed).

import { renderDeliverableHtml } from "../renderers";
import { goodDocument } from "../__fixtures__/ams-rfp";
import type { RenderableExhibit } from "../types";

function withExhibit(exhibit: RenderableExhibit) {
  const doc = goodDocument();
  doc.exhibits = [exhibit];
  return renderDeliverableHtml(doc);
}

describe("architecture-view exhibit rendering", () => {
  it("renders conceptual_architecture as a swimlane diagram with its lane labels", () => {
    const html = withExhibit({
      key: "conceptual_architecture",
      title: "Conceptual Architecture",
      kind: "conceptual_architecture",
      description:
        "Clinicians and care coordinators access the assistant through the patient portal channel. Care management and eligibility capabilities are in scope. Data stays inside the trust boundary and improves care-team outcomes.",
      targetFormat: "docx",
    });
    expect(html).toMatch(/data-kind="conceptual_architecture"/);
    expect(html).toMatch(/Personas &amp; Channels/);
    expect(html).toMatch(/Business Capabilities &amp; Domains/);
    expect(html).toMatch(/Trust, Governance &amp; Outcomes/);
  });

  it("renders logical_architecture with its four composition lanes", () => {
    const html = withExhibit({
      key: "logical_architecture",
      title: "Logical Architecture",
      kind: "logical_architecture",
      description:
        "The experience layer hands off to workflow orchestration. Agents call models for reasoning. Context assembly pulls from data products and integrates with the EHR. Identity, security, and observability wrap every call with human-in-the-loop review.",
      targetFormat: "docx",
    });
    expect(html).toMatch(/Experience &amp; Orchestration/);
    expect(html).toMatch(/Agents &amp; Models/);
    expect(html).toMatch(/Context, Data &amp; Integration/);
    expect(html).toMatch(/Identity, Security, Observability &amp; Governance/);
  });

  it("renders physical_architecture with its lanes AND a legend", () => {
    const html = withExhibit({
      key: "physical_architecture",
      title: "Physical Architecture",
      kind: "physical_architecture",
      description:
        "A dedicated Azure subscription with private networking. Container Apps runtime hosts the agent; Azure AI Foundry serves model endpoints. Azure AI Search and Postgres hold context and data. Key Vault, Application Insights, and CI/CD complete the picture with resilience across regions.",
      targetFormat: "docx",
    });
    expect(html).toMatch(/Cloud Boundaries &amp; Network/);
    expect(html).toMatch(/Runtime &amp; Model Endpoints/);
    expect(html).toMatch(/Data, Search &amp; Events/);
    expect(html).toMatch(/Secrets, Monitoring, CI\/CD &amp; Resilience/);
    // legend distinguishing illustrative / selected / client-confirmed services
    expect(html).toMatch(/data-legend="true"/);
    expect(html).toMatch(/illustrative/);
    expect(html).toMatch(/client-confirmed/);
  });

  it("does NOT render a legend for conceptual/logical architecture (only physical/agent-orchestration need one)", () => {
    const html = withExhibit({
      key: "logical_architecture",
      title: "Logical Architecture",
      kind: "logical_architecture",
      description: "Plain description with no special lane keywords at all here.",
      targetFormat: "docx",
    });
    expect(html).not.toMatch(/data-legend="true"/);
  });

  it("renders agent_orchestration as the explicit trigger-to-trace flow, not a single floating 'AI agent' box", () => {
    const html = withExhibit({
      key: "agent_orchestration",
      title: "Agentic Orchestration Flow",
      kind: "agent_orchestration",
      description:
        "A clinician message triggers the flow. The intent router classifies it. The planner sequences steps. Context assembly retrieves the chart. Tool selection picks the right retrieval. The model executes reasoning. Evidence is challenged against sources. A policy gate checks compliance. Human approval is required for prescriptive actions. The action executes. Everything is traced.",
      targetFormat: "docx",
    });
    expect(html).toMatch(/Trigger/);
    expect(html).toMatch(/Intent Router/);
    expect(html).toMatch(/Planner/);
    expect(html).toMatch(/Context Assembler/);
    expect(html).toMatch(/Tool\/Retrieval Selection/);
    expect(html).toMatch(/Model Execution/);
    expect(html).toMatch(/Evidence Challenge/);
    expect(html).toMatch(/Policy\/Control Gate/);
    expect(html).toMatch(/Human Approval/);
    expect(html).toMatch(/Action Execution/);
    expect(html).toMatch(/Trace\/Monitoring/);
    // gate nodes get a visibly distinct legend/fill, not just plain text
    expect(html).toMatch(/policy\/control or human-approval gate/);
  });

  it("still renders matrix/timeline/flow kinds exactly as before (no regression to existing exhibit kinds)", () => {
    const html = withExhibit({
      key: "tower_scope_map",
      title: "Service Tower Scope Map",
      kind: "matrix",
      description: "Towers × services.",
      targetFormat: "xlsx",
    });
    expect(html).toMatch(/data-kind="matrix"/);
    expect(html).toMatch(/<svg class="exhibit-svg"/);
  });
});
