import { readAcceptedCandidatesForEvent } from "@/lib/source/candidate-suppliers/event-candidate-authority-repository";
import { readNdaAuthorityForEventPanel } from "@/lib/source/nda/nda-authority-repository";
import { readSourceNewStage05NdaCoverage } from "@/lib/source/new-workspace/stage05-nda-coverage";

jest.mock("@/lib/source/candidate-suppliers/event-candidate-authority-repository", () => ({
  readAcceptedCandidatesForEvent: jest.fn(),
}));
jest.mock("@/lib/source/nda/nda-authority-repository", () => ({
  readNdaAuthorityForEventPanel: jest.fn(),
}));

const readCandidates = readAcceptedCandidatesForEvent as jest.Mock;
const readPanel = readNdaAuthorityForEventPanel as jest.Mock;

describe("Stage 05 accepted-panel read", () => {
  beforeEach(() => {
    readCandidates.mockReset();
    readPanel.mockReset();
  });

  it("checks 60 suppliers across archetypes through one panel read and blocks missing coverage", async () => {
    const archetypes = ["managed-services", "software", "cloud", "network", "security", "advisory"];
    const acceptedCandidates = Array.from({ length: 60 }, (_, index) => ({
      authorityId: `candidate-${index}`,
      supplierId: `VEN-${index}`,
      legalEntityId: `VEN-${index}`,
      legalName: `Supplier ${index}`,
      acceptedByName: "Procurement Owner",
      acceptedAt: "2026-09-19T12:00:00Z",
      acceptanceRationale: "Synthetic panel test",
      evidenceReference: `EVID-${index}`,
      eligibility: {
        categoryKeys: [], functionKeys: [], archetypeKeys: [archetypes[index % archetypes.length]],
      },
    }));
    readCandidates.mockResolvedValue({ registryAvailable: true, acceptedCandidates });
    readPanel.mockResolvedValue(new Map(acceptedCandidates.map((candidate) => [
      candidate.legalEntityId,
      { registryAvailable: true, publishedTemplateVersions: ["mutual-v1"], executedNdas: [], waivers: [] },
    ])));

    const result = await readSourceNewStage05NdaCoverage({
      clientKey: "example-tenant", eventId: "11111111-1111-4111-8111-111111111111",
      asOf: "2026-10-03T00:00:00Z",
    });

    expect(readPanel).toHaveBeenCalledTimes(1);
    expect(readPanel).toHaveBeenCalledWith({
      clientKey: "example-tenant", eventId: "11111111-1111-4111-8111-111111111111",
      supplierLegalEntityIds: acceptedCandidates.map((candidate) => candidate.legalEntityId),
    });
    expect(result.suppliers).toHaveLength(60);
    expect(result.suppliers.every((supplier) => supplier.state === "not_covered")).toBe(true);
    expect(result.status).toBe("blocked");
  });

  it("keeps a supplier with missing authority blocked", async () => {
    readCandidates.mockResolvedValue({ registryAvailable: true, acceptedCandidates: [{
      authorityId: "candidate-1", supplierId: "VEN-1", legalEntityId: "VEN-1",
      legalName: "Supplier One", acceptedByName: "Procurement Owner",
      acceptedAt: "2026-09-19T12:00:00Z", acceptanceRationale: "Test",
      evidenceReference: "EVID-1",
    }] });
    readPanel.mockResolvedValue(new Map());
    const result = await readSourceNewStage05NdaCoverage({
      clientKey: "example-tenant", eventId: "11111111-1111-4111-8111-111111111111",
      asOf: "2026-10-03T00:00:00Z",
    });
    expect(result.status).toBe("blocked");
    expect(result.suppliers[0]?.state).toBe("unavailable");
  });
});
