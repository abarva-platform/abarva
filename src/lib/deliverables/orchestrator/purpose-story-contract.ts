import { CHARTER_CONTRACT } from "../shared/artifact-contracts";
import {
  deckContract,
  renderDeckContractPrompt,
} from "../shared/deck-story-contract";
import type { RenderableDeliverable } from "./types";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { gfm } from "micromark-extension-gfm";
import type { Nodes } from "mdast";
import {
  classifyPurposeClaims,
  type PurposeClaimContext,
  type PurposeClaimEvidence,
} from "./purpose-claim-classifier";
import {
  purposeCitationIds,
  compactPurposeCitationIds,
} from "./purpose-citations";
import {
  PURPOSE_CAVEAT_MAX_CHARS,
  PURPOSE_DECISION_MAX_ROWS,
  PURPOSE_TITLE_MAX_CHARS,
  groupPurposeStatusItems,
} from "./purpose-page-plan";

const marker = /\b(?:synthetic|invented|fixture|demo)\b/i;
const operatorProse =
  /\b(?:seed rows?|scoped rebind|rebind(?:ing)? the (?:tenant|dataset)|run the (?:loader|migration)|feature[_ -]flag|fixture loader)\b/i;
const uncertainty =
  /\b(?:hypothes(?:is|es)|suspected|possible|potential|may|might|could|to (?:test|validate|confirm))\b/i;

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
  let phase =
    type === "charter"
      ? `P1 CHARTER CONTRACT. Emit these section keys exactly once in this order:\n${CHARTER_CONTRACT.sections.map((s) => `${s.key}: ${s.intent} Maximum ${s.maxWords} words.`).join("\n")}\n${CHARTER_CONTRACT.boundaryStatement}\nDRAFT STATUS: the preceding boundary describes the instrument's scope, not an approval already granted. Qualify authorization language with "If approved" in the same sentence. A program budget ceiling is not a phase budget or permission to spend. Keep each amount's original scope and qualifier. Preserve negation and conditions from sources exactly.`
      : `${renderDeckContractPrompt("REF_DECK_P2_DISCOVERY_READOUT")}\nUse each contract slide id as the slide key, in this order: ${deckContract(
          "REF_DECK_P2_DISCOVERY_READOUT",
        )
          .slides.map((s) => s.id)
          .join(
            ", ",
          )}. The first slide states the finding AND a proposed proceed, hold or stop decision. Put the decision in the title, points, table or takeaway, not only speaker notes. Never open with an ask to authorize Discovery, test whether, or repeat the Charter request. Findings may remain conditional; do not invent a resolved cause. Optional permitted evidence-detail appendices follow the complete core spine and use unique appendix_ keys. Do not add appendices merely to reach a slide count.`;
  if (type === "charter")
    phase +=
      "\nWrite at most 850 words including tables, excluding the server-owned decision record and source register. The per-section limits above are ceilings, not targets. Use a short title naming the charter and decision record, not an authorization already granted. Lead with the proposed decision in at most 45 words. Use the opportunity section for the business problem and value direction in at most 90 words, not a list of every measure or target. Put scope boundaries only in scope, measures only in success_measures, decision rights only in sponsorship_governance, dependencies only in known_constraints_dependencies, and proposed authorization conditions only in authorization_conditions. Each message appears once. Use short tables for scope, measures, role responsibilities and control limits. Every success measure needs its own definition or validation path; an owner responsibility is not a metric. Each actionRegister evidence field is a future completion test written as the test itself (e.g. 'reviewed baseline signed by the finance lead'), with a citation to the reason it is required, never a claim that the future record already exists. The column header already marks every entry as proposed, so do not repeat 'Proposed', 'Proposed completion evidence' or any other status prefix inside the cell. Paraphrase ordinary positive statements with citations; keep a factual negative quotation short and integrated, never introduce it with assembly commentary such as 'carried verbatim from'. Write full sentences naming the next action and accountable role rather than copying status placeholders. Planned evidence remains planned. Use at most one citation group per table row, placed in its final cell, where all cells share the same source. The recommendation should name the next decision record to complete in one sentence, not repeat the opening decision. All headings use sentence case.";
  phase +=
    type === "charter"
      ? "\nEDITORIAL COVERAGE: Read all supplied P0/P1 sources before selecting the story. Preserve each distinct outcome the sponsor is asking to test, including service or experience outcomes as well as cost. Retain supported baseline/target pairs and scope footprint with their qualifications. Where the brief names alternative routes, compare them briefly in opportunity_context instead of silently treating one route as selected. Include delivery/ramp dependencies only where recorded. Avoid repeating a budget ceiling, permission boundary or evidence status in multiple sections. Measures use Outcome | Measure and target | Validation; roles use Role | Decision or responsibility. Keep roles together and concise. Use ordinary complete clauses; never leave a sentence hanging before a citation."
      : "\nEDITORIAL COVERAGE: First assign every decision-relevant source finding to one core beat. executive_answer is a short thesis and proposed decision, not the detailed condition list used at the end. what_we_assessed bounds the inquiry; current_state shows recorded steps, handoffs and timings when supplied, not identical generic role labels. what_is_working names specific controls worth keeping. what_is_not_working shows the material operational problem. root_causes separates candidate mechanisms and the evidence needed to test each. metrics_evidence exposes the measurement reconciliation or series. implications compares the routes actually named in the evidence using Route | Why consider it | What changes the decision, rather than another caveat list. readiness names dependency, accountable role and exit evidence. proceed_hold_stop names the bounded decision and material conditions; actionRegister specifies the next work without repeating those conditions. Use each material comparison or outcome from the supplied evidence where it affects the decision. Draw current_state's recorded handoffs as a flow exhibit: nodes in path order, each a step name of at most four words with its owner or recorded timing as role, and one edge per handoff. A branch is one extra edge and renders once as the exception path, so never drop a branch. Use a table there only when each step carries several distinct values. Reuse a qualification only when its absence would change a claim's meaning. Put detailed evidence notes in speaker notes. Section chips advance CONTEXT, WHAT, WHY, VALIDATE, HOW in that order: implications/readiness stay VALIDATE and the final decision/actions use HOW. A short page is acceptable when its message is complete; do not pad it with generic caveats. Sources use meaningful complete purpose statements, never raw filenames as prose.";
  phase +=
    "\nMEASURE-TO-EVIDENCE FIT: A citation to a real file does not make it a suitable validation method. Use an evidence item only for the question it actually measures. A timed walkthrough can support task effort, not adoption or experience on its own. When the source names an outcome but supplies no measurement method, label the method as a proposed next measurement decision; do not assert a convenient existing file validates it. Separate deliverable completion/classification from business outcome metrics. The structured actionRegister renders under the heading 'Next actions'; use that heading for forward references.";
  phase +=
    "\nFINAL EDIT: Keep the opening conclusion, its supporting evidence and the closing decision distinct. Do not repeat the title in a table row or takeaway. Replace constant columns with the information that differentiates the rows. When reported period values exist, show the important change with its recorded periods and denominator, using supplied values rather than calculating new figures. Name recorded data-quality defects that could change the recommendation. Give each proposed control one home in the document. Expand unfamiliar source identifiers into their supplied readable names on first use. Keep the original meaning, qualifications and citations when shortening prose; an omitted qualification is not an editorial improvement.";
  if (type === "charter")
    phase +=
      "\nCHARTER COMPLETENESS: A named outcome without a method needs a specific proposed definition question, not the outcome name repeated in the measure column. When there are no recorded targets, the COLUMN HEADING may be 'Measure and definition work'; this phrase is never a cell value. Each cell must name the actual proposed measurement question or recorded measure, with recorded targets retained where supplied. A contract status such as Client Decision Required must follow a complete sentence stating the unresolved question and proposed role that resolves it; never render the status alone. A selected evidence list must say it is selected, or include all recorded items. Proposed controls state the prohibition first, the permitted alternative second, and the reason for the limit where sourced. Never delete a prohibition to avoid a negative-claim check. Scope lists are independent; do not imply unrelated in-scope and out-of-scope entries are matched pairs. Expand opaque scope IDs with their source-recorded business names. Compare source-named options in a compact table, not a long paragraph. Keep the title concise enough to read as two balanced lines.";
  return `${phase}\nVisible titles, body, scope notes and takeaways contain no synthetic/invented/fixture/demo markers; classification is carried by the server footer. A page title states one finding in at most 72 characters, as one clause with no semicolon and no citation codes. The scope note is optional: use it only where the page could be misread, in at most 110 characters, written as what the page shows and what it does not ('Shows X; not Y.'), never starting 'This page', with no citation codes, and never repeating another page's scope note. Citations belong in the footer and in a table's Source column, not in titles, scope notes or table sentences; the server moves a register's codes into that column. The decision summary holds at most three rows once grouped by state (design candidate, conditions to close, later approval); any further row belongs on a later page. Retain hypotheses, constraints and source limitations. If a scope note calls the explanation a hypothesis, the headline must also say hypothesis, possible, suspected or may. Qualifications that change a claim's meaning stay visible next to that claim, not only in notes. When the same qualification applies to every row of a table, state it once in the column header or a one-line lead-in above the table and never repeat it in each cell: a stem such as 'This charter excludes', 'needed at P2' or 'listed as a measure to validate' repeated down a column is the same message said once per row. A planned row supports planned, not not-collected. Classify negative claims: draft document status and conditional decision boundaries are allowed; an evidence gap must be limited to the supplied input bundle and checked against it; a factual claim about the business needs a citation supporting that exact meaning. Do not infer missing evidence from a planned row. Input approval states are explicit; never call pending, proposed or unknown inputs approved. Use a structured actionRegister [{owner, action, evidence}] instead of repeated nextActions prose. Evidence is a short completion test plus citations. Keep number slots intact; the server formats their declared units. Prefer one message per page, short cells, and source-specific scope notes. Exclude source-package operator instructions (seed rows, scoped rebind, loaders and feature flags) from client business controls. Translate status labels into ordinary words, not underscore codes. Charter success_measures must contain a native Markdown table separating outcome, measure and basis or next validation; never a dense baseline/target paragraph. Chart slides use the supplied computed endpoint headline as their governingMessage. Omit points and takeaway on chart slides: the governed chart interpretation supplies the boundary. Put causal diagnoses on their own evidence-supported page, never over unrelated time series.`;
}

