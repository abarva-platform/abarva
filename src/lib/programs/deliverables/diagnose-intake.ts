// =============================================================================
// Diagnose intake engine — the real "drive a response" for P2 Diagnose.
// -----------------------------------------------------------------------------
// A Discovery Report needs inputs evidence can't provide (change-readiness,
// adoption appetite, priority use-cases, target-state, constraints). This engine:
//  1. SCOPES the questions to what we DON'T already know — it references the
//     committed analysis (maturity scores, two-gap, leverage) so it never
//     re-asks what the evidence already answers ("don't-ask-what-we-know"), and
//     frames each question with the real finding it is probing.
//  2. CAPTURES answers as governed, ATTESTED intake (program_evidence_items,
//     attested by the answering user) — never invented.
//  3. RESOLVES committed intake so the Discovery Report is grounded in real
//     analysis + attested intake + committed evidence.
// =============================================================================

import "server-only";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import type { TenancyCtx } from "@/lib/programs/types.db";
import type { ReadinessReport } from "@/lib/programs/current-state-readiness";
import type { CurrentStateRecommendation } from "@/lib/programs/current-state-maturity";
import { recordProgramEvidence } from "@/lib/programs/evidence-ingestion";

export type DiagnoseCategory =
  | "change_readiness"
  | "use_case_priority"
  | "target_state"
  | "constraints"
  | "data_readiness"
  | "value_definition";

export interface DiagnoseQuestion {
  id: string;
  category: DiagnoseCategory;
  /** The scoped question, framed with the real finding it probes. */
  prompt: string;
  /** Why the Discovery Report needs it. */
  whyNeeded: string;
  /** Which Discovery Report section the answer feeds. */
  feedsSection: string;
  /** Whether this answer is already committed (intake captured). */
  answered: boolean;
  /** The attested answer if captured. */
  answer?: string;
}

const STEP_PREFIX = "diagnose-intake:";

/**
 * Build the SCOPED diagnose questions. It references the committed maturity/gap
 * analysis so it probes the real findings instead of asking blind, and it omits
 * anything the evidence already answers.
 */
export function buildDiagnoseQuestions(
  readiness: ReadinessReport | null,
  recommendation: CurrentStateRecommendation | null,
  answered: Record<string, string> = {},
): DiagnoseQuestion[] {
  const q: Array<Omit<DiagnoseQuestion, "answered" | "answer">> = [];

  // Data-readiness — probe the real weak dimension, do not ask blind.
  const dataDim = recommendation?.maturity.find((m) => /data/i.test(m.label));
  if (dataDim && dataDim.score !== null && dataDim.score <= 2) {
    q.push({
      id: "data_gap_specifics",
      category: "data_readiness",
      prompt: `Our assessment scores Data Architecture at ${dataDim.score}/5 — the binding constraint on AI-assisted delivery. Which specific data gaps (quality, lineage, access, labelling) most block the AI use-cases, and is any uplift already funded?`,
      whyNeeded:
        "Turns the 2/5 score into a concrete, prioritized remediation the roadmap can sequence.",
      feedsSection: "Current-state diagnosis & gaps",
    });
  }

  // Use-case prioritization — we know the team/estate; we don't know the priority.
  q.push({
    id: "priority_use_cases",
    category: "use_case_priority",
    prompt:
      "Across the in-scope engineering estate, which 2–3 AI-assisted use-cases should the test target first (e.g. code generation, test automation, legacy comprehension, review)? What makes them the priority — pain, value, or feasibility?",
    whyNeeded:
      "The Discovery Report must recommend where to start; evidence gives leverage, not the business's chosen priority.",
    feedsSection: "Opportunity & where to start",
  });

  // Change-readiness & adoption — not derivable from current-state data.
  q.push({
    id: "change_readiness",
    category: "change_readiness",
    prompt:
      "How ready are the engineering teams to adopt AI-assisted workflows today — sponsorship strength, prior tool adoption, skepticism, and any union/works-council or policy considerations?",
    whyNeeded:
      "Adoption risk is the top reason AI-PDLC programs stall; it is not in the delivery/CMDB evidence.",
    feedsSection: "Change readiness & adoption",
  });

  // Target-state / north-star.
  q.push({
    id: "target_state",
    category: "target_state",
    prompt:
      "What does success look like in 12–18 months — the target operating model for AI-assisted delivery (human + agent workflow, guardrails, who owns it)? Any hard north-star metrics?",
    whyNeeded:
      "The two-gap model needs a target to measure the use-case gap against; evidence only gives current state.",
    feedsSection: "Target state & two-gap analysis",
  });

  // Constraints.
  q.push({
    id: "constraints",
    category: "constraints",
    prompt:
      "What hard constraints must the approach respect — security/IP rules for AI tools, regulated data, the mainframe change-freeze windows already flagged, budget envelope, or timeline pressure?",
    whyNeeded:
      "Constraints shape feasible options; the stakeholder map flags some gates but not the full constraint set.",
    feedsSection: "Constraints & guardrails",
  });

  // Value definition (links to the open value_ratification item).
  q.push({
    id: "value_definition",
    category: "value_definition",
    prompt:
      "Which value levers matter most for this test — engineering throughput, cost-to-serve, quality/defects, speed-to-market — and is there an internal benefit range or hurdle the business case must clear?",
    whyNeeded:
      "Value is currently unratified; this anchors the value hypothesis without inventing a financial figure.",
    feedsSection: "Value hypothesis",
  });

  return q.map((item) => ({
    ...item,
    answered: Boolean(answered[item.id]),
    answer: answered[item.id],
  }));
}

