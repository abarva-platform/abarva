import "server-only";
import { z } from "zod";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import {
  P5MeasurementPlanSchema,
  P5_MEASUREMENT_PLAN_KEY,
  readP5MeasurementPlan,
  type P5MeasurementPlan,
  type P5MeasurementRow,
} from "./p5-measurement-plan";
import { getModuleState } from "./queries";
import type { TenancyCtx } from "./types.db";
import type { RenderableDeliverable } from "@/lib/deliverables/orchestrator/types";
import {
  p5Hash,
  P5HandoffRefusal,
} from "@/lib/data-plane/write-adapters/p5OutcomeHandoffAdapter";

const digest = z.string().regex(/^[a-f0-9]{64}$/);
const snapshotSchema = z.strictObject({
  kind: z.literal("p5_measurement_contract_plan"),
  version: z.literal(1),
  tenantKey: z.string().min(1),
  clientId: z.string().uuid(),
  moveId: z.string().uuid(),
  planHash: digest,
  plan: P5MeasurementPlanSchema,
});
const proofSchema = snapshotSchema.extend({ contentHash: digest });
export type P5MeasurementContractPlan = z.infer<typeof snapshotSchema>;

function measurementFields(row: P5MeasurementRow): Array<[string, string]> {
  return [
    ["Receiving role", row.ownerRole],
    ["Source reference", row.sourceReference],
    ["Cohort and comparator", row.comparator],
    ["Measurement method", row.method],
    ["Review cadence", row.cadence],
    ["First review trigger", row.firstReviewTrigger],
    ["Exclusions", row.exclusionRules],
    ["Open conditions", row.openConditions],
  ];
}

export function renderP5MeasurementContractPlanHtml(
  snapshot: P5MeasurementContractPlan,
): string {
  const escape = (value: string) =>
    value.replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char]!,
    );
  const rows = snapshot.plan.measures
    .map(
      (row) =>
        `<h3>Lever ${escape(row.leverId)}</h3><dl>${measurementFields(row)
          .map(([label, value]) => `<dt>${label}</dt><dd>${escape(value)}</dd>`)
          .join("")}</dl>`,
    )
    .join("");
  return `<section data-p5-plan-sha256="${snapshot.planHash}"><h2>Saved measurement definitions to review</h2><p>Review these saved definitions with the receiving roles before accepting the planned handoff.</p><p>Planned handoff only; measured baselines and realized benefits remain unknown.</p>${rows}</section>`;
}

export function captureP5MeasurementContractPlan(
  ctx: TenancyCtx,
  moveId: string,
  rawPlan: P5MeasurementPlan,
): P5MeasurementContractPlan {
  const plan = P5MeasurementPlanSchema.parse(rawPlan);
  const tenantKey = canonicalTenantKey(ctx.clientKey ?? "");
  if (!CANONICAL_TENANT_KEYS.some((key) => key === tenantKey))
    throw new P5HandoffRefusal(
      "tenant_identity_unavailable",
      "The canonical tenant identity could not be verified.",
      503,
    );
  return snapshotSchema.parse({
    kind: "p5_measurement_contract_plan",
    version: 1,
    tenantKey,
    clientId: ctx.clientId,
    moveId,
    planHash: p5Hash(plan),
    plan,
  });
}

export async function loadCurrentP5MeasurementPlan(
  ctx: TenancyCtx,
  moveId: string,
): Promise<P5MeasurementPlan> {
  let modules;
  try {
    modules = await getModuleState(ctx, moveId);
  } catch {
    throw new P5HandoffRefusal(
      "measurement_plan_read_unavailable",
      "The saved measurement plan could not be read. No contract currency is claimed.",
      503,
    );
  }
  const raw = modules.find(
    (row) => row.moduleKey === `phase_5_${P5_MEASUREMENT_PLAN_KEY}`,
  )?.state?.value;
  const plan = readP5MeasurementPlan(typeof raw === "string" ? raw : "");
  if (!plan)
    throw new P5HandoffRefusal(
      "measurement_plan_required",
      "Save valid measurement definitions before building or signing the measurement contract.",
    );
  return plan;
}

/** Only deterministic rendering receives this snapshot; it is not model context. */
export function withP5MeasurementContractPlan(
  doc: RenderableDeliverable,
  snapshot: P5MeasurementContractPlan,
): RenderableDeliverable {
  const words = (value: string) =>
    value.replace(/([\\`*_{}\[\]()#+.!|>~<-])/g, "\\$1").replace(/\r?\n/g, " ");
  const rows = snapshot.plan.measures.flatMap((row) => [
    `### Lever ${words(row.leverId)}`,
    ...measurementFields(row).map(
      ([label, value]) => `- ${label}: ${words(value)}`,
    ),
    "",
  ]);
  return {
    ...doc,
    generatedSections: [
      ...doc.generatedSections.filter(
        (section) => section.key !== "p5_saved_measurement_plan",
      ),
      {
        key: "p5_saved_measurement_plan",
        title: "Saved measurement definitions to review",
        bodyMarkdown: [
          "Review these saved definitions with the receiving roles before accepting the planned handoff.",
          "Planned handoff only; measured baselines and realized benefits remain unknown.",
          "",
          ...rows,
        ].join("\n"),
        groundingMode: "governed_facts",
        citationsUsed: [],
      },
    ],
  };
}

export function assertP5MeasurementContractPlanCurrent(args: {
  ctx: TenancyCtx;
  moveId: string;
  plan: P5MeasurementPlan;
  content: string;
  structuredData: unknown;
}) {
  const tenantKey = canonicalTenantKey(args.ctx.clientKey ?? "");
  if (!CANONICAL_TENANT_KEYS.some((key) => key === tenantKey))
    throw new P5HandoffRefusal(
      "tenant_identity_unavailable",
      "The canonical tenant identity could not be verified.",
      503,
    );
  const data = args.structuredData as Record<string, unknown> | null;
  const proof = proofSchema.safeParse(data?.p5MeasurementContractPlan);
  if (!proof.success)
    throw new P5HandoffRefusal(
      "contract_plan_binding_absent",
      "This measurement contract has no verifiable saved-plan binding. Build a new unsigned contract from the saved plan, review it and sign that version before accepting a handoff.",
    );
  const bound = proof.data;
  if (
    bound.tenantKey !== tenantKey ||
    bound.clientId !== args.ctx.clientId ||
    bound.moveId !== args.moveId ||
    bound.planHash !== p5Hash(bound.plan) ||
    bound.planHash !== p5Hash(args.plan) ||
    bound.contentHash !== p5Hash(args.content) ||
    !args.content.includes(renderP5MeasurementContractPlanHtml(bound))
  )
    throw new P5HandoffRefusal(
      "contract_plan_stale",
      "The measurement contract is bound to different saved definitions or signed content. Review a governed new contract version; the existing signed bytes are preserved.",
    );
}
