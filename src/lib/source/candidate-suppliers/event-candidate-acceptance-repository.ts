import { createTxSession } from "@/lib/data-plane/read-adapters/azureSession";
import { resolveArchetypeForEvent } from "@/lib/source/archetypes/event-archetype-resolver";
import {
  SOURCE_CATEGORY_IDS,
  type SourceCategoryId,
} from "@/lib/source/taxonomy/category-taxonomy";

type SourceEventMappingRow = {
  id: string;
  event_type: string | null;
  classified_category: string | null;
};

type CurrentEventVersionRow = {
  id: string;
  request_accepted: boolean;
};

type SupplierRegistryRow = {
  vendor_id: string;
  legal_name: string;
  supplier_category: string | null;
  source_record_id: string | null;
  evidence_reference: string | null;
  raw_payload: unknown;
};

type ExistingAuthorityRow = {
  authority_id: string;
};

type InsertedAuthorityRow = {
  authority_id: string;
};

export type AcceptEventCandidateSupplierInput = {
  clientKey: string;
  eventId: string;
  supplierId: string;
  expectedCategoryId: string;
  expectedArchetypeId: string;
  expectedEventVersionId: string;
  expectedSourceReference: string;
  acceptedByUserId: string;
  acceptedByName: string;
  rationale: string;
};

export type AcceptEventCandidateSupplierResult =
  | {
      ok: true;
      authorityId: string;
    }
  | {
      ok: false;
      code:
        | "identity_required"
        | "reviewer_required"
        | "rationale_required"
        | "event_mapping_required"
        | "stale_event_mapping"
        | "stale_event_version"
        | "event_version_not_accepted"
        | "supplier_not_eligible"
        | "stale_supplier_reference"
        | "already_accepted"
        | "write_failed";
      detail: string;
    };

const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

function objectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function textList(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.flatMap((item) => (text(item) ? [text(item)!] : [])))]
    : [];
}

function registryPayload(row: SupplierRegistryRow): Record<string, unknown> {
  const raw = objectRecord(row.raw_payload);
  return objectRecord(
    raw.candidate_supplier_registry ?? raw.candidateSupplierRegistry,
  );
}

function sourceReference(row: SupplierRegistryRow): string {
  return text(row.evidence_reference) ?? text(row.source_record_id) ?? "";
}

function authorityState(registry: Record<string, unknown>): string {
  return text(registry.authorityState ?? registry.authority_state) ?? "draft";
}

function registryEligibility(row: SupplierRegistryRow): {
  categoryKeys: string[];
  archetypeKeys: string[];
} {
  const registry = registryPayload(row);
  const categoryKeys = textList(
    registry.categoryKeys ?? registry.category_keys,
  );
  const supplierCategory = text(row.supplier_category);
  if (supplierCategory && !categoryKeys.includes(supplierCategory)) {
    categoryKeys.push(supplierCategory);
  }
  return {
    categoryKeys,
    archetypeKeys: textList(registry.archetypeKeys ?? registry.archetype_keys),
  };
}

function missingRequired(input: AcceptEventCandidateSupplierInput): boolean {
  return ![
    input.clientKey,
    input.eventId,
    input.supplierId,
    input.expectedCategoryId,
    input.expectedArchetypeId,
    input.expectedEventVersionId,
    input.expectedSourceReference,
  ].every((value) => value.trim());
}

function asSourceCategoryId(value: string | null): SourceCategoryId | null {
  return value && (SOURCE_CATEGORY_IDS as readonly string[]).includes(value)
    ? (value as SourceCategoryId)
    : null;
}

function reviewerMissing(input: AcceptEventCandidateSupplierInput): boolean {
  const name = input.acceptedByName.trim().toLowerCase();
  return (
    !input.acceptedByUserId.trim() ||
    !input.acceptedByName.trim() ||
    name === "user" ||
    name === "unknown" ||
    name === "unknown user"
  );
}

function isUniqueViolation(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505",
  );
}