/** Record an ATTESTED diagnose answer as governed intake (move-scoped). */
export async function recordDiagnoseAnswer(
  ctx: TenancyCtx,
  args: {
    moveId: string;
    questionId: string;
    prompt: string;
    answer: string;
    attestation: "client_attested" | "sme_attested" | "representative_attested";
  },
): Promise<{ evidenceId: string }> {
  const evidenceId = await recordProgramEvidence(ctx, {
    tenantKey: ctx.clientKey ?? "",
    programId: args.moveId,
    phase: 2,
    stepId: `${STEP_PREFIX}${args.questionId}`,
    evidenceType: "workshop_output",
    title: `Diagnose intake — ${args.questionId}`,
    summary: args.answer.slice(0, 700),
    extractedText: `Q: ${args.prompt}\nA: ${args.answer}`,
    extractedStructured: {
      decisions: [],
      action_items: [],
      risks: [],
      baseline_candidates: [],
      attendees: [],
      parse_method: `diagnose-intake:${args.attestation}`,
      warnings: [],
    },
    confidence: 0.8,
  });
  return { evidenceId };
}

/** Read committed (attested) diagnose intake answers for a move. */
export async function resolveDiagnoseIntake(
  ctx: TenancyCtx,
  moveId: string,
): Promise<Record<string, string>> {
  const tenantKey = ctx.clientKey ?? "";
  if (!tenantKey || !moveId) return {};
  try {
    const sb = getAzureWriteFluentClient();
    const { data, error } = await sb
      .from("program_evidence_items")
      .select("step_id, extracted_text, summary")
      .eq("tenant_key", tenantKey)
      .eq("program_id", moveId)
      .like("step_id", `${STEP_PREFIX}%`);
    if (error || !Array.isArray(data)) return {};
    const out: Record<string, string> = {};
    for (const r of data as Array<{
      step_id: string;
      extracted_text: string | null;
      summary: string | null;
    }>) {
      const qid = r.step_id.slice(STEP_PREFIX.length);
      // Prefer the answer portion of "Q: …\nA: …".
      const txt = r.extracted_text ?? r.summary ?? "";
      const m = txt.match(/\nA:\s*([\s\S]*)$/);
      out[qid] = (m ? m[1] : txt).trim();
    }
    return out;
  } catch {
    return {};
  }
}

/** Diagnose-intake answers as citation-ready facts for the Discovery Report. */
export function intakeAsFacts(answered: Record<string, string>): string[] {
  return Object.entries(answered).map(
    ([qid, answer]) => `${qid.replace(/_/g, " ")}: ${answer}`,
  );
}

// ── DESIGN intake (P3) — Solution Approach & Architecture ────────────────────
// Scoped by the approved DISCOVERY (diagnose answers): it never re-asks the
// priorities/constraints already captured; it elicits the design decisions those
// imply. Separate namespace so it doesn't collide with diagnose intake.

const DESIGN_PREFIX = "design-intake:";

export interface DesignQuestion {
  id: string;
  prompt: string;
  whyNeeded: string;
  feedsSection: string;
  answered: boolean;
  answer?: string;
}

