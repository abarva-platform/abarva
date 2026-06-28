import type {
  SolutionContext,
  SolutionEvidenceMetric,
  SolutionEvidenceTaxonomyItem,
  SolutionMissingInputAction,
} from "@/lib/programs/solution-context";

export interface P2EvidenceSpecificity {
  metricsThatMatter: SolutionEvidenceMetric[];
  evidenceTaxonomy: SolutionEvidenceTaxonomyItem[];
  clientActionableMissingInputs: SolutionMissingInputAction[];
}

const CATEGORY_ALIASES: Array<{
  category: string;
  patterns: readonly RegExp[];
}> = [
  { category: "Missing PO", patterns: [/missing\s+po/i, /po\s+mismatch/i] },
  { category: "Price mismatch", patterns: [/price\s+mismatch/i] },
  { category: "Quantity mismatch", patterns: [/quantity\s+mismatch/i] },
  { category: "Goods receipt missing", patterns: [/goods\s+receipt\s+missing/i, /missing\s+receipt/i] },
  { category: "Duplicate invoice candidate", patterns: [/duplicate\s+invoice/i] },
  { category: "Vendor master mismatch", patterns: [/vendor\s+master\s+(?:mismatch|issue)/i] },
  { category: "Tax discrepancy", patterns: [/tax\s+discrepancy/i, /tax\s*\/\s*freight/i] },
  { category: "Approval aging", patterns: [/approval\s+aging/i, /approval\s+delay/i] },
  { category: "Contract reference missing", patterns: [/contract\s+reference\s+missing/i] },
  { category: "Payment hold / control review", patterns: [/payment\s+hold/i, /control\s+review/i] },
];

function normaliseNumber(value: string): string {
  const trimmed = value.trim();
  const numeric = Number(trimmed.replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return trimmed;
  if (trimmed.includes(".")) return String(numeric);
  return Math.round(numeric).toLocaleString("en-US");
}

function pushUniqueMetric(
  metrics: SolutionEvidenceMetric[],
  metric: SolutionEvidenceMetric,
): void {
  const key = `${metric.label.toLowerCase()}::${metric.value.toLowerCase()}`;
  if (metrics.some((m) => `${m.label.toLowerCase()}::${m.value.toLowerCase()}` === key)) return;
  metrics.push(metric);
}

function firstMatch(text: string, patterns: readonly RegExp[]): RegExpMatchArray | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match;
  }
  return null;
}

function extractMetricSignals(text: string, ctx: SolutionContext): SolutionEvidenceMetric[] {
  const metrics: SolutionEvidenceMetric[] = [];
  for (const [label, value] of Object.entries(ctx.baselineMetrics ?? {})) {
    if (value?.trim()) {
      pushUniqueMetric(metrics, {
        label,
        value: value.trim(),
        source: "structured baseline metrics",
      });
    }
  }

  const source = "uploaded evidence / broker current-state bundle";
  const monthlyExceptions = firstMatch(text, [
    /average\s+monthly\s+invoice\s+exceptions[^0-9]{0,80}([0-9][0-9,]*)/i,
    /([0-9][0-9,]*)\s+(?:average\s+)?monthly\s+(?:invoice\s+)?exceptions/i,
  ]);
  if (monthlyExceptions?.[1]) {
    pushUniqueMetric(metrics, {
      label: "Monthly invoice exceptions",
      value: normaliseNumber(monthlyExceptions[1]),
      source,
    });
  }

  const manualHours = firstMatch(text, [
    /manual\s+touch\s+hours\s+(?:per\s+month|monthly)?[^0-9]{0,80}([0-9][0-9,]*)/i,
    /([0-9][0-9,]*)\s+(?:monthly\s+)?manual\s+touch\s+hours/i,
  ]);
  if (manualHours?.[1]) {
    pushUniqueMetric(metrics, {
      label: "Manual touch hours per month",
      value: normaliseNumber(manualHours[1]),
      source,
    });
  }

  const resolutionDays = firstMatch(text, [
    /average\s+resolution\s+days[^0-9]{0,80}([0-9]+(?:\.[0-9]+)?)/i,
    /([0-9]+(?:\.[0-9]+)?)\s+average\s+resolution\s+days/i,
    /([0-9]+(?:\.[0-9]+)?)\s+(?:avg\.?\s+)?(?:resolution|cycle[-\s]?time)\s+days/i,
  ]);
  if (resolutionDays?.[1]) {
    pushUniqueMetric(metrics, {
      label: "Average resolution days",
      value: normaliseNumber(resolutionDays[1]),
      source,
    });
  }

  const blendedRate = firstMatch(text, [
    /(?:blended|analyst|hourly).{0,80}\$([0-9]+(?:\.[0-9]+)?)\s*\/?\s*hour/i,
    /\$([0-9]+(?:\.[0-9]+)?)\s*\/\s*hour/i,
  ]);
  if (blendedRate?.[1]) {
    pushUniqueMetric(metrics, {
      label: "Planning labor rate",
      value: `$${blendedRate[1]}/hour`,
      source,
      caveat: "planning rate only unless client-approved rate card is loaded",
    });
  }

  if (/finance(?:\/client)?\s+(?:rate[-\s]?card\s+)?validation\s+required/i.test(text)) {
    pushUniqueMetric(metrics, {
      label: "Finance validation status",
      value: "Required before funding approval",
      source,
      caveat: "ROM planning evidence, not final funding evidence",
    });
  }

  return metrics;
}

