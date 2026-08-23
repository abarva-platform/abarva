// Render a RenderableDeliverable (the orchestrator's structured output) to a
// single self-contained HTML deck — all CSS inlined, no external assets — so it
// drops into the existing board-grade vault/persistence path unchanged.
//
// The model's section bodies are markdown. We render a SAFE markdown subset
// (headings, lists, tables, bold, inline code, paragraphs): every character is
// HTML-escaped FIRST, then the structural transforms run on the escaped text, so
// model output can never inject markup. Anything we don't recognise renders as
// escaped text — never as raw HTML.

import { humanizeSourceFamily } from "@/lib/deliverables/orchestrator/source-register";
import type { RenderableDeliverable } from "@/lib/deliverables/orchestrator/types";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Inline markdown on already-escaped text: **bold**, *em*, `code`. */
function inline(escaped: string): string {
  return escaped
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function renderTableBlock(lines: string[]): string {
  const toCells = (line: string): string[] =>
    line
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((c) => c.trim());
  const header = toCells(lines[0]);
  const bodyLines = lines.slice(2); // line 1 is the |---|---| separator
  const head = `<tr>${header.map((c) => `<th>${inline(esc(c))}</th>`).join("")}</tr>`;
  const body = bodyLines
    .map(
      (l) =>
        `<tr>${toCells(l)
          .map((c) => `<td>${inline(esc(c))}</td>`)
          .join("")}</tr>`,
    )
    .join("");
  return `<table class="md"><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

/** Safe markdown-subset → HTML. */
export function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;
  let listType: "ul" | "ol" | null = null;

  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Table: a header row followed by a |---| separator.
    if (
      /^\|.*\|$/.test(trimmed) &&
      i + 1 < lines.length &&
      /^\|?[\s:|-]+\|?$/.test(lines[i + 1].trim()) &&
      lines[i + 1].includes("-")
    ) {
      closeList();
      const block: string[] = [];
      while (i < lines.length && /^\|.*\|$/.test(lines[i].trim())) {
        block.push(lines[i].trim());
        i += 1;
      }
      out.push(renderTableBlock(block));
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (heading) {
      closeList();
      const level = Math.min(heading[1].length + 1, 6); // # → h2, never h1 (doc owns h1)
      out.push(`<h${level}>${inline(esc(heading[2]))}</h${level}>`);
      i += 1;
      continue;
    }

    const ul = /^[-*]\s+(.*)$/.exec(trimmed);
    const ol = /^\d+\.\s+(.*)$/.exec(trimmed);
    if (ul || ol) {
      const wanted: "ul" | "ol" = ul ? "ul" : "ol";
      if (listType !== wanted) {
        closeList();
        out.push(`<${wanted}>`);
        listType = wanted;
      }
      out.push(`<li>${inline(esc((ul ?? ol)![1]))}</li>`);
      i += 1;
      continue;
    }

    if (trimmed === "") {
      closeList();
      i += 1;
      continue;
    }

    closeList();
    out.push(`<p>${inline(esc(trimmed))}</p>`);
    i += 1;
  }
  closeList();
  return out.join("\n");
}

const STYLE = `
:root{--ink:#1a1a1a;--muted:#555;--rule:#e2e2e2;--accent:#1b2b5c;--bg:#fff}
*{box-sizing:border-box}
body{font-family:Georgia,'Times New Roman',serif;color:var(--ink);background:var(--bg);margin:0;line-height:1.5}
.page{max-width:920px;margin:0 auto;padding:48px 56px}
.cover{border-bottom:3px solid var(--accent);padding-bottom:24px;margin-bottom:32px}
.cover .kicker{font-family:'DM Sans',Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;font-size:12px;color:var(--muted)}
h1{font-size:30px;margin:8px 0 4px;color:var(--accent)}
.sub{color:var(--muted);font-size:15px}
h2{font-family:'DM Sans',Arial,sans-serif;font-size:19px;margin:32px 0 8px;color:var(--accent);border-bottom:1px solid var(--rule);padding-bottom:4px}
h3{font-family:'DM Sans',Arial,sans-serif;font-size:16px;margin:20px 0 6px}
h4{font-family:'DM Sans',Arial,sans-serif;font-size:14px;margin:16px 0 4px;color:var(--muted)}
p,li{font-size:15px}
ul,ol{margin:8px 0 8px 22px}
code{font-family:'DM Mono',monospace;background:#f3f3f0;padding:1px 4px;border-radius:3px;font-size:13px}
table.md{border-collapse:collapse;width:100%;margin:12px 0;font-family:'DM Sans',Arial,sans-serif;font-size:13px}
table.md th{background:var(--accent);color:#fff;text-align:left;padding:8px 10px}
table.md td{border-bottom:1px solid var(--rule);padding:7px 10px;vertical-align:top}
table.md tbody tr:nth-child(even){background:#f8f8f6}
.rec{background:#f5f7fc;border-left:4px solid var(--accent);padding:16px 20px;margin:24px 0;font-size:16px}
.toc{font-family:'DM Sans',Arial,sans-serif;font-size:13px;color:var(--muted);columns:2;margin-bottom:24px}
.toc a{color:var(--muted);text-decoration:none}
.meta{font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:var(--muted);margin-top:40px;border-top:1px solid var(--rule);padding-top:12px}
.checklist li{color:#7a4a00}
.doc-status{font-family:'DM Sans',Arial,sans-serif;background:#fff8e6;border:1px solid #e8cf8a;border-radius:6px;padding:14px 18px;margin-bottom:24px;font-size:13px;color:#5a4a1a}
.doc-status .status-title{font-weight:700;text-transform:uppercase;letter-spacing:.06em;font-size:11px;margin-bottom:8px}
.doc-status ol{margin:6px 0 8px 20px}
.doc-status .status-line{font-weight:600}
.status-footer{font-family:'DM Sans',Arial,sans-serif;font-size:11px;color:#8a6d1a;text-align:center;margin-top:8px;padding:8px 0;border-top:1px dashed #e8cf8a}
`;

/** Required cover-page status block — every generated artifact carries this until a real approval record exists. */
function renderDocStatusBlock(): string {
  return `<div class="doc-status">
<div class="status-title">Document Status</div>
<div><strong>Generated by:</strong> AbarVa aVa AI-assisted generation</div>
<div class="status-line"><strong>Current status:</strong> AI-generated working draft — not approved</div>
<div style="margin-top:8px"><strong>Required next steps:</strong></div>
<ol>
<li>Review for factual accuracy and completeness.</li>
<li>Resolve highlighted assumptions and evidence gaps.</li>
<li>Update with client decisions and workshop outcomes.</li>
<li>Obtain named human approval.</li>
<li>Upload the approved version to become the governed record.</li>
</ol>
<div>This document must not be treated as an approved client deliverable, implementation instruction, financial commitment, architecture decision, or value claim until human approval is recorded.</div>
</div>`;
}

/**
 * Render the full self-contained HTML deck. `generatedOn` is an ISO date
 * (YYYY-MM-DD) passed in by the caller — this module does no clock access.
 */
export function renderDeliverableHtml(
  doc: RenderableDeliverable,
  generatedOn: string,
): string {
  const toc = doc.generatedSections
    .map((s) => `<a href="#${esc(s.key)}">${esc(s.title)}</a>`)
    .join(" · ");

  const sections = doc.generatedSections
    .map(
      (s) => `<section id="${esc(s.key)}">
<h2>${esc(s.title)}</h2>
${markdownToHtml(s.bodyMarkdown)}
</section>`,
    )
    .join("\n");

  const tables = doc.tables.length
    ? `<section id="exhibits"><h2>Exhibits & Tables</h2>${doc.tables
        .map(
          (t) => `<h3>${esc(t.title)}</h3>
<table class="md"><thead><tr>${t.columns
            .map((c) => `<th>${esc(c)}</th>`)
            .join("")}</tr></thead><tbody>${t.rows
            .map(
              (r) =>
                `<tr>${r.map((c) => `<td>${esc(String(c))}</td>`).join("")}</tr>`,
            )
            .join("")}</tbody></table>`,
        )
        .join("\n")}</section>`
    : "";

  const recommendation = doc.recommendation
    ? `<div class="rec"><strong>Recommendation.</strong> ${esc(doc.recommendation)}</div>`
    : "";

  const nextActions = doc.nextActions.length
    ? `<section id="next-actions"><h2>Next Actions</h2><ol>${doc.nextActions
        .map((a) => `<li>${esc(a)}</li>`)
        .join("")}</ol></section>`
    : "";

  const assumptions = doc.assumptions.length
    ? `<section id="assumptions"><h2>Assumptions to Validate</h2><ul>${doc.assumptions
        .map(
          (a) =>
            `<li><strong>${esc(a.statement)}</strong> — ${esc(a.basis)}${a.mustValidate ? " <em>[validate]</em>" : ""}</li>`,
        )
        .join("")}</ul></section>`
    : "";

  const clientComplete = doc.clientCompleteChecklist.length
    ? `<section id="client-complete"><h2>Client-to-Complete</h2><ul class="checklist">${doc.clientCompleteChecklist
        .map(
          (c) =>
            `<li><strong>${esc(c.label)}</strong> (${esc(String(c.owner))}) — ${esc(c.placeholderText)}</li>`,
        )
        .join("")}</ul></section>`
    : "";

  const sourceRegister = doc.sourceRegister.length
    ? `<section id="source-register"><h2>Source Register</h2><table class="md"><thead><tr><th>[n]</th><th>Source</th><th>Family</th><th>Confidence</th><th>As of</th></tr></thead><tbody>${doc.sourceRegister
        .map(
          (e) =>
            `<tr><td>[${e.citationNumber}]</td><td>${esc(e.label)}</td><td>${esc(humanizeSourceFamily(e.evidenceFamily))}</td><td>${esc(e.confidence)}</td><td>${esc(e.asOf ?? "—")}</td></tr>`,
        )
        .join("")}</tbody></table></section>`
    : "";

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(doc.title)}</title><style>${STYLE}</style></head><body><div class="page">
<div class="cover">
<div class="kicker">${esc(doc.clientDisplayName)} · Board-Grade Deliverable</div>
<h1>${esc(doc.title)}</h1>
${doc.subtitle ? `<div class="sub">${esc(doc.subtitle)}</div>` : ""}
<div class="sub">${esc(doc.initiativeDisplayName)}</div>
</div>
${renderDocStatusBlock()}
<nav class="toc">${toc}</nav>
${recommendation}
${sections}
${tables}
${assumptions}
${clientComplete}
${nextActions}
${sourceRegister}
<div class="meta">Generated ${esc(generatedOn)} · Authored by the Deliverable Intelligence Orchestrator (governed multi-pass) · Every client-specific fact is cited [n], an approved assumption, or a labelled placeholder.</div>
<div class="status-footer">AI-generated working draft. Human review, update, approval, and approved re-upload are required before this artifact becomes authoritative.</div>
</div></body></html>`;
}
