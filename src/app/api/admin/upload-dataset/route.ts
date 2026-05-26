import { NextRequest, NextResponse } from "next/server";
import {
  looksLikeTenantMetricUpload,
  parseTenantMetricCsv,
} from "@/lib/intelligence/tenant-metric-upload";
import { persistTenantMetricUpload } from "@/lib/intelligence/tenant-metric-persistence";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import {
  evaluateSensitiveUpload,
  sensitiveUploadRejectedResponse,
} from "@/lib/security/sensitive-upload-guard";

export async function POST(request: NextRequest) {
  let ctx;
  try {
    ctx = await requireTenancy();
  } catch (err) {
    return tenancyErrorResponse(err) as NextResponse;
  }

  let file: File | null = null;
  let clientId = "";
  let documentName = "";
  let formData: FormData;

  try {
    formData = await request.formData();
    file = formData.get("file") as File | null;
    clientId = (formData.get("clientId") as string) || "";
    documentName = (formData.get("documentName") as string) || "";
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  if (!file)
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  if (!clientId)
    return NextResponse.json({ error: "Missing clientId" }, { status: 400 });
  if (!documentName)
    return NextResponse.json(
      { error: "Missing documentName" },
      { status: 400 },
    );

  if (clientId !== ctx.clientId) {
    return NextResponse.json({ error: "forbidden_cross_tenant" }, { status: 403 });
  }

  const today = new Date().toISOString().split("T")[0];
  const storageUrl: string | null = null;
  let metricIngestion: ReturnType<typeof parseTenantMetricCsv> | null = null;
  let metricPersistence: Awaited<
    ReturnType<typeof persistTenantMetricUpload>
  > | null = null;
  const bytes = await file.arrayBuffer();
  const dataProtection = evaluateSensitiveUpload({
    filename: file.name,
    mimeType: file.type,
    bytes,
    declaredClassification: formData.get("dataClassification"),
  });
  if (dataProtection.decision === "quarantine") {
    return sensitiveUploadRejectedResponse(dataProtection) as NextResponse;
  }

  if (looksLikeTenantMetricUpload(file.name, documentName)) {
    const text = new TextDecoder().decode(bytes);
    try {
      metricIngestion = parseTenantMetricCsv(text, clientId);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Invalid metric upload",
        },
        { status: 400 },
      );
    }
  }

  // Dataset parsing and metric persistence now run against the Postgres data
  // plane. Object-storage archival is handled by the upload artifact pipeline,
  // so this legacy admin endpoint no longer opens a direct storage client.

  if (metricIngestion) {
    try {
      metricPersistence = await persistTenantMetricUpload({
        clientId,
        documentName,
        fileName: file.name,
        storageUrl,
        parsed: metricIngestion,
        uploadedBy: "Anand Sundaram · Admin",
      });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? `Metric upload parsed but persistence failed: ${error.message}`
              : "Metric upload parsed but persistence failed",
        },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    success: true,
    documentName,
    fileName: file.name,
    clientId,
    confidence: 85,
    uploader: "Anand Sundaram · Admin",
    date: today,
    storageUrl,
    dataProtection,
    metricIngestion: metricIngestion
      ? {
          tenantKey: metricIngestion.tenantKey,
          acceptedCount: metricIngestion.accepted.length,
          rejectedCount: metricIngestion.rejected.length,
          acceptedMetricIds: metricIngestion.accepted.map(
            (observation) => observation.metricId,
          ),
          rejections: metricIngestion.rejected,
          persistence: metricPersistence,
        }
      : null,
  });
}
