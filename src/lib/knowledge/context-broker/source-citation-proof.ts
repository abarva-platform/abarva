import "server-only";
import { readExactSourceIndexDocuments } from "@/lib/azure-search/tenant-context-retriever";
import { verifyExactIndexedDocuments, type PreparedSource } from "@/lib/programs/evidence-readiness/exact-source-preparation";

/** Returns proof metadata only; never creates an agent context or calls a model. */
export async function proveReviewedSourceCitation(source:PreparedSource,read=readExactSourceIndexDocuments) {
  if (!source.eligible) throw new Error("source_future_phase");
  const document=source.documents.find(doc=>doc.id===source.citationDocumentId);
  if (!document || document.body!==source.quote) throw new Error("source_quote_unbound");
  const actual=await read({ids:source.documents.map(doc=>doc.id),scope:{clientKey:source.admissionSource.clientKey,clientId:source.admissionSource.tenantId,recordId:String(document.record_id)}});
  verifyExactIndexedDocuments(source.documents,actual);
  return { mode:"non-model" as const,sourceRevision:source.admissionSource.binding.source_revision_sha256,indexedIds:actual.map(row=>String(row.id)),quote:source.quote,locator:source.locator,downloadPath:source.downloadPath };
}