export async function acceptEventCandidateSupplier(
  input: AcceptEventCandidateSupplierInput,
): Promise<AcceptEventCandidateSupplierResult> {
  if (missingRequired(input)) {
    return {
      ok: false,
      code: "identity_required",
      detail:
        "Tenant, event, supplier, mapping, and source reference are required.",
    };
  }
  if (reviewerMissing(input)) {
    return {
      ok: false,
      code: "reviewer_required",
      detail: "A named signed-in reviewer is required.",
    };
  }
  if (input.rationale.trim().length < 12) {
    return {
      ok: false,
      code: "rationale_required",
      detail: "Acceptance rationale must be at least 12 characters.",
    };
  }

  try {
    return await createTxSession("source-event-candidate-supplier-acceptance")(
      async (run) => {
        await run("SELECT set_config('app.tenant_key', $1, false)", [
          input.clientKey,
        ]);

        const eventRows = await run<SourceEventMappingRow>(
          `SELECT id, event_type, classified_category
           FROM source_events
          WHERE client_key = $1
            AND id = $2::uuid
          LIMIT 1`,
          [input.clientKey, input.eventId],
        );
        const event = eventRows[0];
        if (!event?.classified_category) {
          return {
            ok: false,
            code: "event_mapping_required",
            detail:
              "The event must have an accepted category and archetype mapping.",
          };
        }

        const categoryId = asSourceCategoryId(event.classified_category);
        if (!categoryId) {
          return {
            ok: false,
            code: "event_mapping_required",
            detail: "The event category is not a governed Source category.",
          };
        }

        const resolved = resolveArchetypeForEvent({
          categoryId,
          eventType: event.event_type ?? undefined,
        });
        if (!resolved.archetypeId) {
          return {
            ok: false,
            code: "event_mapping_required",
            detail:
              "The event category does not resolve to a governed archetype.",
          };
        }
        if (
          categoryId !== input.expectedCategoryId.trim() ||
          resolved.archetypeId !== input.expectedArchetypeId.trim()
        ) {
          return {
            ok: false,
            code: "stale_event_mapping",
            detail:
              "The posted category or archetype no longer matches the event.",
          };
        }

        const versionRows = await run<CurrentEventVersionRow>(
          `SELECT version.id,
                  EXISTS (
                    SELECT 1
                      FROM source_event_authority_version_approvals approval
                     WHERE approval.version_id = version.id
                       AND approval.client_key = version.client_key
                       AND approval.event_id = version.event_id
                       AND approval.authority_kind = version.authority_kind
                       AND approval.role = 'request_acceptor'
                       AND approval.decision = 'approved'
                  )
                  AND NOT EXISTS (
                    SELECT 1
                      FROM source_event_authority_version_approvals approval
                     WHERE approval.version_id = version.id
                       AND approval.client_key = version.client_key
                       AND approval.event_id = version.event_id
                       AND approval.authority_kind = version.authority_kind
                       AND approval.role = 'request_acceptor'
                       AND approval.decision = 'changes_requested'
                  ) AS request_accepted
             FROM source_event_authority_versions version
            WHERE version.client_key = $1
              AND version.event_id = $2::uuid
              AND version.authority_kind = 'request'
              AND version.superseded_at IS NULL
          LIMIT 1`,
          [input.clientKey, input.eventId],
        );
        if (versionRows[0]?.id !== input.expectedEventVersionId.trim()) {
          return {
            ok: false,
            code: "stale_event_version",
            detail:
              "The posted Request version is no longer the current event authority.",
          };
        }
        if (!versionRows[0].request_accepted) {
          return {
            ok: false,
            code: "event_version_not_accepted",
            detail:
              "The current Request version must be accepted before a supplier can join the candidate panel.",
          };
        }

        const existing = await run<ExistingAuthorityRow>(
          `SELECT authority_id
           FROM source_event_candidate_supplier_authority
          WHERE client_key = $1
            AND source_event_id = $2::uuid
            AND vendor_id = $3
            AND authority_state <> 'retired'
          LIMIT 1`,
          [input.clientKey, input.eventId, input.supplierId],
        );
        if (existing[0]) {
          return {
            ok: false,
            code: "already_accepted",
            detail:
              "This supplier already has active candidate authority for the event.",
          };
        }

        const supplierRows = await run<SupplierRegistryRow>(
          `SELECT vendor_id,
                legal_name,
                supplier_category,
                source_record_id,
                evidence_reference,
                raw_payload
           FROM source.vendor
          WHERE tenant_key = $1
            AND vendor_id = $2
          LIMIT 1`,
          [input.clientKey, input.supplierId],
        );
        const supplier = supplierRows[0];
        const registry = supplier ? registryPayload(supplier) : {};
        const eligibility = supplier ? registryEligibility(supplier) : null;
        if (
          !supplier ||
          authorityState(registry) !== "accepted" ||
          !eligibility?.categoryKeys.includes(
            input.expectedCategoryId.trim(),
          ) ||
          !eligibility.archetypeKeys.includes(input.expectedArchetypeId.trim())
        ) {
          return {
            ok: false,
            code: "supplier_not_eligible",
            detail:
              "The supplier is not a currently eligible registry suggestion for this event.",
          };
        }
        if (
          sourceReference(supplier) !== input.expectedSourceReference.trim()
        ) {
          return {
            ok: false,
            code: "stale_supplier_reference",
            detail:
              "The posted supplier source reference no longer matches the registry.",
          };
        }

        const authorityId = `stage04:${input.eventId}:${input.expectedEventVersionId.trim()}:${input.supplierId}`;
        const inserted = await run<InsertedAuthorityRow>(
          `INSERT INTO source_event_candidate_supplier_authority (
            authority_id,
            client_key,
            source_event_id,
            vendor_id,
            authority_state,
            accepted_by_user_id,
            accepted_by_name,
            accepted_at,
            acceptance_rationale,
            evidence_reference
          )
          VALUES ($1, $2, $3::uuid, $4, 'accepted', $5, $6, now(), $7, $8)
          RETURNING authority_id`,
          [
            authorityId,
            input.clientKey,
            input.eventId,
            input.supplierId,
            input.acceptedByUserId.trim(),
            input.acceptedByName.trim(),
            input.rationale.trim(),
            input.expectedSourceReference.trim(),
          ],
        );

        return {
          ok: true,
          authorityId: inserted[0]?.authority_id ?? authorityId,
        };
      },
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        code: "already_accepted",
        detail:
          "This supplier already has active candidate authority for the event.",
      };
    }
    return {
      ok: false,
      code: "write_failed",
      detail:
        error instanceof Error ? error.message : "Candidate acceptance failed.",
    };
  }
}
