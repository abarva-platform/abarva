import { createClerkClient } from "@clerk/backend";
import type { Browser, BrowserContext, Page } from "@playwright/test";
import type { CxoPersona } from "@/lib/auth/cxo-personas";
import { AGENT_CLIENT_LOGINS } from "@/lib/auth/agent-client-logins";

export interface CrawlPersona {
  key: string;
  tenantKey: CxoPersona["clientKey"];
  tenantName: string;
  title: string;
  email: string;
  sourceSlug: string;
  /**
   * Playwright storage-state filename minted by the prime-auth harness
   * (scripts/auth/prime-agent-client-auth-states.ts → `.auth/agent-<clientKey>.json`).
   */
  storageFile: string;
}

export interface CrawlSurface {
  id: string;
  path: string;
  requiresAgentProbe?: boolean;
  requiresContextDemoVectorProof?: boolean;
}

// Crawl personas are DERIVED from the durable per-client agent roster
// (src/lib/auth/agent-client-logins.ts) so there is one source of truth across
// the prime-auth harness and the post-deploy crawl/gauntlet. This replaced the
// prior hardcoded human CXO emails (cio@/cdao@…), which were removed and left
// the crawl access-stale. One automation persona per client; each authenticates
// via Clerk sign-in tokens (no password) as a maestro agent.
export const CRAWL_PERSONAS: CrawlPersona[] = AGENT_CLIENT_LOGINS.map(
  (login) => ({
    key: login.slug,
    tenantKey: login.clientKey,
    tenantName: login.tenant,
    title: login.titleShort,
    email: login.email,
    sourceSlug: login.slug,
    storageFile: `agent-${login.clientKey}.json`,
  }),
);

export const PRIMARY_CRAWL_SURFACES: CrawlSurface[] = [
  { id: 'home', path: '/home' },
  { id: 'intelligence-root', path: '/intelligence' },
  { id: 'intelligence-ask', path: '/intelligence/ask', requiresAgentProbe: true },
  { id: 'intelligence-patterns', path: '/intelligence/patterns' },
  { id: 'intelligence-signals', path: '/intelligence/signals' },
  { id: 'moves-list', path: '/moves' },
  { id: 'strategic-moves-list', path: '/strategic-moves' },
  { id: 'moves-new', path: '/strategic-moves/new' },
  { id: 'programs-list', path: '/programs' },
  { id: 'programs-new', path: '/programs/new' },
  { id: 'source-list', path: '/source' },
  { id: 'source-events', path: '/source/events' },
  { id: 'source-new', path: '/source/new' },
  { id: 'source-queue', path: '/source/queue' },
  { id: 'source-portfolio', path: '/source/portfolio' },
  { id: 'source-value', path: '/source/value' },
  { id: 'tower-root', path: '/tower' },
  { id: 'tower-value', path: '/tower' },
  { id: 'tower-spend', path: '/tower' },
  { id: 'tower-actions', path: '/tower' },
  { id: 'home-queue', path: '/home/queue' },
  { id: 'admin-data-trust', path: '/admin/data-trust' },
  { id: 'admin-setup', path: '/admin?tab=tenant' },
  { id: 'admin-production-readiness', path: '/admin/production-readiness' },
  { id: 'admin-releases', path: '/admin/releases' },
];

export const EXPLICIT_CRAWL_SURFACES: CrawlSurface[] = [];

export const POST_DEPLOY_HARD_QUESTIONS = [
  "What decision should I make next, and what evidence supports it?",
  "What are the top three reasons this recommendation could be wrong?",
  "Which claims are not grounded in tenant data?",
  "What should the CFO refuse to fund until evidence improves?",
  "Which Source event should not proceed to award yet?",
  "What exact intake field blocks the procurement recommendation?",
  "What value has been verified versus merely projected?",
  "Where is tenant identity wrong or stale?",
  "What would change your recommendation?",
  "What should I ask the vendor before signing?",
] as const;

