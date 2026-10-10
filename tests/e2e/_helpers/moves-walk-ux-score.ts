/** Pure scoring of observations captured from a signed-in step page. */

export const UX_WEIGHTS = {
  template: 20,
  nextAction: 10,
  responsiveness: 15,
  accessibility: 20,
  themes: 10,
  honesty: 15,
  performance: 10,
} as const;

export type UxDimension = keyof typeof UX_WEIGHTS;
export type UxVariant =
  | "desktopLight"
  | "phoneLight"
  | "desktopDark"
  | "phoneDark";

export interface WalkDomSnapshot {
  stepHead: boolean;
  nextAction: boolean;
  contextLine: boolean;
  workGroupOrEmptyState: boolean;
  footer: boolean;
  currentStepMatches: boolean;
  nextActionText: string;
  countLabel: string | null;
  workRowCount: number;
  viewportWidth: number;
  documentScrollWidth: number;
  documentClientWidth: number;
  wideElements: string[];
  clippedTextElements: string[];
  figures: Array<{ value: string; nearbyText: string }>;
  tenantName: string | null;
  themeScheme: string | null;
  unreviewedReadError: string | null;
}

export interface WalkVariantObservation {
  snapshot: WalkDomSnapshot | null;
  reason?: string;
  seriousCriticalAxeIds?: string[] | null;
  allAxeIds?: string[] | null;
  contrastAxeIds?: string[] | null;
}

export interface WalkUxInput {
  variants: Record<UxVariant, WalkVariantObservation>;
  expectedTenantName: string;
  settledHeadMs: number | null;
  unavailableReason?: string;
}

export interface UxDimensionScore {
  earned: number | null;
  possible: number;
  reason?: string;
}

export interface WalkUxScore {
  score: number | null;
  measuredPoints: number;
  possiblePoints: number;
  dimensions: Record<UxDimension, UxDimensionScore>;
  violations: string[];
}

export function countActionClauses(sentence: string): number {
  const trimmed = sentence.trim();
  if (!trimmed) return 0;
  return (
    1 +
    (trimmed.match(/,/g) ?? []).length +
    (trimmed.match(/\band\b/gi) ?? []).length
  );
}

export function hasFigureProvenance(nearbyText: string): boolean {
  return /\b(?:FACT|ESTIMATE)\b|\[(?:A:[A-Za-z0-9_-]+|E:\d+|S:\d+)\]/.test(
    nearbyText,
  );
}

export function unlabelledFigures(
  figures: WalkDomSnapshot["figures"],
): string[] {
  return figures
    .filter((figure) => !hasFigureProvenance(figure.nearbyText))
    .map((figure) => figure.value);
}

export function overflowIssues(snapshot: WalkDomSnapshot): string[] {
  const issues: string[] = [];
  if (snapshot.documentScrollWidth > snapshot.documentClientWidth + 1) {
    issues.push(
      `page scroll ${snapshot.documentScrollWidth}/${snapshot.documentClientWidth}`,
    );
  }
  issues.push(...snapshot.wideElements.map((item) => `wide: ${item}`));
  issues.push(
    ...snapshot.clippedTextElements.map((item) => `clipped: ${item}`),
  );
  return issues;
}

function measured(earned: number, possible: number): UxDimensionScore {
  return { earned: Math.max(0, Math.min(possible, earned)), possible };
}

function unmeasured(possible: number, reason: string): UxDimensionScore {
  return { earned: null, possible, reason };
}

function oneSentence(value: string): boolean {
  const text = value.trim();
  if (!text) return false;
  return (text.match(/[.!?](?=\s|$)/g) ?? []).length <= 1;
}

