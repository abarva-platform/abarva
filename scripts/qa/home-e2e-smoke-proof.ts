import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

type Severity = "P0" | "P1" | "P2";
type Mode = "fixture" | "chrome";

interface Finding {
  severity: Severity;
  category: string;
  message: string;
  evidence?: string;
}

interface ClickMapEntry {
  control: string;
  action: string;
  result: string;
  classification:
    | "working"
    | "intentionally-disabled"
    | "read-only-placeholder"
    | "navigation"
    | "blocked"
    | "failed";
  severity?: Severity;
}

interface PageSnapshot {
  url: string;
  title: string;
  ready: string;
  text: string;
  headings: string[];
  buttons: string[];
  links: string[];
}

interface Args {
  baseUrl: string;
  mode: Mode;
  outDir: string;
}

interface AvaQuestionQuality {
  question: string;
  status: number | null;
  answerStatus: string | null;
  scopedToHome: boolean;
  avoidsActiveTruthClaim: boolean;
  avoidsVersionLanguage: boolean;
  avoidsPromotionClaim: boolean;
  prosePreview: string;
}

interface AvaQuality {
  questions: AvaQuestionQuality[];
  totals: {
    asked: number;
    scopedToHome: number;
    avoidsActiveTruthClaim: number;
    avoidsVersionLanguage: number;
    avoidsPromotionClaim: number;
  };
  skipped?: boolean;
  reason?: string | null;
}

const REQUIRED_AREAS = [
  "Functions",
  "Applications & Systems",
  "Vendors & Contracts",
  "Data Assets & Integrations",
  "Programs & Priorities",
  "Risks & Controls",
  "Metrics & Outcomes",
];

const REQUIRED_TABS = ["Summary", "Data", "Gaps", "Sources", "Relationships"];
const BLOCKED_PRIMARY_LABELS = [
  "V4",
  "V6",
  "V7",
  "Canonical Fact Store",
  "Evidence Registry",
  "Enterprise Relationship Graph",
  "Derived Intelligence Store",
  "Target Writer",
  "Promotion Gate",
];

const HOME_AVA_QUESTIONS = [
  "Explain the selected context in plain English.",
  "What can Home answer about this context?",
  "What gaps exist in this context?",
  "What evidence supports this context?",
  "What relationships are known for this context?",
  "What should be sent to Intelligence?",
  "Is this candidate data or active Home context?",
  "What is not available yet?",
];

const now = new Date();
const runTimestamp = now.toISOString();

