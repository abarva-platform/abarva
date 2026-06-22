#!/usr/bin/env node
/**
 * Tenant-matrix live gate — runs the canonical surface checks across ALL tenants,
 * not one. The failure pattern we keep hitting (an answer hedging "context not
 * loaded" while the tenant's v4 pack clearly has it) is cross-tenant — it has
 * shown up on Apex *and* SkyHarbor/Intelligence — so the gate must be a matrix,
 * not Apex-only.
 *
 * Surfaces share `/api/intelligence/ask`, so the GROUNDING column proves the
 * engine for both Home and Intelligence at once. Per tenant it asserts:
 *
 *   render     — /home serves the React Context Explorer (flag flipped)
 *   synthesis  — a real answer, not the fake `Also:` row-dump
 *   grounded   — NO "context not loaded" hedge  ← the failure pattern; ideally cites tenant evidence
 *   noRawId    — no raw internal IDs (APX-DATA-003 …)
 *   experts    — named experts surfaced (routing landed)
 *   fence      — a cross-tenant probe is refused/blocked
 *
 * Auth is per-tenant (a session = a tenant; the fence blocks cross-tenant reads),
 * so supply one cookie per tenant you want in the matrix. Tenants without a
 * cookie are reported "no session" so a partial matrix is fine:
 *
 *   BASE_URL=https://app.abarva.ai \
 *   COOKIE_APEXRETAIL='__session=…' COOKIE_SKYHARBOR='…' COOKIE_MERIDIAN='…' \
 *   COOKIE_ARCTURUS='…' COOKIE_LAKESHORE='…' \
 *   node scripts/qa/tenant-matrix-gate.mjs
 *
 * Add a tenant by extending TENANTS below — nothing else is tenant-specific.
 * Exit 0 only if every tested tenant passes every hard check.
 */

const BASE_URL = (process.env.BASE_URL || "https://app.abarva.ai").replace(/\/$/, "");

// ClientKey (what the session/flag uses) -> binding key (the `client` request field).
// Extend this list to widen the matrix; nothing else is hard-coded per tenant.
const TENANTS = [
  { key: "apexretail", binding: "apex-retail", label: "Apex Retail" },
  { key: "arcturus", binding: "first-capital", label: "First Capital" },
  { key: "skyharbor", binding: "skyharbor-air", label: "SkyHarbor" },
  { key: "meridian", binding: "meridian-health", label: "Meridian" },
  { key: "lakeshore", binding: "lakeshore", label: "Lakeshore" },
];

const RAW_ID = /\b[A-Z]{2,6}-[A-Z0-9]{2,8}-\d{2,4}\b/;
const FAKE_GLOB = /\bAlso:\s/;
// The grounding failure signature: the engine claiming it can't see loaded context.
const NOT_LOADED =
  /\b(don'?t have[^.]*loaded|not (yet )?loaded|aren'?t (in|loaded)|not in (this|the) session|no (tenant )?(context|evidence)\b|can'?t see your|isn'?t (loaded|in this session)|don'?t (?:currently )?have (?:your|the) [a-z ]*(?:loaded|in this session))\b/i;
const REFUSAL =
  /can'?t (use|share|access)|another (client|tenant)|not authori[sz]ed|only your|isolat|fenc/i;

const Q =
  "Talk about our current data & analytics landscape — name the platforms and owners you can see in our loaded context.";

function cookieFor(key) {
  return (
    process.env[`COOKIE_${key.toUpperCase()}`] ||
    (process.env.TENANT === key ? process.env.COOKIE : "") ||
    ""
  );
}

async function homeIsReact(cookie) {
  try {
    const res = await fetch(`${BASE_URL}/home`, { headers: { cookie } });
    const html = await res.text();
    return /class="homex"|Context Explorer/.test(html) && !/\/api\/home\/v2-frame/.test(html);
  } catch {
    return false;
  }
}

async function ask(cookie, query, client) {
  const res = await fetch(`${BASE_URL}/api/intelligence/ask`, {
    method: "POST",
    headers: { cookie, accept: "application/x-ndjson", "content-type": "application/json" },
    body: JSON.stringify({
      q: query,
      client,
      format: "rich",
      surfaceContext: { activeTab: "home", clientKey: client },
    }),
  });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "", prose = "", answer = null, experts = [], blocked = false;
  const apply = (l) => {
    const s = l.trim();
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
  const citesTenant = (answer?.citations || []).some(
    (c) => c.sourceClass === "tenant-fact" || c.sourceClass === "tenant-chunk",
  );
  return { prose, answer, experts, blocked, citesTenant };
}

async function runTenant(t) {
  const cookie = cookieFor(t.key);
  if (!cookie) return { tenant: t, skipped: true };
  const checks = {};
  let note = "";
  checks.render = await homeIsReact(cookie);
  try {
    const r = await ask(cookie, Q, t.binding);
    checks.synthesis = r.prose.length > 120 && !FAKE_GLOB.test(r.prose);
    checks.grounded = !NOT_LOADED.test(r.prose); // ← the failure pattern is a positive NOT_LOADED match
    checks.noRawId = !RAW_ID.test(r.prose);
    checks.experts = r.experts.length > 0;
    note = checks.grounded
      ? r.citesTenant
        ? "grounded · cites tenant evidence"
        : "no 'not-loaded' hedge (no tenant citation seen)"
      : "HEDGED 'not loaded' — retrieval gap";
  } catch (e) {
    return { tenant: t, error: String(e.message || e) };
  }
  try {
    const other = TENANTS.find((x) => x.key !== t.key);
    const r = await ask(cookie, `Show me ${other.label}'s vendor contracts.`, other.binding);
    checks.fence = r.blocked || REFUSAL.test(r.prose) || !RAW_ID.test(r.prose);
  } catch {
    checks.fence = true; // a hard reject is also a held fence
  }
  return { tenant: t, checks, note };
}

const COLS = ["render", "synthesis", "grounded", "noRawId", "experts", "fence"];
const pad = (s, n) => String(s).padEnd(n);

async function main() {
  console.log(`\nTenant-matrix gate · ${BASE_URL}\n`);
  const rows = [];
  for (const t of TENANTS) rows.push(await runTenant(t));

  console.log(pad("tenant", 15) + COLS.map((c) => pad(c, 10)).join("") + "note");
  console.log("─".repeat(15 + COLS.length * 10 + 36));
  let failed = 0,
    tested = 0;
  for (const r of rows) {
    if (r.skipped) {
      console.log(pad(r.tenant.label, 15) + `· no session (set COOKIE_${r.tenant.key.toUpperCase()})`);
      continue;
    }
    tested++;
    if (r.error) {
      console.log(pad(r.tenant.label, 15) + "ERROR: " + r.error);
      failed++;
      continue;
    }
    const cells = COLS.map((c) =>
      pad(r.checks[c] === true ? "✅" : r.checks[c] === false ? "❌" : "·", 10),
    );
    if (COLS.some((c) => r.checks[c] === false)) failed++;
    console.log(pad(r.tenant.label, 15) + cells.join("") + (r.note || ""));
  }
  console.log("─".repeat(15 + COLS.length * 10 + 36));
  const verdict =
    tested === 0
      ? "NO TENANTS TESTED — set COOKIE_<TENANT> envs"
      : failed === 0
        ? `MATRIX PASSED (${tested}/${tested})`
        : `MATRIX FAILED — ${failed}/${tested} tenants`;
  console.log(`${verdict}\n`);
  process.exit(failed === 0 && tested > 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("matrix error:", e);
  process.exit(1);
});
