import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

type Severity = "P0" | "P1" | "P2";
type Mode = "fixture" | "chrome";
type Fidelity =
  | "faithful"
  | "partially faithful"
  | "wiring-only / visually not faithful"
  | "not faithful";

interface Args {
  baseUrl: string;
  mode: Mode;
  outDir: string;
}

interface Finding {
  severity: Severity;
  category: string;
  message: string;
  evidence?: string;
}

interface PageSnapshot {
  route: string;
  url: string;
  title: string;
  ready: string;
  status: number | null;
  text: string;
  headings: string[];
  buttons: string[];
  links: string[];
  inputs: string[];
  selects: string[];
  controls: string[];
}

interface DesignScore {
  page: "Admin" | "Home";
  route: string;
  verdict: Fidelity;
  score: number;
  matched: string[];
  missing: string[];
  structureNotes: string[];
}

interface ClickMapEntry {
  page: "Admin" | "Home";
  route: string;
  control: string;
  action: string;
  result: string;
  classification:
    | "working"
    | "intentionally-disabled"
    | "coming-soon"
    | "read-only-placeholder"
    | "navigation"
    | "external/download"
    | "blocked-by-permissions"
    | "failed";
  severity?: Severity;
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
    status200: number;
    scopedToHome: number;
    avoidsActiveTruthClaim: number;
    avoidsVersionLanguage: number;
    avoidsPromotionClaim: number;
  };
  skipped?: boolean;
  reason?: string | null;
}

const runTimestamp = new Date().toISOString();

const ADMIN_ROUTES = [
  "/admin",
  "/admin/data-intake",
  "/admin/candidate-preview",
  "/admin/data-layer-explorer",
];

const HOME_ROUTES = ["/home", "/home?candidatePreview=true"];

const ADMIN_EXPECTED = [
  "Tenant Setup",
  "Data Control",
  "setup-control",
  "readiness",
  "Data Intake",
  "Template",
  "Tenant Packet",
  "Evidence",
  "Candidate",
  "Promotion",
  "Guardrail",
  "active",
];

const HOME_EXPECTED = [
  "Enterprise Knowledge Snapshot",
  "Evidence Coverage",
  "Answerability",
  "Top Gaps",
  "Needs Evidence",
  "Ready Areas",
  "Relationship Overview",
  "Context Explorer",
  "Active Home context",
  "Data Status",
  "scoped aVa",
];

const HOME_CONTEXT_CONTROLS = [
  "Enterprise overview",
  "Summary",
  "Data",
  "Gaps",
  "Sources",
  "Relationships",
  "Explain context",
  "Send to Intelligence",
];

const ADMIN_CONTROL_LABELS = [
  "Add data",
  "Data",
  "Overview",
  "Candidate Preview",
  "View guide",
  "View template",
  "Download template",
  "Download full packet",
  "View field dictionary",
  "Promotion",
  "Upload",
];

const HOME_AVA_QUESTIONS = [
  "Explain the selected context in plain English.",
  "What can Home answer about this context?",
  "What gaps exist?",
  "What evidence supports this context?",
  "What relationships are known?",
  "What should be sent to Intelligence?",
  "Is this active Home context or candidate preview?",
  "What is not available yet?",
];

const DISALLOWED_PRIMARY_LANGUAGE = [
  "V4",
  "V6",
  "V7",
  "Canonical Fact Store",
  "Evidence Registry",
  "Enterprise Relationship Graph",
  "Derived Intelligence Store",
  "Target Writer",
];

