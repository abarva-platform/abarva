import type {
  ChapterView,
  HomeReviewBundle,
  TechObjectType,
  VisualOpportunity,
} from "./types";

type BundleSlice = Pick<HomeReviewBundle, "chapters" | "technologyEstate">;

export interface VendorEvidenceSummary {
  totalSpend: number;
  supplierAliases: Map<string, string>;
  topSuppliers: Array<{ name: string; spend: number; sharePct: number }>;
  hasContractEvidence: boolean;
}

export interface StaleHomeClaimContext {
  recordCountsByObjectType: Map<TechObjectType, number>;
  vendorEvidence: VendorEvidenceSummary | null;
}

export function buildStaleHomeClaimContext(
  bundle: BundleSlice,
): StaleHomeClaimContext {
  return {
    recordCountsByObjectType: new Map(
      (bundle.technologyEstate?.recordTypes ?? []).map((recordType) => [
        recordType.objectType,
        recordType.rows.length,
      ]),
    ),
    vendorEvidence: summarizeVendorEvidence(bundle),
  };
}

export function sanitizeHomeReviewBundleNarrative(
  bundle: HomeReviewBundle,
): HomeReviewBundle {
  const context = buildStaleHomeClaimContext(bundle);
  return {
    ...bundle,
    chapters: bundle.chapters.map((chapter) =>
      sanitizeChapter(chapter, context),
    ),
  };
}

export function isStaleHomeClaim(
  statement: string,
  context: StaleHomeClaimContext,
): boolean {
  const vendorContracts =
    context.recordCountsByObjectType.get("vendor_contract");
  if (
    vendorContracts !== undefined &&
    containsConflictingVendorContractTotal(statement, vendorContracts)
  ) {
    return true;
  }

  const dataAssets = context.recordCountsByObjectType.get(
    "data_asset_or_integration",
  );
  if (
    dataAssets !== undefined &&
    containsConflictingDataAssetTotal(statement, dataAssets)
  ) {
    return true;
  }

  if (
    context.vendorEvidence?.hasContractEvidence &&
    /\b(no|none of the|absent|unavailable)\b/i.test(statement) &&
    /\b(vendor contracts?|contracts?|pricing|SLA|terms?|performance evidence|contract-level evidence|document-level evidence)\b/i.test(
      statement,
    )
  ) {
    return true;
  }

  if (
    context.vendorEvidence &&
    /\b(over|more than|at least)\s+(?:a\s+)?quarter\b/i.test(statement) &&
    /\b(vendor|supplier|contract)\s+spend\b/i.test(statement)
  ) {
    return vendorPairConcentrationConflicts(statement, context.vendorEvidence);
  }

  return false;
}

