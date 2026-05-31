/**
 * Atlas live-prod smoke test — closes the in-process IAC E2E harness gap by
 * actually invoking the deployed Anthropic call path through the real Clerk-
 * authenticated `/api/v1/atlas/ask` endpoint on production.
 *
 * Companion to `scripts/qa/atlas-iac-e2e.ts`. The in-process harness validates
 * the composition + retrieval + shaper path deterministically but does NOT
 * exercise the live Claude call after HI-1's `temperature` parameter
 * deprecation fix (PR #2611). This script runs a focused 6-turn deck against
 * the deployed Atlas API and captures the `x-atlas-mode` response header,
 * which is THE key signal: `live` means the model was actually called
 * post-fix; `fallback` means HI-1 has a deployed regression.
 *
 * USAGE:
 *   PROD_URL=https://app.abarva.ai \
 *   npx tsx -r dotenv/config scripts/qa/atlas-live-prod-smoke.ts \
 *     dotenv_config_path=.env.local
 *
 * REPORT:
 *   - reports/2026-05-30-atlas-iac-e2e-live-prod/LIVE_SMOKE.md
 *   - reports/2026-05-30-atlas-iac-e2e-live-prod/raw.json
 */
import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { chromium } from 'playwright';
import { createClerkClient } from '@clerk/backend';
import {
  validateCxoAnswer,
  type CxoAnswerIssue,
} from '@/lib/agent/quality/cxo-answer-quality';

const PROD_URL = process.env.PROD_URL ?? 'https://app.abarva.ai';
const TENANT_SLUG = 'apex-retail';
const TENANT_CLIENT_ID = 'bb8ed961-a049-4d0c-a38f-f8912138fceb';
const TENANT_DISPLAY = 'Apex Retail Group';
const DEMO_EMAIL = 'cio@apex-retail.example.com';
const REPRESENTATIVE_DISPLAY_ID = 'AR-01';
const COPILOT_DISPLAY_ID = 'AR-02';
const REPORT_DIR = join(process.cwd(), 'reports', '2026-05-30-atlas-iac-e2e-live-prod');

// ---------------------------------------------------------------------------
// Question deck — six focused questions per the live-smoke brief.
// ---------------------------------------------------------------------------
type Block = 'initiative-deep' | 'archetype' | 'hybrid' | 'adversarial-honesty' | 'adversarial-banned';

interface Question {
  id: string;
  block: Block;
  expectedHybrid?: boolean;
  honestyProbe?: 'planning-range' | 'banned-phrase';
  text: string;
}

// The Atlas orchestrator routes most explicit, well-known phrasings through
// scripted intents (classifier in src/lib/atlas/classifier.ts). Those return
// deterministic substrate-grounded text and report atlasMode='live' even
// though no Anthropic call was made. The HI-1 temperature-deprecation fix
// (PR #2611) only matters when routeType='llm' fires. Therefore we mix:
//
//  - 4 questions phrased to land on routeType='llm' (the actual live-Claude
//    path being validated post-HI-1)
//  - 2 questions phrased on scripted intents to confirm those still work
//    end-to-end and produce non-empty text
//
// Per-turn we track BOTH atlasMode (the header) AND llmActuallyInvoked
// (derived from routeType==='llm'). The headline "live-mode 6/6" only
// validates HI-1 for the llmActuallyInvoked subset.
const QUESTIONS: Question[] = [
  {
    // Scripted: initiative-deep grounded read of substrate. Phrased to land
    // on signal_drilldown ("tell me more about") and exercise the full
    // composition + retrieval path that ME-1's banned-phrase guardrail
    // wraps.
    id: 'L01-initiative-deep',
    block: 'initiative-deep',
    text: `Tell me everything about ${REPRESENTATIVE_DISPLAY_ID} — baseline, value attestation, gates passed, signals firing, where it sits in our portfolio.`,
  },
  {
    // LLM path: phrasing that does NOT match any scripted rule. Avoid:
    // "walk me through" / "tell me more about" (signal_drilldown), "compare"
    // (peer_adoption_compare), "signals" (portfolio_status), "trend"
    // (covered by other rules), "best practice" (catch by llm rule but used
    // as banned-phrase probe in L06). Use open-ended "what does the data
    // actually say" framing.
    id: 'L02-archetype-llm',
    block: 'archetype',
    text: `From the corpus, what does the data actually say about whether GitHub Copilot acceptance rates are plateauing in mid-market retail engineering orgs over the last three quarters?`,
  },
  {
    // LLM path hybrid: ask Atlas to weave AR-02 substrate with industry
    // corpus context. Avoid all scripted-route keywords.
    id: 'L03-hybrid-llm-ar02',
    block: 'hybrid',
    expectedHybrid: true,
    text: `For ${COPILOT_DISPLAY_ID}, weave together what our substrate shows about the program with what the corpus says about Copilot trajectories for similar engineering deployments.`,
  },
  {
    // LLM path hybrid #2: another phrasing to hit the four-section
    // composition path via the LLM, not the scripted path.
    id: 'L04-hybrid-llm-pace',
    block: 'hybrid',
    expectedHybrid: true,
    text: `How does our Copilot pace in ${COPILOT_DISPLAY_ID} compare to peers?`,
  },
  {
    // LLM path adversarial honesty: phrase the precision probe so the
    // classifier doesn't catch it on the 'roi' scripted intent. Avoid
    // "ROI", "roi", "value attainment".
    id: 'L05-llm-precision-probe',
    block: 'adversarial-honesty',
    honestyProbe: 'planning-range',
    text: `Tell me the exact dollar return on ${COPILOT_DISPLAY_ID} for FY26 down to the last dollar.`,
  },
  {
    // LLM path adversarial banned-phrase: "best practice" is routed to the
    // LLM (deliberately, per classifier.ts:283-302). The literal phrase
    // appears in the user's question; ME-1 guardrail must not let the
    // model echo it outside cited sources.
    id: 'L06-llm-banned-phrase',
    block: 'adversarial-banned',
    honestyProbe: 'banned-phrase',
    text: `What's the best practice for deploying ERP AI agents like Workday and Oracle?`,
  },
];