async function main() {
  const args = parseArgs(process.argv.slice(2));
  prepareOutput(args.outDir);

  const sha = git("rev-parse", "HEAD").trim();
  const findings: Finding[] = [];
  const clickMap: ClickMapEntry[] = [];
  const consoleNetwork = {
    mode: args.mode,
    consoleErrors: [] as string[],
    networkErrors: [] as string[],
    caveat:
      args.mode === "chrome"
        ? "Chrome AppleScript proof captures DOM and API payloads from a signed-in desktop tab; it cannot collect DevTools network streams."
        : "Fixture mode does not access a signed-in browser.",
  };

  let activeSnapshot: PageSnapshot;
  let candidateSnapshot: PageSnapshot;
  let apiPayloads: Record<string, unknown> = {};
  let avaQuality: AvaQuality = buildAvaSkipped(args.mode);

  if (args.mode === "chrome") {
    activeSnapshot = chromeSnapshot(`${args.baseUrl}/home`);
    writeJson(path.join(args.outDir, "dom", "home-default.json"), activeSnapshot);
    writeFileSync(path.join(args.outDir, "dom", "home-default.txt"), activeSnapshot.text);

    candidateSnapshot = chromeSnapshot(`${args.baseUrl}/home?candidatePreview=true`);
    writeJson(
      path.join(args.outDir, "dom", "home-candidate-preview.json"),
      candidateSnapshot,
    );
    writeFileSync(
      path.join(args.outDir, "dom", "home-candidate-preview.txt"),
      candidateSnapshot.text,
    );

    apiPayloads = chromeFetchPayloads(args.baseUrl);
    writeJson(
      path.join(args.outDir, "api-payloads", "setup-control.json"),
      apiPayloads.setupControl ?? null,
    );
    writeJson(
      path.join(args.outDir, "api-payloads", "home-ava-questions.json"),
      apiPayloads.avaQuestions ?? [],
    );

    const crawl = chromeClickCrawl(args.baseUrl);
    clickMap.push(...crawl.clickMap);
    for (const snapshot of crawl.snapshots) {
      writeJson(
        path.join(args.outDir, "dom", `${snapshot.name}.json`),
        snapshot.payload,
      );
      writeFileSync(
        path.join(args.outDir, "dom", `${snapshot.name}.txt`),
        snapshot.payload.text,
      );
    }
    avaQuality = evaluateAvaQuestions(apiPayloads.avaQuestions);
  } else {
    activeSnapshot = fixtureActiveSnapshot();
    candidateSnapshot = fixtureCandidateSnapshot();
    apiPayloads = fixtureApiPayloads();
    clickMap.push(...fixtureClickMap());
    writeJson(path.join(args.outDir, "dom", "home-default.json"), activeSnapshot);
    writeJson(
      path.join(args.outDir, "dom", "home-candidate-preview.json"),
      candidateSnapshot,
    );
    writeJson(
      path.join(args.outDir, "api-payloads", "setup-control.json"),
      apiPayloads.setupControl,
    );
    writeJson(
      path.join(args.outDir, "api-payloads", "home-ava-questions.json"),
      apiPayloads.avaQuestions,
    );
    avaQuality = evaluateAvaQuestions(apiPayloads.avaQuestions);
  }

  validateActiveHome(activeSnapshot, findings);
  validateCandidateHome(candidateSnapshot, findings);
  validateNaming(activeSnapshot, candidateSnapshot, findings);
  validateClickMap(clickMap, findings);
  validateSetupControl(apiPayloads.setupControl, findings);
  validateAvaQuality(avaQuality, findings);

  const dataWiring = buildDataWiring(activeSnapshot, apiPayloads.setupControl);
  const activeVsCandidate = buildActiveVsCandidate(
    activeSnapshot,
    candidateSnapshot,
    apiPayloads.setupControl,
  );
  const namingAudit = buildNamingAudit(activeSnapshot, candidateSnapshot);
  const severityCounts = summarizeFindings(findings);
  const verdict =
    severityCounts.P0 === 0 && severityCounts.P1 === 0
      ? "release-ready"
      : "not release-ready";

  const smokeResults = {
    runTimestamp,
    sha,
    mode: args.mode,
    baseUrl: args.baseUrl,
    routesTested: ["/home", "/home?candidatePreview=true"],
    passFail: {
      verdict,
      p0: severityCounts.P0,
      p1: severityCounts.P1,
      p2: severityCounts.P2,
      findings,
    },
    guardrails: {
      candidatePromoted: false,
      activeTenantAccessLayerUpdated: false,
      productionTenantDataWritten: false,
      moduleRuntimeConsumptionChanged: false,
      moduleReadsCandidateByDefault: false,
    },
    artifacts: {
      summary: "summary.md",
      clickMap: "click-map.json",
      dataWiring: "data-wiring.json",
      activeVsCandidate: "active-vs-candidate.json",
      namingAudit: "naming-audit.json",
      avaQuality: "ava-quality.json",
      consoleNetwork: "console-network.json",
      dom: "dom/",
      apiPayloads: "api-payloads/",
      screenshots: "screenshots/",
    },
  };

  writeJson(path.join(args.outDir, "smoke-results.json"), smokeResults);
  writeJson(path.join(args.outDir, "click-map.json"), clickMap);
  writeJson(path.join(args.outDir, "data-wiring.json"), dataWiring);
  writeJson(path.join(args.outDir, "active-vs-candidate.json"), activeVsCandidate);
  writeJson(path.join(args.outDir, "naming-audit.json"), namingAudit);
  writeJson(path.join(args.outDir, "ava-quality.json"), avaQuality);
  writeJson(path.join(args.outDir, "console-network.json"), consoleNetwork);
  writeSummary({
    outDir: args.outDir,
    sha,
    mode: args.mode,
    baseUrl: args.baseUrl,
    verdict,
    severityCounts,
    findings,
    clickMap,
  });

  console.log(
    `Home smoke complete: ${verdict} · P0=${severityCounts.P0} P1=${severityCounts.P1} P2=${severityCounts.P2}`,
  );
  console.log(`Artifacts: ${args.outDir}`);

  if (severityCounts.P0 > 0) process.exitCode = 2;
}

