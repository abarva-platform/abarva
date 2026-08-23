// Client-readiness scan over generated Move artifacts.
//
//   npm run moves:scan-artifacts -- <path|dir> [more paths...]
//
// Reads .docx, .pptx, .html, .md and .txt and reports anything a client
// executive, procurement lead, architecture reviewer or finance sponsor should
// never see: UUIDs, content hashes, model names, schema identifiers, internal
// reference codes, unresolved placeholders, pipeline vocabulary and filler.
//
// Read-only. It opens files and prints findings. It never writes, uploads,
// mutates tenant data, or touches the data plane.
//
// The one behaviour worth knowing up front: a document that cannot be read is
// reported as UNREADABLE and counted separately — never as clean. An earlier
// ad-hoc version of this check parsed DOCX binaries as if they were HTML and
// reported internal hashes in eight documents that contained none. Staying
// quiet about a file we failed to open is how that happens, so it is made
// loud here.
//
// Exit codes: 0 clean · 1 blockers found · 2 unreadable documents · 3 usage.

import { readFile, readdir, stat } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import process from "node:process";

import { scanClientReadiness } from "@/lib/deliverables/shared/client-readiness-scan";
import {
  extractOfficeText,
  type OfficeFormat,
} from "@/lib/deliverables/shared/office-text-extract";

const TEXT_EXTENSIONS = new Set([".html", ".htm", ".md", ".txt"]);
const OFFICE_EXTENSIONS = new Map<string, OfficeFormat>([
  [".docx", "docx"],
  [".pptx", "pptx"],
]);

function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<br\b[^>]*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function collectFiles(target: string): Promise<string[]> {
  const info = await stat(target);
  if (info.isFile()) return [target];
  const entries = await readdir(target, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const full = join(target, entry.name);
    if (entry.isDirectory()) out.push(...(await collectFiles(full)));
    else out.push(full);
  }
  return out;
}

type ReadResult =
  | { ok: true; text: string }
  | { ok: false; detail: string; unsupported?: boolean };

async function readDocument(path: string): Promise<ReadResult> {
  const ext = extname(path).toLowerCase();
  const officeFormat = OFFICE_EXTENSIONS.get(ext);

  if (officeFormat) {
    const bytes = new Uint8Array(await readFile(path));
    const result = await extractOfficeText(bytes, officeFormat);
    return result.ok
      ? { ok: true, text: result.text }
      : { ok: false, detail: `${result.reason} — ${result.detail}` };
  }

  if (TEXT_EXTENSIONS.has(ext)) {
    const raw = await readFile(path, "utf8");
    const text = ext === ".md" || ext === ".txt" ? raw : stripHtml(raw);
    return text.trim().length > 0
      ? { ok: true, text }
      : { ok: false, detail: "empty_document — no text after parsing" };
  }

  return {
    ok: false,
    unsupported: true,
    detail: `unsupported_extension — ${ext || "(none)"}`,
  };
}

async function main(): Promise<number> {
  const targets = process.argv.slice(2);
  if (targets.length === 0) {
    console.error(
      "usage: npm run moves:scan-artifacts -- <path|dir> [more paths...]",
    );
    return 3;
  }

  const files: string[] = [];
  for (const target of targets) {
    try {
      files.push(...(await collectFiles(target)));
    } catch (err) {
      console.error(
        `cannot read ${target}: ${err instanceof Error ? err.message : String(err)}`,
      );
      return 3;
    }
  }

  let totalBlockers = 0;
  let totalReview = 0;
  let unreadable = 0;
  let cleanCount = 0;
  const skipped: string[] = [];

  for (const path of files.sort()) {
    const doc = await readDocument(path);

    if (!doc.ok) {
      if (doc.unsupported) {
        skipped.push(basename(path));
        continue;
      }
      unreadable += 1;
      console.log(`\nUNREADABLE  ${path}`);
      console.log(`            ${doc.detail}`);
      console.log("            NOT scanned — do not treat as clean.");
      continue;
    }

    const result = scanClientReadiness(doc.text);
    totalBlockers += result.blockers;
    totalReview += result.reviewItems;

    if (result.clean) {
      cleanCount += 1;
      console.log(`\nCLEAN       ${path}  (${doc.text.length} chars)`);
      continue;
    }

    console.log(
      `\nFINDINGS    ${path}  (${doc.text.length} chars, ` +
        `${result.blockers} blocker(s), ${result.reviewItems} to review)`,
    );
    for (const finding of result.findings) {
      const tag = finding.severity === "blocker" ? "BLOCKER" : "review ";
      console.log(`  ${tag} [${finding.kind}] ${finding.match}`);
      console.log(`          ${finding.why}`);
      console.log(`          …${finding.context}…`);
    }
  }

  console.log("\n" + "-".repeat(72));
  console.log(
    `scanned ${files.length - skipped.length} document(s): ` +
      `${cleanCount} clean, ${totalBlockers} blocker(s), ` +
      `${totalReview} to review, ${unreadable} unreadable`,
  );
  if (skipped.length > 0) {
    console.log(
      `skipped ${skipped.length} unsupported file(s): ${skipped.join(", ")}`,
    );
  }
  if (unreadable > 0) {
    console.log(
      "unreadable documents were NOT scanned — their content is unverified",
    );
  }

  if (totalBlockers > 0) return 1;
  if (unreadable > 0) return 2;
  return 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err);
    process.exit(3);
  },
);