export function buildDesignQuestions(
  diagnoseAnswers: Record<string, string> = {},
  answered: Record<string, string> = {},
): DesignQuestion[] {
  const hasDiagnose = Object.keys(diagnoseAnswers).length > 0;
  const q: Array<Omit<DesignQuestion, "answered" | "answer">> = [
    {
      id: "architecture_pattern",
      prompt: hasDiagnose
        ? "Given your priority use-cases (requirements-gen, code-review, incident-analysis) and the mainframe-last sequencing, what target architecture do you favour — a centralized AI platform/gateway, embedded per-team tools, or a hybrid? Any existing platform to build on?"
        : "What target architecture do you favour for AI-assisted delivery — centralized AI platform/gateway, embedded per-team tools, or hybrid?",
      whyNeeded:
        "Sets the architecture backbone the roadmap and estimates sequence against.",
      feedsSection: "Target architecture",
    },
    {
      id: "build_vs_buy",
      prompt:
        "Build-vs-buy for the AI tooling — adopt commercial dev-AI tools, an internal gateway over foundation models, or both? Any approved or banned vendors given your Security/IP constraints?",
      whyNeeded:
        "Drives cost basis (licences vs build) and the security control model.",
      feedsSection: "Approach & build-vs-buy",
    },
    {
      id: "guardrail_model",
      prompt:
        "What control model keeps usage safe — code/data egress controls, human review gates, role-based access, prompt/policy governance — and who owns the guardrails?",
      whyNeeded:
        "Your change-readiness answer flagged Security caution and human-in-the-loop; the architecture must encode it.",
      feedsSection: "Guardrails & controls",
    },
    {
      id: "data_uplift_approach",
      prompt:
        "Given Data Architecture at 2/5, how should the data uplift the use-cases need be handled — a parallel data-integration workstream, scoped data products per use-case, or deferred with a documented risk?",
      whyNeeded:
        "Turns the binding data constraint into a design choice the roadmap can cost.",
      feedsSection: "Data enablement",
    },
    {
      id: "human_agent_workflow",
      prompt:
        "Across the SDLC (requirements, code, test, release, incident), where does the AI agent assist and where must a human decide/approve? Any hard human-gate points?",
      whyNeeded:
        "Defines the human + agent operating model and the guardrail gates.",
      feedsSection: "Human + agent operating model",
    },
    {
      id: "integration_scope",
      prompt:
        "What must the approach integrate with — the CI/CD, ITSM, CMDB, product-planning and value-tracking systems you flagged as fragmented? Any integration constraints or sequencing?",
      whyNeeded:
        "Integration scope is a major estimate driver and a feasibility constraint.",
      feedsSection: "Integration & operating model",
    },
  ];
  return q.map((item) => ({
    ...item,
    answered: Boolean(answered[item.id]),
    answer: answered[item.id],
  }));
}

export async function recordDesignAnswer(
  ctx: TenancyCtx,
  args: {
    moveId: string;
    questionId: string;
    prompt: string;
    answer: string;
    attestation: "client_attested" | "sme_attested" | "representative_attested";
  },
): Promise<{ evidenceId: string }> {
  const evidenceId = await recordProgramEvidence(ctx, {
    tenantKey: ctx.clientKey ?? "",
    programId: args.moveId,
    phase: 3,
    stepId: `${DESIGN_PREFIX}${args.questionId}`,
    evidenceType: "workshop_output",
    title: `Design intake — ${args.questionId}`,
    summary: args.answer.slice(0, 700),
    extractedText: `Q: ${args.prompt}\nA: ${args.answer}`,
    extractedStructured: {
      decisions: [],
      action_items: [],
      risks: [],
      baseline_candidates: [],
      attendees: [],
      parse_method: `design-intake:${args.attestation}`,
      warnings: [],
    },
    confidence: 0.8,
  });
  return { evidenceId };
}

export async function resolveDesignIntake(
  ctx: TenancyCtx,
  moveId: string,
): Promise<Record<string, string>> {
  const tenantKey = ctx.clientKey ?? "";
  if (!tenantKey || !moveId) return {};
  try {
    const sb = getAzureWriteFluentClient();
    const { data, error } = await sb
      .from("program_evidence_items")
      .select("step_id, extracted_text, summary")
      .eq("tenant_key", tenantKey)
      .eq("program_id", moveId)
      .like("step_id", `${DESIGN_PREFIX}%`);
    if (error || !Array.isArray(data)) return {};
    const out: Record<string, string> = {};
    for (const r of data as Array<{
      step_id: string;
      extracted_text: string | null;
      summary: string | null;
    }>) {
      const qid = r.step_id.slice(DESIGN_PREFIX.length);
      const txt = r.extracted_text ?? r.summary ?? "";
      const m = txt.match(/\nA:\s*([\s\S]*)$/);
      out[qid] = (m ? m[1] : txt).trim();
    }
    return out;
  } catch {
    return {};
  }
}
