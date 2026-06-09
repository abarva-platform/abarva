// POST /api/v1/programs/:programId/current-state/ingest
// Multipart: file (CSV) + family + provenance? → parse + commit to the canonical
// tower_* table + evidence_ledger, scoped to the active tenant. Returns the honest
// ladder counts (parsedRows vs committedRows). CSV-only auto-commit (charter).

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../../_auth";
import {
  ingestCurrentStateCsv,
  type DatasetProvenance,
  type IngestFamily,
} from "@/lib/programs/current-state-ingest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INGEST_FAMILIES: IngestFamily[] = ["eng_performance_dora"];
const PROVENANCES: DatasetProvenance[] = [
  "client_export",
  "representative_synthetic",
];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    await params; // programId reserved for per-move attachment linkage (S4)
    const ctx = await requireTenancy();

    const form = await req.formData();
    const file = form.get("file");
    const familyRaw = String(form.get("family") ?? "");
    const provenanceRaw = String(
      form.get("provenance") ?? "representative_synthetic",
    );

    if (!(file instanceof File)) {
      return Response.json({ error: "file_required" }, { status: 400 });
    }
    if (!INGEST_FAMILIES.includes(familyRaw as IngestFamily)) {
      return Response.json(
        {
          error: "unsupported_family",
          detail: `family must be one of: ${INGEST_FAMILIES.join(", ")}`,
        },
        { status: 400 },
      );
    }
    const provenance: DatasetProvenance = PROVENANCES.includes(
      provenanceRaw as DatasetProvenance,
    )
      ? (provenanceRaw as DatasetProvenance)
      : "representative_synthetic";

    const text = await file.text();
    const result = await ingestCurrentStateCsv(
      ctx,
      familyRaw as IngestFamily,
      text,
      file.name,
      provenance,
      new Date().toISOString(),
    );

    // Honest ladder: surface parsed vs committed separately; committed>0 means
    // rows are in the tower table and the readiness resolver will read them.
    const status = result.committedRows > 0 ? 200 : 422;
    return Response.json(result, { status });
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}
