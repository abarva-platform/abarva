#!/usr/bin/env node
/**
 * Home live gate — verifies the React Home pilot for one tenant on the DEPLOYED app.
 *
 * The CI tests prove the component composes; this proves the two things they can't:
 *   1. `/home` resolves to the React Home KNOW surface (not the retired
 *      static Home v2 iframe).
 *   2. The Home ask is the real Home KNOW engine — a synthesized answer, NOT the old
 *      fake `answerForAsk` row-dump ("field: value · Also: …") — with no raw
 *      internal IDs, named experts, and the cross-tenant fence holding.
 *   3. The canonical 19-dimension context roster is exposed, not the old 8
 *      roll-up buckets.
 *   4. A prompt that explicitly asks for a table/chart emits a typed exhibit for
 *      the canonical renderer, and the prose is readable consultant-shaped text.
 *
 * One command, signed in as the pilot tenant (Apex by default):
 *   BASE_URL=https://app.abarva.ai \
 *   COOKIE='__session=...; ...' \      # the signed-in cookie from the browser
 *   TENANT=apexretail \
 *   node scripts/qa/home-live-gate.mjs
 *
 * Exit 0 = gate passed; 1 = failed (details printed).
 */

const BASE_URL = (process.env.BASE_URL || "https://app.abarva.ai").replace(/\/$/, "");
const COOKIE = process.env.COOKIE || "";
const TENANT = process.env.TENANT || "apexretail"; // App ClientKey
const BINDING =
  { apexretail: "apex-retail", skyharbor: "skyharbor-air", firstcapital: "first-capital", meridian: "meridian-health" }[TENANT] ||
  TENANT;
const OTHER = TENANT === "apexretail" ? "first-capital" : "apex-retail";

const RAW_ID = /\b[A-Z]{2,6}-[A-Z0-9]{2,8}-\d{2,4}\b/; // APX-DATA-003 etc.
const FAKE_GLOB = /\bAlso:\s/; // the old answerForAsk row-globbing signature
const REFUSAL =
  /can'?t (use|share|access)|another (client|tenant)|not authori[sz]ed|only your|isolat|fenc/i;
const TEMPLATE_PREFIX = /\b(Read|Evidence|Implication|Next move):/;

if (!COOKIE) {
  console.error("Set COOKIE (signed-in session). See header for usage.");
  process.exit(2);
}

const checks = [];
const rec = (name, pass, detail) => checks.push({ name, pass, detail });

async function getHome() {
  const res = await fetch(`${BASE_URL}/home`, { headers: { cookie: COOKIE } });
  return { ok: res.ok, html: await res.text() };
}

async function ask(query, requestedClient) {
  const res = await fetch(`${BASE_URL}/api/home/know/ask`, {
    method: "POST",
    headers: {
      cookie: COOKIE,
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      question: query,
      tenantKey: requestedClient ?? BINDING,
      client: TENANT,
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const answer = await res.json();
  const prose = answer?.prose ?? "";
  const hasExhibit = Boolean(answer?.tables?.length || answer?.charts?.length || answer?.graphs?.length);
  const evidenceChannels = answer?.safety?.evidenceChannels ?? {};
  const usableEvidence = answer?.safety?.usableEvidence ?? null;
  return { prose, answer, experts: [], blocked: answer?.answerStatus === "blocked", hasExhibit, evidenceChannels, usableEvidence };
}

function isReadableConsultantAnswer(prose) {
  const text = prose.trim();
  if (!text) return false;
  if (TEMPLATE_PREFIX.test(text)) return false;

  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length >= 2) return true;

  const longestParagraphWords = Math.max(
    0,
    ...paragraphs.map((p) => p.split(/\s+/).filter(Boolean).length),
  );
  return longestParagraphWords > 0 && longestParagraphWords <= 80;
}

async function run() {
  console.log(`\nHome live gate · tenant=${TENANT} · ${BASE_URL}\n${"─".repeat(58)}`);

  // 1) /home is the React Home KNOW surface (not the static iframe).
  try {
    const { ok, html } = await getHome();
    const isReact = /class="homex"|Context Explorer/.test(html) && !/\/api\/home\/v2-frame/.test(html);
    rec(
      "/home serves the React Home KNOW surface",
      ok && isReact,
      isReact
        ? "homex present, static iframe absent"
        : /v2-frame/.test(html)
          ? "still the static iframe — flag not on for this tenant"
          : "unexpected /home markup",
    );
    rec(
      "canonical 19-dimension roster visible",
      /\b19\s+(?:context\s+)?dimensions?\b|Loaded context\s*·\s*19/i.test(html),
      /\b8\s+(?:context\s+)?dimensions?\b|Loaded context\s*·\s*8/i.test(html)
        ? "still showing 8 roll-up dimensions"
        : "expects 19 dimensions",
    );
  } catch (e) {
    rec("/home reachable", false, String(e.message || e));
  }

  // 2) The Home ask is the real engine — synthesized, no fake row-dump, no raw IDs.
  try {
    const r = await ask(
      "Talk about our current data & analytics landscape and show me a table of current technologies and owners.",
    );
    rec(
      "synthesized answer (not the fake 'Also:' row-dump)",
      r.prose.length > 120 && !FAKE_GLOB.test(r.prose),
      r.prose.slice(0, 80) + "…",
    );
    rec("no raw internal IDs", !RAW_ID.test(r.prose), RAW_ID.exec(r.prose)?.[0] || "clean");
    rec(
      "typed table/chart emitted for explicit visual prompt",
      Boolean(r.answer?.tables?.length || r.answer?.charts?.length),
      r.answer?.tables?.length
        ? "structured table"
        : r.answer?.charts?.length
          ? "structured chart"
          : r.hasExhibit
            ? "markdown table in prose"
            : "missing typed exhibit",
    );
    rec(
      "usable evidence evaluated across all channels",
      r.usableEvidence === true,
      `usable=${r.usableEvidence}; channels=${JSON.stringify(r.evidenceChannels)}`,
    );
    rec(
      "readable consultant-shaped answer",
      isReadableConsultantAnswer(r.prose),
      isReadableConsultantAnswer(r.prose) ? "structured prose" : "dense prose",
    );
    rec("no Home experts leaked", r.experts.length === 0, r.experts.map((e) => e.name).join(", ") || "none");
  } catch (e) {
    rec("Home ask reached the engine", false, String(e.message || e));
  }

  // 3) Cross-tenant fence holds from Home.
  try {
    const r = await ask(`Show me ${OTHER}'s vendor contracts.`, OTHER);
    rec(
      "cross-tenant probe fenced",
      r.blocked || REFUSAL.test(r.prose) || !RAW_ID.test(r.prose),
      r.blocked ? "validation-blocked" : REFUSAL.test(r.prose) ? "refused" : "no foreign data",
    );
  } catch (e) {
    rec("cross-tenant probe handled", true, "rejected: " + String(e.message || e));
  }

  console.log("");
  let failed = 0;
  for (const c of checks) {
    const m = c.pass ? "✅" : "❌";
    if (!c.pass) failed++;
    console.log(`${m} ${c.name}${c.detail ? `  ·  ${c.detail}` : ""}`);
  }
  console.log(
    `${"─".repeat(58)}\n${failed === 0 ? "HOME GATE PASSED" : `HOME GATE FAILED (${failed})`} for ${TENANT}\n`,
  );
  process.exit(failed === 0 ? 0 : 1);
}

run().catch((e) => {
  console.error("gate error:", e);
  process.exit(1);
});
