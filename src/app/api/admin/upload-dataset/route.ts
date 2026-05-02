import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  looksLikeTenantMetricUpload,
  parseTenantMetricCsv,
} from "@/lib/intelligence/tenant-metric-upload";
import { persistTenantMetricUpload } from "@/lib/intelligence/tenant-metric-persistence";

export async function POST(request: NextRequest) {
  let file: File | null = null;
  let clientId = "";
  let documentName = "";

  try {
    const formData = await request.formData();
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

  const today = new Date().toISOString().split("T")[0];
  let storageUrl: string | null = null;
  let metricIngestion: ReturnType<typeof parseTenantMetricCsv> | null = null;
  let metricPersistence: Awaited<
    ReturnType<typeof persistTenantMetricUpload>
  > | null = null;
  const bytes = await file.arrayBuffer();

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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const BUCKET = "datasets";

      // Create bucket if it doesn't exist
      await supabase.storage
        .createBucket(BUCKET, { public: false })
        .catch(() => {});

      const path = `${clientId}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(path, bytes, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (!error && data) {
        const { data: urlData } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(path);
        storageUrl = urlData.publicUrl;
      }
    } catch {
      // Storage unavailable — proceed without URL
    }
  }

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