export function sanitizeHomeNarrativeText(
  text: string,
  context: StaleHomeClaimContext,
): string {
  if (!text) return text;
  const sentences = text
    .match(/[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean) ?? [text];
  return sentences
    .filter((sentence) => !isStaleHomeClaim(sentence, context))
    .join(" ")
    .trim();
}

export function currentVendorConcentrationMessage(
  context: StaleHomeClaimContext,
): string {
  const top = context.vendorEvidence?.topSuppliers[0];
  if (!top) {
    return "Supplier concentration is calculated from the current contract register.";
  }
  return `${top.name} is the largest supplier group at ${top.sharePct.toFixed(1)}% of the current contract value.`;
}

function sanitizeChapter(
  chapter: ChapterView,
  context: StaleHomeClaimContext,
): ChapterView {
  return {
    ...chapter,
    headline:
      sanitizeHomeNarrativeText(chapter.headline, context) || chapter.headline,
    executive_synthesis: sanitizeHomeNarrativeText(
      chapter.executive_synthesis,
      context,
    ),
    key_insights: chapter.key_insights.filter(
      (claim) => !isStaleHomeClaim(claim.statement, context),
    ),
    tensions: chapter.tensions.filter(
      (claim) => !isStaleHomeClaim(claim.statement, context),
    ),
    what_to_watch: chapter.what_to_watch.filter(
      (claim) => !isStaleHomeClaim(claim.statement, context),
    ),
    questions_to_ask: chapter.questions_to_ask
      .map((question) => sanitizeHomeNarrativeText(question, context))
      .filter(Boolean),
    visual_opportunities: chapter.visual_opportunities.map((visual) =>
      sanitizeVisual(visual, context),
    ),
    limitations: chapter.limitations
      .map((limitation) => sanitizeHomeNarrativeText(limitation, context))
      .filter(Boolean),
  };
}

function sanitizeVisual(
  visual: VisualOpportunity,
  context: StaleHomeClaimContext,
): VisualOpportunity {
  if (visual.dataset_ref !== "vendor_spend_concentration") {
    return {
      ...visual,
      title: sanitizeHomeNarrativeText(visual.title, context) || visual.title,
      key_message:
        sanitizeHomeNarrativeText(visual.key_message, context) ||
        visual.key_message,
    };
  }

  const replacement = currentVendorConcentrationMessage(context);
  return {
    ...visual,
    title: isStaleHomeClaim(visual.title, context)
      ? "Supplier concentration in current contract value"
      : sanitizeHomeNarrativeText(visual.title, context) || visual.title,
    key_message: isStaleHomeClaim(visual.key_message, context)
      ? replacement
      : sanitizeHomeNarrativeText(visual.key_message, context) ||
        visual.key_message,
  };
}

function containsConflictingVendorContractTotal(
  statement: string,
  expected: number,
): boolean {
  return [
    ...statement.matchAll(/\b(\d+)\s+vendor contracts?\b/gi),
    ...statement.matchAll(/\b(\d+)\s+declared\s+contracts?\b/gi),
  ].some((match) => Number(match[1]) !== expected);
}

function containsConflictingDataAssetTotal(
  statement: string,
  expected: number,
): boolean {
  return [
    ...statement.matchAll(
      /\b\d+\s+of\s+(\d+)\s+(?:tracked\s+)?data assets(?:\s*(?:and|\/)\s*integrations)?\b/gi,
    ),
    ...statement.matchAll(
      /\b(\d+)\s+(?:tracked\s+)?data assets(?:\s*(?:and|\/)\s*integrations)?\b/gi,
    ),
    ...statement.matchAll(
      /\bdata assets(?:\s*(?:and|\/)\s*integrations)?\s*\(\d+\s+of\s+(\d+)\)/gi,
    ),
  ].some((match) => Number(match[1]) !== expected);
}

function vendorPairConcentrationConflicts(
  statement: string,
  vendorEvidence: VendorEvidenceSummary,
): boolean {
  if (
    vendorEvidence.totalSpend <= 0 ||
    vendorEvidence.topSuppliers.length < 2
  ) {
    return false;
  }
  const normalizedStatement = normalizeSupplierAlias(statement);
  const mentionedSupplierKeys = new Set<string>();
  for (const [alias, supplierKey] of vendorEvidence.supplierAliases) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}\\b`, "i").test(normalizedStatement)) {
      mentionedSupplierKeys.add(supplierKey);
    }
  }
  if (mentionedSupplierKeys.size < 2) return false;

  const topTwoKeys = new Set(
    vendorEvidence.topSuppliers
      .slice(0, 2)
      .map((supplier) => normalizeSupplierAlias(supplier.name)),
  );
  const mentionsOnlyTopTwo =
    mentionedSupplierKeys.size === topTwoKeys.size &&
    Array.from(mentionedSupplierKeys).every((key) => topTwoKeys.has(key));
  const topTwoShare = vendorEvidence.topSuppliers
    .slice(0, 2)
    .reduce((sum, supplier) => sum + supplier.sharePct, 0);

  return !mentionsOnlyTopTwo || topTwoShare < 25;
}

function summarizeVendorEvidence(
  bundle: BundleSlice,
): VendorEvidenceSummary | null {
  const recordType = bundle.technologyEstate?.recordTypes.find(
    (rt) => rt.objectType === "vendor_contract",
  );
  if (!recordType) return null;

  const spendBySupplier = new Map<string, number>();
  const displayNameBySupplier = new Map<string, string>();
  const supplierAliases = new Map<string, string>();
  let hasContractEvidence = false;

  for (const row of recordType.rows) {
    const supplierName = normalizedCellText(row.vendorName);
    if (supplierName) {
      const key = normalizeSupplierAlias(supplierName);
      displayNameBySupplier.set(key, supplierName);
      spendBySupplier.set(
        key,
        (spendBySupplier.get(key) ?? 0) + numberCellValue(row.annualSpendUsd),
      );
      for (const alias of supplierNameAliases(supplierName)) {
        supplierAliases.set(alias, key);
      }
    }
    if (
      [
        "pricingHistory",
        "utilizationEvidence",
        "contractTermsDetail",
        "renegotiationLevers",
        "benchmarkClause",
      ].some((key) => Boolean(normalizedCellText(row[key])))
    ) {
      hasContractEvidence = true;
    }
  }

  const totalSpend = Array.from(spendBySupplier.values()).reduce(
    (sum, value) => sum + value,
    0,
  );
  const topSuppliers = Array.from(spendBySupplier.entries())
    .map(([key, spend]) => ({
      name: displayNameBySupplier.get(key) ?? key,
      spend,
      sharePct: totalSpend > 0 ? (spend / totalSpend) * 100 : 0,
    }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5);

  return {
    totalSpend,
    supplierAliases,
    topSuppliers,
    hasContractEvidence,
  };
}

function normalizedCellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function numberCellValue(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeSupplierAlias(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b(corporation|corp\.?|inc\.?|llc|ltd\.?|company|co\.?)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function supplierNameAliases(name: string): string[] {
  const normalized = normalizeSupplierAlias(name);
  const aliases = new Set<string>();
  if (normalized) aliases.add(normalized);
  const firstToken = normalized.split(/\s+/)[0];
  if (firstToken && firstToken.length >= 3) aliases.add(firstToken);
  return Array.from(aliases);
}