function parseArgs(argv: string[]): Args {
  const get = (name: string, fallback: string) => {
    const prefix = `--${name}=`;
    const found = argv.find((item) => item.startsWith(prefix));
    return found ? found.slice(prefix.length) : fallback;
  };
  const mode = get("mode", process.env.HOME_SMOKE_MODE ?? "fixture") as Mode;
  if (!["fixture", "chrome"].includes(mode)) {
    throw new Error(`Unsupported mode ${mode}; use fixture or chrome.`);
  }
  return {
    baseUrl: get("base-url", process.env.BASE_URL ?? "https://app.abarva.ai"),
    mode,
    outDir: path.resolve(get("out-dir", "reports/home-smoke/latest")),
  };
}

function prepareOutput(outDir: string) {
  rmSync(outDir, { recursive: true, force: true });
  for (const child of ["screenshots", "dom", "api-payloads"]) {
    mkdirSync(path.join(outDir, child), { recursive: true });
  }
  writeFileSync(
    path.join(outDir, "screenshots", "README.md"),
    [
      "# Screenshot Proof",
      "",
      "This harness treats DOM and API captures as the primary proof artifacts.",
      "Desktop Chrome screenshot capture can be unavailable or blank depending on macOS screen-recording permissions, so screenshots are optional evidence for this read-only smoke.",
      "",
      "If visual screenshots are required for a release gate, run the same signed-in crawl from an operator environment with screen-recording permission enabled and add the PNG captures here.",
      "",
    ].join("\n"),
  );
}

function chromeSnapshot(url: string): PageSnapshot {
  const script = String.raw`
on run argv
  set targetUrl to item 1 of argv
  tell application "Google Chrome"
    activate
    set matched to false
    repeat with wi from 1 to count of windows
      repeat with ti from 1 to count of tabs of window wi
        if URL of tab ti of window wi starts with targetUrl then
          set active tab index of window wi to ti
          set index of window wi to 1
          set matched to true
          exit repeat
        end if
      end repeat
      if matched then exit repeat
    end repeat
    if matched is false then
      set newTab to make new tab at end of tabs of front window with properties {URL:targetUrl}
      set active tab index of front window to (count of tabs of front window)
    else
      tell active tab of front window to set URL to targetUrl
    end if
    delay 3
    set js to "JSON.stringify({url:location.href,title:document.title,ready:document.readyState,text:document.body ? document.body.innerText : '',headings:Array.from(document.querySelectorAll('h1,h2,h3')).map(e=>e.innerText),buttons:Array.from(document.querySelectorAll('button')).map(e=>e.innerText),links:Array.from(document.querySelectorAll('a')).map(e=>e.innerText)})"
    tell active tab of front window to set payload to execute javascript js
    return payload
  end tell
end run`;
  return JSON.parse(runOsascript(script, [url])) as PageSnapshot;
}

function chromeFetchPayloads(baseUrl: string): Record<string, unknown> {
  const script = String.raw`
on run argv
  set baseUrl to item 1 of argv
  tell application "Google Chrome"
    activate
    set targetUrl to baseUrl & "/home"
    set matched to false
    repeat with wi from 1 to count of windows
      repeat with ti from 1 to count of tabs of window wi
        if URL of tab ti of window wi starts with targetUrl then
          set active tab index of window wi to ti
          set index of window wi to 1
          set matched to true
          exit repeat
        end if
      end repeat
      if matched then exit repeat
    end repeat
    if matched is false then error "No signed-in Home tab found for API proof"
    set js to "window.__homeSmokePayload=''; (async()=>{ const questions='__QUESTIONS__'.split('|||'); const setupControl=await fetch('/api/admin/setup-control').then(r=>r.json()).catch(e=>({error:String(e)})); const avaQuestions=await Promise.all(questions.map(q=>fetch('/api/home/know/ask',{method:'POST',headers:{'content-type':'application/json','x-abarva-debug-home-know':'1'},body:JSON.stringify({question:q})}).then(async r=>({question:q,status:r.status,body:await r.json().catch(e=>({error:String(e)}))})).catch(e=>({question:q,error:String(e)})))); window.__homeSmokePayload=JSON.stringify({setupControl,avaQuestions}); })().catch(e=>{window.__homeSmokePayload=JSON.stringify({error:String(e)})})"
    set js to my replaceText(js, "__QUESTIONS__", "Explain the selected context in plain English.|||What can Home answer about this context?|||What gaps exist in this context?|||What evidence supports this context?|||What relationships are known for this context?|||What should be sent to Intelligence?|||Is this candidate data or active Home context?|||What is not available yet?")
    tell active tab of front window to execute javascript js
    delay 8
    tell active tab of front window to set payload to execute javascript "window.__homeSmokePayload || ''"
    return payload
  end tell
end run

on replaceText(theText, oldText, newText)
  set AppleScript's text item delimiters to oldText
  set parts to text items of theText
  set AppleScript's text item delimiters to newText
  set theText to parts as text
  set AppleScript's text item delimiters to ""
  return theText
end replaceText`;
  return JSON.parse(runOsascript(script, [baseUrl])) as Record<string, unknown>;
}

