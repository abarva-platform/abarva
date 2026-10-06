import type { AskSurfaceContext } from "@/lib/intelligence/ask/types";
import { checkTenantAccessByKey } from "@/lib/auth/tenant-access";
import {
  getContract360,
  getContractOptimizationOpportunitySet,
  listContract360,
} from "@/lib/source/data-model/read-adapter";
import type { SourceContract360Row } from "@/lib/source/data-model/types";
import { classifyOpportunityTrace } from "@/lib/source/data-model/contract-optimization-traceability";
import { opportunityForAvaTrace } from "@/lib/source/facts/view/ava-contract-grounding-context";
import { tenantAliasesFor } from "@/lib/tenant/aliases";
import { buildSourceContract360PromptBlock } from "./portfolio-fallback-answer";
import { resolveSourceWorkspaceContractId } from "./source-workspace-visual-answer";

function readHintId(context: AskSurfaceContext): string | null {
  const direct = context.contractId?.trim();
  if (direct) return direct;
  const source = context.sourceV4;
  if (!source || typeof source !== "object" || Array.isArray(source))
    return null;
  const selected = (source as Record<string, unknown>).selectedContract;
  if (!selected || typeof selected !== "object" || Array.isArray(selected))
    return null;
  const id = (selected as Record<string, unknown>).contractId;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}

function calendarDate(value: unknown): string | null {
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) return null;
    const year = String(value.getFullYear()).padStart(4, "0");
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  if (typeof value !== "string") return null;
  const date = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date
    ? date
    : null;
}

function contractForAnswer(contract: SourceContract360Row) {
  const committedAnnualSpendUsd = contract.committed_annual_spend;
  const actualAnnualSpendUsd = contract.actual_annual_spend;
  return {
    contractId: contract.contract_id,
    vendorName: contract.vendor_name,
    contractName: contract.contract_name,
    annualValueUsd: contract.annual_value,
    annualValueConflict: contract.annual_value_conflict_flag === true,
    annualValueProvenance: contract.annual_value_conflict_flag
      ? "contract_360_stated_conflict"
      : "contract_360",
    committedAnnualSpendUsd,
    actualAnnualSpendUsd,
    contractedToActualVarianceUsd:
      committedAnnualSpendUsd != null && actualAnnualSpendUsd != null
        ? Math.max(0, committedAnnualSpendUsd - actualAnnualSpendUsd)
        : null,
    totalCommittedValueUsd: contract.total_committed_value_conflict_flag
      ? contract.resolved_total_committed_value
      : contract.total_committed_value,
    endDate: calendarDate(contract.end_date),
    noticeDate: calendarDate(
      contract.renewal_notice_date ?? contract.notice_deadline,
    ),
    noticePeriodDays: contract.notice_period_days,
    autoRenew: contract.auto_renew,
    renewalOwnerRef: contract.renewal_owner_ref,
    scopeSummary: contract.scope_summary,
    scopeRowCount: contract.scoped_application_count,
  };
}

export async function buildServerSourceAnswerContext(input: {
  query: string;
  requestContext: AskSurfaceContext;
  tenantKey: string;
  tenantDisplayName: string;
}): Promise<AskSurfaceContext | null> {
  const access = await checkTenantAccessByKey(input.tenantKey).catch(
    () => null,
  );
  if (!access?.ok) return null;

  const aliases = new Set(
    tenantAliasesFor(input.tenantKey).map((alias) => alias.toLowerCase()),
  );
  try {
    const directory = (await listContract360(input.tenantKey)).filter((row) =>
      aliases.has(row.tenant_key.toLowerCase()),
    );
    const hintedId = readHintId(input.requestContext);
    const selected = hintedId
      ? directory.find(
          (row) => row.contract_id.toUpperCase() === hintedId.toUpperCase(),
        )
      : null;
    const selectionContext: AskSurfaceContext = {
      module: "Source",
      clientKey: input.tenantKey,
      sourceV4: {
        selectedContract: selected ? contractForAnswer(selected) : null,
        contractDirectory: directory.map(contractForAnswer),
      },
    };
    const contractId = resolveSourceWorkspaceContractId({
      query: input.query,
      surfaceContext: selectionContext,
    });
    if (!contractId) return null;

    const contract = await getContract360(input.tenantKey, contractId);
    if (
      !contract ||
      contract.contract_id.toUpperCase() !== contractId.toUpperCase() ||
      !aliases.has(contract.tenant_key.toLowerCase())
    ) {
      return null;
    }

    const opportunitySet = await getContractOptimizationOpportunitySet(
      input.tenantKey,
      contractId,
      contract,
    );
    if (
      opportunitySet &&
      (opportunitySet.contractId.toUpperCase() !== contractId.toUpperCase() ||
        (opportunitySet.tenantKey &&
          !aliases.has(opportunitySet.tenantKey.toLowerCase())))
    ) {
      return null;
    }

    return {
      module: "Source",
      activeClient: input.tenantDisplayName,
      clientKey: input.tenantKey,
      activeTab: input.requestContext.activeTab,
      sourceV4: {
        selectedContract: {
          ...contractForAnswer(contract),
          ...(opportunitySet?.baseline?.status === "conflict"
            ? {
                annualValueConflict: true,
                annualValueProvenance: "contract_360_stated_conflict",
              }
            : {}),
        },
        optimizationOpportunities: {
          opportunities: (opportunitySet?.opportunities ?? [])
            .filter((opportunity) => opportunity.contractId === contractId)
            .map((opportunity) => {
              const trace = classifyOpportunityTrace(
                opportunityForAvaTrace(opportunity, opportunitySet?.claims),
              );
              const calculated =
                trace.state === "traced" &&
                opportunity.amountState !== "not_sized";
              return {
                id: opportunity.opportunityId,
                contractId,
                label: opportunity.label,
                valueType: opportunity.valueType,
                amountUsd: calculated ? opportunity.amountUsd : null,
                statedAmountUsd:
                  !calculated &&
                  opportunity.amountState !== "not_sized" &&
                  trace.state !== "not_sized"
                    ? opportunity.amountUsd
                    : null,
                amountTraceState:
                  opportunity.amountState === "not_sized"
                    ? "not_sized"
                    : trace.state,
                amountTraceLabel: trace.label,
                stageRaw: opportunity.stage,
                confidence: opportunity.confidence,
                grade: opportunity.evidenceGrade,
                blockingGap: opportunity.blockingGap,
                nextAction: opportunity.nextAction,
                owner: opportunity.owner,
                buyerAsk: opportunity.negotiationDetail?.buyerAsk,
                negotiationLanguage:
                  opportunity.negotiationDetail?.negotiationLanguage,
                vendorConcession:
                  opportunity.negotiationDetail?.vendorConcession,
                timingDependency:
                  opportunity.negotiationDetail?.timingDependency,
                priority: opportunity.negotiationDetail?.priority,
                riskIfIgnored: opportunity.negotiationDetail?.riskIfIgnored,
                sourceRefs: opportunity.evidenceRefs.map(
                  (ref) => ref.tableName,
                ),
              };
            }),
        },
      },
    };
  } catch {
    return null;
  }
}

export async function buildAuthorizedSourceContract360PromptBlock(input: {
  query: string;
  requestContext: AskSurfaceContext;
  tenantKey: string;
  tenantDisplayName: string;
}): Promise<string> {
  const context = await buildServerSourceAnswerContext(input);
  if (!context) return "";
  return buildSourceContract360PromptBlock(
    context as unknown as Record<string, unknown>,
    input.tenantDisplayName,
  );
}
