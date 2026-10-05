import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import Papa from "papaparse";

import { listSourceArchetypes } from "../../src/lib/source/archetypes/registry.ts";

const HEADERS = [
  "company_key",
  "company_name",
  "company_domain",
  "archetype_id",
  "capability_basis",
  "source_url",
  "checked_on",
  "research_state",
  "contact_policy",
];

const DEFAULT_INPUT = new URL(
  "../../datasets/source/market-candidate-research-v1/candidates.csv",
  import.meta.url,
);

export function validateMarketCandidateResearch(
  csvText,
  archetypeIds = listSourceArchetypes().map(({ id }) => id),
  { minimumPerArchetype = 5 } = {},
) {
  const errors = [];
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true, transform: (value) => value.trim() });
  errors.push(...parsed.errors.map(({ row, message }) => `CSV row ${row}: ${message}`));
  const fields = parsed.meta.fields ?? [];
  for (const field of HEADERS) {
    if (!fields.includes(field)) errors.push(`Missing column ${field}`);
  }
  for (const field of fields) {
    if (!HEADERS.includes(field)) errors.push(`Unexpected column ${field}`);
  }

  const expected = new Set(archetypeIds);
  const counts = new Map(archetypeIds.map((id) => [id, 0]));
  const identities = new Map();
  const pairs = new Set();
  for (const [index, row] of parsed.data.entries()) {
    const label = `Row ${index + 2}`;
    if (!row.company_key || !/^[a-z0-9_]+$/.test(row.company_key)) errors.push(`${label}: invalid company key`);
    if (!row.company_name || !row.company_domain || !row.capability_basis) errors.push(`${label}: incomplete research basis`);
    if (Object.values(row).some((value) => typeof value === "string" && /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(value))) {
      errors.push(`${label}: contact address in research pack`);
    }
    if (row.research_state !== "unreviewed_market_candidate") errors.push(`${label}: research is not an approval`);
    if (row.contact_policy !== "do_not_contact_without_buyer_authorization") errors.push(`${label}: contact authority not established`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.checked_on ?? "") || Number.isNaN(Date.parse(row.checked_on))) {
      errors.push(`${label}: invalid checked date`);
    }
    if (!expected.has(row.archetype_id) || row.archetype_id === "CONTRACT_RENEWAL") {
      errors.push(`${label}: unknown or incumbent-specific archetype`);
    } else {
      counts.set(row.archetype_id, counts.get(row.archetype_id) + 1);
    }
    const pair = `${row.company_key}:${row.archetype_id}`;
    if (pairs.has(pair)) errors.push(`${label}: duplicate company-archetype fit`);
    pairs.add(pair);
    const identity = `${row.company_name}|${row.company_domain}`;
    if (identities.has(row.company_key) && identities.get(row.company_key) !== identity) {
      errors.push(`${label}: company identity differs across archetypes`);
    }
    identities.set(row.company_key, identity);
    try {
      const url = new URL(row.source_url);
      const domain = row.company_domain?.toLowerCase();
      if (url.protocol !== "https:" || !domain || (url.hostname !== domain && !url.hostname.endsWith(`.${domain}`))) {
        errors.push(`${label}: source is not HTTPS on the declared company domain`);
      }
    } catch {
      errors.push(`${label}: invalid source URL`);
    }
  }
  for (const id of archetypeIds) {
    if (id !== "CONTRACT_RENEWAL" && (counts.get(id) ?? 0) < minimumPerArchetype) {
      errors.push(`${id}: fewer than ${minimumPerArchetype} research candidates`);
    }
  }
  return {
    status: errors.length === 0 ? "pass" : "fail",
    rows: parsed.data.length,
    distinctCompanies: identities.size,
    coveredArchetypes: [...counts].filter(([id, count]) => id !== "CONTRACT_RENEWAL" && count >= minimumPerArchetype).length,
    renewalDisposition: "incumbent_specific",
    sha256: createHash("sha256").update(csvText).digest("hex"),
    errors,
    authority: {
      researchOnly: true,
      canonicalSupplierWriteAuthorized: false,
      buyerApprovalRecorded: false,
      contactAuthorized: false,
    },
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const input = process.argv[2] ? readFileSync(process.argv[2], "utf8") : readFileSync(DEFAULT_INPUT, "utf8");
  const report = validateMarketCandidateResearch(input);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.status === "fail") process.exitCode = 1;
}