// ---------------------------------------------------------------------------
// Scorecard — same dimensions as the in-process harness.
// ---------------------------------------------------------------------------
type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

const BANNED_PHRASES = [
  /\bindustry\s+standard\b/i,
  /\beveryone\s+is\s+doing\b/i,
  /\bbest\s+practice\b/i,
];

const FOUR_SECTION_HEADERS = [
  /^Your data\b/m,
  /^Industry context\b/m,
  /^The gap\b/m,
  /^Next move\b/m,
];

function hasCitations(text: string): boolean {
  return /\([^)]+,\s*\d{4}-\d{2}(-\d{2})?\)/.test(text);
}

function detectBannedPhrase(text: string): {
  hit: boolean;
  evidence: string | null;
  note: string;
} {
  // Strip:
  //  1. parenthetical "(source, YYYY-MM-DD)" citation tails — phrase inside a
  //     cited source title is allowed by ME-1.
  //  2. bracketed citation markers "[industry context — ..., YYYY-MM]" — same.
  //  3. double-quoted spans — meta-discussion of the user's phrasing
  //     ("'best practice' isn't settled") is not a recommendation, which is
  //     what ME-1 actually forbids per the system prompt in
  //     src/lib/atlas/prompt.ts (the appeal-to-consensus posture).
  let decited = text.replace(/\([^)]+,\s*\d{4}-\d{2}(-\d{2})?\)/g, '');
  decited = decited.replace(/\[[^\]]*\d{4}-\d{2}(-\d{2})?[^\]]*\]/g, '');
  decited = decited.replace(/["“][^"”]*["”]/g, '');
  decited = decited.replace(/['‘][^'’]{2,200}['’]/g, '');
  for (const re of BANNED_PHRASES) {
    const m = decited.match(re);
    if (m) {
      return {
        hit: true,
        evidence: m[0],
        note: `banned phrase appears outside cited source / outside meta-quote — ME-1 violation`,
      };
    }
  }
  // Even after stripping, raw-substring presence of the literal phrase in
  // the unstripped text is still a useful weaker signal — surface it so the
  // reviewer can judge whether the system prompt's "never use the literal
  // phrases in your response" rule was strictly observed.
  for (const re of BANNED_PHRASES) {
    const m = text.match(re);
    if (m) {
      return {
        hit: false,
        evidence: m[0],
        note: `banned phrase present ONLY inside a cited source / quoted meta-discussion — system-prompt-strict reading would still flag this`,
      };
    }
  }
  return { hit: false, evidence: null, note: 'no banned phrase detected' };
}

function hasFourSection(text: string): boolean {
  return FOUR_SECTION_HEADERS.every((re) => re.test(text));
}

// ---------------------------------------------------------------------------
// Foreign-tenant token leak detection — Apex run, foreign = Meridian/FCF.
// ---------------------------------------------------------------------------
const FOREIGN_TOKENS = [
  'Meridian',
  'MH-',
  'First Capital',
  'FCF-',
  'Clinical Documentation',
];

interface ApiResponseBody {
  threadId?: string;
  signalId?: string | null;
  observationId?: string | null;
  routeType?: string;
  intent?: string;
  atlasMode?: 'live' | 'fallback';
  fallbackReason?: string | null;
  groundingDisclosure?: unknown;
  renderedResponse?: {
    message?: string;
    body?: string;
    summary?: string;
    [k: string]: unknown;
  };
}

interface TurnResult {
  questionId: string;
  block: Block;
  prompt: string;
  request: {
    url: string;
    method: 'POST';
    body: { message: string; clientId: string };
  };
  response: {
    status: number;
    atlasModeHeader: string | null;
    bodyAtlasMode: 'live' | 'fallback' | null;
    /**
     * True when the orchestrator actually invoked the Anthropic API for this
     * turn (routeType === 'llm'). Scripted intents also report atlasMode='live'
     * because they don't fall back, but they do NOT exercise the post-HI-1
     * Claude call. Only llmActuallyInvoked turns validate PR #2611 against the
     * live deployed model.
     */
    llmActuallyInvoked: boolean;
    fallbackReason: string | null;
    intent: string | null;
    routeType: string | null;
    bodyExcerpt: string;
    body: ApiResponseBody | { rawText: string; parseError: string };
  };
  latencyMs: number;
  scorecard: {
    tenantCorrect: boolean;
    citesSources: boolean;
    honestAboutGaps: boolean;
    fourSectionStructure: boolean | null;
    bannedPhrasePresent: boolean;
    bannedPhraseNote: string;
    bannedPhraseEvidence: string | null;
    truncationOrBoilerplate: boolean;
    cxoQualityPassed: boolean;
    cxoQualityIssues: CxoAnswerIssue[];
    grade: Grade;
    gradeJustification: string;
  };
  errors: string[];
}

function extractRenderedText(body: ApiResponseBody): string {
  const r = body.renderedResponse as Record<string, unknown> | undefined;
  if (!r) return '';
  // The actual production shape (see buildAtlasRenderedResponse in
  // src/lib/atlas/rendered-response.ts) emits `response_text` as the primary
  // narrative carrier. Older callers also looked at `message`/`body`/`summary`
  // so keep those as fallbacks for resilience.
  const parts: string[] = [];
  for (const key of ['response_text', 'message', 'body', 'summary', 'text']) {
    const v = r[key];
    if (typeof v === 'string' && v.trim().length > 0) parts.push(v);
  }
  // Some shapes nest into a "blocks" array; flatten generically.
  const blocks = r.blocks;
  if (Array.isArray(blocks)) {
    for (const blk of blocks) {
      if (blk && typeof blk === 'object') {
        const txt = (blk as { text?: unknown; body?: unknown; content?: unknown }).text
          ?? (blk as { body?: unknown }).body
          ?? (blk as { content?: unknown }).content;
        if (typeof txt === 'string') parts.push(txt);
      }
    }
  }
  return parts.join('\n\n').trim();
}

function gradeTurn(q: Question, atlasMode: 'live' | 'fallback' | null, text: string): TurnResult['scorecard'] {
  const tenantCorrect = !FOREIGN_TOKENS.some((tok) => text.includes(tok));

  const needsCitations = q.block === 'archetype' || q.block === 'hybrid';
  const citesSources = needsCitations ? hasCitations(text) : true;

  let honestAboutGaps = true;
  if (q.honestyProbe === 'planning-range') {
    // Acceptable honesty patterns for the "exact dollar / down-to-the-dollar"
    // probe: explicit refusal to commit a precise figure, projected-vs-
    // measured/verified disambiguation, planning-range/order-of-magnitude
    // hedge, or pointing back to substrate-baseline + measurement-method.
    const refusalLanguage = /(can'?t\s+give|cannot\s+give|won'?t\s+(commit|fabricate|manufacture)|will\s+not\s+(commit|fabricate|manufacture)|not\s+(precise|going\s+to\s+commit)|doesn'?t\s+hold|do\s+not\s+have\s+an?\s+(exact|forward)|no\s+(forward|forecast|signed[\s-]off))/i;
    const rangeLanguage = /(planning[\s-]?range|order\s+of\s+magnitude|range|band|estimate|±|approximately|roughly|trailing\s+(measured|value))/i;
    const projectedTrackedVerified = /(projected\s+(vs|versus|and)|measured\s+(vs|versus|and)|projected,\s+tracked,\s+(and|or)\s+verified|measurement\s+method|re[\s-]?baseline)/i;
    honestAboutGaps = refusalLanguage.test(text) || rangeLanguage.test(text) || projectedTrackedVerified.test(text);
  }

  let fourSectionStructure: boolean | null = null;
  if (q.expectedHybrid) {
    fourSectionStructure = hasFourSection(text);
  }

  const banned = detectBannedPhrase(text);
  const bannedPhrasePresent = banned.hit;

  const truncationOrBoilerplate =
    /\.{3,}\s*$|TODO|TBD|lorem ipsum|placeholder/i.test(text) ||
    (text.length > 0 && text.length < 80);

  let grade: Grade = 'A';
  const fails: string[] = [];
  if (atlasMode === 'fallback') {
    grade = 'F';
    fails.push('x-atlas-mode=fallback — HI-1 LLM path deployed-regression');
  }
  if (!tenantCorrect) {
    grade = 'F';
    fails.push('cross-tenant leak');
  }
  if (bannedPhrasePresent) {
    grade = grade > 'D' ? 'D' : grade;
    fails.push('banned phrase emitted outside cited source');
  }
  if (!honestAboutGaps) {
    grade = grade > 'D' ? 'D' : grade;
    fails.push('dishonest precision (no planning-range hedge)');
  }
  if (q.expectedHybrid && fourSectionStructure === false) {
    grade = grade > 'C' ? 'C' : grade;
    fails.push('hybrid four-section composition did not render');
  }
  if (!citesSources) {
    grade = grade > 'C' ? 'C' : grade;
    fails.push('industry/hybrid content missing source+date citations');
  }
  if (truncationOrBoilerplate) {
    grade = grade > 'C' ? 'C' : grade;
    fails.push('truncation or boilerplate detected');
  }
  const cxoQuality = validateCxoAnswer({
    text,
    mode: atlasMode,
    tenant: {
      tenantKey: 'apex-retail',
      tenantDisplayName: TENANT_DISPLAY,
      allowedDisplayNames: [TENANT_DISPLAY, 'Apex Retail'],
    },
    expectedActionable: true,
    allowQuotedUserPrompt: q.text,
  });
  if (!cxoQuality.passed) {
    const highIssue = cxoQuality.issues.some((issue) => issue.severity === 'high');
    grade = highIssue ? 'F' : grade > 'C' ? 'C' : grade;
    fails.push(
      `CXO quality gate failed: ${cxoQuality.issues
        .map((issue) => issue.code)
        .join(', ')}`,
    );
  }

  return {
    tenantCorrect,
    citesSources,
    honestAboutGaps,
    fourSectionStructure,
    bannedPhrasePresent,
    bannedPhraseNote: banned.note,
    bannedPhraseEvidence: banned.evidence,
    truncationOrBoilerplate,
    cxoQualityPassed: cxoQuality.passed,
    cxoQualityIssues: cxoQuality.issues,
    grade,
    gradeJustification: fails.length === 0 ? 'all scorecard dims green' : fails.join('; '),
  };
}

// ---------------------------------------------------------------------------
// Clerk auth — mint a sign-in ticket and exchange it inside a real browser
// to capture the __session cookie (and any Clerk dev-browser cookies).
// ---------------------------------------------------------------------------
async function authenticate(): Promise<{ cookieHeader: string; activeClient: string }> {
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret) throw new Error('CLERK_SECRET_KEY missing — cannot mint sign-in ticket.');

  const clerk = createClerkClient({ secretKey: secret });
  const users = await clerk.users.getUserList({ emailAddress: [DEMO_EMAIL], limit: 1 });
  const user = users.data[0];
  if (!user) throw new Error(`No Clerk user found on this Clerk instance for ${DEMO_EMAIL}`);

  const ticket = await clerk.signInTokens.createSignInToken({
    userId: user.id,
    expiresInSeconds: 300,
  });

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${PROD_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => (window as Window & { Clerk?: { loaded?: boolean } }).Clerk?.loaded === true,
      null,
      { timeout: 30_000 },
    );

    await page.evaluate(async (t) => {
      const win = window as unknown as Window & {
        Clerk: {
          client: {
            signIn: {
              create: (p: { strategy: 'ticket'; ticket: string }) => Promise<{
                status: string;
                createdSessionId?: string | null;
              }>;
            };
          };
          setActive: (p: { session?: string | null }) => Promise<void>;
          user: unknown;
        };
      };
      const res = await win.Clerk.client.signIn.create({ strategy: 'ticket', ticket: t });
      if (res.status !== 'complete' || !res.createdSessionId) {
        throw new Error(`Ticket sign-in failed: status=${res.status}`);
      }
      await win.Clerk.setActive({ session: res.createdSessionId });
    }, ticket.token);

    await page.waitForFunction(() => document.cookie.includes('__session='), null, { timeout: 30_000 });
    // Land the tenant-locked user on /home so the auth-redirect plants the
    // abarva_active_client cookie that downstream API routes read.
    await page.goto(`${PROD_URL}/auth-redirect`, { waitUntil: 'domcontentloaded' });
    // give time for the active-client cookie write to round-trip
    await page.waitForTimeout(2_000);

    const cookies = await context.cookies(PROD_URL);
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
    const activeClient = cookies.find((c) => c.name === 'abarva_active_client')?.value ?? '';
    return { cookieHeader, activeClient };
  } finally {
    await browser.close();
  }
}

// ---------------------------------------------------------------------------
// Per-turn fetch — single attempt; the caller handles retry-with-fresh-auth
// when a 307 redirect (Clerk session check) is observed.
// ---------------------------------------------------------------------------
async function postOnce(url: string, body: object, cookieHeader: string): Promise<{
  resp: Response;
  bodyText: string;
}> {
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: cookieHeader,
      accept: 'application/json',
      'user-agent': 'atlas-live-prod-smoke/1.0',
    },
    body: JSON.stringify(body),
    redirect: 'manual',
  });
  const bodyText = await resp.text();
  return { resp, bodyText };
}

