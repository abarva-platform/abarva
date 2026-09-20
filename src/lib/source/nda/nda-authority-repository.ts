import { azureRead } from "@/lib/data-plane/azureRead";
import type { NdaWaiverRecord } from "./nda-scope-authority";

type TemplateVersionRow = {
  template_version: string;
};

type WaiverRow = {
  waiver_id: string;
  client_key: string;
  supplier_legal_entity_id: string;
  source_event_id: string;
  reason: string;
  expires_at: string | Date;
  approved_by_legal_name: string;
  approved_at: string | Date;
};

export type NdaAuthorityRead = {
  registryAvailable: boolean;
  publishedTemplateVersions: string[];
  waivers: NdaWaiverRecord[];
};

export type NdaAuthorityReadInput = {
  clientKey: string;
  eventId: string;
  supplierLegalEntityId: string;
};

const UNAVAILABLE: NdaAuthorityRead = {
  registryAvailable: false,
  publishedTemplateVersions: [],
  waivers: [],
};

function nonempty(value: string): boolean {
  return value.trim().length > 0;
}

function iso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

/**
 * Read the governed Stage 05 authority slice for one event and one declared
 * supplier legal entity. Any missing relation or malformed scope fails closed.
 */
export async function readNdaAuthorityForEvent(
  input: NdaAuthorityReadInput,
): Promise<NdaAuthorityRead> {
  if (
    !nonempty(input.clientKey) ||
    !nonempty(input.eventId) ||
    !nonempty(input.supplierLegalEntityId)
  ) {
    return UNAVAILABLE;
  }

  try {
    return await azureRead.withSession(async (run) => {
      await run("SELECT set_config('app.tenant_key', $1, false)", [
        input.clientKey,
      ]);
      const templateRows = await run<TemplateVersionRow>(
        `SELECT template_version
         FROM source_nda_template_versions
         WHERE client_key = $1
           AND publication_state = 'published'
         ORDER BY published_at DESC, template_version ASC`,
        [input.clientKey],
      );
      const waiverRows = await run<WaiverRow>(
        `SELECT waiver_id, client_key, supplier_legal_entity_id,
                source_event_id, reason, expires_at,
                approved_by_legal_name, approved_at
         FROM source_event_nda_waivers
         WHERE client_key = $1
           AND source_event_id = $2::uuid
           AND supplier_legal_entity_id = $3
           AND revoked_at IS NULL
         ORDER BY approved_at DESC, waiver_id ASC`,
        [input.clientKey, input.eventId, input.supplierLegalEntityId],
      );

      return {
        // A successful empty read is materially different from a relation that
        // does not exist or cannot be read. Legal has published nothing; the
        // registry is still modelled and available.
        registryAvailable: true,
        publishedTemplateVersions: templateRows.map(
          (row) => row.template_version,
        ),
        waivers: waiverRows.map((row) => ({
          waiverId: row.waiver_id,
          tenantKey: row.client_key,
          supplierLegalEntityId: row.supplier_legal_entity_id,
          eventId: row.source_event_id,
          reason: row.reason,
          expiresAt: iso(row.expires_at),
          approvedByLegalName: row.approved_by_legal_name,
          approvedAt: iso(row.approved_at),
        })),
      };
    });
  } catch {
    return UNAVAILABLE;
  }
}
