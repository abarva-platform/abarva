import { parseSourceScopeDescription } from "@/lib/source/intake-summary";

/**
 * The governed facts held inside an event's scope description.
 *
 * `source_events.scope_description` is one free-text column, but it is not free
 * text: `buildSourceScopeDescription` writes four labelled facts into it, and
 * `parseSourceScopeDescription` reads them back. The approval surface and the
 * strategy builder already parse it. The Source New workspace did not, and
 * rendered the whole column under a single "Scope" heading — so an operator
 * read four distinct governed facts as one paragraph:
 *
 *   Scope boundary: … Value target: … Baseline owner: … Category: …
 *
 * This splits them for display. It parses nothing itself; it is a view over the
 * existing parser, so the surface and the approval page cannot disagree about
 * what the column says.
 *
 * `category` is deliberately NOT returned. Both panels that use this already
 * carry the event's own category field, and the Request panel was showing the
 * same value twice — once as its own fact and once inside the paragraph. The
 * event's field is the authority; the copy embedded in the description is a
 * duplicate of it.
 */
export type RecordedScopeFact = {
  key: "scopeBoundary" | "valueTarget" | "baselineOwner";
  label: string;
  value: string;
};

const LABELS: Record<RecordedScopeFact["key"], string> = {
  scopeBoundary: "Scope boundary",
  valueTarget: "Value target",
  baselineOwner: "Baseline owner",
};

const filled = (value: string | undefined): value is string =>
  typeof value === "string" && value.trim().length > 0;

/**
 * Whether this description is written in the labelled form at all.
 *
 * `parseSourceScopeDescription` resolves a bare, unlabelled string to
 * `scopeBoundary`, which is right for its callers but wrong here: a plain
 * sentence recorded as the scope is a scope, and relabelling it "Scope
 * boundary" renames a row without telling the reader anything new. So the
 * split is offered only when the column genuinely carries labels, and a bare
 * description is left to the caller's own single row.
 */
function carriesLabels(
  scope: string | null | undefined,
  parsed: ReturnType<typeof parseSourceScopeDescription>,
): boolean {
  if (filled(parsed.valueTarget) || filled(parsed.baselineOwner)) return true;
  // A description carrying only a labelled scope boundary still counts: the
  // label is present, so splitting repeats nothing the writer did not write.
  return /(^|\n)\s*scope boundary\s*[:–—-]/i.test(scope ?? "");
}

/**
 * The facts this scope description actually records, in reading order.
 *
 * Returns an empty list when the description is not in the labelled form, so
 * the caller keeps whatever single row it rendered before. A fact the
 * description does not carry is omitted rather than rendered empty: an absent
 * value target is not a value target of nothing.
 */
export function recordedScopeFacts(
  scope: string | null | undefined,
): RecordedScopeFact[] {
  const parsed = parseSourceScopeDescription(scope);
  if (!carriesLabels(scope, parsed)) return [];
  const ordered: RecordedScopeFact["key"][] = [
    "scopeBoundary",
    "valueTarget",
    "baselineOwner",
  ];
  return ordered
    .filter((key) => filled(parsed[key]))
    .map((key) => ({
      key,
      label: LABELS[key],
      value: (parsed[key] as string).trim(),
    }));
}
