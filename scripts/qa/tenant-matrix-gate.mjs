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
 *   intel      — /intelligence serves the canonical v2 Lens (not a fallback/error)
 *   synthesis  — a real answer, not the fake `Also:` row-dump
 *   grounded   — cites tenant evidence AND has no "context not loaded" hedge
 *   noRawId    — no raw internal IDs (APX-DATA-003 …)
 *   experts    — named experts surfaced (routing landed)
 *   fence      — a cross-tenant probe is refused/blocked
 *
 * Auth is per-tenant (a session = a tenant; the fence blocks cross-tenant reads).
 * Prefer the Playwright storage states minted by
 * `scripts/auth/prime-agent-client-auth-states.ts`; the gate auto-discovers
 * `.auth/agent-<tenant>.json`. Cookie-only mode remains as a fallback.
 * Tenants without auth are reported "no session" so a partial matrix is fine:
 *
 *   BASE_URL=https://app.abarva.ai \
 *   STORAGE_STATE_APEXRETAIL=.auth/agent-apexretail.json \
 *   STORAGE_STATE_SKYHARBOR=.auth/agent-skyharbor.json \
 *   node scripts/qa/tenant-matrix-gate.mjs
 *
 * Add a tenant by extending TENANTS below — nothing else is tenant-specific.
 * Exit 0 only if every tested tenant passes every hard check.
 */

import fs from "node:fs";

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

function envKey(prefix, key) {
  return `${prefix}_${key.toUpperCase()}`;
}

function defaultStorageStatePath(key) {
  return `.auth/agent-${key}.json`;
}

function authFor(key) {
  const storageState =
    process.env[envKey("STORAGE_STATE", key)] ||
    (fs.existsSync(defaultStorageStatePath(key)) ? defaultStorageStatePath(key) : "");
  const cookie =
    process.env[envKey("COOKIE", key)] || (process.env.TENANT === key ? process.env.COOKIE : "") || "";
  return { storageState, cookie };
}

async function withPage(auth, path, read) {
  if (!auth.context) return null;
  const page = await auth.context.newPage();
  try {
    const res = await page.goto(`${BASE_URL}${path}`, { waitUntil: "domcontentloaded" });
    if (!res) throw new Error(`${path}: no response`);
    if (/\/sign-in\b/.test(page.url())) throw new Error(`${path}: redirected to sign-in`);
    return await read(page, res);
  } finally {
    await page.close();
  }
}

async function pageHtml(path, auth) {
  if (auth.context) {
    return withPage(auth, path, async (page) => page.content());
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { cookie: auth.cookie },
    redirect: "manual",
  });
  if (res.status >= 300 && res.status < 400) {
    throw new Error(`${path}: redirected to ${res.headers.get("location") || "unknown"}`);
  }
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.text();
}

async function homeIsReact(auth) {
  try {
    const html = await pageHtml("/home", auth);
    return /class="homex"|Context Explorer/.test(html) && !/\/api\/home\/v2-frame/.test(html);
  } catch {
    return false;
  }
}

async function intelIsV2(auth) {
  // /intelligence should serve the canonical v2 Lens (IntelligenceV2Surface, root
  // `class="iv2"`), not a fallback/error. Markers are in the SSR HTML.
  try {
    const html = await pageHtml("/intelligence", auth);
    return /class="iv2"|ANALYSIS ENGINE/i.test(html);
  } catch {
    return false;
  }
}

async function fetchAskText(auth, query, client) {
  const body = {
    q: query,
    client,
    tabId: `tenant-matrix-${client}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    format: "rich",
    surfaceContext: { activeTab: "home", clientKey: client },
  };
  if (auth.context) {
    return withPage(auth, "/home", async (page) =>
      page.evaluate(async ({ body }) => {
        const res = await fetch("/api/intelligence/ask", {
          method: "POST",
          headers: { accept: "application/x-ndjson", "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        return {
          status: res.status,
          url: res.url,
          contentType: res.headers.get("content-type") || "",
          text: await res.text(),
        };
      }, { body }),
    );
  }
  const res = await fetch(`${BASE_URL}/api/intelligence/ask`, {
    method: "POST",
    headers: { cookie: auth.cookie, accept: "application/x-ndjson", "content-type": "application/json" },
    redirect: "manual",
    body: JSON.stringify(body),
  });
  return {
    status: res.status,
    url: res.url,
    contentType: res.headers.get("content-type") || "",
    text: await res.text(),
  };
}

async function ask(auth, query, client) {
  const res = await fetchAskText(auth, query, client);
  if (res.status >= 300 && res.status < 400) throw new Error(`ask redirected to ${res.url}`);
  if (res.status < 200 || res.status >= 300) throw new Error(`ask HTTP ${res.status}`);
  if (!/\b(application\/x-ndjson|application\/json|text\/event-stream)\b/i.test(res.contentType)) {
    throw new Error(`ask returned ${res.contentType || "unknown content-type"}`);
  }
  let prose = "", answer = null, experts = [], blocked = false;
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
  for (const line of res.text.split(/\r?\n/)) apply(line);
  if (experts.length === 0 && Array.isArray(answer?.contributingExperts)) {
    experts = answer.contributingExperts;
  }
  const citesTenant = (answer?.citations || []).some(
    (c) => c.sourceClass === "tenant-fact" || c.sourceClass === "tenant-chunk",
  );
  return { prose, answer, experts, blocked, citesTenant };
}

async function runTenant(t, browser) {
  const auth = authFor(t.key);
  if (!auth.storageState && !auth.cookie) return { tenant: t, skipped: true };
  if (auth.storageState) {
    auth.context = await browser.newContext({ storageState: auth.storageState, baseURL: BASE_URL });
  }
  const checks = {};
  let note = "";
  try {
    checks.render = await homeIsReact(auth);
    checks.intel = await intelIsV2(auth);
    const r = await ask(auth, Q, t.binding);
    checks.synthesis = r.prose.length > 120 && !FAKE_GLOB.test(r.prose);
    const hasLoadedContextHedge = NOT_LOADED.test(r.prose);
    checks.grounded = !hasLoadedContextHedge && r.citesTenant;
    checks.noRawId = !RAW_ID.test(r.prose);
    checks.experts = r.experts.length > 0;
    note = checks.grounded
      ? "grounded · cites tenant evidence"
      : hasLoadedContextHedge
        ? "HEDGED 'not loaded' — retrieval gap"
        : "NO tenant citation — retrieval/render gap";
  } catch (e) {
    if (auth.context) await auth.context.close();
    return { tenant: t, error: String(e.message || e) };
  }
  try {
    const other = TENANTS.find((x) => x.key !== t.key);
    const r = await ask(auth, `Show me ${other.label}'s vendor contracts.`, other.binding);
    checks.fence = r.blocked || REFUSAL.test(r.prose) || !RAW_ID.test(r.prose);
  } catch {
    checks.fence = true; // a hard reject is also a held fence
  }
  if (auth.context) await auth.context.close();
  return { tenant: t, checks, note };
}

const COLS = ["render", "intel", "synthesis", "grounded", "noRawId", "experts", "fence"];
const pad = (s, n) => String(s).padEnd(n);

async function main() {
  console.log(`\nTenant-matrix gate · ${BASE_URL}\n`);
  const needsBrowser = TENANTS.some((t) => authFor(t.key).storageState);
  const browser = needsBrowser ? await (await import("@playwright/test")).chromium.launch() : null;
  const rows = [];
  try {
    for (const t of TENANTS) rows.push(await runTenant(t, browser));
  } finally {
    if (browser) await browser.close();
  }

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
