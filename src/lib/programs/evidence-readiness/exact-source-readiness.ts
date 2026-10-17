import "server-only";
import { z } from "zod";
import {
  POLICY_VERSION,
  evaluateGovernedObject,
} from "@/lib/governance/context-corpus-policy";
import type { DatasetManifest } from "@/lib/governance/dataset-manifest";
import {
  verifyExactIndexedDocuments,
  type ExactSourcePlan,
  type NativeSourceRow,
  type PreparedSource,
} from "./exact-source-preparation";
const sha = z.string().regex(/^[a-f0-9]{64}$/);
export const SourceRenderReceiptSchema = z
  .object({
    objectId: z.string().uuid(),
    sourceRevision: sha,
    indexDocumentId: z.string(),
    proofUrl: z.string().url(),
    renderedQuote: z.string().min(1),
    renderedLocator: z.string().min(1),
    downloadPath: z.string(),
    downloadSha256: sha,
    downloadStatus: z.literal(200),
    observedAt: z.string().datetime(),
    rendered: z.literal(true),
    screenshotSha256: sha,
  })
  .strict();
export type SourceRenderReceipt = z.infer<typeof SourceRenderReceiptSchema>;
type CitationSource = Pick<
  PreparedSource,
  | "eligible"
  | "admissionSource"
  | "quote"
  | "locator"
  | "citationDocumentId"
  | "downloadPath"
> & { expected: { sourceSha256: string } };
export type SourceCitationPlan = Pick<
  ExactSourcePlan,
  "documents" | "sourceSetHash"
> & {
  cohort: Pick<ExactSourcePlan["cohort"], "moveId">;
  sources: CitationSource[];
};

/** A native row is built only after exact index readback and independently captured browser proof. */
export function buildExactSourceReadinessRows(args: {
  plan: SourceCitationPlan;
  manifest: DatasetManifest;
  receipts: unknown;
  indexed: NativeSourceRow[];
  indexedAt: string;
  now: string;
  runId: string;
  proofUri: string;
  proofSha256: string;
}) {
  const { plan } = args,
    sources = plan.sources.filter((s) => s.eligible);
  const receipts = z
    .array(SourceRenderReceiptSchema)
    .min(1)
    .max(32)
    .parse(args.receipts);
  const now = Date.parse(args.now),
    indexedAt = Date.parse(args.indexedAt);
  if (
    !Number.isFinite(now) ||
    !Number.isFinite(indexedAt) ||
    indexedAt > now ||
    !sha.safeParse(args.proofSha256).success ||
    !/^https:\/\/[a-z0-9]+\.blob\.core\.windows\.net\/[^?]+$/.test(
      args.proofUri,
    ) ||
    receipts.length !== sources.length ||
    new Set(receipts.map((r) => r.objectId)).size !== sources.length
  )
    throw new Error("source_render_proof_unbound");
  verifyExactIndexedDocuments(plan.documents, args.indexed);
  return sources.map((source) => {
    const s = source.admissionSource,
      receipt = receipts.find((r) => r.objectId === s.objectId);
    const proofRoute =
      s.objectTable === "program_evidence_items"
        ? `source-citation-proof?evidenceId=${s.objectId}`
        : s.objectTable === "program_modules"
          ? `source-capture-proof?moduleId=${s.objectId}`
          : null;
    if (!proofRoute) throw new Error("source_render_kind_unreleased");
    const expectedUrl = `https://app.abarva.ai/api/v1/programs/${plan.cohort.moveId}/${proofRoute}&revision=${s.binding.source_revision_sha256}`;
    if (
      !receipt ||
      receipt.sourceRevision !== s.binding.source_revision_sha256 ||
      receipt.indexDocumentId !== source.citationDocumentId ||
      receipt.proofUrl !== expectedUrl ||
      receipt.renderedQuote !== source.quote ||
      receipt.renderedLocator !== source.locator ||
      receipt.downloadPath !== source.downloadPath ||
      receipt.downloadSha256 !== source.expected.sourceSha256 ||
      Date.parse(receipt.observedAt) < indexedAt ||
      Date.parse(receipt.observedAt) > now ||
      !s.changedAt ||
      indexedAt < Date.parse(s.changedAt)
    )
      throw new Error("source_render_proof_changed_or_stale");
    const row = {
      object_table: s.objectTable,
      object_id: s.objectId,
      client_key: s.clientKey,
      tenant_id: s.tenantId,
      source_layer: s.sourceLayer,
      agent_readiness_status: "agent_ready",
      retrievability: "search_indexed",
      classification: "internal",
      source_basis: args.manifest.source_basis,
      confidence_level: "unverified",
      confidence_rationale:
        "Reviewed synthetic scenario; not independently client- or Finance-attested.",
      applicable_agents: ["nexus"],
      cited_render_verified_at: receipt.observedAt,
      policy_version: POLICY_VERSION,
      policy_validation_status: "pass",
      policy_validated_at: args.now,
      provenance: {
        source_file: s.sourceFile,
        ingestion_run_id: args.runId,
        parse_method: "reviewed_extraction",
        committed_at: args.now,
        indexed_at: args.indexedAt,
        index_name: "tenant-context-v1",
        move_source_binding: s.binding,
        source_set_hash: plan.sourceSetHash,
        render_proof: { uri: args.proofUri, sha256: args.proofSha256, receipt },
        synthetic: true,
        client_attested: false,
      },
      owner: "AbarVa Moves product team",
      backfill_reason:
        "Exact reviewed source index and signed-in citation proof verified",
    };
    const verdict = evaluateGovernedObject({
      ...row,
      id: s.objectId,
      object_type: s.objectTable,
      industry: null,
      enterprise_area: null,
      function: null,
      process_area: null,
      use_case_category: null,
      compliance_basis: null,
      last_reviewed_at: receipt.observedAt,
      measurement_method: null,
      contract_hash: plan.sourceSetHash,
      created_at: args.now,
      updated_at: args.now,
      source_references: s.citations,
    });
    if (verdict.decision !== "pass" || !verdict.agentReady)
      throw new Error(
        `source_readiness_policy_failed:${verdict.errors.join(";")}`,
      );
    return row;
  });
}