export const PHS_MERIDIAN_HARD_QUESTIONS = [
  "What tenant profile facts are actually loaded for Meridian: headquarters, hospital count, payer-provider structure, revenue, headcount, and executive roles?",
  "If Meridian is meant to be a Sacramento-based integrated health system with 30+ hospitals, which loaded evidence proves that and which fields are still missing?",
  "Who are the CIO, CTO, and CDAO personas in the loaded Meridian context, and what decisions does each own?",
  "What does the org structure show under the CDAO: VPs, directors, managers, domains, and total resource count?",
  "Which CDAO teams should own data engineering, analytics product management, AI governance, MDM, BI, and clinical data science?",
  "What Meridian facts should Sentinel refuse to state until the Setup loader provides evidence?",
  "Which loaded Meridian data records are strongest, which are stale, and which are only synthetic assumptions?",
  "What exact evidence fields support the current Meridian enterprise profile answer?",
  "Where could Meridian tenant identity be confused with Apex, SkyHarbor, First Capital, Lakeshore, or PHS New Mexico?",
  "What would you ask the data steward to upload next to make Meridian profile grounding decision-grade?",
  "What Epic data assets should Meridian expect to ingest for clinical analytics: Clarity, Caboodle, Cogito, Chronicles extracts, HL7, FHIR, or other feeds?",
  "How should Meridian estimate Epic table or extract scope by use case without pretending to know every table name up front?",
  "Which Epic subject areas matter for population health: encounters, diagnoses, procedures, meds, labs, vitals, ADT, care gaps, referrals, claims, and provider attribution?",
  "Which Epic subject areas matter for hospital operations: throughput, beds, OR, ED, discharge, quality, readmissions, staffing, and revenue cycle?",
  "Which data is needed from ERP, HR, finance, supply chain, and ITSM to connect clinical performance to cost and operating capacity?",
  "What inbound integrations should Meridian count separately from source tables, and how should that estimate be calculated?",
  "What is the difference between an integration, a source extract, a table, a data product, a dashboard, and a governed metric?",
  "How should Meridian estimate report rationalization: legacy reports, Tableau or Power BI workbooks, Epic dashboards, SQL jobs, and regulatory extracts?",
  "What metadata should the Setup loader require for every Meridian dataset before it enters the context layer?",
  "What evidence should prove that Meridian has moved legacy workloads into AWS by July rather than merely planned it?",
  "What should a metadata-driven Databricks ingestion framework look like for Meridian at scale?",
  "What belongs in Bronze for Epic, claims, ERP, ITSM, identity, vendor, and external benchmark data?",
  "What belongs in Silver for patient, encounter, provider, member, claim, cost center, service line, and facility conformance?",
  "What belongs in Gold for population health, quality, MLR, readmissions, access, capacity, productivity, revenue cycle, and executive scorecards?",
  "How should Unity Catalog, PHI tagging, lineage, row-level security, and audit logging be designed for Meridian?",
  "Where should FHIR R4, HL7 v2, X12 claims, and batch file ingestion fit in the Databricks architecture?",
  "What Lakehouse medallion data products should be built before any AI use case is funded?",
  "How should Meridian decide between lift-and-shift AWS hosting, replatforming, refactoring, retiring, and rebuilding analytics workloads?",
  "What are the highest-risk modernization dependencies: Epic AMS, analytics AMS, cloud networking, IAM, data quality, or governance?",
  "What should the architecture answer say if the corpus has Databricks patterns but Meridian-specific inventory is incomplete?",
  "Which external datasets should Meridian consider for population health: HCUP, CMS quality, HEDIS, Stars, SDOH, ADI, census, provider NPI, and drug or formulary data?",
  "Which external datasets should be treated carefully because they may be public, stale, sampled, or not directly comparable to Meridian?",
  "How should plan-side analytics differ from provider and hospital analytics for the same patient population?",
  "What are the key plan-side KPIs: MLR, PMPM cost, RAF, Stars or quality rating, HEDIS gaps, retention, utilization, avoidable ED, and risk adjustment?",
  "What are the key provider-side KPIs: readmissions, LOS, throughput, access, leakage, referral completion, quality measures, productivity, and margin by service line?",
  "What are the shared integrated-system KPIs that connect the health plan and delivery network?",
  "How should Meridian prioritize use cases across population health command center, clinical performance, revenue cycle, access, workforce, and cloud cost?",
  "What would make an AI-enabled Population Health and Clinical Performance Command Center fundable in the next 90 days?",
  "Which use cases should not be funded until Epic, claims, and attribution data are reconciled?",
  "What should the CFO refuse to count as realized value until finance attestation exists?",
  "What value assumptions are projections only: MLR compression, utilization reduction, readmission reduction, Stars uplift, or clinician productivity?",
  "How should Nexus explain the gap between projected value and verified value in plain English?",
  "What questions should a board member ask before approving a Databricks modernization business case?",
  "What would a 30-60-90 day mobilization plan look like for Meridian's data platform, governance, and first two analytics use cases?",
  "Which roles should be named in the RACI for Epic data, claims data, ERP data, Databricks, Unity Catalog, AI governance, and finance value attestation?",
  "What should Meridian ask its Epic AMS vendor and analytics AMS vendor before expanding scope?",
  "When should Source be triggered for an SI or AMS event, and when should Moves continue without procurement?",
  "What are the biggest tenant-safety risks in this answer, and did you avoid mentioning Apex or SkyHarbor data?",
  "What exact corpus patterns or evidence records did you use, and which claims have no source?",
  "Give a plain-English answer for a common CXO: what should Meridian do next, why, what evidence supports it, and what gap remains?",
] as const;