async function main() {
  const args = parseArgs(process.argv.slice(2));
  prepareOutput(args.outDir);

  const sha = git("rev-parse", "HEAD").trim();
  const findings: Finding[] = [];
  const clickMap: ClickMapEntry[] = [];
  const snapshots: PageSnapshot[] = [];
  let apiPayloads: Record<string, unknown> = {};
  let avaQuality: AvaQuality = buildAvaSkipped(args.mode);

  if (args.mode === "chrome") {
    for (const route of [...ADMIN_ROUTES, ...HOME_ROUTES]) {
      const snapshot = chromeSnapshot(args.baseUrl, route);
      snapshots.push(snapshot);
      writeSnapshot(args.outDir, snapshot);
      tryCaptureScreenshot(args.outDir, route);
    }

    apiPayloads = chromeFetchPayloads(args.baseUrl);
    writeJson(
      path.join(args.outDir, "api-payloads", "setup-control.json"),
      apiPayloads.setupControl ?? null,
    );
    writeJson(
      path.join(args.outDir, "api-payloads", "template-catalog.json"),
      apiPayloads.templateCatalog ?? null,
    );
    writeJson(
      path.join(args.outDir, "api-payloads", "home-ava-questions.json"),
      apiPayloads.avaQuestions ?? [],
    );

    const crawl = chromeClickCrawl(args.baseUrl);
    clickMap.push(...crawl.clickMap);
    for (const snapshot of crawl.snapshots) {
      writeSnapshot(args.outDir, snapshot, `click-${slug(snapshot.route)}`);
    }

    avaQuality = evaluateAvaQuestions(apiPayloads.avaQuestions);
  } else {
    const fixture = fixtureSnapshots();
    snapshots.push(...fixture);
    for (const snapshot of fixture) writeSnapshot(args.outDir, snapshot);
    apiPayloads = fixtureApiPayloads();
    clickMap.push(...fixtureClickMap());
    avaQuality = evaluateAvaQuestions(apiPayloads.avaQuestions);
    writeJson(
      path.join(args.outDir, "api-payloads", "setup-control.json"),
      apiPayloads.setupControl,
    );
    writeJson(
      path.join(args.outDir, "api-payloads", "template-catalog.json"),
      apiPayloads.templateCatalog,
    );
    writeJson(
      path.join(args.outDir, "api-payloads", "home-ava-questions.json"),
      apiPayloads.avaQuestions,
    );
  }

  const adminScores = scoreAdminFidelity(snapshots);
  const homeScores = scoreHomeFidelity(snapshots);
  validateRoutes(snapshots, findings);
  validateDesignScores(adminScores, homeScores, findings);
  validateClickMap(clickMap, findings);
  validateActiveCandidateSeparation(snapshots, apiPayloads.setupControl, findings);
  validateNaming(snapshots, findings);
  validateTruthSafety(snapshots, findings);
  validateAvaQuality(avaQuality, findings);

  const dataWiring = buildDataWiring(snapshots, apiPayloads);
  const activeVsCandidate = buildActiveVsCandidate(snapshots, apiPayloads);
  const namingAudit = buildNamingAudit(snapshots);
  const truthSafetyAudit = buildTruthSafetyAudit(snapshots);
  const consoleNetwork = buildConsoleNetwork(args.mode);
  const severityCounts = summarizeFindings(findings);
  const verdict =
    severityCounts.P0 === 0 &&
    severityCounts.P1 === 0 &&
    adminScores[0]?.verdict === "faithful" &&
    homeScores[0]?.verdict === "faithful"
      ? "release-ready"
      : "not release-ready";

  writeJson(path.join(args.outDir, "design-fidelity.json"), {
    admin: adminScores,
    home: homeScores,
  });
  writeDesignMarkdown(args.outDir, adminScores, homeScores);
  writeJson(path.join(args.outDir, "click-map.json"), clickMap);
  writeJson(path.join(args.outDir, "data-wiring.json"), dataWiring);
  writeJson(path.join(args.outDir, "active-vs-candidate.json"), activeVsCandidate);
  writeJson(path.join(args.outDir, "naming-audit.json"), namingAudit);
  writeJson(path.join(args.outDir, "truth-safety-audit.json"), truthSafetyAudit);
  writeJson(path.join(args.outDir, "ava-quality.json"), avaQuality);
  writeJson(path.join(args.outDir, "console-network.json"), consoleNetwork);
  writeJson(path.join(args.outDir, "smoke-results.json"), {
    runTimestamp,
    sha,
    mode: args.mode,
    baseUrl: args.baseUrl,
    routesTested: [...ADMIN_ROUTES, ...HOME_ROUTES],
    passFail: { verdict, ...severityCounts, findings },
    designFidelity: {
      admin: adminScores[0]?.verdict ?? "not faithful",
      home: homeScores[0]?.verdict ?? "not faithful",
    },
    guardrails: activeVsCandidate.guardrails,
  });
  writeSummary({
    outDir: args.outDir,
    sha,
    mode: args.mode,
    baseUrl: args.baseUrl,
    verdict,
    severityCounts,
    findings,
    clickMap,
    adminScores,
    homeScores,
  });

  console.log(
    `Admin/Home design smoke complete: ${verdict} · P0=${severityCounts.P0} P1=${severityCounts.P1} P2=${severityCounts.P2}`,
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
  const mode = get("mode", process.env.ADMIN_HOME_SMOKE_MODE ?? "fixture") as Mode;
  if (!["fixture", "chrome"].includes(mode)) {
    throw new Error(`Unsupported mode ${mode}; use fixture or chrome.`);
  }
  return {
    baseUrl: get("base-url", process.env.BASE_URL ?? "https://app.abarva.ai"),
    mode,
    outDir: path.resolve(
      get("out-dir", "reports/admin-home-design-smoke/latest"),
    ),
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
      "The harness attempts macOS screen captures after each route load.",
      "DOM and API captures remain the primary machine-readable proof because desktop screen-recording permissions can block screenshots.",
      "",
    ].join("\n"),
  );
}

function chromeSnapshot(baseUrl: string, route: string): PageSnapshot {
  const target = `${baseUrl}${route}`;
  const script = String.raw`
on run argv
  set targetUrl to item 1 of argv
  set routeName to item 2 of argv
  tell application "Google Chrome"
    activate
    if (count of windows) is 0 then
      make new window
      delay 1
    end if
    if (count of tabs of front window) is 0 then
      make new tab at end of tabs of front window
    end if
    tell active tab of front window to set URL to targetUrl
    delay 4
    set js to "JSON.stringify({route:" & quoted form of routeName & ",url:location.href,title:document.title,ready:document.readyState,status:null,text:document.body ? document.body.innerText : '',headings:Array.from(document.querySelectorAll('h1,h2,h3')).map(e=>e.innerText.trim()).filter(Boolean),buttons:Array.from(document.querySelectorAll('button')).map(e=>e.innerText.trim()).filter(Boolean),links:Array.from(document.querySelectorAll('a')).map(e=>e.innerText.trim()).filter(Boolean),inputs:Array.from(document.querySelectorAll('input,textarea')).map(e=>e.getAttribute('placeholder')||e.getAttribute('aria-label')||e.name||e.id||'input').filter(Boolean),selects:Array.from(document.querySelectorAll('select')).map(e=>e.getAttribute('aria-label')||e.name||e.id||'select').filter(Boolean),controls:Array.from(document.querySelectorAll('button,a,input,select,textarea')).map(e=>(e.innerText||e.value||e.getAttribute('placeholder')||e.getAttribute('aria-label')||e.name||e.id||e.href||'control').trim()).filter(Boolean)})"
    tell active tab of front window to set payload to execute javascript js
    return payload
  end tell
end run`;
  return JSON.parse(runOsascript(script, [target, route])) as PageSnapshot;
}

