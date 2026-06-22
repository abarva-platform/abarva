// Golden question fixture type — W5.2.
//
// Shared by the per-domain golden batch modules and the aggregator
// (`../golden-questions.ts`). Kept in its own module so batch files can import
// the type without a value-cycle back through the aggregator.

export interface GoldenQuestion {
  id: string;
  query: string;
  /** Tenant industry when the question is industry-specific (helps routing). */
  industry?: string;
  /** The expert id the router must summon as the lead. */
  expectedExpertId: string;
  /** Optional content terms the grounding block must surface (case-insensitive). */
  mustInclude?: string[];
}
