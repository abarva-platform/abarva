export type CrawlSeverity = "P0" | "P1" | "P2";

export interface CrawlFinding {
  severity: CrawlSeverity;
  tenantKey: string;
  personaKey: string;
  surfaceId: string;
  dimension: string;
  message: string;
  evidence?: Record<string, unknown>;
}

export interface CrawlPageObservation {
  tenantKey: string;
  expectedTenantName: string;
  personaKey: string;
  surfaceId: string;
  path: string;
  url: string;
  title?: string;
  visibleText: string;
  screenshotPath?: string;
  htmlPath?: string;
  consoleErrors: string[];
  networkErrors: Array<{ url: string; status: number }>;
  evidenceChipCount: number;
  proofPointCount: number;
  citationDensity: number;
  hardQuestionExactFieldCitations?: number;
  hardQuestionGroundingEvidence?: number;
  watchlistTopEntries: string[];
  visualCanon: {
    backgroundOk: boolean;
    headersOk: boolean;
    bodyOk: boolean;
    buttonsOk: boolean;
  };
  metrics?: {
    lcpMs?: number;
    cls?: number;
  };
}

export interface CrawlRun {
  runId: string;
  baseUrl: string;
  commitSha?: string;
  createdAt: string;
  observations: CrawlPageObservation[];
  candidatePreview?: unknown;
}

export interface CrawlBaselinePage {
  tenantKey: string;
  personaKey: string;
  surfaceId: string;
  evidenceChipCount: number;
  proofPointCount: number;
  citationDensity: number;
  screenshotPath?: string;
}

export interface CrawlBaseline {
  baselineId: string;
  createdAt: string;
  pages: CrawlBaselinePage[];
}

export interface CrawlComparison {
  runId: string;
  p0: number;
  p1: number;
  p2: number;
  findings: CrawlFinding[];
  candidatePreview?: {
    runId: string;
    p0: number;
    p1: number;
    p2: number;
    findings: CrawlFinding[];
  };
}

export const FORBIDDEN_TENANT_REFERENCES = ["Heliara", "Arcturus"] as const;

const TENANT_SPECIFIC_FORBIDDEN_REFERENCES: Partial<
  Record<CrawlPageObservation["tenantKey"], readonly string[]>
> = {
  skyharbor: [
    "Clinical care",
    "ambient AI",
    "MH-07",
    "Innovaccer",
    "revenue cycle",
  ],
};

export const GENERIC_TENANT_REFERENCES = [
  "generic tenant",
  "sample client",
  "demo tenant",
] as const;

export const SEEDED_APEX_KILL_CANDIDATES = [
  "Punchh",
  "Mainframe Modernization",
  "AS-400",
] as const;

const CLERK_DEV_BROWSER_CORS_PATTERNS = [
  /https:\/\/[^/\s]+\.clerk\.accounts\.dev\/v1\/client\?/i,
  /blocked by CORS policy/i,
] as const;
const RESOURCE_FAILED_PATTERN = /Failed to load resource: net::ERR_FAILED/i;

export function compareCrawlToBaseline(
  run: CrawlRun,
  baseline?: CrawlBaseline | null,
): CrawlComparison {
  const findings = run.observations.flatMap((observation) =>
    comparePage(observation, baseline),
  );
  return {
    runId: run.runId,
    p0: findings.filter((finding) => finding.severity === "P0").length,
    p1: findings.filter((finding) => finding.severity === "P1").length,
    p2: findings.filter((finding) => finding.severity === "P2").length,
    findings,
  };
}