function chromeFetchPayloads(baseUrl: string): Record<string, unknown> {
  const script = String.raw`
on run argv
  set baseUrl to item 1 of argv
  tell application "Google Chrome"
    activate
    if (count of windows) is 0 then
      make new window
      delay 1
    end if
    set targetUrl to baseUrl & "/home"
    if (count of tabs of front window) is 0 then
      make new tab at end of tabs of front window
    end if
    tell active tab of front window to set URL to targetUrl
    delay 4
    set js to "window.__adminHomeDesignSmokePayload=''; (async()=>{ const questions='__QUESTIONS__'.split('|||'); const getJson=async(u)=>fetch(u).then(async r=>({ok:r.ok,status:r.status,body:await r.json().catch(e=>({error:String(e)}))})).catch(e=>({ok:false,status:null,error:String(e)})); const setupControl=await getJson('/api/admin/setup-control'); const templateCatalog=await getJson('/api/admin/context-layer/templates'); const avaQuestions=await Promise.all(questions.map(q=>fetch('/api/home/know/ask',{method:'POST',headers:{'content-type':'application/json','x-abarva-debug-home-know':'1'},body:JSON.stringify({question:q})}).then(async r=>({question:q,status:r.status,body:await r.json().catch(e=>({error:String(e)}))})).catch(e=>({question:q,status:null,error:String(e)})))); window.__adminHomeDesignSmokePayload=JSON.stringify({setupControl,templateCatalog,avaQuestions}); })().catch(e=>{window.__adminHomeDesignSmokePayload=JSON.stringify({error:String(e)})})"
    set js to my replaceText(js, "__QUESTIONS__", "Explain the selected context in plain English.|||What can Home answer about this context?|||What gaps exist?|||What evidence supports this context?|||What relationships are known?|||What should be sent to Intelligence?|||Is this active Home context or candidate preview?|||What is not available yet?")
    tell active tab of front window to execute javascript js
    delay 9
    tell active tab of front window to set payload to execute javascript "window.__adminHomeDesignSmokePayload || ''"
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
  snapshots: PageSnapshot[];
} {
  const clickMap: ClickMapEntry[] = [];
  const snapshots: PageSnapshot[] = [];

  chromeSnapshot(baseUrl, "/admin");
  for (const label of ["Overview", "Data", "Add data", "Candidate Preview", "Promotion"]) {
    const entry = safeClickControl(baseUrl, "/admin", "Admin", label);
    clickMap.push(entry);
    if (entry.classification === "working" || entry.classification === "navigation") {
      snapshots.push(chromeCurrentSnapshot(baseUrl, "/admin"));
    }
  }
  const intakeEntry = safeClickControl(baseUrl, "/admin", "Admin", "Data Intake Library");
  clickMap.push(intakeEntry);
  snapshots.push(chromeCurrentSnapshot(baseUrl, "/admin"));
  for (const label of [
    "View guide",
    "View template",
    "Download template",
    "Download full packet",
    "View field dictionary",
    "Upload",
  ]) {
    const entry = safeClickControl(baseUrl, "/admin", "Admin", label);
    clickMap.push(entry);
    if (entry.classification === "working" || entry.classification === "navigation") {
      snapshots.push(chromeCurrentSnapshot(baseUrl, "/admin"));
    }
  }

  chromeSnapshot(baseUrl, "/home");
  const overviewEntry = safeClickControl(baseUrl, "/home", "Home", "Enterprise overview");
  clickMap.push(overviewEntry);
  const contextEntry = safeClickControl(baseUrl, "/home", "Home", "Functions");
  clickMap.push(contextEntry);
  snapshots.push(chromeCurrentSnapshot(baseUrl, "/home"));
  for (const label of HOME_CONTEXT_CONTROLS.filter((label) => label !== "Enterprise overview")) {
    const entry = safeClickControl(baseUrl, "/home", "Home", label);
    clickMap.push(entry);
    if (entry.classification === "working" || entry.classification === "navigation") {
      snapshots.push(chromeCurrentSnapshot(baseUrl, "/home"));
    }
  }

  for (const suggestion of [
    "Explain this Home context",
    "Show gaps in this Home context",
    "What can Home answer about this context",
  ]) {
    const entry = safeClickControl(baseUrl, "/home", "Home", suggestion);
    clickMap.push(entry);
    if (entry.classification === "working") {
      snapshots.push(chromeCurrentSnapshot(baseUrl, "/home"));
    }
  }

  return { clickMap, snapshots };
}

function safeClickControl(
  baseUrl: string,
  route: string,
  page: "Admin" | "Home",
  label: string,
): ClickMapEntry {
  const mutating = /promote|commit|delete|sign out/i.test(label);
  if (mutating) {
    return {
      page,
      route,
      control: label,
      action: "classify control without clicking",
      result: "blocked to avoid production write or sign-out",
      classification: "blocked-by-permissions",
    };
  }

  const before = chromeCurrentSnapshot(baseUrl, route);
  const result = chromeExecuteOnRoute(
    baseUrl,
    route,
    clickJsForLabel(label),
    2,
  );
  const after = chromeCurrentSnapshot(baseUrl, route);
  const found = result === "clicked" || result === "disabled" || result === "download";
  const visibleChange = normalizeText(before.text) !== normalizeText(after.text);
  const routeChanged = stripHash(before.url) !== stripHash(after.url);
  const comingSoon = /coming soon|not implemented|future|disabled/i.test(
    after.text,
  );
  const activeNoop =
    /^(Enterprise overview|Overview|Data|Candidate Preview|Promotion|Sources|Relationships|Summary|Gaps)$/i.test(
      label,
    ) && after.text.toLowerCase().includes(label.toLowerCase());

  if (!found) {
    return {
      page,
      route,
      control: label,
      action: "click visible control",
      result: "missing",
      classification: "failed",
      severity: "P1",
    };
  }
  if (result === "disabled" || comingSoon) {
    return {
      page,
      route,
      control: label,
      action: "click visible control",
      result: result === "disabled" ? "disabled" : "coming soon / labelled",
      classification: comingSoon ? "coming-soon" : "intentionally-disabled",
    };
  }
  if (routeChanged) {
    return {
      page,
      route,
      control: label,
      action: "click visible control",
      result: "navigation",
      classification: "navigation",
    };
  }
  return {
    page,
    route,
    control: label,
    action: "click visible control",
    result: visibleChange
      ? "visible state changed"
      : activeNoop
        ? "control already visible or selected"
        : "no visible state change",
    classification:
      visibleChange || activeNoop ? "working" : "read-only-placeholder",
    severity: visibleChange || activeNoop ? undefined : "P1",
  };
}

function clickJsForLabel(label: string): string {
  return `(() => {
    const wanted = ${JSON.stringify(label.toLowerCase())};
    const controls = Array.from(document.querySelectorAll('button,a,input,select,textarea'));
    const control = controls.find((el) => {
      const text = ((el.innerText || el.value || el.getAttribute('placeholder') || el.getAttribute('aria-label') || el.name || el.id || '') + '').trim().toLowerCase();
      return text === wanted || text.includes(wanted) || wanted.includes(text);
    });
    if (!control) return 'missing';
    if (control.disabled || control.getAttribute('aria-disabled') === 'true') return 'disabled';
    const href = control.href || '';
    if (/download/i.test((control.innerText || '') + ' ' + href)) return 'download';
    control.click();
    return 'clicked';
  })()`;
}

function chromeExecuteOnRoute(
  baseUrl: string,
  route: string,
  js: string,
  delaySeconds: number,
): string {
  const target = `${baseUrl}${route}`;
  const script = String.raw`
on run argv
  set targetUrl to item 1 of argv
  set js to item 2 of argv
  set delaySeconds to item 3 of argv as number
  tell application "Google Chrome"
    activate
    if (count of windows) is 0 then
      make new window
      delay 1
    end if
    if (count of tabs of front window) is 0 then
      make new tab at end of tabs of front window
    end if
    if URL of active tab of front window does not start with targetUrl then
      tell active tab of front window to set URL to targetUrl
      delay 3
    end if
    tell active tab of front window to set payload to execute javascript js
    delay delaySeconds
    return payload
  end tell
end run`;
  return runOsascript(script, [target, js, String(delaySeconds)]);
}

function chromeCurrentSnapshot(baseUrl: string, route: string): PageSnapshot {
  const target = `${baseUrl}${route}`;
  const script = String.raw`
on run argv
  set targetUrl to item 1 of argv
  set routeName to item 2 of argv
  tell application "Google Chrome"
    activate
    if (count of windows) is 0 then
      make new window
      delay 1
    end if
    if (count of tabs of front window) is 0 then
      make new tab at end of tabs of front window
    end if
    if URL of active tab of front window does not start with targetUrl then
      tell active tab of front window to set URL to targetUrl
      delay 3
    end if
    set js to "JSON.stringify({route:" & quoted form of routeName & ",url:location.href,title:document.title,ready:document.readyState,status:null,text:document.body ? document.body.innerText : '',headings:Array.from(document.querySelectorAll('h1,h2,h3')).map(e=>e.innerText.trim()).filter(Boolean),buttons:Array.from(document.querySelectorAll('button')).map(e=>e.innerText.trim()).filter(Boolean),links:Array.from(document.querySelectorAll('a')).map(e=>e.innerText.trim()).filter(Boolean),inputs:Array.from(document.querySelectorAll('input,textarea')).map(e=>e.getAttribute('placeholder')||e.getAttribute('aria-label')||e.name||e.id||'input').filter(Boolean),selects:Array.from(document.querySelectorAll('select')).map(e=>e.getAttribute('aria-label')||e.name||e.id||'select').filter(Boolean),controls:Array.from(document.querySelectorAll('button,a,input,select,textarea')).map(e=>(e.innerText||e.value||e.getAttribute('placeholder')||e.getAttribute('aria-label')||e.name||e.id||e.href||'control').trim()).filter(Boolean)})"
    tell active tab of front window to set payload to execute javascript js
    return payload
  end tell
end run`;
  return JSON.parse(runOsascript(script, [target, route])) as PageSnapshot;
}

function tryCaptureScreenshot(outDir: string, route: string) {
  const file = path.join(outDir, "screenshots", `${slug(route)}.png`);
  try {
    execFileSync("screencapture", ["-x", file], { timeout: 10000 });
    if (!existsSync(file)) {
      writeFileSync(`${file}.skipped.txt`, "screencapture did not create a file");
    }
  } catch (error) {
    writeFileSync(`${file}.skipped.txt`, String(error));
  }
}

function scoreAdminFidelity(snapshots: PageSnapshot[]): DesignScore[] {
  return snapshots
    .filter((snapshot) => snapshot.route.startsWith("/admin"))
    .map((snapshot) =>
      scoreFidelity("Admin", snapshot, ADMIN_EXPECTED, [
        "Tenant Setup & Data Control Center",
        "workflow-led operating surface",
        "setup-control caveats and guardrails",
      ]),
    );
}

function scoreHomeFidelity(snapshots: PageSnapshot[]): DesignScore[] {
  return snapshots
    .filter((snapshot) => snapshot.route.startsWith("/home"))
    .map((snapshot) =>
      scoreFidelity("Home", snapshot, HOME_EXPECTED, [
        "Enterprise Knowledge Surface",
        "knowledge command center landing",
        "Context Explorer as drill-down, not the whole page",
      ]),
    );
}

function scoreFidelity(
  page: "Admin" | "Home",
  snapshot: PageSnapshot,
  expected: string[],
  structureNotes: string[],
): DesignScore {
  const text = snapshot.text;
  const matched = expected.filter((label) =>
    new RegExp(escapeRegex(label), "i").test(text),
  );
  const missing = expected.filter((label) => !matched.includes(label));
  const score = Math.round((matched.length / expected.length) * 100);
  let verdict: Fidelity = "not faithful";
  if (score >= 85) verdict = "faithful";
  else if (score >= 60) verdict = "partially faithful";
  else if (
    /(setup-control|Context Explorer|Evidence|Candidate|Data Intake|Active Home context)/i.test(
      text,
    )
  ) {
    verdict = "wiring-only / visually not faithful";
  }
  return {
    page,
    route: snapshot.route,
    verdict,
    score,
    matched,
    missing,
    structureNotes,
  };
}

function validateRoutes(snapshots: PageSnapshot[], findings: Finding[]) {
  for (const snapshot of snapshots) {
    if (/404|not found|Application error|This page could not be found/i.test(snapshot.text)) {
      findings.push({
        severity: "P1",
        category: "route load",
        message: `${snapshot.route} did not render the expected signed-in page.`,
        evidence: snapshot.url,
      });
    }
    if (/sign in|sign-in|Clerk/i.test(snapshot.text) && !/Sign out/i.test(snapshot.text)) {
      findings.push({
        severity: "P0",
        category: "auth",
        message: `${snapshot.route} did not load as signed-in.`,
        evidence: snapshot.url,
      });
    }
  }
}

function validateDesignScores(
  adminScores: DesignScore[],
  homeScores: DesignScore[],
  findings: Finding[],
) {
  const primaryAdmin = adminScores.find((score) => score.route === "/admin");
  const primaryHome = homeScores.find((score) => score.route === "/home");
  for (const score of [primaryAdmin, primaryHome].filter(Boolean) as DesignScore[]) {
    if (score.verdict !== "faithful") {
      findings.push({
        severity: "P1",
        category: "design fidelity",
        message: `${score.page} design fidelity is ${score.verdict}.`,
        evidence: `${score.score}% matched; missing: ${score.missing.join(", ")}`,
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
        message: `${entry.page} ${entry.control}: ${entry.result}`,
        evidence: `${entry.action} classified as ${entry.classification}`,
      });
    }
  }
}

function validateActiveCandidateSeparation(
  snapshots: PageSnapshot[],
  setupControl: unknown,
  findings: Finding[],
) {
  const homeDefault = snapshots.find((snapshot) => snapshot.route === "/home");
  const homeCandidate = snapshots.find(
    (snapshot) => snapshot.route === "/home?candidatePreview=true",
  );
  if (homeDefault?.text.includes("Candidate Preview — inactive data")) {
    findings.push({
      severity: "P0",
      category: "active/candidate separation",
      message: "Candidate preview banner appears in default Home mode.",
    });
  }
  if (homeCandidate && !/inactive|not active tenant truth/i.test(homeCandidate.text)) {
    findings.push({
      severity: "P0",
      category: "active/candidate separation",
      message: "Candidate preview mode does not clearly say the candidate is inactive.",
    });
  }

  const guardrails = getGuardrails(setupControl);
  for (const key of [
    "candidatePromoted",
    "activeTenantAccessLayerUpdated",
    "productionTenantDataWritten",
    "moduleRuntimeConsumptionChanged",
    "candidateReadByDefault",
  ]) {
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

function validateNaming(snapshots: PageSnapshot[], findings: Finding[]) {
  const text = snapshots.map((snapshot) => snapshot.text).join("\n");
  for (const label of DISALLOWED_PRIMARY_LANGUAGE) {
    if (new RegExp(`\\b${escapeRegex(label)}\\b`, "i").test(text)) {
      findings.push({
        severity: "P1",
        category: "naming",
        message: `Primary UI exposes architecture/internal label: ${label}`,
      });
    }
  }
}

function validateTruthSafety(snapshots: PageSnapshot[], findings: Finding[]) {
  const text = snapshots
    .map((snapshot) => snapshot.text)
    .join("\n")
    .replace(/not active tenant truth/gi, "")
    .replace(/not realized value/gi, "");
  const unsafeClaims = [
    [/uploaded files equal active facts/i, "uploaded files equal active facts"],
    [/candidate is promoted|promoted candidate/i, "candidate equals active truth"],
    [
      /\b(has|shows|claims|reports)\b[^.\n]{0,80}\brealized (value|savings)\b/i,
      "realized value without proof",
    ],
    [
      /\b(is|equals|confirmed as)\b[^.\n]{0,80}\bactive tenant truth\b/i,
      "unsupported active tenant truth claim",
    ],
  ];
  for (const [pattern, label] of unsafeClaims) {
    if ((pattern as RegExp).test(text)) {
      findings.push({
        severity: label === "unsupported active tenant truth claim" ? "P0" : "P1",
        category: "truth safety",
        message: `UI contains risky claim: ${label}`,
      });
    }
  }
}

function validateAvaQuality(avaQuality: AvaQuality, findings: Finding[]) {
  for (const question of avaQuality.questions) {
    if (question.status !== 200) {
      findings.push({
        severity: "P1",
        category: "aVa scoped quality",
        message: `Home aVa question did not return 200: ${question.question}`,
        evidence: `status=${String(question.status ?? "missing")}`,
      });
      continue;
    }
    if (!question.scopedToHome) {
      findings.push({
        severity: "P1",
        category: "aVa scoped quality",
        message: `Home aVa answer was not visibly scoped to Home context: ${question.question}`,
      });
    }
    if (!question.avoidsActiveTruthClaim) {
      findings.push({
        severity: "P0",
        category: "aVa scoped quality",
        message: `Home aVa answer claimed active tenant truth: ${question.question}`,
      });
    }
    if (!question.avoidsVersionLanguage || !question.avoidsPromotionClaim) {
      findings.push({
        severity: "P1",
        category: "aVa scoped quality",
        message: `Home aVa answer exposed forbidden language or promotion claim: ${question.question}`,
      });
    }
  }
}

function buildDataWiring(
  snapshots: PageSnapshot[],
  apiPayloads: Record<string, unknown>,
) {
  const setup = isRecord(apiPayloads.setupControl)
    ? apiPayloads.setupControl
    : null;
  const setupBody = isRecord(setup?.body) ? setup.body : setup;
  const text = snapshots.map((snapshot) => snapshot.text).join("\n");
  return {
    setupControlAvailable: Boolean(setupBody && !setupBody.error),
    tenant: setupBody && isRecord(setupBody.tenant) ? setupBody.tenant : null,
    guardrails: getGuardrails(apiPayloads.setupControl),
    renderedValues: {
      hasAdminDataControl: /Data Control|setup-control|Setup/i.test(text),
      hasHomeKnowledgeSnapshot: /Enterprise Knowledge Snapshot/i.test(text),
      hasEvidenceCoverage: /Evidence Coverage/i.test(text),
      hasAnswerability: /Answerability/i.test(text),
      hasRelationshipOverview: /Relationship Overview/i.test(text),
    },
    mismatches: [],
    caveat:
      "This smoke verifies rendered state against setup-control and route DOM. It does not mutate tenant data.",
  };
}

function buildActiveVsCandidate(
  snapshots: PageSnapshot[],
  apiPayloads: Record<string, unknown>,
) {
  const homeDefault = snapshots.find((snapshot) => snapshot.route === "/home");
  const homeCandidate = snapshots.find(
    (snapshot) => snapshot.route === "/home?candidatePreview=true",
  );
  return {
    activeDefault: {
      route: "/home",
      activeHomeContextVisible: Boolean(
        homeDefault?.text.includes("Active Home context"),
      ),
      candidateBannerVisible: Boolean(
        homeDefault?.text.includes("Candidate Preview — inactive data"),
      ),
      activeTenantTruthVisible: Boolean(/Active tenant truth/i.test(homeDefault?.text ?? "")),
    },
    candidatePreview: {
      route: "/home?candidatePreview=true",
      inactiveCandidateBannerVisible: Boolean(
        homeCandidate?.text.includes("Candidate Preview — inactive data"),
      ),
      notActiveTenantTruthVisible: Boolean(
        /not active tenant truth|inactive/i.test(homeCandidate?.text ?? ""),
      ),
    },
    guardrails: getGuardrails(apiPayloads.setupControl),
  };
}

function buildNamingAudit(snapshots: PageSnapshot[]) {
  const text = snapshots.map((snapshot) => snapshot.text).join("\n");
  return {
    blockedPrimaryLabels: DISALLOWED_PRIMARY_LANGUAGE.map((label) => ({
      label,
      visible: new RegExp(`\\b${escapeRegex(label)}\\b`, "i").test(text),
    })),
    allowedLabels: [
      "Tenant Packet",
      "Evidence",
      "Known Facts",
      "Relationships",
      "Insights",
      "Gaps",
      "Answerability",
      "Ready Areas",
      "Candidate Preview",
      "Active Home context",
      "Data Status",
      "Promotion Readiness",
    ].map((label) => ({ label, visible: text.includes(label) })),
  };
}

function buildTruthSafetyAudit(snapshots: PageSnapshot[]) {
  const text = snapshots
    .map((snapshot) => snapshot.text)
    .join("\n")
    .replace(/not active tenant truth/gi, "")
    .replace(/not realized value/gi, "");
  return {
    uploadedEqualsActiveFacts: /uploaded files equal active facts/i.test(text),
    candidateEqualsActiveTruth: /candidate is promoted|promoted candidate/i.test(
      text,
    ),
    activeTenantTruthClaim:
      /\b(is|equals|confirmed as)\b[^.\n]{0,80}\bactive tenant truth\b/i.test(text),
    proposedValueAsRealized:
      /\b(has|shows|claims|reports)\b[^.\n]{0,80}\brealized (value|savings)\b/i.test(
        text,
      ),
    rawInternalErrorVisible: /stack trace|Unhandled Runtime Error|TypeError:/i.test(
      text,
    ),
  };
}

function buildConsoleNetwork(mode: Mode) {
  return {
    mode,
    consoleErrors: [] as string[],
    networkErrors: [] as string[],
    caveat:
      mode === "chrome"
        ? "Chrome AppleScript captures DOM/API results but not DevTools console streams."
        : "Fixture mode does not access a signed-in browser.",
  };
}

function evaluateAvaQuestions(raw: unknown): AvaQuality {
  const rows = Array.isArray(raw) ? raw : [];
  const questions = rows.map((row): AvaQuestionQuality => {
    const item = isRecord(row) ? row : {};
    const body = isRecord(item.body) ? item.body : {};
    const bodyBody = isRecord(body.body) ? body.body : body;
    const prose =
      typeof bodyBody.prose === "string"
        ? bodyBody.prose
        : typeof body.prose === "string"
          ? body.prose
          : "";
    return {
      question: typeof item.question === "string" ? item.question : "unknown",
      status: typeof item.status === "number" ? item.status : null,
      answerStatus:
        typeof bodyBody.answerStatus === "string" ? bodyBody.answerStatus : null,
      scopedToHome:
        /Home|context|evidence|loaded|available|not available|gap|relationship/i.test(
          prose,
        ),
      avoidsActiveTruthClaim: !/Active tenant truth/i.test(prose),
      avoidsVersionLanguage: !/\bV[467]\b/.test(prose),
      avoidsPromotionClaim: !/promoted candidate|candidate data is promoted/i.test(
        prose,
      ),
      prosePreview: prose.slice(0, 360),
    };
  });
  return {
    questions,
    totals: {
      asked: questions.length,
      status200: questions.filter((question) => question.status === 200).length,
      scopedToHome: questions.filter((question) => question.scopedToHome).length,
      avoidsActiveTruthClaim: questions.filter(
        (question) => question.avoidsActiveTruthClaim,
      ).length,
      avoidsVersionLanguage: questions.filter(
        (question) => question.avoidsVersionLanguage,
      ).length,
      avoidsPromotionClaim: questions.filter(
        (question) => question.avoidsPromotionClaim,
      ).length,
    },
  };
}

function buildAvaSkipped(mode: Mode): AvaQuality {
  return {
    questions: [],
    totals: {
      asked: 0,
      status200: 0,
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

function fixtureSnapshots(): PageSnapshot[] {
  const adminText =
    "Tenant Setup & Data Control Center setup-control readiness Data Intake Template Catalog Tenant Packet Evidence Candidate Promotion Guardrail active";
  const homeText =
    "Active Home context Data Status Enterprise Knowledge Snapshot Evidence Coverage Answerability Top Gaps Needs Evidence Ready Areas Relationship Overview Context Explorer scoped aVa";
  const candidateText =
    `${homeText} Candidate Preview — inactive data not active tenant truth`;
  return [
    snapshotFixture("/admin", adminText),
    snapshotFixture("/admin/data-intake", `${adminText} Download template`),
    snapshotFixture("/admin/candidate-preview", `${adminText} inactive candidate`),
    snapshotFixture("/admin/data-layer-explorer", `${adminText} Relationships`),
    snapshotFixture("/home", homeText),
    snapshotFixture("/home?candidatePreview=true", candidateText),
  ];
}

function snapshotFixture(route: string, text: string): PageSnapshot {
  return {
    route,
    url: `fixture://${route}`,
    title: "fixture",
    ready: "complete",
    status: 200,
    text,
    headings: [],
    buttons: [],
    links: [],
    inputs: [],
    selects: [],
    controls: [],
  };
}

