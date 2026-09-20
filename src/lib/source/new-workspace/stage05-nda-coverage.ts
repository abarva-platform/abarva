import {
  readAcceptedCandidatesForEvent,
  type AcceptedEventCandidate,
} from "@/lib/source/candidate-suppliers/event-candidate-authority-repository";
import {
  readNdaAuthorityForEvent,
  type NdaAuthorityRead,
} from "@/lib/source/nda/nda-authority-repository";
import { evaluateNdaCoverage } from "@/lib/source/nda/nda-scope-authority";

export type Stage05SupplierAuthoritySlice = {
  candidate: AcceptedEventCandidate;
  ndaAuthority: NdaAuthorityRead;
};

export type SourceNewStage05SupplierCoverage = {
  legalEntityId: string;
  legalName: string;
  state: "covered_by_nda" | "covered_by_waiver" | "not_covered" | "unavailable";
  reason: string;
  authorityReference: string | null;
  evidenceReference: string;
  evidenceCaveats: readonly string[];
};

export type SourceNewStage05NdaCoverage = {
  status: "ready" | "blocked" | "empty" | "unavailable";
  asOf: string;
  suppliers: readonly SourceNewStage05SupplierCoverage[];
  nextAction: {
    label: string;
    detail: string;
  };
};

export type SourceNewStage05CoverageInput = {
  clientKey: string;
  eventId: string;
  asOf: string;
  candidateRegistryAvailable: boolean;
  suppliers: readonly Stage05SupplierAuthoritySlice[];
};

const unavailableProjection = (asOf: string): SourceNewStage05NdaCoverage => ({
  status: "unavailable",
  asOf,
  suppliers: [],
  nextAction: {
    label: "Restore candidate authority",
    detail:
      "The governed candidate-panel registry could not be read. Supplier NDA coverage stays blocked until authority is available.",
  },
});

export function buildSourceNewStage05NdaCoverage(
  input: SourceNewStage05CoverageInput,
): SourceNewStage05NdaCoverage {
  if (!input.candidateRegistryAvailable) {
    return unavailableProjection(input.asOf);
  }

  if (input.suppliers.length === 0) {
    return {
      status: "empty",
      asOf: input.asOf,
      suppliers: [],
      nextAction: {
        label: "Accept candidate panel",
        detail:
          "No supplier has explicit candidate-panel acceptance for this event. Invitations, responses, recommendations, and awards do not substitute for that authority.",
      },
    };
  }

  const suppliers = input.suppliers.map<SourceNewStage05SupplierCoverage>(
    ({ candidate, ndaAuthority }) => {
      if (!ndaAuthority.registryAvailable) {
        return {
          legalEntityId: candidate.legalEntityId,
          legalName: candidate.legalName,
          state: "unavailable",
          reason:
            "The governed NDA authority registry is unavailable for this supplier. Unknown coverage is blocked coverage.",
          authorityReference: null,
          evidenceReference: candidate.evidenceReference,
          evidenceCaveats: [],
        };
      }

      const result = evaluateNdaCoverage({
        registryAvailable: true,
        tenantKey: input.clientKey,
        eventId: input.eventId,
        supplierLegalEntityId: candidate.legalEntityId,
        publishedTemplateVersions: ndaAuthority.publishedTemplateVersions,
        executedNdas: ndaAuthority.executedNdas,
        waivers: ndaAuthority.waivers,
        asOf: input.asOf,
      });

      return {
        legalEntityId: candidate.legalEntityId,
        legalName: candidate.legalName,
        state: result.state,
        reason: result.reason,
        authorityReference: result.ndaId ?? result.waiver?.waiverId ?? null,
        evidenceReference: candidate.evidenceReference,
        evidenceCaveats: result.evidenceCaveats,
      };
    },
  );

  const hasUnavailable = suppliers.some(
    (supplier) => supplier.state === "unavailable",
  );
  const hasUncovered = suppliers.some(
    (supplier) => supplier.state === "not_covered",
  );
  const status = hasUnavailable || hasUncovered ? "blocked" : "ready";
  const nextAction = hasUnavailable
    ? {
        label: "Restore NDA authority",
        detail:
          "At least one accepted supplier could not be checked against the governed NDA registry.",
      }
    : hasUncovered
      ? {
          label: "Resolve NDA coverage",
          detail:
            "File an executed NDA on a Legal-published template or record a named, expiring Legal waiver for every uncovered supplier.",
        }
      : {
          label: "Open market package gate",
          detail:
            "Every explicitly accepted supplier has governed NDA or waiver coverage for this event as of the recorded date.",
        };

  return {
    status,
    asOf: input.asOf,
    suppliers,
    nextAction,
  };
}

export async function readSourceNewStage05NdaCoverage(input: {
  clientKey: string;
  eventId: string;
  asOf: string;
}): Promise<SourceNewStage05NdaCoverage> {
  const candidates = await readAcceptedCandidatesForEvent({
    clientKey: input.clientKey,
    eventId: input.eventId,
  });
  if (!candidates.registryAvailable) {
    return unavailableProjection(input.asOf);
  }

  const suppliers = await Promise.all(
    candidates.acceptedCandidates.map(async (candidate) => ({
      candidate,
      ndaAuthority: await readNdaAuthorityForEvent({
        clientKey: input.clientKey,
        eventId: input.eventId,
        supplierLegalEntityId: candidate.legalEntityId,
      }),
    })),
  );

  return buildSourceNewStage05NdaCoverage({
    ...input,
    candidateRegistryAvailable: true,
    suppliers,
  });
}
