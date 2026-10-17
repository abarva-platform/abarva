/** Every refusal the mobilization-plan download can give, each with the sentence a person reads. */
export const MOBILIZATION_PLAN_REFUSAL = {
  not_enabled: { status: 404, detail: "The mobilization plan needs the estimate engine, which is not enabled for this workspace." },
  forbidden: { status: 403, detail: "You can see this Move but not its plan." },
  estimate_not_approved: { status: 409, detail: "Approve the delivery estimate in P3 first. The plan's build weeks and cost come from it." },
  estimate_stale: { status: 409, detail: "The delivery estimate changed after it was approved. Approve it again in P3, then download the plan." },
  estimate_unreadable: { status: 503, detail: "The approved estimate could not be read. Try again; nothing was changed." },
  estimate_mismatch: { status: 409, detail: "The approved estimate no longer reproduces its approved figures on its own rates. Approve it again in P3 before planning on it." },
  plan_failed: { status: 500, detail: "The plan workbook could not be built. Nothing was stored; try again." },
} as const;
export type MobilizationPlanRefusal = keyof typeof MOBILIZATION_PLAN_REFUSAL;