export function resolveCrawlQuestions(questionSet?: string): readonly string[] {
  if (questionSet === "phs-meridian") return PHS_MERIDIAN_HARD_QUESTIONS;
  return POST_DEPLOY_HARD_QUESTIONS;
}

export interface PersonaContextOptions {
  baseUrl: string;
  password?: string;
  headless?: boolean;
}

export interface PersonaContext {
  context: BrowserContext;
  page: Page;
  persona: CrawlPersona;
}

export async function createIsolatedPersonaContext(
  browser: Browser,
  persona: CrawlPersona,
  options: PersonaContextOptions,
): Promise<PersonaContext> {
  const context = await browser.newContext({
    baseURL: options.baseUrl,
    storageState: undefined,
  });
  const page = await context.newPage();
  await signInPersona(page, persona, options);
  return { context, page, persona };
}

export async function signInPersona(
  page: Page,
  persona: CrawlPersona,
  options: PersonaContextOptions,
): Promise<void> {
  if (process.env.CLERK_SECRET_KEY?.trim()) {
    console.log(`crawl_auth_ticket_start:${persona.key}:${persona.tenantKey}`);
    await signInPersonaWithClerkTicket(page, persona, options);
    console.log(
      `crawl_auth_ticket_complete:${persona.key}:${persona.tenantKey}`,
    );
    return;
  }

  const password = firstPresent(
    process.env[`CRAWL_${envKey(persona.key)}_PASSWORD`],
    options.password,
    process.env.CRAWL_DEMO_PASSWORD,
    "Demo2026!",
  );
  const email = firstPresent(
    process.env[`CRAWL_${envKey(persona.key)}_EMAIL`],
    persona.email,
  );
  const code = firstPresent(process.env.CRAWL_DEMO_CODE, "424242");

  await page.goto("/sign-in", {
    waitUntil: "domcontentloaded",
    timeout: 45_000,
  });
  await page.waitForFunction(
    () => {
      return Boolean(
        (window as unknown as { Clerk?: { loaded?: boolean } }).Clerk?.loaded,
      );
    },
    null,
    { timeout: 30_000 },
  );
  await typeCredential(
    page,
    /name@company\.com|enter your email address/i,
    email,
  );
  await typeCredential(
    page,
    /password from invite|enter your password/i,
    password,
  );
  await typeCredential(page, /6-digit code|access code/i, code);
  const submit = page.getByRole("button", { name: /sign in|continue/i });
  await submit.waitFor({ state: "visible", timeout: 10_000 });
  await page
    .waitForFunction(
      () => {
        return Array.from(document.querySelectorAll("button")).some(
          (button) =>
            /sign in|continue/i.test(button.textContent ?? "") &&
            !button.disabled,
        );
      },
      null,
      { timeout: 10_000 },
    )
    .catch(async () => {
      const formState = await page
        .evaluate(() => {
          return Array.from(document.querySelectorAll("input")).map(
            (input) => ({
              id: input.id,
              placeholder: input.placeholder,
              valueLength: input.value.length,
              disabled: input.disabled,
            }),
          );
        })
        .catch(() => []);
      throw new Error(
        `crawl_sign_in_form_disabled:${JSON.stringify(formState)}`,
      );
    });
  await submit.click();

  const outcome = await waitForSignInOutcome(page);
  if (outcome.type === "alert") {
    throw new Error(`crawl_sign_in_failed: ${outcome.text}`);
  }
  if (outcome.type === "timeout") {
    throw new Error("crawl_sign_in_timeout_no_redirect_or_session");
  }

  await page.context().addCookies([
    {
      name: "abarva_active_client",
      value: persona.tenantKey,
      domain: new URL(options.baseUrl).hostname,
      path: "/",
      sameSite: "Lax",
      secure: options.baseUrl.startsWith("https://"),
    },
  ]);
}