function markdownClaims(markdown: string): string[] {
  const tree = fromMarkdown(markdown, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });
  const source = (node: Nodes): string =>
    "value" in node
      ? node.value
      : "children" in node
        ? node.children
            .map(source)
            .join(
              ["root", "list", "listItem", "blockquote"].includes(node.type)
                ? "\n"
                : "",
            )
        : "alt" in node
          ? node.alt || ""
          : node.type === "break"
            ? "\n"
            : "";
  return tree.children.flatMap((node) => {
    if (node.type !== "table") return [source(node)];
    return node.children.flatMap((row) => {
      const cells = row.children.map(source);
      const cites =
        cells
          .join(" ")
          .match(/\[\d+(?:\s*[,–-]\s*\d+)*\]/g)
          ?.join(" ") || "";
      return cells.map((cell) => `${cell} ${cites}`);
    });
  });
}

export function purposeVisibleText(doc: RenderableDeliverable): string[] {
  return [
    doc.title,
    doc.subtitle || "",
    ...markdownClaims(doc.recommendation),
    ...doc.generatedSections.flatMap((s) => [
      s.title,
      ...markdownClaims(s.bodyMarkdown),
    ]),
    ...(doc.deckSlides || []).flatMap((s) =>
      [
        s.governingMessage,
        ...(s.points || []),
        s.pageIntent?.scopeNote || "",
        s.pageIntent?.takeaway || "",
        s.pageIntent?.takeawayLabel || "",
      ]
        .filter(Boolean)
        .map(
          (text) =>
            `${text}${s.citationsUsed?.length ? ` ${compactPurposeCitationIds(s.citationsUsed)}` : ""}`,
        ),
    ),
    ...doc.tables.flatMap((t) => [
      t.title,
      ...(t.columns || []),
      ...(t.rows || []).flatMap((row) => {
        const cites =
          row
            .join(" ")
            .match(/\[(?:\d+|[A-Z]+\d+)(?:\s*[,–-]\s*(?:\d+|[A-Z]+\d+))*\]/g)
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
  evidence: readonly PurposeClaimEvidence[],
  context: PurposeClaimContext = {},
): string[] {
  return classifyPurposeClaims(text, evidence, context)
    .filter((c) => !c.supported)
    .map((c) => c.sentence);
}

export function validatePurposeStory(
  doc: RenderableDeliverable,
  evidence: readonly PurposeClaimEvidence[],
  context: PurposeClaimContext = {},
): string[] {
  const errors: string[] = [];
  if (!["charter", "discovery_report"].includes(doc.deliverableType || ""))
    return errors;
  const charter = doc.deliverableType === "charter";
  if (charter) {
    const measures = doc.generatedSections.find(
      (s) => s.key === "success_measures",
    );
    const tree =
      measures &&
      fromMarkdown(measures.bodyMarkdown, {
        extensions: [gfm()],
        mdastExtensions: [gfmFromMarkdown()],
      });
    const nativeTable = doc.tables.some(
      (t) =>
        ["success_measures", "success_measures_table"].includes(t.key) &&
        t.targetFormat !== "xlsx" &&
        t.rows?.length > 0,
    );
    if (
      measures &&
      !nativeTable &&
      !tree?.children.some((n) => n.type === "table" && n.children.length > 1)
    )
      errors.push("purpose_story:success_measures_need_table");
    const measureText = (node: Nodes): string =>
      "value" in node
        ? node.value
        : "children" in node
          ? node.children.map(measureText).join("")
          : "";
    const measureRows = [
      ...(tree?.children.flatMap((node) =>
        node.type === "table"
          ? node.children.slice(1).map((row) => row.children.map(measureText))
          : [],
      ) || []),
      ...doc.tables
        .filter((table) =>
          ["success_measures", "success_measures_table"].includes(table.key),
        )
        .flatMap((table) => table.rows || []),
    ];
    if (
      measureRows.some((row) =>
        row.some((cell) =>
          /^(?:measure and definition work|measure and target|basis or next validation)(?:\s*\[[\d,\s–-]+\])*[.]?$/i.test(
            cell.trim(),
          ),
        ),
      )
    )
      errors.push("purpose_story:measure_cell_is_column_heading");
  }
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
    // R5 §3 and §1 for what the writer authors: one finding per title, a short caveat that is not
    // repeated boilerplate, and no citation codes on either. Citations belong in the footer and the
    // table's own Source column, where they are already collected for every page.
    const seenCaveats = new Set<string>();
    for (const slide of doc.deckSlides || []) {
      const key = slide.key || "slide";
      const title = slide.governingMessage || "";
      if (title.length > PURPOSE_TITLE_MAX_CHARS)
        errors.push(`purpose_story:title_too_long:${key}`);
      if (title.includes(";"))
        errors.push(`purpose_story:title_two_clauses:${key}`);
      if (/\[\s*\d/.test(title))
        errors.push(`purpose_story:citation_in_title:${key}`);
      const caveat = slide.pageIntent?.scopeNote?.trim() || "";
      if (caveat) {
        if (caveat.length > PURPOSE_CAVEAT_MAX_CHARS)
          errors.push(`purpose_story:caveat_too_long:${key}`);
        if (/^this page\b/i.test(caveat))
          errors.push(`purpose_story:caveat_this_page:${key}`);
        if (/\[\s*\d/.test(caveat))
          errors.push(`purpose_story:citation_in_caveat:${key}`);
        const normalized = caveat
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, " ")
          .trim();
        if (seenCaveats.has(normalized))
          errors.push(`purpose_story:caveat_repeated:${key}`);
        seenCaveats.add(normalized);
      }
    }
    // R5 §6: a repetition budget, checked on sentences rather than left to the writer's judgement.
    // Twenty regenerations showed the writer will restate the decision and reuse a takeaway on every
    // page it can; these make that a rejection rather than a reviewer's deduction.
    const sentence = (value: string) =>
      value
        .replace(/\[[^\]]*\]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
    const seenTakeaways = new Set<string>();
    for (const slide of doc.deckSlides || []) {
      const key = slide.key || "slide";
      const takeaway = slide.pageIntent?.takeaway?.trim();
      if (!takeaway) continue;
      const pair = `${sentence(slide.pageIntent?.takeawayLabel || "")}|${sentence(takeaway)}`;
      if (seenTakeaways.has(pair))
        errors.push(`purpose_story:takeaway_repeated:${key}`);
      seenTakeaways.add(pair);
      const rows =
        doc.tables.find((t) => t.key === slide.pageIntent?.tableKey)?.rows ||
        [];
      if (
        rows.some((row) =>
          row.some((cell) => sentence(cell) === sentence(takeaway)),
        )
      )
        errors.push(`purpose_story:takeaway_repeats_row:${key}`);
    }
    // The decision page is read in one glance. Rows are counted after grouping by client label, the
    // way they render, so three conditions under one "Conditions to close" row count once.
    for (const table of doc.tables) {
      if (table.pageShape !== "decision") continue;
      const rendered = groupPurposeStatusItems(
        table.rows.map((row, i) => ({
          label: row[0] || "",
          tone: table.rowTones?.[i],
          detail: row.slice(1).join(" "),
        })),
      );
      if (rendered.length > PURPOSE_DECISION_MAX_ROWS)
        errors.push(`purpose_story:decision_rows_exceed:${table.key}`);
    }
    const decision = sentence(doc.deckSlides?.[0]?.governingMessage || "");
    if (decision) {
      const restated = (doc.deckSlides || [])
        .slice(1)
        .filter((slide) =>
          [
            slide.governingMessage,
            slide.pageIntent?.takeaway || "",
            ...(slide.points || []),
          ].some((text) => sentence(text) === decision),
        );
      // The summary states it; next steps may state it once more. A third time is padding.
      if (restated.length > 1)
        errors.push(
          `purpose_story:decision_restated:${restated.map((s) => s.key).join(",")}`,
        );
    }
    for (const slide of doc.deckSlides || []) {
      if (
        /\bhypothes(?:is|es)\b/i.test(slide.pageIntent?.scopeNote || "") &&
        !uncertainty.test(slide.governingMessage)
      )
        errors.push(
          `purpose_story:hypothesis_hidden_from_headline:${slide.key}`,
        );
    }
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
  const scopeNotes = new Set(
    (doc.deckSlides || [])
      .map((s) =>
        s.pageIntent?.scopeNote
          ? `${s.pageIntent.scopeNote}${s.citationsUsed?.length ? ` ${compactPurposeCitationIds(s.citationsUsed)}` : ""}`
          : "",
      )
      .filter(Boolean),
  );
  for (const text of purposeVisibleText(doc))
    errors.push(
      ...validatePurposeText(text, doc, evidence, {
        ...context,
        textRole: scopeNotes.has(text) ? "scope" : "body",
      }),
    );
  return [...new Set(errors)];
}

export function validatePurposeText(
  text: string,
  doc: Pick<RenderableDeliverable, "deliverableType" | "sourceRegister">,
  evidence: readonly PurposeClaimEvidence[],
  context: PurposeClaimContext = {},
): string[] {
  const errors: string[] = [];
  const charter = doc.deliverableType === "charter";

  for (const sentence of text.split(/\n|(?<=[.!?])\s+/))
    if (operatorProse.test(sentence))
      errors.push(
        `purpose_story:operator_instructions_in_body:${sentence.slice(0, 100)}`,
      );
  if (
    /\b(?:not_reviewed|not_verified|review_pending|owner_review_pending|source_asserted|client_confirmed|one_source)\b/i.test(
      text,
    )
  )
    errors.push(`purpose_story:raw_status_in_body:${text.slice(0, 100)}`);
  if (
    charter &&
    text
      .split(/\n|(?<=[.!?])\s+/)
      .some(
        (sentence) =>
          /\bthis charter authori[sz]es\b/i.test(sentence) &&
          !/\b(?:once|when|if) approved\b/i.test(sentence),
      )
  )
    errors.push("purpose_story:draft_claims_authorization");
  const sourceDisclosure = ["source", "disclosure"].includes(
    context.textRole || "",
  );
  const scenarioScope =
    context.textRole === "scope" &&
    context.syntheticInputBundle &&
    /\bsynthetic\b/i.test(text) &&
    !/\b(?:invented|fixture|demo)\b/i.test(text);
  const permittedDataControl =
    /\b(?:use synthetic or approved de-identified material|no raw (?:member identifiers|PHI).{0,60}(?:model prompts|demo uploads))\b/i.test(
      text,
    ) && !/\b(?:invented|fixture)\b/i.test(text);
  if (
    marker.test(text) &&
    !sourceDisclosure &&
    !scenarioScope &&
    !permittedDataControl
  )
    errors.push(`purpose_story:classification_in_body:${text.slice(0, 100)}`);
  const citedText = text.replace(
    /\[([A-Z]+\d+(?:\s*[,–-]\s*[A-Z]*\d+)*)\]/g,
    (match, body: string) => {
      const ids: number[] = [];
      for (const piece of body.split(/\s*,\s*/)) {
        const [start, end] = piece.split(/\s*[–-]\s*/);
        const a = doc.sourceRegister.find(
          (s) => s.referenceId === start,
        )?.citationNumber;
        const endLabel =
          end && /^\d/.test(end) ? start!.replace(/\d+$/, end) : end;
        const b = endLabel
          ? doc.sourceRegister.find((s) => s.referenceId === endLabel)
              ?.citationNumber
          : a;
        if (!a || !b || b < a) return match;
        for (let i = a; i <= b; i++) ids.push(i);
      }
      return compactPurposeCitationIds(ids);
    },
  );
  for (const sentence of citedText.split(/\n|(?<=[.!?])\s+(?!\s*\[)/)) {
    if (
      !/\b(?:approved (?:input(?: package)?|source (?:file|package|record)|(?:P[0-5](?: and |,?\s*))*package(?: files)?|charter)|(?:input|source|package|charter) (?:is |was |has been )approved)\b/i.test(
        sentence,
      ) ||
      /\b(?:not approved|if approved|once approved|when approved)\b/i.test(
        sentence,
      )
    )
      continue;
    const ids = purposeCitationIds(sentence);
    if (
      !ids.length ||
      ids.some(
        (id) =>
          evidence.find((e) => e.citationNumber === id)?.approvalState !==
          "approved",
      )
    )
      errors.push("purpose_story:draft_claims_authorization");
  }
  for (const claim of unsupportedPurposeAbsences(citedText, evidence, context))
    errors.push(`purpose_story:unsupported_absence:${claim.slice(0, 160)}`);
  return [...new Set(errors)];
}
