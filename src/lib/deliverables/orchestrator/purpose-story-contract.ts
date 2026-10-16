import { CHARTER_CONTRACT } from "../shared/artifact-contracts";
import {
  deckContract,
  renderDeckContractPrompt,
} from "../shared/deck-story-contract";
import type { GovernedEvidenceItem, RenderableDeliverable } from "./types";

const marker = /\b(?:synthetic|invented|fixture|demo)\b/i;
const absence =
  /\b(?:no|none|missing|absent|unavailable|unrecorded|uncollected|lacks?|not\s+(?:yet\s+)?(?:collected|received|available|recorded|provided|loaded|supplied|established))\b/i;
const normalize = (s: string) =>
  s
    .replace(/\[(?:\d+|[A-Z]+\d+)(?:\s*,\s*(?:\d+|[A-Z]+\d+))*\]|[*_"“”]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object")
    return Object.entries(value)
      .filter(
        ([k]) =>
          !["key", "id", "from", "to", "kind", "targetFormat"].includes(k),
      )
      .flatMap(([, v]) => strings(v));
  return [];
}

export function purposePhasePrompt(type: string): string {
  const phase =
    type === "charter"
      ? `P1 CHARTER CONTRACT. Emit these section keys exactly once in this order:\n${CHARTER_CONTRACT.sections.map((s) => `${s.key}: ${s.intent} Maximum ${s.maxWords} words.`).join("\n")}\n${CHARTER_CONTRACT.boundaryStatement}\nDRAFT STATUS: the preceding boundary describes the instrument's scope, not an approval already granted. Qualify authorization language with "If approved" in the same sentence. A program budget ceiling is not a phase budget or permission to spend. Keep each amount's original scope and qualifier. Preserve negation and conditions from sources exactly.`
      : `${renderDeckContractPrompt("REF_DECK_P2_DISCOVERY_READOUT")}\nUse each contract slide id as the slide key, in this order: ${deckContract(
          "REF_DECK_P2_DISCOVERY_READOUT",
        )
          .slides.map((s) => s.id)
          .join(
            ", ",
          )}. The first slide states the finding AND a proposed proceed, hold or stop decision. Put the decision in the title, points, table or takeaway, not only speaker notes. Never open with an ask to authorize Discovery, test whether, or repeat the Charter request. Findings may remain conditional; do not invent a resolved cause. Optional permitted evidence-detail appendices follow the complete core spine and use unique appendix_ keys. Do not add appendices merely to reach a slide count.`;
  return `${phase}\nVisible titles, body, scope notes and takeaways contain no synthetic/invented/fixture/demo markers; classification is carried by the server footer. Retain hypotheses, constraints and source limitations. A planned row supports planned, not not-collected. Any absence claim must quote the exact explicit absence from its cited source; otherwise ask the owner to confirm the state. Do not paraphrase absence into a stronger claim. Use a structured actionRegister [{owner, action, evidence}] instead of repeated nextActions prose. Evidence is a short completion test plus citations. Keep number slots intact; the server formats their declared units. Prefer one message per page, short cells, and source-specific scope notes. Put qualifications in notes rather than repeating them three times.`;
}

export function purposeVisibleText(doc: RenderableDeliverable): string[] {
  return [
    doc.title,
    doc.subtitle || "",
    doc.recommendation,
    ...doc.generatedSections.flatMap((s) => [s.title, s.bodyMarkdown]),
    ...(doc.deckSlides || []).flatMap((s) => [
      s.governingMessage,
      ...(s.points || []),
      s.pageIntent?.scopeNote || "",
      s.pageIntent?.takeaway || "",
      s.pageIntent?.takeawayLabel || "",
    ]),
    ...doc.tables.flatMap((t) => [
      t.title,
      ...(t.columns || []),
      ...(t.rows || []).flatMap((row) => {
        const cites =
          row
            .join(" ")
            .match(/\[(?:\d+|[A-Z]+\d+)(?:\s*,\s*(?:\d+|[A-Z]+\d+))*\]/g)
            ?.join(" ") || "";
        const slideCites = (doc.deckSlides || [])
          .filter((s) => s.pageIntent?.tableKey === t.key)
          .flatMap((s) => s.citationsUsed || [])
          .map((id) => `[${id}]`)
          .join(" ");
        return row.map((cell) => `${cell} ${cites} ${slideCites}`);
      }),
    ]),
    ...doc.nextActions,
    ...(doc.actionRegister || []).flatMap((a) => [
      a.owner,
      a.action,
      a.evidence,
    ]),
    ...doc.exhibits.flatMap((e) => [e.title, ...strings(e.data)]),
  ].filter(Boolean);
}

