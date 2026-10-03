import type { SourceGenerationContext } from "./types";

/** Drafting context is deliberately smaller than the buyer's Source workspace. */
export function buildD09VendorDraftContext(ctx: SourceGenerationContext): string {
  return [
    `Buyer: ${ctx.tenantName}`,
    "Vendor-disclosable event scope, baseline, exhibits, dates, evaluation weights, and commercial terms: not supplied to this drafting context.",
    "Do not infer these facts from the buyer's internal workflow or claim that an exhibit is issued.",
  ].join("\n");
}