export function comparePage(
  observation: CrawlPageObservation,
  baseline?: CrawlBaseline | null,
): CrawlFinding[] {
  const findings: CrawlFinding[] = [];
  const add = (
    severity: CrawlSeverity,
    dimension: string,
    message: string,
    evidence?: Record<string, unknown>,
  ) => {
    findings.push({
      severity,
      tenantKey: observation.tenantKey,
      personaKey: observation.personaKey,
      surfaceId: observation.surfaceId,
      dimension,
      message,
      evidence,
    });
  };

  const base = findBaselinePage(observation, baseline);

  if (observation.surfaceId === "auth-bootstrap") {
    add(
      "P1",
      "auth-bootstrap",
      "A crawl persona could not establish an authenticated session; remaining personas should continue.",
      { message: observation.visibleText },
    );
    return findings;
  }

  if (!observation.visibleText.includes(observation.expectedTenantName)) {
    add(
      base ? "P0" : "P1",
      "tenant-identity",
      `Expected visible tenant identity "${observation.expectedTenantName}" was not present.`,
    );
  }

  const forbidden = FORBIDDEN_TENANT_REFERENCES.filter((term) =>
    new RegExp(`\\b${escapeRegex(term)}\\b`, "i").test(observation.visibleText),
  );
  if (forbidden.length > 0) {
    add(
      "P0",
      "tenant-leakage",
      `Forbidden tenant/demo reference(s) found: ${forbidden.join(", ")}.`,
      { forbidden },
    );
  }

  if (observation.surfaceId !== "admin-releases") {
    const tenantForbidden = (
      TENANT_SPECIFIC_FORBIDDEN_REFERENCES[observation.tenantKey] ?? []
    ).filter((term) =>
      new RegExp(`\\b${escapeRegex(term)}\\b`, "i").test(
        observation.visibleText,
      ),
    );
    if (tenantForbidden.length > 0) {
      add(
        "P0",
        "tenant-specific-leakage",
        `Forbidden ${observation.expectedTenantName} cross-tenant reference(s) found: ${tenantForbidden.join(", ")}.`,
        { forbidden: tenantForbidden },
      );
    }
  }

  const generic = GENERIC_TENANT_REFERENCES.filter((term) =>
    new RegExp(`\\b${escapeRegex(term)}\\b`, "i").test(observation.visibleText),
  );
  if (generic.length > 0) {
    add(
      "P1",
      "generic-tenant-copy",
      `Generic tenant/demo reference(s) found: ${generic.join(", ")}.`,
      { generic },
    );
  }

  const { actionable: actionableConsoleErrors, ignored: ignoredConsoleErrors } =
    splitConsoleErrors(observation.consoleErrors);
  if (actionableConsoleErrors.length > 0) {
    add("P0", "console-errors", "Console errors were emitted on the page.", {
      consoleErrors: actionableConsoleErrors.slice(0, 10),
    });
  }

  if (ignoredConsoleErrors.length > 0) {
    add(
      "P2",
      "third-party-console-noise",
      "Known Clerk dev-browser CORS noise was observed after the page rendered.",
      {
        consoleErrors: ignoredConsoleErrors.slice(0, 10),
      },
    );
  }

  if (observation.networkErrors.length > 0) {
    add("P0", "network-errors", "4xx/5xx network responses were observed.", {
      networkErrors: observation.networkErrors.slice(0, 10),
    });
  }

  if (base) {
    if (observation.evidenceChipCount < base.evidenceChipCount) {
      add(
        "P1",
        "evidence-chip-regression",
        "Evidence chip count dropped below last-known-good baseline.",
        {
          baseline: base.evidenceChipCount,
          actual: observation.evidenceChipCount,
        },
      );
    }
    if (observation.proofPointCount < base.proofPointCount) {
      add(
        "P1",
        "proof-point-regression",
        "Proof-point count dropped below last-known-good baseline.",
        {
          baseline: base.proofPointCount,
          actual: observation.proofPointCount,
        },
      );
    }
    if (observation.citationDensity + 0.0001 < base.citationDensity) {
      add(
        "P1",
        "citation-density-regression",
        "Citation density dropped below last-known-good baseline.",
        {
          baseline: base.citationDensity,
          actual: observation.citationDensity,
        },
      );
    }
  }

  if (
    !observation.visualCanon.backgroundOk ||
    !observation.visualCanon.headersOk ||
    !observation.visualCanon.bodyOk ||
    !observation.visualCanon.buttonsOk
  ) {
    add(
      "P2",
      "visual-canon",
      "Visual canon check failed for one or more style dimensions.",
      observation.visualCanon,
    );
  }

  if (/watchlist/i.test(observation.surfaceId)) {
    const topText = observation.watchlistTopEntries.join(" ");
    const missing = SEEDED_APEX_KILL_CANDIDATES.filter(
      (candidate) => !topText.toLowerCase().includes(candidate.toLowerCase()),
    );
    if (observation.tenantKey === "apexretail" && missing.length > 0) {
      add(
        "P1",
        "watchlist-kill-candidates",
        "Apex watchlist did not surface all seeded kill candidates in top entries.",
        { missing },
      );
    }
  }

  if (
    requiresHardQuestionCitationDepth(observation.surfaceId) &&
    hardQuestionGroundingEvidence(observation) < 2
  ) {
    add(
      "P1",
      "hard-question-citation-depth",
      "Hard-question answers did not provide at least two grounded evidence signals.",
      {
        groundingEvidence: hardQuestionGroundingEvidence(observation),
        exactFieldCitations: observation.hardQuestionExactFieldCitations ?? 0,
      },
    );
  }

  return findings;
}

function requiresHardQuestionCitationDepth(surfaceId: string): boolean {
  return /(?:^|[-_])(ask|agent|sentinel)(?:$|[-_])|source-event-detail/i.test(
    surfaceId,
  );
}

function hardQuestionGroundingEvidence(
  observation: CrawlPageObservation,
): number {
  return (
    observation.hardQuestionGroundingEvidence ??
    observation.hardQuestionExactFieldCitations ??
    0
  );
}

export function hasP0(comparison: CrawlComparison): boolean {
  return comparison.p0 > 0;
}

export function summarizeComparison(comparison: CrawlComparison): string {
  return `${comparison.p0} P0 · ${comparison.p1} P1 · ${comparison.p2} P2 findings`;
}

function findBaselinePage(
  observation: CrawlPageObservation,
  baseline?: CrawlBaseline | null,
): CrawlBaselinePage | null {
  if (!baseline) return null;
  return (
    baseline.pages.find(
      (page) =>
        page.tenantKey === observation.tenantKey &&
        page.personaKey === observation.personaKey &&
        page.surfaceId === observation.surfaceId,
    ) ?? null
  );
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function splitConsoleErrors(errors: string[]): {
  actionable: string[];
  ignored: string[];
} {
  const hasClerkDevCors = errors.some((message) =>
    isClerkDevCorsMessage(message),
  );
  const ignored: string[] = [];
  const actionable: string[] = [];
  for (const message of errors) {
    if (
      isClerkDevCorsMessage(message) ||
      (hasClerkDevCors && RESOURCE_FAILED_PATTERN.test(message))
    ) {
      ignored.push(message);
    } else {
      actionable.push(message);
    }
  }
  return { actionable, ignored };
}

function isClerkDevCorsMessage(message: string): boolean {
  return CLERK_DEV_BROWSER_CORS_PATTERNS.every((pattern) =>
    pattern.test(message),
  );
}