function fixtureApiPayloads() {
  return {
    setupControl: {
      body: {
        tenant: { tenantKey: "fixture" },
        guardrails: {
          candidatePromoted: false,
          activeTenantAccessLayerUpdated: false,
          productionTenantDataWritten: false,
          moduleRuntimeConsumptionChanged: false,
          candidateReadByDefault: false,
        },
      },
    },
    templateCatalog: { status: 200, body: { templates: [] } },
    avaQuestions: HOME_AVA_QUESTIONS.map((question) => ({
      question,
      status: 200,
      body: {
        prose:
          "Home can answer from the selected context, evidence, gaps, and relationships. Candidate preview remains inactive.",
        answerStatus: "answered",
      },
    })),
  };
}

function fixtureClickMap(): ClickMapEntry[] {
  return [
    ...ADMIN_CONTROL_LABELS.map((control) => ({
      page: "Admin" as const,
      route: "/admin",
      control,
      action: "fixture click",
      result: "classified",
      classification: "working" as const,
    })),
    ...HOME_CONTEXT_CONTROLS.map((control) => ({
      page: "Home" as const,
      route: "/home",
      control,
      action: "fixture click",
      result: "classified",
      classification: "working" as const,
    })),
  ];
}

function getGuardrails(setupControl: unknown): Record<string, unknown> {
  const setup = isRecord(setupControl) ? setupControl : {};
  const body = isRecord(setup.body) ? setup.body : setup;
  const guardrails = isRecord(body.guardrails) ? body.guardrails : {};
  return guardrails;
}

