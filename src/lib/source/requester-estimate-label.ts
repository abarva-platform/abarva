/**
 * The one wording authority for a requester-declared value estimate.
 *
 * `source_events.estimated_value_usd` is a number the requester typed into
 * intake. It is not read from a contract, an invoice or the value ledger, and
 * nothing validates it before an approver sees it. Rendered bare — beside an
 * event code and a stage label, which are facts — it reads as a measured
 * figure, which is the defect item U-514 was opened against.
 *
 * Two phrasings already existed in the product, on the two intake surfaces
 * that did qualify the number, and they were the only two occurrences of the
 * wording anywhere in `src/`. Neither is invented here and neither is changed:
 * they are moved into this module so the four surfaces that render this field
 * cannot drift apart again, and so a fifth surface has something to import
 * rather than a sentence to re-type.
 *
 * Which form goes where follows the shape of the surface, not taste:
 *
 *   • `requesterEstimateCardLabel` — a card or a dot-separated metadata line,
 *     where the qualifier is another segment. Originally
 *     `SourceNewRequestFirstPage`.
 *   • `requesterEstimateFieldLabel` — a single free-text field whose value is
 *     read as a sentence. Originally `SourceOriginatePage`, which writes this
 *     exact string into the intake `Value target` field; the event approval
 *     page reads that same field back, so its fallback must use the same form
 *     or one field would read two ways depending on which writer filled it.
 *
 * Both take an ALREADY FORMATTED amount. Formatting is the caller's, because
 * the surfaces disagree legitimately — some are permission-gated through
 * `formatSourceFinancialValue`, some are not — and folding that in here would
 * put a money policy decision inside a labelling helper.
 */

/** `Requester estimate: $4.2M · Not validated` */
export function requesterEstimateCardLabel(formattedAmount: string): string {
  return `Requester estimate: ${formattedAmount} · Not validated`;
}

/** `Requester estimate: $4.2M (not validated)` */
export function requesterEstimateFieldLabel(formattedAmount: string): string {
  return `Requester estimate: ${formattedAmount} (not validated)`;
}
