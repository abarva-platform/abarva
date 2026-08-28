import { composeAvaAnswer } from "@/lib/ava-answer/composeAvaAnswer";
import type { AvaAnswerPacket, AvaSurface } from "@/lib/ava-answer/contract";
import { tenantAliasesFor } from "@/lib/tenant/aliases";

const KNOWN_TENANT_QUERY_TERMS = [
  {
    aliases: tenantAliasesFor("apexretail"),
    terms: ["apex retail", "apexretail"],
  },
  {
    aliases: tenantAliasesFor("arcturus"),
    terms: ["first capital", "arcturus", "firstcapital"],
  },
  {
    aliases: tenantAliasesFor("skyharbor"),
    terms: ["skyharbor", "skyharbor air"],
  },
  {
    aliases: tenantAliasesFor("meridian"),
    terms: ["meridian", "meridian health"],
  },
  { aliases: tenantAliasesFor("lakeshore"), terms: ["lakeshore"] },
] as const;

export function shouldFenceForeignTenantQuery(input: {
  query: string;
  activeTenantAliases: readonly (string | null | undefined)[];
}): boolean {
  const normalized = input.query.toLowerCase();
  const current = new Set(
    input.activeTenantAliases
      .flatMap((value) => tenantAliasesFor(value))
      .map((value) => value.toLowerCase()),
  );
  for (const tenant of KNOWN_TENANT_QUERY_TERMS) {
    if (!tenant.terms.some((term) => normalized.includes(term))) continue;
    if (tenant.aliases.some((alias) => current.has(alias.toLowerCase()))) {
      continue;
    }
    return true;
  }
  return false;
}

export function buildTenantFenceAnswer(input: {
  surface: AvaSurface;
  mode: "KNOW" | "ANALYZE" | "SOURCE";
  activeTenantDisplayName: string;
}): AvaAnswerPacket {
  const surfaceLabel =
    input.surface === "home"
      ? "Home"
      : input.surface === "source"
        ? "Source"
        : "Intelligence";
  return composeAvaAnswer({
    surface: input.surface,
    mode: input.mode,
    tenantKey: "signed-in-tenant",
    question: "cross-tenant request",
    intent: "tenant_fence",
    status: "blocked",
    directAnswer: `I can't share or use another tenant's data from ${surfaceLabel}. Your signed-in session is fenced to ${input.activeTenantDisplayName}; ask from this tenant's active context only.`,
    citations: [],
    gaps: [
      {
        id: "tenant-fence",
        label: "Tenant fence",
        detail: "Cross-tenant data is fenced by the signed-in session tenant.",
      },
    ],
    caveats: [
      {
        id: "blocked-before-retrieval",
        label: "Blocked before retrieval",
        detail: "Cross-tenant request blocked before retrieval.",
      },
    ],
    retrievalSummary: {
      substrate: "none",
      hasTenantFacts: false,
    },
  });
}
