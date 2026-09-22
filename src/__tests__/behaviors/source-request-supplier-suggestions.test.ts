import { resolveArchetypeForEvent } from "@/lib/source/archetypes/event-archetype-resolver";
import type { CandidateSupplierAuthorityRow } from "@/lib/source/candidate-suppliers/candidate-supplier-authority";
import { SOURCE_CATEGORIES } from "@/lib/source/taxonomy/category-taxonomy";
import { buildSourceRequestSupplierSuggestions } from "@/lib/source/intake/source-request-supplier-suggestions";

function row(input: {
  categoryId: string;
  archetypeId: string;
  index: number;
  contactPolicy?: "contact_allowed" | "review_required" | "do_not_contact";
}): CandidateSupplierAuthorityRow {
  return {
    tenantKey: "tenant-alpha",
    supplierId: `supplier-${input.index}`,
    legalEntityId: `supplier-${input.index}`,
    legalName: `Synthetic Supplier ${input.index}`,
    authorityState: "accepted",
    eligibility: {
      categoryKeys: [input.categoryId],
      functionKeys: [`function-${input.index}`],
      archetypeKeys: [input.archetypeId],
    },
    contactPolicy: input.contactPolicy ?? "review_required",
    contacts: [],
    source: {
      system: "supplier-master-template",
      reference: `EVID-SUPPLIER-${input.index}`,
      recordedAt: "2026-09-20T00:00:00.000Z",
      recordedBy: "Named Supplier Data Steward",
    },
  };
}

describe("Source request supplier suggestions", () => {
  const routes = SOURCE_CATEGORIES.map((category, index) => {
    const resolution = resolveArchetypeForEvent({ categoryId: category.id });
    if (!resolution.archetypeId) {
      throw new Error(`Missing archetype for ${category.id}`);
    }
    return {
      categoryId: category.id,
      archetypeId: resolution.archetypeId,
      index,
    };
  });
  const rows = routes.map((route) => row(route));

  it.each(routes)(
    "filters governed candidates for $categoryId and $archetypeId",
    ({ categoryId, archetypeId, index }) => {
      const projection = buildSourceRequestSupplierSuggestions({
        tenantKey: "tenant-alpha",
        eventId: "11111111-1111-4111-8111-111111111111",
        acceptedMapping: { categoryId, archetypeId },
        registryAvailable: true,
        registryRows: rows,
        contractVendorLegalEntityIds: [],
        contractEvidenceAvailable: true,
      });

      expect(projection.status).toBe("available");
      expect(projection.rows).toEqual([
        expect.objectContaining({
          supplierId: `supplier-${index}`,
          label: "Suggested for review",
          existingContractVendor: false,
          contactActionAvailable: false,
        }),
      ]);
    },
  );

  it("does not suggest anything before a named mapping has become event authority", () => {
    const projection = buildSourceRequestSupplierSuggestions({
      tenantKey: "tenant-alpha",
      eventId: "11111111-1111-4111-8111-111111111111",
      acceptedMapping: null,
      registryAvailable: true,
      registryRows: rows,
      contractVendorLegalEntityIds: [],
      contractEvidenceAvailable: true,
    });

    expect(projection.status).toBe("blocked");
    expect(projection.rows).toEqual([]);
    expect(projection.blockers).toContain(
      "A named mapping decision is required before supplier suggestions.",
    );
  });

  it("keeps existing-contract vendors separate and never exposes a contact action", () => {
    const first = routes[0]!;
    const contactAllowed = row({
      ...first,
      contactPolicy: "contact_allowed",
    });
    contactAllowed.contacts = [
      {
        contactId: "contact-1",
        role: "account_executive",
        email: "synthetic@example.invalid",
        state: "active",
      },
    ];

    const projection = buildSourceRequestSupplierSuggestions({
      tenantKey: "tenant-alpha",
      eventId: "11111111-1111-4111-8111-111111111111",
      acceptedMapping: first,
      registryAvailable: true,
      registryRows: [contactAllowed],
      contractVendorLegalEntityIds: [contactAllowed.legalEntityId],
      contractEvidenceAvailable: true,
    });

    expect(projection.rows[0]).toEqual(
      expect.objectContaining({
        existingContractVendor: true,
        contactReadiness: "ready",
        contactActionAvailable: false,
      }),
    );
  });

  it("fails closed when candidate or contract authority is unavailable", () => {
    const first = routes[0]!;
    expect(
      buildSourceRequestSupplierSuggestions({
        tenantKey: "tenant-alpha",
        eventId: "11111111-1111-4111-8111-111111111111",
        acceptedMapping: first,
        registryAvailable: false,
        registryRows: [],
        contractVendorLegalEntityIds: [],
        contractEvidenceAvailable: true,
      }).status,
    ).toBe("blocked");
    expect(
      buildSourceRequestSupplierSuggestions({
        tenantKey: "tenant-alpha",
        eventId: "11111111-1111-4111-8111-111111111111",
        acceptedMapping: first,
        registryAvailable: true,
        registryRows: rows,
        contractVendorLegalEntityIds: [],
        contractEvidenceAvailable: false,
      }).status,
    ).toBe("blocked");
  });
});