export function scoreWalkUx(input: WalkUxInput): WalkUxScore {
  const unavailableReason = input.unavailableReason;
  if (unavailableReason) {
    const dimensions = Object.fromEntries(
      Object.entries(UX_WEIGHTS).map(([name, points]) => [
        name,
        unmeasured(points, unavailableReason),
      ]),
    ) as Record<UxDimension, UxDimensionScore>;
    return {
      score: null,
      measuredPoints: 0,
      possiblePoints: 100,
      dimensions,
      violations: [],
    };
  }
  const violations: string[] = [];
  const desktop = input.variants.desktopLight.snapshot;
  const phone = input.variants.phoneLight.snapshot;
  const darkPhone = input.variants.phoneDark.snapshot;
  const dimensions = {} as Record<UxDimension, UxDimensionScore>;

  if (!desktop) {
    const reason =
      input.variants.desktopLight.reason ?? "desktop light DOM unavailable";
    dimensions.template = unmeasured(20, reason);
    dimensions.nextAction = unmeasured(10, reason);
    dimensions.honesty = unmeasured(15, reason);
  } else {
    const templateChecks = [
      desktop.stepHead && desktop.currentStepMatches,
      desktop.nextAction,
      desktop.contextLine,
      desktop.workGroupOrEmptyState,
      desktop.footer,
    ];
    dimensions.template = measured(
      templateChecks.filter(Boolean).length * 4,
      20,
    );
    templateChecks.forEach((met, index) => {
      if (!met)
        violations.push(
          `template: ${["step head/current step", "next action", "context", "work group/empty state", "footer"][index]}`,
        );
    });

    const clearAction =
      oneSentence(desktop.nextActionText) &&
      countActionClauses(desktop.nextActionText) <= 3 &&
      Boolean(desktop.countLabel?.trim()) &&
      !(
        desktop.workRowCount > 0 &&
        /record this step['’]s decisions/i.test(desktop.nextActionText)
      );
    dimensions.nextAction = measured(clearAction ? 10 : 0, 10);
    if (!clearAction)
      violations.push(
        "next action: sentence, clause, count, or generic-copy rule failed",
      );

    const unlabelled = unlabelledFigures(desktop.figures);
    const tenantCorrect = desktop.tenantName === input.expectedTenantName;
    const honest =
      !desktop.unreviewedReadError && unlabelled.length === 0 && tenantCorrect;
    dimensions.honesty = measured(honest ? 15 : 0, 15);
    if (desktop.unreviewedReadError)
      violations.push(
        `honesty: unreviewed read error ${desktop.unreviewedReadError}`,
      );
    for (const figure of unlabelled)
      violations.push(`honesty: figure without nearby source ${figure}`);
    if (!tenantCorrect)
      violations.push(
        "honesty: tenant identity does not match authenticated Move",
      );
  }

  if (!phone || !darkPhone) {
    dimensions.responsiveness = unmeasured(
      15,
      !phone
        ? (input.variants.phoneLight.reason ?? "phone light DOM unavailable")
        : (input.variants.phoneDark.reason ?? "phone dark DOM unavailable"),
    );
  } else {
    const issues = [
      ...overflowIssues(phone).map((item) => `light ${item}`),
      ...overflowIssues(darkPhone).map((item) => `dark ${item}`),
    ];
    dimensions.responsiveness = measured(issues.length === 0 ? 15 : 0, 15);
    violations.push(...issues.map((item) => `responsive: ${item}`));
  }

  const lightAxe = [input.variants.desktopLight, input.variants.phoneLight];
  const allAxeIds = new Set(lightAxe.flatMap((item) => item.allAxeIds ?? []));
  for (const id of allAxeIds) {
    if (!lightAxe.some((item) => item.seriousCriticalAxeIds?.includes(id))) {
      violations.push(`axe: ${id}`);
    }
  }
  if (
    lightAxe.some(
      (item) => !item.snapshot || item.seriousCriticalAxeIds == null,
    )
  ) {
    dimensions.accessibility = unmeasured(
      20,
      "light-mode axe result unavailable at one or both widths",
    );
  } else {
    const ids = new Set(
      lightAxe.flatMap((item) => item.seriousCriticalAxeIds ?? []),
    );
    dimensions.accessibility = measured(20 - ids.size * 5, 20);
    violations.push(...Array.from(ids, (id) => `accessibility: ${id}`));
  }

  const darkAxe = [input.variants.desktopDark, input.variants.phoneDark];
  if (darkAxe.some((item) => !item.snapshot || item.contrastAxeIds == null)) {
    dimensions.themes = unmeasured(
      10,
      "dark-mode contrast result unavailable at one or both widths",
    );
  } else {
    const ids = new Set(darkAxe.flatMap((item) => item.contrastAxeIds ?? []));
    const actualDark = darkAxe.every((item) =>
      item.snapshot?.themeScheme?.includes("dark"),
    );
    dimensions.themes = measured(actualDark ? 10 - ids.size * 3 : 0, 10);
    if (!actualDark)
      violations.push("dark theme: computed color scheme stayed light");
    violations.push(...Array.from(ids, (id) => `dark contrast: ${id}`));
  }

  if (input.settledHeadMs === null) {
    dimensions.performance = unmeasured(
      10,
      "settled step-head time unavailable",
    );
  } else {
    dimensions.performance = measured(
      input.settledHeadMs < 2_500 ? 10 : input.settledHeadMs < 4_000 ? 5 : 0,
      10,
    );
    if (input.settledHeadMs >= 2_500) {
      violations.push(`performance: settled head ${input.settledHeadMs}ms`);
    }
  }

  const measuredDimensions = Object.values(dimensions).filter(
    (item): item is UxDimensionScore & { earned: number } =>
      item.earned !== null,
  );
  const measuredPoints = measuredDimensions.reduce(
    (sum, item) => sum + item.possible,
    0,
  );
  const earnedPoints = measuredDimensions.reduce(
    (sum, item) => sum + item.earned,
    0,
  );
  return {
    score: measuredPoints
      ? Math.floor((earnedPoints * 100) / measuredPoints)
      : null,
    measuredPoints,
    possiblePoints: 100,
    dimensions,
    violations,
  };
}

export function floorAverage(scores: Array<number | null>): number | null {
  const measuredScores = scores.filter(
    (score): score is number => score !== null,
  );
  return measuredScores.length
    ? Math.floor(
        measuredScores.reduce((sum, score) => sum + score, 0) /
          measuredScores.length,
      )
    : null;
}