function extractCsvCellNear(text: string, category: string, columnOffset: number): string | undefined {
  const line = text
    .split(/\r?\n/)
    .find((row) => row.toLowerCase().includes(category.toLowerCase()));
  if (!line) return undefined;
  const cells = line
    .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
    .map((cell) => cell.trim().replace(/^"|"$/g, "").trim());
  const categoryIndex = cells.findIndex((cell) => cell.toLowerCase() === category.toLowerCase());
  if (categoryIndex < 0) return undefined;
  return cells[categoryIndex + columnOffset]?.trim() || undefined;
}

function extractTaxonomySignals(text: string): SolutionEvidenceTaxonomyItem[] {
  return CATEGORY_ALIASES.flatMap(({ category, patterns }) => {
    if (!patterns.some((pattern) => pattern.test(text))) return [];
    return [
      {
        category,
        volume: extractCsvCellNear(text, category, 1),
        rate: extractCsvCellNear(text, category, 2),
        averageResolutionDays: extractCsvCellNear(text, category, 3),
        manualTouchHours: extractCsvCellNear(text, category, 4),
        riskLevel: extractCsvCellNear(text, category, 5),
        owner: extractCsvCellNear(text, category, 6),
      },
    ];
  });
}

function missingInput(
  needed: string,
  whyItMatters: string,
  owner: string,
  howItWillBeUsed: string,
  gateImpact: string,
): SolutionMissingInputAction {
  return { needed, whyItMatters, owner, howItWillBeUsed, gateImpact };
}

function inferMissingInputs(text: string, ctx: SolutionContext): SolutionMissingInputAction[] {
  const explicit = ctx.clientActionableMissingInputs ?? [];
  const lower = `${text}\n${(ctx.evidenceNeeds ?? []).join("\n")}`.toLowerCase();
  const inferred: SolutionMissingInputAction[] = [];

  if (/systems?\s+landscape|it_systems_landscape|enterprise architecture/.test(lower)) {
    inferred.push(
      missingInput(
        "AP/procurement systems landscape",
        "Confirms systems of record, workflow tools, integrations, and where the future architecture must connect.",
        "Enterprise Architecture / AP Systems Owner",
        "P3 target architecture and integration/security design",
        "Blocks final P3 architecture; P2 can remain draft",
      ),
    );
  }
  if (/erp.*timestamp|case[-\s]?level|approval[-\s]?history|aging|cycle[-\s]?time/.test(lower)) {
    inferred.push(
      missingInput(
        "Case-level ERP/AP exception export with timestamps",
        "Proves cycle-time, queue aging, handoff delay, and SLA breach by process step.",
        "AP Analytics / ERP Reporting",
        "P2 final diagnosis, P4 value model, and automation sequencing",
        "Blocks final P2 and P4 value case",
      ),
    );
  }
  if (/control\s+checklist|duplicate[-\s]?payment|payment\s+hold|sox|audit/.test(lower)) {
    inferred.push(
      missingInput(
        "Payment control checklist and duplicate-payment history",
        "Separates efficiency work from high-risk payment release and control clearance decisions.",
        "Finance Control / Internal Audit",
        "Control model, human approval boundary, and risk case",
        "Blocks funding-grade business case",
      ),
    );
  }
  if (/raci|sponsor|stakeholder|owner/.test(lower)) {
    inferred.push(
      missingInput(
        "Named RACI and stakeholder attestation",
        "Confirms who can approve policy, workflow, vendor-master, and payment-release changes.",
        "CFO delegate / AP Director / Procurement lead",
        "Gate approval, owner/action matrix, and workshop decision rights",
        "Blocks finalization; improves P3 execution confidence",
      ),
    );
  }

  const merged = [...explicit, ...inferred];
  const seen = new Set<string>();
  return merged.filter((item) => {
    const key = item.needed.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function inferP2EvidenceSpecificity(ctx: SolutionContext): P2EvidenceSpecificity {
  const text = [
    ctx.currentState,
    Object.entries(ctx.baselineMetrics ?? {})
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n"),
    ctx.evidenceMap?.map((e) => `${e.claim}\n${e.source}`).join("\n"),
    ctx.evidenceNeeds?.join("\n"),
  ]
    .filter(Boolean)
    .join("\n");

  const metricsThatMatter = [
    ...(ctx.metricsThatMatter ?? []),
    ...extractMetricSignals(text, ctx),
  ];
  const evidenceTaxonomy = [
    ...(ctx.evidenceTaxonomy ?? []),
    ...extractTaxonomySignals(text),
  ];

  return {
    metricsThatMatter,
    evidenceTaxonomy: evidenceTaxonomy.filter(
      (item, index, all) =>
        all.findIndex((candidate) => candidate.category.toLowerCase() === item.category.toLowerCase()) === index,
    ),
    clientActionableMissingInputs: inferMissingInputs(text, ctx),
  };
}

export function exactEvidenceTermsForGoldenBar(ctx: SolutionContext): string[] {
  return (ctx.metricsThatMatter ?? [])
    .map((metric) => metric.value)
    .filter((value) => /[0-9]/.test(value));
}

export function taxonomyTermsForGoldenBar(ctx: SolutionContext): string[] {
  return (ctx.evidenceTaxonomy ?? []).map((item) => item.category);
}