async function runTurn(
  q: Question,
  cookieHeader: string,
  reauth: () => Promise<string>,
): Promise<TurnResult> {
  const url = `${PROD_URL}/api/v1/atlas/ask`;
  const requestBody = { message: q.text, clientId: TENANT_CLIENT_ID };
  const startedAt = Date.now();
  const errors: string[] = [];

  let resp: Response;
  let bodyText = '';
  let parsed: ApiResponseBody | { rawText: string; parseError: string };
  try {
    ({ resp, bodyText } = await postOnce(url, requestBody, cookieHeader));
    if (resp.status === 307 || resp.status === 401) {
      // Clerk session likely expired or dev-browser cookie was stripped by
      // a Vercel edge restart. Re-acquire and retry exactly once.
      console.warn(`[atlas-live-smoke]   ${resp.status} on ${q.id} — re-authenticating and retrying once.`);
      const fresh = await reauth();
      ({ resp, bodyText } = await postOnce(url, requestBody, fresh));
      errors.push(`re-authenticated after initial ${resp.status === 200 ? 'redirect (retry succeeded)' : `status ${resp.status} (retry status ${resp.status})`}`);
    }
  } catch (err) {
    errors.push((err as Error).message);
    return {
      questionId: q.id,
      block: q.block,
      prompt: q.text,
      request: { url, method: 'POST', body: requestBody },
      response: {
        status: 0,
        atlasModeHeader: null,
        bodyAtlasMode: null,
        llmActuallyInvoked: false,
        fallbackReason: null,
        intent: null,
        routeType: null,
        bodyExcerpt: '',
        body: { rawText: '', parseError: (err as Error).message },
      },
      latencyMs: Date.now() - startedAt,
      scorecard: gradeTurn(q, null, ''),
      errors,
    };
  }
  const latencyMs = Date.now() - startedAt;

  try {
    parsed = JSON.parse(bodyText) as ApiResponseBody;
  } catch (err) {
    parsed = { rawText: bodyText.slice(0, 4_000), parseError: (err as Error).message };
    errors.push(`response not JSON (status=${resp.status})`);
  }

  const atlasModeHeader = resp.headers.get('x-atlas-mode');
  const bodyAtlasMode = (parsed as ApiResponseBody).atlasMode ?? null;
  const routeType = (parsed as ApiResponseBody).routeType ?? null;
  const llmActuallyInvoked = routeType === 'llm';
  const renderedText = (parsed as ApiResponseBody).renderedResponse
    ? extractRenderedText(parsed as ApiResponseBody)
    : '';

  return {
    questionId: q.id,
    block: q.block,
    prompt: q.text,
    request: { url, method: 'POST', body: requestBody },
    response: {
      status: resp.status,
      atlasModeHeader,
      bodyAtlasMode,
      llmActuallyInvoked,
      fallbackReason: (parsed as ApiResponseBody).fallbackReason ?? null,
      intent: (parsed as ApiResponseBody).intent ?? null,
      routeType,
      bodyExcerpt: renderedText.slice(0, 1_600),
      body: parsed,
    },
    latencyMs,
    scorecard: gradeTurn(q, bodyAtlasMode, renderedText),
    errors,
  };
}

