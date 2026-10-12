import { z } from "zod";

export const P5_TOWER_HANDOFF_FLAG = "moves_p5_tower_handoff_v1" as const;
export const P5_MEASUREMENT_PLAN_KEY = "p5_measurement_handoff";

const words = z.string().trim().min(1).max(2000);
export const P5MeasurementPlanSchema = z
  .strictObject({
    kind: z.literal("p5_measurement_handoff"),
    version: z.literal(1),
    measures: z
      .array(
        z.strictObject({
          leverId: words,
          ownerUserId: words,
          ownerRole: words,
          sourceReference: words,
          comparator: words,
          method: words,
          cadence: z.enum(["weekly", "monthly", "quarterly"]),
          firstReviewTrigger: words,
          exclusionRules: words,
          openConditions: words,
        }),
      )
      .min(1)
      .max(50),
  })
  .superRefine((plan, ctx) => {
    if (
      new Set(plan.measures.map((row) => row.leverId)).size !==
      plan.measures.length
    )
      ctx.addIssue({
        code: "custom",
        message: "Each P4 lever must appear once.",
      });
  });

export type P5MeasurementPlan = z.infer<typeof P5MeasurementPlanSchema>;
export type P5MeasurementRow = P5MeasurementPlan["measures"][number];

export function readP5MeasurementPlan(raw: string): P5MeasurementPlan | null {
  try {
    const read = P5MeasurementPlanSchema.safeParse(JSON.parse(raw));
    return read.success ? read.data : null;
  } catch {
    return null;
  }
}

/** Gate and document readers receive only the team's saved words. */
export function p5MeasurementPlanText(raw: string): string {
  const plan = readP5MeasurementPlan(raw);
  return plan
    ? plan.measures
        .map((row) =>
          [
            row.ownerRole,
            row.sourceReference,
            row.comparator,
            row.method,
            row.cadence,
            row.firstReviewTrigger,
            row.exclusionRules,
            row.openConditions,
          ].join("\n"),
        )
        .join("\n\n")
    : "";
}

export interface P5HandoffBinding {
  tenantKey: string;
  clientId: string;
  moveId: string;
  contractId: string;
  contractVersion: number;
  contractHash: string;
  planHash: string;
  inputBasisHash: string;
}

export interface P5HandoffView {
  ok: true;
  programId: string;
  binding: P5HandoffBinding | null;
  savedPlan: P5MeasurementPlan | null;
  owners: Array<{ userId: string; role: string }>;
  levers: Array<{
    leverId: string;
    name: string;
    inCash: boolean;
    projectedUsd: number;
  }>;
  publication: { state: "published" | "not_yet_linked"; rowIds: string[] };
  detail: string;
}

export const P5HandoffBindingSchema = z.strictObject({
  tenantKey: z.string().min(1),
  clientId: z.string().uuid(),
  moveId: z.string().uuid(),
  contractId: z.string().uuid(),
  contractVersion: z.number().int().positive(),
  contractHash: z.string().regex(/^[a-f0-9]{64}$/),
  planHash: z.string().regex(/^[a-f0-9]{64}$/),
  inputBasisHash: z.string().regex(/^[a-f0-9]{64}$/),
});
export const P5HandoffViewSchema = z
  .object({
    ok: z.literal(true),
    programId: z.string().min(1),
    binding: P5HandoffBindingSchema.nullable(),
    savedPlan: P5MeasurementPlanSchema.nullable(),
    owners: z.array(z.object({ userId: words, role: words })),
    levers: z.array(
      z.object({
        leverId: words,
        name: words,
        inCash: z.boolean(),
        projectedUsd: z.number().finite().nonnegative(),
      }),
    ),
    publication: z.object({
      state: z.enum(["published", "not_yet_linked"]),
      rowIds: z.array(z.string().uuid()),
    }),
    detail: words,
  })
  .superRefine((view, ctx) => {
    if (
      (view.binding && view.binding.moveId !== view.programId) ||
      (view.publication.state === "published" &&
        (!view.binding ||
          !view.savedPlan ||
          !view.levers.length ||
          view.publication.rowIds.length !== view.levers.length))
    )
      ctx.addIssue({
        code: "custom",
        message: "Publication identity or proof is incomplete.",
      });
  });