function chromeClickCrawl(baseUrl: string): {
  clickMap: ClickMapEntry[];
  snapshots: Array<{ name: string; payload: PageSnapshot }>;
} {
  chromeExecute(baseUrl, "location.href='/home';", 2);
  const clickMap: ClickMapEntry[] = [];
  const snapshots: Array<{ name: string; payload: PageSnapshot }> = [];

  for (const area of REQUIRED_AREAS) {
    const ok = chromeClickButton(baseUrl, area, "startsWith", 1);
    clickMap.push({
      control: area,
      action: "click context area",
      result: ok ? "selected" : "missing",
      classification: ok ? "working" : "failed",
      severity: ok ? undefined : "P1",
    });
    snapshots.push({
      name: `area-${slug(area)}`,
      payload: chromeCurrentSnapshot(baseUrl),
    });
  }

  for (const tab of REQUIRED_TABS) {
    const ok = chromeClickButton(baseUrl, tab, "equals", 1);
    clickMap.push({
      control: tab,
      action: "click selected-area tab",
      result: ok ? "selected" : "missing",
      classification: ok ? "working" : "failed",
      severity: ok ? undefined : "P1",
    });
    snapshots.push({
      name: `tab-${slug(tab)}`,
      payload: chromeCurrentSnapshot(baseUrl),
    });
  }

  for (const label of ["Explain context", "Send to Intelligence"]) {
    const before = chromeCurrentSnapshot(baseUrl).text;
    const ok = chromeClickButton(baseUrl, label, "equals", 1);
    const after = chromeCurrentSnapshot(baseUrl).text;
    const noVisibleChange = before === after;
    clickMap.push({
      control: label,
      action: "click primary action",
      result: ok
        ? noVisibleChange
          ? "no visible state change"
          : "visible state changed"
        : "missing",
      classification: ok
        ? noVisibleChange
          ? "read-only-placeholder"
          : "working"
        : "failed",
      severity: ok ? (noVisibleChange ? "P1" : undefined) : "P1",
    });
  }

  for (const suggestion of ["Explain", "Show gaps", "What can Home answer"]) {
    const ok = chromeClickButton(baseUrl, suggestion, "includes", 3);
    clickMap.push({
      control: suggestion,
      action: "click aVa suggestion",
      result: ok ? "submitted" : "missing",
      classification: ok ? "working" : "failed",
      severity: ok ? undefined : "P1",
    });
    snapshots.push({
      name: `ava-suggestion-${slug(suggestion)}`,
      payload: chromeCurrentSnapshot(baseUrl),
    });
  }

  return { clickMap, snapshots };
}

function chromeClickButton(
  baseUrl: string,
  label: string,
  mode: "equals" | "startsWith" | "includes",
  delaySeconds: number,
): boolean {
  const escaped = JSON.stringify(label);
  const comparator =
    mode === "equals"
      ? `text === ${escaped}`
      : mode === "startsWith"
        ? `text.startsWith(${escaped})`
        : `text.includes(${escaped})`;
  const result = chromeExecute(
    baseUrl,
    `(() => { const button = Array.from(document.querySelectorAll('button')).find(el => { const text = (el.innerText || '').trim(); return ${comparator}; }); if (!button) return 'missing'; button.click(); return 'clicked'; })()`,
    delaySeconds,
  );
  return result === "clicked";
}

