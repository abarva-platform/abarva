/**
 * What an event's uploaded artifacts actually yielded when they were parsed.
 *
 * `text-parser.ts` extracts six families from every artifact. Two of them —
 * chunks and facts — are read back by the Nexus answer path and the context
 * binder. The other four are written on every upload and read by nothing: the
 * only other reference to any of them is a column contract in a module that is
 * itself unreferenced. So the product has been extracting structured
 * requirements, pricing components, vendor commitments and meeting outcomes for
 * months and showing an operator none of it.
 *
 * This is the read side. It counts, it does not interpret: a count of extracted
 * requirements is a statement about what parsing found, never about whether
 * those requirements are complete, correct, or agreed.
 */

/** The four families the parser writes and nothing previously read. */
export const PARSED_YIELD_FAMILIES = [
  "requirements",
  "pricingComponents",
  "vendorCommitments",
  "meetingOutcomes",
] as const;

export type ParsedYieldFamily = (typeof PARSED_YIELD_FAMILIES)[number];

export type ParsedYieldCounts = Record<ParsedYieldFamily, number>;

export type ParsedYieldView =
  | { kind: "unread" }
  | { kind: "none" }
  | { kind: "extracted"; counts: ParsedYieldCounts; total: number };

/**
 * `registryAvailable: false` means the store could not be read. That is not the
 * same claim as "the parser found nothing", and the two must not render alike —
 * reporting an unreadable store as an empty one tells an operator their uploads
 * yielded nothing when nobody actually looked.
 */
export function describeParsedYield(input: {
  registryAvailable: boolean;
  counts: Partial<ParsedYieldCounts>;
}): ParsedYieldView {
  if (!input.registryAvailable) return { kind: "unread" };

  const counts = PARSED_YIELD_FAMILIES.reduce<ParsedYieldCounts>(
    (accumulator, family) => {
      const value = input.counts[family];
      // A negative or non-finite count is a broken read, not a small one.
      accumulator[family] =
        typeof value === "number" && Number.isFinite(value) && value > 0
          ? Math.floor(value)
          : 0;
      return accumulator;
    },
    { requirements: 0, pricingComponents: 0, vendorCommitments: 0, meetingOutcomes: 0 },
  );

  const total = PARSED_YIELD_FAMILIES.reduce((sum, family) => sum + counts[family], 0);
  if (total === 0) return { kind: "none" };
  return { kind: "extracted", counts, total };
}

const LABELS: Record<ParsedYieldFamily, [string, string]> = {
  requirements: ["requirement", "requirements"],
  pricingComponents: ["pricing component", "pricing components"],
  vendorCommitments: ["vendor commitment", "vendor commitments"],
  meetingOutcomes: ["meeting outcome", "meeting outcomes"],
};

export function parsedYieldLabel(view: ParsedYieldView): string {
  if (view.kind === "unread") return "Not recorded";
  if (view.kind === "none") return "Nothing extracted yet";

  // Only the families that found something are named. Listing four zeroes
  // reads as four failures rather than as one thing parsing happened to find.
  return PARSED_YIELD_FAMILIES.filter((family) => view.counts[family] > 0)
    .map((family) => {
      const count = view.counts[family];
      const [one, many] = LABELS[family];
      return `${count} ${count === 1 ? one : many}`;
    })
    .join(" · ");
}
