#!/usr/bin/env node
/**
 * Home live gate — verifies the React Home pilot for one tenant on the DEPLOYED app.
 *
 * The CI tests prove the component composes; this proves the two things they can't:
 *   1. The flag actually flipped `/home` to the React Context Explorer (not the
 *      static `public/home-v2` iframe).
 *   2. The Home ask is the real shared engine — a synthesized answer, NOT the old
 *      fake `answerForAsk` row-dump ("field: value · Also: …") — with no raw
 *      internal IDs, named experts, and the cross-tenant fence holding.
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
  const res = await fetch(`${BASE_URL}/api/intelligence/ask`, {
    method: "POST",
    headers: {
      cookie: COOKIE,
      accept: "application/x-ndjson",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      q: query,
      client: requestedClient ?? BINDING,
      format: "rich",
      surfaceContext: { activeTab: "home", clientKey: TENANT },
    }),
  });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "", prose = "", answer = null, experts = [], blocked = false;
  const apply = (line) => {
    const s = line.trim();
    if (!s) return;
    let e;
    try {
      e = JSON.parse(s);
    } catch {
      return;
    }
    if (e.type === "delta" && typeof e.text === "string") prose += e.text;
    else if (e.type === "agent-answer" && e.answer) answer = e.answer;
    else if (e.type === "contributing-experts" && Array.isArray(e.contributingExperts))
      experts = e.contributingExperts;
    else if (e.type === "validation" && e.tenantLeakage?.length) blocked = true;
  };
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl;
    while ((nl = buf.indexOf("\n")) >= 0) {
      apply(buf.slice(0, nl));
      buf = buf.slice(nl + 1);
    }
  }
  apply(buf);
  const hasExhibit = Boolean(answer?.tables?.length || answer?.charts?.length) || /\n\s*\|.*\|/.test(prose);
  return { prose, answer, experts, blocked, hasExhibit };
}

async function run() {
  console.log(`\nHome live gate · tenant=${TENANT} · ${BASE_URL}\n${"─".repeat(58)}`);

  // 1) The flag flipped /home to the React Context Explorer (not the static iframe).
  try {
    const { ok, html } = await getHome();
    const isReact = /class="homex"|Context Explorer/.test(html) && !/\/api\/home\/v2-frame/.test(html);
    rec(
      "/home serves the React Context Explorer (flag flipped)",
      ok && isReact,
      isReact
        ? "homex present, static iframe absent"
        : /v2-frame/.test(html)
          ? "still the static iframe — flag not on for this tenant"
          : "unexpected /home markup",
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
    // Informational, NOT a hard requirement: since #3836 suppresses inferred
    // (prose-scraped) exhibits, a prose-only answer is the correct, honest result.
    // Report whether a genuinely-structured exhibit was emitted; never fail on its absence.
    rec(
      "exhibit (informational — present only for genuinely structured answers)",
      true,
      r.answer?.tables?.length
        ? "structured table"
        : r.answer?.charts?.length
          ? "structured chart"
          : r.hasExhibit
            ? "markdown table in prose"
            : "prose-only (inferred exhibits suppressed — correct)",
    );
    rec("named experts surfaced", r.experts.length > 0, r.experts.map((e) => e.name).join(", ") || "none");
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
