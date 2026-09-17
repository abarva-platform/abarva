import type { AskSurfaceContext } from "@/lib/intelligence/ask/types";
import { checkTenantAccessByKey } from "@/lib/auth/tenant-access";
import {
  getContract360,
  getContractOptimizationOpportunitySet,
  listContract360,
} from "@/lib/source/data-model/read-adapter";
import type { SourceContract360Row } from "@/lib/source/data-model/types";
import { tenantAliasesFor } from "@/lib/tenant/aliases";
import { resolveSourceWorkspaceContractId } from "./source-workspace-visual-answer";

function readHintId(context: AskSurfaceContext): string | null {
  const direct = context.contractId?.trim();
  if (direct) return direct;
  const source = context.sourceV4;
  if (!source || typeof source !== "object" || Array.isArray(source)) return null;
  const selected = (source as Record<string, unknown>).selectedContract;
  if (!selected || typeof selected !== "object" || Array.isArray(selected)) return null;
  const id = (selected as Record<string, unknown>).contractId;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}

function contractForAnswer(contract: SourceContract360Row) {
  return {
    contractId: contract.contract_id,
    vendorName: contract.vendor_name,
    contractName: contract.contract_name,
    annualValueUsd: contract.annual_value_conflict_flag
      ? contract.resolved_annual_value
      : contract.annual_value,
    actualAnnualSpendUsd: contract.actual_annual_spend,
    totalCommittedValueUsd: contract.total_committed_value_conflict_flag
      ? contract.resolved_total_committed_value
      : contract.total_committed_value,
    endDate: contract.end_date,
    noticeDate: contract.renewal_notice_date ?? contract.notice_deadline ?? null,
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
  const access = await checkTenantAccessByKey(input.tenantKey).catch(() => null);
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
      ? directory.find((row) => row.contract_id.toUpperCase() === hintedId.toUpperCase())
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
        selectedContract: contractForAnswer(contract),
        optimizationOpportunities: {
          opportunities: (opportunitySet?.opportunities ?? []).filter(
            (opportunity) => opportunity.contractId === contractId,
          ).map((opportunity) => ({
            id: opportunity.opportunityId,
            contractId,
            label: opportunity.label,
            valueType: opportunity.valueType,
            amountUsd:
              opportunity.amountState === "not_sized"
                ? null
                : opportunity.amountUsd,
            stageRaw: opportunity.stage,
            confidence: opportunity.confidence,
            grade: opportunity.evidenceGrade,
            blockingGap: opportunity.blockingGap,
            nextAction: opportunity.nextAction,
            owner: opportunity.owner,
            buyerAsk: opportunity.negotiationDetail?.buyerAsk,
            negotiationLanguage: opportunity.negotiationDetail?.negotiationLanguage,
            vendorConcession: opportunity.negotiationDetail?.vendorConcession,
            timingDependency: opportunity.negotiationDetail?.timingDependency,
            priority: opportunity.negotiationDetail?.priority,
            riskIfIgnored: opportunity.negotiationDetail?.riskIfIgnored,
            sourceRefs: opportunity.evidenceRefs.map((ref) => ref.tableName),
          })),
        },
      },
    };
  } catch {
    return null;
  }
}