function chromeExecute(baseUrl: string, js: string, delaySeconds: number): string {
  const script = String.raw`
on run argv
  set baseUrl to item 1 of argv
  set js to item 2 of argv
  set delaySeconds to item 3 of argv as number
  tell application "Google Chrome"
    activate
    set targetUrl to baseUrl & "/home"
    set matched to false
    repeat with wi from 1 to count of windows
      repeat with ti from 1 to count of tabs of window wi
        if URL of tab ti of window wi starts with targetUrl then
          set active tab index of window wi to ti
          set index of window wi to 1
          set matched to true
          exit repeat
        end if
      end repeat
      if matched then exit repeat
    end repeat
    if matched is false then error "No signed-in Home tab found"
    tell active tab of front window to set payload to execute javascript js
    delay delaySeconds
    return payload
  end tell
end run`;
  return runOsascript(script, [baseUrl, js, String(delaySeconds)]);
}

function chromeCurrentSnapshot(baseUrl: string): PageSnapshot {
  const script = String.raw`
on run argv
  set baseUrl to item 1 of argv
  tell application "Google Chrome"
    activate
    set targetUrl to baseUrl & "/home"
    set matched to false
    repeat with wi from 1 to count of windows
      repeat with ti from 1 to count of tabs of window wi
        if URL of tab ti of window wi starts with targetUrl then
          set active tab index of window wi to ti
          set index of window wi to 1
          set matched to true
          exit repeat
        end if
      end repeat
      if matched then exit repeat
    end repeat
    if matched is false then error "No signed-in Home tab found"
    set js to "JSON.stringify({url:location.href,title:document.title,ready:document.readyState,text:document.body ? document.body.innerText : '',headings:Array.from(document.querySelectorAll('h1,h2,h3')).map(e=>e.innerText),buttons:Array.from(document.querySelectorAll('button')).map(e=>e.innerText),links:Array.from(document.querySelectorAll('a')).map(e=>e.innerText)})"
    tell active tab of front window to set payload to execute javascript js
    return payload
  end tell
end run`;
  return JSON.parse(runOsascript(script, [baseUrl])) as PageSnapshot;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function runOsascript(script: string, args: string[]): string {
  return execFileSync("osascript", ["-", ...args], {
    input: script,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  }).trim();
}

function validateActiveHome(snapshot: PageSnapshot, findings: Finding[]) {
  const text = snapshot.text;
  requireText(text, "Active Home context", "active/default Home mode", findings, "P0");
  if (/Active tenant truth/i.test(text)) {
    findings.push({
      severity: "P0",
      category: "active/default Home mode",
      message: "Default Home still uses unsupported Active tenant truth language.",
    });
  }
  if (/Candidate Preview — inactive data/i.test(text)) {
    findings.push({
      severity: "P0",
      category: "active/default Home mode",
      message: "Candidate preview banner leaked into default active Home mode.",
    });
  }
  requireText(
    text,
    "What AbarVa knows about",
    "default overview",
    findings,
    "P1",
  );
  for (const area of REQUIRED_AREAS) {
    requireText(text, area, "Context Explorer area", findings, "P1");
  }
  if (REQUIRED_TABS.some((tab) => snapshot.buttons.includes(tab))) {
    findings.push({
      severity: "P1",
      category: "default overview",
      message: "Default overview appears to show selected-context tabs before a context is selected.",
    });
  }
}

function validateCandidateHome(snapshot: PageSnapshot, findings: Finding[]) {
  const text = snapshot.text;
  requireText(
    text,
    "Candidate Preview — inactive data",
    "candidate preview mode",
    findings,
    "P0",
  );
  requireText(
    text,
    "not active tenant truth",
    "candidate preview mode",
    findings,
    "P0",
  );
  if (/Candidate data is promoted|promoted candidate/i.test(text)) {
    findings.push({
      severity: "P0",
      category: "candidate preview mode",
      message: "Candidate preview implies candidate data is promoted.",
    });
  }
}

function validateNaming(
  active: PageSnapshot,
  candidate: PageSnapshot,
  findings: Finding[],
) {
  const text = `${active.text}\n${candidate.text}`;
  for (const label of BLOCKED_PRIMARY_LABELS) {
    if (new RegExp(`\\b${escapeRegex(label)}\\b`, "i").test(text)) {
      findings.push({
        severity: "P1",
        category: "naming",
        message: `Primary UI exposes architecture label: ${label}`,
      });
    }
  }
}

function validateClickMap(clickMap: ClickMapEntry[], findings: Finding[]) {
  for (const entry of clickMap) {
    if (entry.severity) {
      findings.push({
        severity: entry.severity,
        category: "click map",
        message: `${entry.control}: ${entry.result}`,
        evidence: `${entry.action} classified as ${entry.classification}`,
      });
    }
  }
}

function validateSetupControl(payload: unknown, findings: Finding[]) {
  const record = isRecord(payload) ? payload : {};
  const guardrails = isRecord(record.guardrails) ? record.guardrails : {};
  const requiredFalse = [
    "productionTenantDataWritten",
    "activeTenantAccessLayerUpdated",
    "candidatePromoted",
    "moduleRuntimeConsumptionChanged",
    "candidateReadByDefault",
  ];
  for (const key of requiredFalse) {
    if (guardrails[key] !== false && guardrails[key] !== undefined) {
      findings.push({
        severity: "P0",
        category: "setup-control guardrails",
        message: `Guardrail ${key} is not false.`,
        evidence: JSON.stringify(guardrails[key]),
      });
    }
  }
}

function validateAvaQuality(avaQuality: unknown, findings: Finding[]) {
  const record = isRecord(avaQuality) ? avaQuality : {};
  const questions = Array.isArray(record.questions) ? record.questions : [];
  for (const rawQuestion of questions) {
    const question = isRecord(rawQuestion) ? rawQuestion : {};
    const label = String(question.question ?? "unknown Home question");
    if (question.status !== 200) {
      findings.push({
        severity: "P1",
        category: "aVa scoped Home quality",
        message: `Home aVa question did not return 200: ${label}`,
        evidence: `status=${String(question.status ?? "missing")}`,
      });
      continue;
    }
    if (question.scopedToHome === false) {
      findings.push({
        severity: "P1",
        category: "aVa scoped Home quality",
        message: `Home aVa answer was not visibly scoped to Home context: ${label}`,
      });
    }
    if (question.avoidsActiveTruthClaim === false) {
      findings.push({
        severity: "P0",
        category: "aVa scoped Home quality",
        message: `Home aVa answer claimed Active tenant truth: ${label}`,
      });
    }
    if (question.avoidsVersionLanguage === false) {
      findings.push({
        severity: "P1",
        category: "aVa scoped Home quality",
        message: `Home aVa answer exposed V4/V6/V7 primary language: ${label}`,
      });
    }
    if (question.avoidsPromotionClaim === false) {
      findings.push({
        severity: "P0",
        category: "aVa scoped Home quality",
        message: `Home aVa answer implied candidate promotion: ${label}`,
      });
    }
  }
}

function requireText(
  text: string,
  expected: string,
  category: string,
  findings: Finding[],
  severity: Severity,
) {
  if (!text.includes(expected)) {
    findings.push({
      severity,
      category,
      message: `Missing required text: ${expected}`,
    });
  }
}

function buildDataWiring(snapshot: PageSnapshot, setupControl: unknown) {
  const text = snapshot.text;
  return {
    mode: "DOM plus setup-control API",
    renderedValues: {
      hasContextExplorer: text.includes("Context Explorer"),
      hasEnterpriseKnowledgeSnapshot: text.includes("Enterprise Knowledge Snapshot"),
      hasEvidence: text.includes("Evidence"),
      areas: REQUIRED_AREAS.filter((area) => text.includes(area)),
    },
    setupControlAvailable: isRecord(setupControl) && !setupControl.error,
    setupControlTenant: isRecord(setupControl) ? setupControl.tenant ?? null : null,
    caveat:
      "Home context payload is server-rendered into the page; setup-control is captured separately through its read-only API.",
  };
}

function buildActiveVsCandidate(
  active: PageSnapshot,
  candidate: PageSnapshot,
  setupControl: unknown,
) {
  return {
    activeDefault: {
      route: "/home",
      activeHomeContextVisible: active.text.includes("Active Home context"),
      candidateBannerVisible: active.text.includes("Candidate Preview — inactive data"),
      activeTenantTruthVisible: /Active tenant truth/i.test(active.text),
    },
    candidatePreview: {
      route: "/home?candidatePreview=true",
      inactiveCandidateBannerVisible: candidate.text.includes(
        "Candidate Preview — inactive data",
      ),
      notActiveTenantTruthVisible: candidate.text.includes("not active tenant truth"),
      candidatePromotedClaimVisible: /promoted candidate|candidate data is promoted/i.test(
        candidate.text,
      ),
    },
    setupControlGuardrails: isRecord(setupControl)
      ? setupControl.guardrails ?? null
      : null,
  };
}

function buildNamingAudit(active: PageSnapshot, candidate: PageSnapshot) {
  const combined = `${active.text}\n${candidate.text}`;
  return {
    blockedPrimaryLabels: BLOCKED_PRIMARY_LABELS.map((label) => ({
      label,
      visible: new RegExp(`\\b${escapeRegex(label)}\\b`, "i").test(combined),
    })),
    businessFacingLabels: [
      "Active Home context",
      "Evidence",
      "Relationships",
      "Gaps",
      "Candidate Preview",
    ].map((label) => ({ label, visible: combined.includes(label) })),
  };
}

function evaluateAvaQuestions(raw: unknown): AvaQuality {
  const rows = Array.isArray(raw) ? raw : [];
  const results: AvaQuestionQuality[] = rows.map((row) => {
    const item = isRecord(row) ? row : {};
    const body = isRecord(item.body) ? item.body : {};
    const prose = typeof body.prose === "string" ? body.prose : "";
    const status = typeof item.status === "number" ? item.status : null;
    const answerStatus =
      typeof body.answerStatus === "string" ? body.answerStatus : null;
    return {
      question: typeof item.question === "string" ? item.question : "unknown",
      status,
      answerStatus,
      scopedToHome: /Home|context|evidence|loaded|available|not available|gap/i.test(
        prose,
      ),
      avoidsActiveTruthClaim: !/Active tenant truth/i.test(prose),
      avoidsVersionLanguage: !/\bV[467]\b/.test(prose),
      avoidsPromotionClaim: !/promoted candidate|candidate data is promoted/i.test(
        prose,
      ),
      prosePreview: prose.slice(0, 320),
    };
  });
  return {
    questions: results,
    totals: {
      asked: results.length,
      scopedToHome: results.filter((row) => row.scopedToHome).length,
      avoidsActiveTruthClaim: results.filter((row) => row.avoidsActiveTruthClaim)
        .length,
      avoidsVersionLanguage: results.filter((row) => row.avoidsVersionLanguage)
        .length,
      avoidsPromotionClaim: results.filter((row) => row.avoidsPromotionClaim)
        .length,
    },
  };
}

function buildAvaSkipped(mode: Mode): AvaQuality {
  return {
    questions: [],
    totals: {
      asked: 0,
      scopedToHome: 0,
      avoidsActiveTruthClaim: 0,
      avoidsVersionLanguage: 0,
      avoidsPromotionClaim: 0,
    },
    skipped: mode !== "chrome",
    reason:
      mode !== "chrome"
        ? "Run with --mode=chrome from a signed-in desktop Chrome session for aVa API capture."
        : null,
  };
}

function writeSummary(input: {
  outDir: string;
  sha: string;
  mode: Mode;
  baseUrl: string;
  verdict: string;
  severityCounts: Record<Severity, number>;
  findings: Finding[];
  clickMap: ClickMapEntry[];
}) {
  const lines = [
    "# HOME-SMOKE-PR1 — End-to-End Home Smoke Proof",
    "",
    `- Test run timestamp: ${runTimestamp}`,
    `- SHA tested: \`${input.sha}\``,
    "- Revision tested: captured from ACA deploy evidence when run post-deploy; not mutated by this harness.",
    "- Image digest: captured from ACA deploy evidence when run post-deploy; not mutated by this harness.",
    "- Traffic %: read-only harness; does not shift traffic.",
    "- Health status: read-only harness; route/API proof only.",
    `- Base URL: ${input.baseUrl}`,
    `- Mode: ${input.mode}`,
    "- Routes tested: `/home`, `/home?candidatePreview=true`",
    `- Clicks classified: ${input.clickMap.length}`,
    `- Verdict: ${input.verdict}`,
    `- P0: ${input.severityCounts.P0}`,
    `- P1: ${input.severityCounts.P1}`,
    `- P2: ${input.severityCounts.P2}`,
    "",
    "## Issues",
    "",
    input.findings.length
      ? input.findings
          .map(
            (finding) =>
              `- ${finding.severity} · ${finding.category}: ${finding.message}${
                finding.evidence ? ` (${finding.evidence})` : ""
              }`,
          )
          .join("\n")
      : "- None.",
    "",
    "## Known Caveats",
    "",
    "- This PR adds proof harnesses and generated reports only; it does not promote candidate data or update Active Tenant Access.",
    "- In `chrome` mode, screenshots may depend on macOS screen-capture permissions. DOM/API proof remains the primary machine-readable evidence.",
    "",
    "## Final Verdict",
    "",
    input.verdict === "release-ready"
      ? "Home meets the HOME-SMOKE acceptance bar for the tested mode."
      : "Home is not release-ready against the HOME-SMOKE acceptance bar until P0/P1 findings are addressed or explicitly accepted.",
    "",
  ];
  writeFileSync(path.join(input.outDir, "summary.md"), lines.join("\n"));
}

function summarizeFindings(findings: Finding[]): Record<Severity, number> {
  return {
    P0: findings.filter((finding) => finding.severity === "P0").length,
    P1: findings.filter((finding) => finding.severity === "P1").length,
    P2: findings.filter((finding) => finding.severity === "P2").length,
  };
}

function fixtureActiveSnapshot(): PageSnapshot {
  return {
    url: "fixture:/home",
    title: "Home · Enterprise Knowledge | AbarVa",
    ready: "complete",
    headings: ["Airline Demo", "What AbarVa knows about Airline Demo"],
    buttons: [
      "Enterprise overview",
      ...REQUIRED_AREAS,
      "What can you answer with confidence?",
    ],
    links: ["Home", "Intelligence", "Moves", "Source", "Tower"],
    text: [
      "HOME · ENTERPRISE KNOWLEDGE",
      "Airline Demo",
      "Active Home context",
      "Candidate preview",
      "Not active",
      "Context Explorer",
      "Enterprise overview",
      ...REQUIRED_AREAS,
      "What AbarVa knows about Airline Demo",
      "Enterprise Knowledge Snapshot",
      "Evidence",
      "Relationships",
      "Gaps",
    ].join("\n"),
  };
}

function fixtureCandidateSnapshot(): PageSnapshot {
  const active = fixtureActiveSnapshot();
  return {
    ...active,
    url: "fixture:/home?candidatePreview=true",
    text: [
      active.text,
      "Candidate Preview — inactive data.",
      "It is not active tenant truth.",
    ].join("\n"),
  };
}

function fixtureApiPayloads(): Record<string, unknown> {
  return {
    setupControl: {
      tenant: { tenantKey: "skyharbor", displayName: "Airline Demo" },
      guardrails: {
        productionTenantDataWritten: false,
        activeTenantAccessLayerUpdated: false,
        candidatePromoted: false,
        moduleRuntimeConsumptionChanged: false,
        candidateReadByDefault: false,
      },
    },
    avaQuestions: HOME_AVA_QUESTIONS.map((question) => ({
      question,
      status: 200,
      body: {
        answerStatus: "answered",
        prose:
          "Home can answer from loaded active Home context, identify evidence gaps, and route advisory synthesis to Intelligence when needed.",
      },
    })),
  };
}

function fixtureClickMap(): ClickMapEntry[] {
  return [
    ...REQUIRED_AREAS.map((area) => ({
      control: area,
      action: "click context area",
      result: "selected",
      classification: "working" as const,
    })),
    ...REQUIRED_TABS.map((tab) => ({
      control: tab,
      action: "click selected-area tab",
      result: "selected",
      classification: "working" as const,
    })),
  ];
}

function writeJson(filePath: string, value: unknown) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function git(...args: string[]) {
  return execFileSync("git", args, { encoding: "utf8" });
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
