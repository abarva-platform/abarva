#!/usr/bin/env node
import { Client } from "pg";

const DATABASE_URL = process.env.DATABASE_URL;
const TENANT_KEY = process.env.TENANT_KEY || "";
const QUESTION = process.env.QUESTION || "";
const LIMIT = Number(process.env.LIMIT || 5);

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function parseJson(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(String(value));
  } catch {
    return value;
  }
}

function firstChars(value, length = 3000) {
  if (value === null || value === undefined) return null;
  const text = String(value);
  return text.length > length ? `${text.slice(0, length)}…[truncated ${text.length - length} chars]` : text;
}

async function main() {
  await client.connect();

  const filters = [];
  const params = [];
  if (TENANT_KEY) {
    params.push(TENANT_KEY);
    filters.push(`at.tenant_key = $${params.length}`);
  }
  if (QUESTION) {
    params.push(`%${QUESTION}%`);
    filters.push(`at.user_question ilike $${params.length}`);
  }
  params.push(Math.max(1, Math.min(25, LIMIT)));

  const where = filters.length ? `where ${filters.join(" and ")}` : "";
  const result = await client.query(
    `
      select
        at.trace_key,
        at.tenant_key,
        at.user_question,
        at.contract_key,
        at.measure_key,
        at.validation_status,
        at.validation_errors,
        at.latency_ms,
        at.model_name,
        at.created_at,
        at.raw_model_response,
        at.rendered_response,
        at.artifacts,
        pp.prompt_package_key,
        pp.prompt_hash,
        pp.prompt_text,
        pp.deterministic_packet
      from cio_tower.answer_traces at
      left join cio_tower.prompt_packages pp
        on pp.prompt_package_key = at.prompt_package_key
      ${where}
      order by at.created_at desc
      limit $${params.length}
    `,
    params,
  );

  const rows = result.rows.map((row) => ({
    trace_key: row.trace_key,
    tenant_key: row.tenant_key,
    user_question: row.user_question,
    contract_key: row.contract_key,
    measure_key: row.measure_key,
    validation_status: row.validation_status,
    validation_errors: parseJson(row.validation_errors),
    latency_ms: row.latency_ms,
    model_name: row.model_name,
    created_at: row.created_at,
    raw_model_response: firstChars(row.raw_model_response),
    rendered_response: firstChars(row.rendered_response),
    artifacts: parseJson(row.artifacts),
    prompt_package_key: row.prompt_package_key,
    prompt_hash: row.prompt_hash,
    prompt_text: firstChars(row.prompt_text, 5000),
    deterministic_packet: parseJson(row.deterministic_packet),
  }));

  console.log(JSON.stringify({ filters: { tenantKey: TENANT_KEY, question: QUESTION, limit: LIMIT }, count: rows.length, rows }, null, 2));
  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  try {
    await client.end();
  } catch {
    // ignore close failures during error handling
  }
  process.exit(1);
});