/** Conservative textual proof, not a semantic entailment or historical-completeness claim. */
export function unsupportedPurposeAbsences(
  text: string,
  evidence: readonly Pick<
    GovernedEvidenceItem,
    "citationNumber" | "statement"
  >[],
): string[] {
  const chunks = text
    .split(/\n|(?<=[.!?])\s+(?!\[)/)
    .map((s) => s.trim())
    .filter(Boolean);
  return chunks.filter((sentence) => {
    // A draft's own scope boundary is not a statement about evidence history.
    if (
      /\b(?:this|the) (?:charter|document|readout|page|slide) (?:commits|defines|authorizes|sets) no (?:implementation funding|architecture|investment|operating model|roadmap|baseline|target|benefit)\b/i.test(
        sentence,
      )
    )
      return false;
    if (
      !absence.test(sentence) ||
      /^(?:(?:confirm|check|test|review|validate|determine) whether\b|if\b)/i.test(
        sentence,
      )
    )
      return false;
    const cites = [...sentence.matchAll(/\[(\d+(?:\s*,\s*\d+)*)\]/g)].flatMap(
      (m) => m[1]!.split(/\s*,\s*/).map(Number),
    );
    const quotes = [...sentence.matchAll(/["“]([^"”]+)["”]/g)]
      .map((m) => m[1]!)
      .filter((q) => absence.test(q));
    const outer = sentence.replace(/["“][^"”]+["”]/g, "");
    const claims = quotes.length
      ? [...quotes, ...(absence.test(outer) ? [outer] : [])]
      : [sentence];
    return !claims.every((claim) =>
      cites.some((id) =>
        evidence.some(
          (e) =>
            e.citationNumber === id &&
            absence.test(e.statement) &&
            normalize(e.statement).includes(
              normalize(claim)
                .replace(/[.!?]+$/, "")
                .trim(),
            ),
        ),
      ),
    );
  });
}

export function validatePurposeStory(
  doc: RenderableDeliverable,
  evidence: readonly Pick<
    GovernedEvidenceItem,
    "citationNumber" | "statement"
  >[],
): string[] {
  const errors: string[] = [];
  if (!["charter", "discovery_report"].includes(doc.deliverableType || ""))
    return errors;
  const charter = doc.deliverableType === "charter";
  for (const table of doc.tables)
    if (!Array.isArray(table.columns) || !Array.isArray(table.rows))
      errors.push(
        `purpose_story:table_schema:${table.key}:use_columns_and_rows`,
      );
  const spec = charter
    ? CHARTER_CONTRACT.sections.map((s) => ({ id: s.key, required: true }))
    : deckContract("REF_DECK_P2_DISCOVERY_READOUT").slides;
  const keys = charter
    ? doc.generatedSections.map((s) => s.key)
    : (doc.deckSlides || []).map((s) => s.key || "");
  const required = spec.filter((s) => s.required).map((s) => s.id);
  for (const id of required)
    if (!keys.includes(id)) errors.push(`purpose_story:missing_beat:${id}`);
  let previous = -1;
  let appendixStarted = false;
  const seen = new Set<string>();
  for (const key of keys) {
    const rank = spec.findIndex((s) => s.id === key);
    if (
      !charter &&
      deckContract("REF_DECK_P2_DISCOVERY_READOUT").appendixAllowed &&
      /^appendix_\w+$/.test(key) &&
      previous === spec.length - 1 &&
      !seen.has(key)
    ) {
      appendixStarted = true;
      seen.add(key);
      continue;
    }
    if (rank < 0 || rank <= previous || appendixStarted || seen.has(key))
      errors.push(`purpose_story:beat_order:${key}`);
    previous = rank;
    seen.add(key);
  }
  if (!charter) {
    const first = doc.deckSlides?.[0];
    const opener = [
      first?.governingMessage,
      first?.pageIntent?.takeaway,
      ...(first?.points || []),
      ...(doc.tables
        .find((t) => t.key === first?.pageIntent?.tableKey)
        ?.rows.flat() || []),
    ].join(" ");
    if (
      /\b(?:ask\s*:|test whether|(?:authori[sz]e|open|start|begin)\b.{0,35}\bdiscovery|P1\s+(?:ask|request))\b/i.test(
        opener,
      )
    )
      errors.push("purpose_story:forbidden_discovery_opener");
    if (!/\b(?:proceed|hold|stop)\b/i.test(opener))
      errors.push("purpose_story:opening_decision_missing");
  }
  for (const text of purposeVisibleText(doc)) {
    if (
      charter &&
      text
        .split(/\n|(?<=[.!?])\s+/)
        .some(
          (sentence) =>
            /\bthis charter authorizes\b/i.test(sentence) &&
            !/\b(?:once|when|if) approved\b/i.test(sentence),
        )
    )
      errors.push("purpose_story:draft_claims_authorization");
    if (marker.test(text))
      errors.push(`purpose_story:classification_in_body:${text.slice(0, 100)}`);
    const citedText = doc.sourceRegister.reduce(
      (value, s) =>
        s.referenceId
          ? value.replace(
              new RegExp(
                `\\b${s.referenceId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
                "g",
              ),
              `[${s.citationNumber}]`,
            )
          : value,
      text,
    );
    const isScope = doc.deckSlides?.some(
      (s) => s.pageIntent?.scopeNote === text,
    );
    const boundaryOnly =
      isScope &&
      /\bestablish(?:es)? no\b|\bdoes not (?:establish|authorize|approve)\b|\brecords no (?:build )?approval\b|\b(?:no|none)\b.{0,100}\b(?:selected|proposed|approved|ranked|costed|sequenced|preferred)\b.{0,20}\b(?:here|on this page)\b/i.test(
        text,
      ) &&
      !/\b(?:received|collected|arrived|exists?|existed|missing|absent)\b/i.test(
        text,
      );
    for (const claim of boundaryOnly
      ? []
      : unsupportedPurposeAbsences(citedText, evidence))
      errors.push(`purpose_story:unsupported_absence:${claim.slice(0, 160)}`);
  }
  return [...new Set(errors)];
}
