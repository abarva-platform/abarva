import { auth, currentUser } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

import {
  CANDIDATE_PREVIEW_BANNER,
  evaluateCandidatePreviewEnablement,
  normalizeRequest,
  validateExplicitRequest,
} from "@/lib/enterprise-data/candidate-preview-enablement/candidate-preview-enablement";
import type { CandidatePreviewModule } from "@/lib/enterprise-data/candidate-preview-enablement/skyharbor-preview-package";
import { CANONICAL_CLIENT_ADMIN_EMAILS } from "@/lib/auth/canonical-auth-roster";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
} as const;

const ADMIN_EMAIL_ALLOWLIST: ReadonlySet<string> = new Set([
  "anand.sundaram@thesundaram.com",
  ...CANONICAL_CLIENT_ADMIN_EMAILS,
]);

interface CandidatePreviewBody {
  operatorId?: unknown;
  tenantKey?: unknown;
  candidateVersionId?: unknown;
  module?: unknown;
  previewReason?: unknown;
  acknowledgedNotActiveRuntimeTruth?: unknown;
}

export async function POST(request: NextRequest) {
  const allowed = await canReadCandidatePreview();
  if (!allowed) {
    return json(
      {
        ok: false,
        error: "forbidden",
        banner: CANDIDATE_PREVIEW_BANNER,
        message: "Candidate preview inspection is restricted to operators.",
      },
      403,
    );
  }

  let body: CandidatePreviewBody;
  try {
    body = (await request.json()) as CandidatePreviewBody;
  } catch {
    return json(
      {
        ok: false,
        error: "invalid_json_body",
        banner: CANDIDATE_PREVIEW_BANNER,
      },
      400,
    );
  }

  const previewModeFlag = request.headers.get(
    "x-abarva-candidate-preview-mode",
  );
  const normalized = normalizeRequest({
    operatorId: stringValue(body.operatorId),
    tenantKey: stringValue(body.tenantKey),
    candidateVersionId: stringValue(body.candidateVersionId),
    module: parseModule(body.module),
    previewReason: stringValue(body.previewReason),
    previewModeFlag:
      previewModeFlag === "enabled"
        ? "enabled"
        : previewModeFlag === "disabled"
          ? "disabled"
          : "",
    acknowledgedNotActiveRuntimeTruth:
      body.acknowledgedNotActiveRuntimeTruth === true,
    requestSource: "api",
  });
  const validationErrors = validateExplicitRequest(normalized);
  if (validationErrors.length > 0) {
    return json(
      {
        ok: false,
        error: "candidate_preview_request_rejected",
        banner: CANDIDATE_PREVIEW_BANNER,
        validationErrors,
        guardrails: {
          activeTenantAccessLayerUpdated: false,
          candidatePromoted: false,
          productionTenantDataWritten: false,
          moduleReadsCandidateByDefault: false,
        },
      },
      400,
    );
  }

  const report = evaluateCandidatePreviewEnablement({
    generatedAt: new Date().toISOString(),
    request: normalized,
  });

  return json({
    ok: report.qualityGateStatus === "pass",
    banner: report.banner,
    enablementState: report.enablementState,
    tenantKey: report.tenantKey,
    candidateVersionId: report.candidateVersionId,
    module: report.selectedModulePacket.module,
    selectedModulePacket: report.selectedModulePacket,
    guardrails: report.guardrails,
    truthSplit: report.truthSplit,
    auditTrail: report.auditTrail,
  });
}

async function canReadCandidatePreview(): Promise<boolean> {
  const session = await auth();
  if (!session.userId) return false;

  const user = await currentUser();
  const role = (user?.publicMetadata?.role as string | undefined) ?? "";
  const fallbackRole =
    (user?.unsafeMetadata?.role as string | undefined) ??
    (user?.publicMetadata?.legacyRole as string | undefined);
  const primaryEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();

  return (
    role === "admin" ||
    fallbackRole === "admin" ||
    (!!primaryEmail && ADMIN_EMAIL_ALLOWLIST.has(primaryEmail))
  );
}

function parseModule(value: unknown): CandidatePreviewModule | undefined {
  if (
    value === "home" ||
    value === "intelligence" ||
    value === "moves" ||
    value === "source" ||
    value === "tower"
  ) {
    return value;
  }
  return undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function json(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}