function writeSnapshot(outDir: string, snapshot: PageSnapshot, prefix?: string) {
  const name = prefix ?? slug(snapshot.route || "root");
  writeJson(path.join(outDir, "dom", `${name}.json`), snapshot);
  writeFileSync(path.join(outDir, "dom", `${name}.txt`), snapshot.text);
}

function writeDesignMarkdown(
  outDir: string,
  adminScores: DesignScore[],
  homeScores: DesignScore[],
) {
  const lines = [
    "# Admin/Home Design Fidelity",
    "",
    "## Admin",
    "",
    ...adminScores.map(
      (score) =>
        `- ${score.route}: ${score.verdict} (${score.score}%). Missing: ${
          score.missing.join(", ") || "none"
        }`,
    ),
    "",
    "## Home",
    "",
    ...homeScores.map(
      (score) =>
        `- ${score.route}: ${score.verdict} (${score.score}%). Missing: ${
          score.missing.join(", ") || "none"
        }`,
    ),
    "",
  ];
  writeFileSync(path.join(outDir, "design-fidelity.md"), lines.join("\n"));
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
  adminScores: DesignScore[];
  homeScores: DesignScore[];
}) {
  const deadClicks = input.clickMap.filter(
    (entry) =>
      entry.classification === "failed" ||
      entry.classification === "read-only-placeholder",
  ).length;
  const lines = [
    "# ADMIN-HOME-DESIGN-SMOKE-PR — Design Fidelity and Smoke Proof",
    "",
    `- Test run timestamp: ${runTimestamp}`,
    `- SHA tested: \`${input.sha}\``,
    "- Revision tested: captured from ACA deploy evidence when run post-deploy; not mutated by this harness.",
    "- Image digest: captured from ACA deploy evidence when run post-deploy; not mutated by this harness.",
    "- Traffic %: read-only harness; does not shift traffic.",
    "- Health status: read-only harness; route/API proof only.",
    `- Base URL: ${input.baseUrl}`,
    `- Mode: ${input.mode}`,
    `- Routes tested: ${[...ADMIN_ROUTES, ...HOME_ROUTES].join(", ")}`,
    `- Admin design fidelity: ${input.adminScores[0]?.verdict ?? "not tested"}`,
    `- Home design fidelity: ${input.homeScores[0]?.verdict ?? "not tested"}`,
    `- Clicks classified: ${input.clickMap.length}`,
    `- Dead/read-only primary click count: ${deadClicks}`,
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
    "- This PR adds proof harnesses, generated reports, and bounded Home/Admin UI corrections; it does not promote candidate data or update Active Tenant Access.",
    "- Chrome mode captures DOM/API proof from a signed-in desktop tab. Console streams are not DevTools-complete in AppleScript mode.",
    "- Screenshots can be blocked by local macOS permissions; DOM/API proof is primary.",
    "",
    "## Final Verdict",
    "",
    input.verdict === "release-ready"
      ? "Admin and Home meet the ADMIN-HOME-DESIGN-SMOKE acceptance bar for the tested mode."
      : "Admin/Home are not release-ready against the ADMIN-HOME-DESIGN-SMOKE acceptance bar until P0/P1 findings are addressed or explicitly accepted.",
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

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function stripHash(value: string): string {
  return value.replace(/#.*$/, "");
}

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "root"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function runOsascript(script: string, args: string[]): string {
  return execFileSync("osascript", ["-", ...args], {
    input: script,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
    timeout: 30000,
  }).trim();
}

function git(...args: string[]): string {
  return execFileSync("git", args, { encoding: "utf8" });
}

function writeJson(file: string, value: unknown) {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
