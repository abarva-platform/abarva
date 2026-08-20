import { redirect } from "next/navigation";
import { requireProductModule } from "@/lib/auth/server-module-access";
import { requireTenancy } from "@/app/api/v1/programs/_auth";
import { getActiveClientRow } from "@/lib/active-client";
import { StrategicMoveOriginateClient } from "@/components/strategic-moves/StrategicMoveOriginateClient";
import {
  composeOriginateFirstMessage,
  type FromInitiativeCtx,
  type FromIntelligenceCtx,
} from "@/components/strategic-moves/composeOriginateFirstMessage";
import { AppShell } from "@/components/shell/AppShell";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { canonicalClientDisplayName } from "@/lib/client-config";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Originate Strategic Move · AbarVa",
};

// Business Segment is a GROUNDED FACT per tenant (the tenant's own business
// units), not a universal enum — so it's data, not a shared constant that
// belongs in a component or feature-flag definition. Meridian's values below
// are the same segment names already governed in
// datasets/tenant-inputs/active/meridian-health/current/01b_business_segments.csv,
// duplicated here only until Moves reads tenant segment data from that
// source directly instead of a hardcoded map.
const BUSINESS_SEGMENT_OPTIONS_BY_TENANT: Record<string, string[]> = {
  "meridian-health": [
    "Health Plan Operations",
    "Hospital & Acute Delivery",
    "Ambulatory & Physician Network",
    "Shared Enterprise Services",
  ],
  meridian: [
    "Health Plan Operations",
    "Hospital & Acute Delivery",
    "Ambulatory & Physician Network",
    "Shared Enterprise Services",
  ],
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parseFromInitiative(
  params: Record<string, string | string[] | undefined>,
): FromInitiativeCtx | null {
  const raw = (key: string) => {
    const v = params[key];
    return typeof v === "string" ? v : undefined;
  };
  if (raw("fromInitiative") !== "1") return null;
  const displayId = raw("fromId");
  if (!displayId) return null;
  const gapRaw = raw("fromGapUsd");
  return {
    displayId,
    name: raw("fromName") ?? displayId,
    statusFlag: raw("fromStatus") ?? "",
    gapUsd: gapRaw ? Number(gapRaw) : null,
    ownerName: raw("fromOwner") ?? "",
    goalName: raw("fromGoal") ?? "",
  };
}

function parseFromIntelligence(
  params: Record<string, string | string[] | undefined>,
): FromIntelligenceCtx | null {
  const raw = (key: string) => {
    const v = params[key];
    return typeof v === "string" ? v : undefined;
  };
  if (raw("fromIntelligence") !== "1") return null;
  const patternId = raw("patternId");
  const patternName = raw("patternName");
  if (!patternId || !patternName) return null;
  const failureRateRaw = raw("failureRatePct");
  return {
    patternId,
    patternName,
    useCaseName: raw("useCaseName") ?? patternName,
    sessionId:
      raw("intelligenceSessionId") ??
      raw("sessionId") ??
      raw("originatingSessionId") ??
      null,
    sourceTitle: raw("sourceTitle") ?? null,
    contradictionTitle: raw("contradictionTitle") ?? null,
    failureRatePct: failureRateRaw ? Number(failureRateRaw) : null,
  };
}

export default async function StrategicMoveOriginatePage({
  searchParams,
}: PageProps) {
  await requireProductModule("programs");
  const params = await searchParams;
  const requestedClient =
    typeof params.client === "string" ? params.client : undefined;
  const activeClient = await getActiveClientRow(requestedClient);
  if (!activeClient) {
    redirect("/sign-in");
  }

  const fromInitiative = parseFromInitiative(params);
  const fromIntelligence = parseFromIntelligence(params);
  const activeTenantName =
    canonicalClientDisplayName({
      key: activeClient.key,
      name: activeClient.name,
    }) ?? activeClient.name;

  // Compose first-message variant server-side:
  //   2A — empty entry (no draft, no initiative context)
  //   2B — partial draft return
  //   2D — from "Shape into a Move →" CTA on an AI Initiative page
  //   Intelligence — from a pattern/use-case/contradiction evidence edge
  let firstMessage = null;
  // Discovery Intake: gate the capture panel by `discovery_intake_v2` for this
  // tenant (computed server-side; default off). Re-homed from /programs/new,
  // which the routing cutover supersedes.
  let discoveryIntakeEnabled = false;
  let extendedIntakeFieldsEnabled = false;
  try {
    const ctx = await requireTenancy();
    firstMessage = await composeOriginateFirstMessage(
      ctx,
      fromInitiative,
      fromIntelligence,
    );
    discoveryIntakeEnabled = isFeatureEnabled(ctx, "discovery_intake_v2");
    extendedIntakeFieldsEnabled = isFeatureEnabled(
      ctx,
      "moves_extended_intake_fields_v1",
    );
  } catch {
    // Tenancy or draft read failure — fall through; client uses its default 2A message.
  }
  const businessSegmentOptions =
    BUSINESS_SEGMENT_OPTIONS_BY_TENANT[activeClient.key] ?? [];

  return (
    <AppShell surface="programs">
      <StrategicMoveOriginateClient
        tenantName={activeTenantName}
        initialTurns={firstMessage ? [firstMessage] : undefined}
        originatingIntelligenceSessionId={fromIntelligence?.sessionId ?? null}
        discoveryIntakeEnabled={discoveryIntakeEnabled}
        extendedIntakeFieldsEnabled={extendedIntakeFieldsEnabled}
        businessSegmentOptions={businessSegmentOptions}
      />
    </AppShell>
  );
}