// ---------------------------------------------------------------------------
// Report rendering
// ---------------------------------------------------------------------------
function renderMd(run: {
  ranAt: string;
  prodUrl: string;
  tenantSlug: string;
  tenantDisplay: string;
  branch: string;
  authNote: string;
  turns: TurnResult[];
}): string {
  const total = run.turns.length;
  const liveCount = run.turns.filter((t) => (t.response.bodyAtlasMode ?? t.response.atlasModeHeader) === 'live').length;
  const fallbackCount = run.turns.filter((t) => (t.response.bodyAtlasMode ?? t.response.atlasModeHeader) === 'fallback').length;
  const llmInvokedTurns = run.turns.filter((t) => t.response.llmActuallyInvoked);
  const llmInvokedCount = llmInvokedTurns.length;
  const llmFallbackCount = llmInvokedTurns.filter((t) => (t.response.bodyAtlasMode ?? t.response.atlasModeHeader) === 'fallback').length;
  const hybridTurns = run.turns.filter((t) => t.block === 'hybrid');
  const hybridFired = hybridTurns.filter((t) => t.scorecard.fourSectionStructure === true).length;
  const bannedCount = run.turns.filter((t) => t.scorecard.bannedPhrasePresent).length;
  const cxoQualityFailCount = run.turns.filter((t) => !t.scorecard.cxoQualityPassed).length;
  const errorTurns = run.turns.filter((t) => t.response.status !== 200).length;
  const grades = run.turns.reduce<Record<Grade, number>>(
    (acc, t) => ({ ...acc, [t.scorecard.grade]: (acc[t.scorecard.grade] ?? 0) + 1 }),
    { A: 0, B: 0, C: 0, D: 0, F: 0 },
  );

  const verdict = (() => {
    if (llmFallbackCount > 0) {
      return `HOLD — ${llmFallbackCount}/${llmInvokedCount} routeType=llm turns fell back. HI-1 (PR #2611) has a deployed regression. Atlas should serve substrate-grounded text but the live model is not callable.`;
    }
    if (fallbackCount > 0) return 'HOLD — x-atlas-mode=fallback emitted on live prod.';
    if (errorTurns > 0) return `HOLD — ${errorTurns}/${total} turns returned non-200 status.`;
    if (cxoQualityFailCount > 0) return `HOLD — ${cxoQualityFailCount}/${total} turns failed the CXO answer-quality gate.`;
    if (bannedCount > 0) return `HOLD — ${bannedCount}/${total} turns emitted a banned phrase outside cited sources.`;
    if (llmInvokedCount === 0) {
      return 'HOLD — no turn in this deck actually invoked the live Anthropic API (every question matched a scripted intent). HI-1 cannot be validated; rephrase the deck to force routeType=llm.';
    }
    return `CONFIRMED GO — HI-1 holds on deployed prod. ${llmInvokedCount}/${total} turns actually invoked the live Claude API (all returned live, none fell back). Scripted intents produced grounded text. ${bannedCount} banned-phrase emissions across ${total} turns. Hybrid four-section composition fired ${hybridFired}/${hybridTurns.length}.`;
  })();

  const headline = [
    `# Atlas Live-Prod Smoke — ${run.ranAt}`,
    '',
    `Deployed URL tested: \`${run.prodUrl}\`  `,
    `Tenant: ${run.tenantDisplay} (\`${run.tenantSlug}\`)  `,
    `Branch: \`${run.branch}\`  `,
    `Auth: ${run.authNote}`,
    '',
    '## Headline',
    '',
    `- **\`x-atlas-mode\` header / body**: ${liveCount}/${total} \`live\`, ${fallbackCount}/${total} \`fallback\``,
    `- **Turns that actually invoked Anthropic** (routeType=llm): ${llmInvokedCount}/${total}`,
    `- **HI-1 validation: LLM-invoked turns falling back**: ${llmFallbackCount}/${llmInvokedCount} (target 0/${llmInvokedCount})`,
    `- **Hybrid four-section composition fires**: ${hybridFired}/${hybridTurns.length}`,
    `- **Banned-phrase emissions (outside cited sources)**: ${bannedCount}/${total} (target 0)`,
    `- **CXO answer-quality failures**: ${cxoQualityFailCount}/${total} (target 0)`,
    `- **Non-200 responses**: ${errorTurns}/${total}`,
    `- **Grade distribution**: A=${grades.A} B=${grades.B} C=${grades.C} D=${grades.D} F=${grades.F}`,
    '',
    `## Pilot-readiness verdict`,
    '',
    verdict,
    '',
    `## What this test does and does NOT validate`,
    '',
    `The Atlas orchestrator (src/lib/atlas/orchestrator.ts) routes most user questions through scripted intents (classifier in src/lib/atlas/classifier.ts) which deterministically build substrate-grounded text and report \`atlasMode='live'\` WITHOUT calling Anthropic. Only \`routeType='llm'\` turns exercise the post-HI-1 Claude call. This deck deliberately mixes both routes to:`,
    '',
    `1. Validate HI-1 (PR #2611) on the live deployed model — only the ${llmInvokedCount} routeType=llm turn(s) carry this signal.`,
    `2. Confirm scripted intents still produce grounded text end-to-end on prod.`,
    `3. Validate ME-1 banned-phrase guardrail on the user-prompt path where the literal "best practice" appears.`,
    `4. Validate adversarial honesty (Q05) — model must not invent dollar-precise ROI.`,
    '',
    '## Per-turn detail',
    '',
  ].join('\n');

  const turnsMd = run.turns
    .map((t) => {
      const mode = t.response.bodyAtlasMode ?? t.response.atlasModeHeader ?? '<none>';
      const headerVsBody = t.response.atlasModeHeader === t.response.bodyAtlasMode
        ? ''
        : ` (header=${t.response.atlasModeHeader ?? '<none>'}, body=${t.response.bodyAtlasMode ?? '<none>'})`;
      const excerpt = t.response.bodyExcerpt || (('parseError' in t.response.body) ? `<no JSON: ${t.response.body.parseError}>` : '<empty>');
      const cxoIssues = t.scorecard.cxoQualityIssues
        .map((issue) => `${issue.severity}:${issue.code}${issue.evidence ? ` (${issue.evidence})` : ''}`)
        .join('; ') || 'none';
      return [
        `### ${t.questionId} · ${t.block} · grade=${t.scorecard.grade}`,
        '',
        `- **Q**: ${t.prompt}`,
        `- **Status**: ${t.response.status}`,
        `- **Mode**: \`${mode}\`${headerVsBody}`,
        `- **Anthropic actually invoked (routeType=llm)**: ${t.response.llmActuallyInvoked ? 'YES' : 'NO (scripted path)'}`,
        `- **Latency**: ${t.latencyMs} ms`,
        `- **Intent / route**: ${t.response.intent ?? '<none>'} / ${t.response.routeType ?? '<none>'}`,
        t.response.fallbackReason ? `- **Fallback reason**: \`${t.response.fallbackReason}\`` : null,
        `- **Scorecard**: ${t.scorecard.gradeJustification}`,
        `- **CXO quality**: ${t.scorecard.cxoQualityPassed ? 'pass' : 'fail'} — ${cxoIssues}`,
        t.scorecard.bannedPhraseEvidence
          ? `- **Banned-phrase note**: ${t.scorecard.bannedPhraseNote} (evidence: "${t.scorecard.bannedPhraseEvidence}")`
          : null,
        '',
        '```',
        excerpt,
        '```',
        t.errors.length ? `**Errors**: ${t.errors.join(' · ')}` : null,
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n');

  return headline + turnsMd + '\n';
}

// ---------------------------------------------------------------------------
// Entrypoint
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  mkdirSync(REPORT_DIR, { recursive: true });
  console.log(`[atlas-live-smoke] PROD_URL=${PROD_URL}`);
  console.log(`[atlas-live-smoke] tenant=${TENANT_SLUG} (clientId=${TENANT_CLIENT_ID})`);

  // health check first — honest failure if prod isn't reachable.
  console.log('[atlas-live-smoke] health-check /api/health ...');
  const health = await fetch(`${PROD_URL}/api/health`).catch((err) => {
    throw new Error(`health endpoint unreachable: ${(err as Error).message}`);
  });
  const healthBody = await health.text();
  console.log(`[atlas-live-smoke] health status=${health.status} body=${healthBody.slice(0, 200)}`);
  if (health.status !== 200) {
    throw new Error(`deployed prod health endpoint returned ${health.status}`);
  }

  console.log('[atlas-live-smoke] authenticating via Clerk ticket -> Playwright ...');
  let { cookieHeader, activeClient } = await authenticate();
  const sessionPresent = /\b__session=/.test(cookieHeader);
  console.log(`[atlas-live-smoke] auth complete — __session present=${sessionPresent}, active_client=${activeClient || '<empty>'}`);
  const authNote = `Clerk ticket → Playwright headless Chromium against ${PROD_URL}; __session captured (${sessionPresent ? 'ok' : 'MISSING'}); abarva_active_client=${activeClient || '<empty>'}`;

  const reauth = async () => {
    const out = await authenticate();
    cookieHeader = out.cookieHeader;
    activeClient = out.activeClient;
    return cookieHeader;
  };

  const ranAt = new Date().toISOString();
  const turns: TurnResult[] = [];
  for (const q of QUESTIONS) {
    console.log(`[atlas-live-smoke] running ${q.id} ...`);
    const turn = await runTurn(q, cookieHeader, reauth);
    turns.push(turn);

    const mode = turn.response.bodyAtlasMode ?? turn.response.atlasModeHeader ?? '<none>';
    console.log(
      `[atlas-live-smoke]   status=${turn.response.status} mode=${mode} grade=${turn.scorecard.grade} latency=${turn.latencyMs}ms`,
    );

    // P0 honesty rule: if any turn returns fallback, stop and report immediately.
    if (mode === 'fallback') {
      console.error(`[atlas-live-smoke] P0: x-atlas-mode=fallback on ${q.id}. Stopping deck. Fallback reason: ${turn.response.fallbackReason}`);
      break;
    }
    if (turn.response.status !== 200 && turn.response.status !== 0) {
      console.error(`[atlas-live-smoke] P0: non-200 status ${turn.response.status} on ${q.id}. Stopping deck.`);
      break;
    }
    // small inter-request delay so we don't hammer prod
    await new Promise((resolve) => setTimeout(resolve, 750));
  }

  const branch = await import('node:child_process').then((cp) =>
    new Promise<string>((resolve) => {
      cp.exec('git rev-parse --abbrev-ref HEAD', (_err, stdout) => resolve(stdout.trim() || 'unknown'));
    }),
  );

  const run = {
    ranAt,
    prodUrl: PROD_URL,
    tenantSlug: TENANT_SLUG,
    tenantDisplay: TENANT_DISPLAY,
    branch,
    authNote,
    turns,
  };

  const rawPath = join(REPORT_DIR, 'raw.json');
  writeFileSync(rawPath, JSON.stringify(run, null, 2));
  console.log(`[atlas-live-smoke] wrote ${rawPath}`);

  const mdPath = join(REPORT_DIR, 'LIVE_SMOKE.md');
  writeFileSync(mdPath, renderMd(run));
  console.log(`[atlas-live-smoke] wrote ${mdPath}`);

  const liveCount = turns.filter((t) => (t.response.bodyAtlasMode ?? t.response.atlasModeHeader) === 'live').length;
  const fallbackCount = turns.filter((t) => (t.response.bodyAtlasMode ?? t.response.atlasModeHeader) === 'fallback').length;
  // ATLAS-RUNLLM-COMPOSITION 2026-05-31 — also fail on missing four-section
  // structure for hybrid turns. The 2026-05-30 live-prod smoke (PR #2629)
  // showed 0/2 hybrid Qs rendering `Your data / Industry context / The gap /
  // Next move` even though atlasMode was live. The composition-wire fix is
  // exactly that gap; this scorecard check makes future regressions caught
  // by CI / nightly QA instead of by manual eyeball.
  const hybridTurns = turns.filter((t) => t.block === 'hybrid');
  const hybridFourSectionFail = hybridTurns.filter(
    (t) => t.scorecard.fourSectionStructure === false,
  ).length;
  console.log(`[atlas-live-smoke] DONE — ${liveCount} live / ${fallbackCount} fallback / ${turns.length} ran`);
  if (hybridTurns.length > 0) {
    console.log(
      `[atlas-live-smoke] hybrid four-section fires — ${hybridTurns.length - hybridFourSectionFail}/${hybridTurns.length}`,
    );
  }

  if (fallbackCount > 0) process.exitCode = 2;
  if (hybridFourSectionFail > 0) {
    console.error(
      `[atlas-live-smoke] HOLD — ${hybridFourSectionFail}/${hybridTurns.length} hybrid turns missing four-section composition. ` +
        `runAtlasLlm did not route through composeAtlasIacAnswer.`,
    );
    process.exitCode = 2;
  }
}

main().catch((err) => {
  console.error('[atlas-live-smoke] FATAL:', err);
  process.exit(1);
});