async function signInPersonaWithClerkTicket(
  page: Page,
  persona: CrawlPersona,
  options: PersonaContextOptions,
): Promise<void> {
  const secretKey = process.env.CLERK_SECRET_KEY?.trim();
  if (!secretKey) throw new Error("Missing CLERK_SECRET_KEY");

  const clerk = createClerkClient({ secretKey });
  const users = await withTimeout(
    clerk.users.getUserList({
      emailAddress: [persona.email],
      limit: 1,
    }),
    20_000,
    `crawl_clerk_ticket_user_lookup_timeout:${persona.key}`,
  );
  const user = users.data[0];
  if (!user) {
    throw new Error(`crawl_clerk_ticket_user_not_found:${persona.email}`);
  }

  const token = await withTimeout(
    clerk.signInTokens.createSignInToken({
      userId: user.id,
      expiresInSeconds: 300,
    }),
    20_000,
    `crawl_clerk_ticket_create_timeout:${persona.key}`,
  );

  await page.goto(options.baseUrl, {
    waitUntil: "domcontentloaded",
    timeout: 45_000,
  });
  await page.waitForFunction(
    () => {
      return Boolean(
        (window as unknown as { Clerk?: { loaded?: boolean } }).Clerk?.loaded,
      );
    },
    null,
    { timeout: 30_000 },
  );
  await page.evaluate(async (ticket) => {
    const clerk = (
      window as unknown as {
        Clerk?: {
          client?: {
            signIn?: {
              create: (args: {
                strategy: "ticket";
                ticket: string;
              }) => Promise<{ status?: string; createdSessionId?: string }>;
            };
          };
          setActive?: (args: { session: string }) => Promise<unknown>;
        };
      }
    ).Clerk;
    const result = await clerk?.client?.signIn?.create({
      strategy: "ticket",
      ticket,
    });
    if (result?.status !== "complete" || !result.createdSessionId) {
      throw new Error(
        `crawl_clerk_ticket_incomplete:${result?.status ?? "unknown"}`,
      );
    }
    await clerk?.setActive?.({ session: result.createdSessionId });
  }, token.token);
  await page.waitForFunction(
    () => document.cookie.includes("__session="),
    null,
    { timeout: 20_000 },
  );

  await page.context().addCookies([
    {
      name: "abarva_active_client",
      value: persona.tenantKey,
      domain: new URL(options.baseUrl).hostname,
      path: "/",
      sameSite: "Lax",
      secure: options.baseUrl.startsWith("https://"),
    },
  ]);
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(message)), ms);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export function resolveCrawlPersonas(filter?: string): CrawlPersona[] {
  if (!filter || filter === "all") return CRAWL_PERSONAS;
  const requested = new Set(
    filter
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
  return CRAWL_PERSONAS.filter((persona) => requested.has(persona.key));
}

export function resolveCrawlSurfaces(filter?: string): CrawlSurface[] {
  if (!filter || filter === "all") return PRIMARY_CRAWL_SURFACES;
  const requested = new Set(
    filter
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
  return [...PRIMARY_CRAWL_SURFACES, ...EXPLICIT_CRAWL_SURFACES].filter(
    (surface) => requested.has(surface.id),
  );
}

function envKey(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

function firstPresent(...values: Array<string | undefined>): string {
  const found = values.find((value) => value?.trim());
  if (!found) throw new Error("Missing crawl credential");
  return found.trim();
}

async function typeCredential(
  page: Page,
  placeholder: RegExp,
  value: string,
): Promise<void> {
  const field = page.getByPlaceholder(placeholder).first();
  await field.waitFor({ state: "visible", timeout: 10_000 });
  await field.fill(value);
  const actual = await field.inputValue();
  if (actual !== value) {
    throw new Error(
      `crawl_sign_in_field_not_filled:${String(placeholder)}:${actual.length}`,
    );
  }
}

async function waitForSignInOutcome(
  page: Page,
): Promise<
  | { type: "redirect" }
  | { type: "session" }
  | { type: "alert"; text: string }
  | { type: "timeout" }
> {
  const redirect = page
    .waitForURL((url) => !url.pathname.startsWith("/sign-in"), {
      timeout: 25_000,
    })
    .then(() => ({ type: "redirect" as const }))
    .catch(() => null);
  const session = page
    .waitForFunction(
      () => {
        const clerk = (
          window as unknown as {
            Clerk?: {
              session?: { id?: string } | null;
              user?: { id?: string } | null;
            };
          }
        ).Clerk;
        return Boolean(
          clerk?.session?.id ||
          clerk?.user?.id ||
          document.cookie.includes("__session="),
        );
      },
      null,
      { timeout: 25_000 },
    )
    .then(() => ({ type: "session" as const }))
    .catch(() => null);
  const alert = page
    .waitForFunction(
      () => {
        return Array.from(document.querySelectorAll('[role="alert"]')).some(
          (element) => {
            return (element.textContent ?? "").trim().length > 0;
          },
        );
      },
      null,
      { timeout: 25_000 },
    )
    .then(async () => ({
      type: "alert" as const,
      text: (
        await page
          .getByRole("alert")
          .innerText()
          .catch(() => "unknown sign-in error")
      ).trim(),
    }))
    .catch(() => null);
  const timeout = new Promise<{ type: "timeout" }>((resolve) => {
    setTimeout(() => resolve({ type: "timeout" }), 26_000);
  });

  const outcome = await Promise.race([redirect, session, alert, timeout]);
  return outcome ?? { type: "timeout" };
}
