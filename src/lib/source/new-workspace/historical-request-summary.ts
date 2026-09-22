import { sourceNewCategoryDisplay } from "./phase-state";

type HistoricalRequestEvent = {
  trigger: string | null;
  scope: string | null;
  category: string | null;
  decisionOwner: string | null;
};

type HistoricalRequestOrigin = {
  sourceSystem: "ServiceNow";
  requestNumber: string;
  requesterName: string | null;
  mappingDecision: {
    state: "accepted" | "overridden";
    categoryId: string;
    archetypeId: string;
    decidedByName: string;
  } | null;
};

type HistoricalRequestAuthorityRecord = {
  sourceSystem: "ServiceNow";
  requestNumber: string;
  sourceVersion: string;
  requestedByDisplayName?: string | null;
  eventLink: {
    eventId: string;
    sourceVersion: string;
  } | null;
  mappingDecision: {
    state: "accepted" | "overridden" | "unmapped";
    categoryId: string | null;
    archetypeId: string | null;
    decidedByName: string;
    sourceVersion: string;
  } | null;
};

type SummaryFact = {
  key: string;
  label: string;
  value: string;
};

export type HistoricalRequestSummary = {
  requestFacts: SummaryFact[];
  originFacts: SummaryFact[];
  mappingFacts: SummaryFact[];
  mappingGap: string | null;
};

const GENERIC_PERSON_NAMES = new Set([
  "admin",
  "administrator",
  "unknown",
  "unknown user",
  "user",
]);

const recordedText = (value: string | null, absent: string): string =>
  value?.trim() || absent;

const namedPerson = (value: string | null): string | null => {
  const name = value?.trim() ?? "";
  return name && !GENERIC_PERSON_NAMES.has(name.toLowerCase()) ? name : null;
};

export function historicalRequestOriginForEvent(input: {
  eventId: string;
  registryAvailable: boolean;
  requests: readonly HistoricalRequestAuthorityRecord[];
}): HistoricalRequestOrigin | null {
  if (!input.registryAvailable) return null;
  const request = input.requests.find(
    (candidate) => candidate.eventLink?.eventId === input.eventId,
  );
  if (!request?.eventLink) return null;

  const decision = request.mappingDecision;
  const hasVersionMatchedDecision = Boolean(
    decision &&
      (decision.state === "accepted" || decision.state === "overridden") &&
      request.eventLink.sourceVersion === request.sourceVersion &&
      decision.sourceVersion === request.eventLink.sourceVersion &&
      decision.categoryId?.trim() &&
      decision.archetypeId?.trim(),
  );

  return {
    sourceSystem: request.sourceSystem,
    requestNumber: request.requestNumber,
    requesterName: request.requestedByDisplayName ?? null,
    mappingDecision:
      decision && hasVersionMatchedDecision
        ? {
            state: decision.state as "accepted" | "overridden",
            categoryId: decision.categoryId!,
            archetypeId: decision.archetypeId!,
            decidedByName: decision.decidedByName,
          }
        : null,
  };
}

export function buildHistoricalRequestSummary(input: {
  event: HistoricalRequestEvent;
  origin: HistoricalRequestOrigin | null;
}): HistoricalRequestSummary {
  const requestFacts: SummaryFact[] = [
    {
      key: "need",
      label: "Need",
      value: recordedText(input.event.trigger, "Not recorded"),
    },
    {
      key: "scope",
      label: "Scope",
      value: recordedText(input.event.scope, "Not recorded"),
    },
    {
      key: "category",
      label: "Category",
      value: sourceNewCategoryDisplay(input.event.category).text,
    },
    {
      key: "decision-owner",
      label: "Decision owner",
      value: recordedText(input.event.decisionOwner, "Not recorded"),
    },
  ];

  if (!input.origin) {
    return {
      requestFacts,
      originFacts: [],
      mappingFacts: [],
      mappingGap: null,
    };
  }

  const originFacts: SummaryFact[] = [
    {
      key: "source-request",
      label: "Source request",
      value: `${input.origin.sourceSystem} · ${input.origin.requestNumber.trim()}`,
    },
  ];
  const requester = namedPerson(input.origin.requesterName);
  if (requester) {
    originFacts.push({ key: "requester", label: "Requester", value: requester });
  }

  const decision = input.origin.mappingDecision;
  const reviewer = decision ? namedPerson(decision.decidedByName) : null;
  if (!decision || !reviewer) {
    return {
      requestFacts,
      originFacts,
      mappingFacts: [],
      mappingGap: "No named mapping decision is recorded for this request.",
    };
  }

  const decisionLabel =
    decision.state === "overridden" ? "Overridden" : "Accepted";
  return {
    requestFacts,
    originFacts,
    mappingFacts: [
      {
        key: "mapping-category",
        label: "Mapping category",
        value: sourceNewCategoryDisplay(decision.categoryId).text,
      },
      {
        key: "mapping-archetype",
        label: "Mapping archetype",
        value: decision.archetypeId.trim(),
      },
      {
        key: "mapping-decision",
        label: "Mapping decision",
        value: `${decisionLabel} by ${reviewer}`,
      },
    ],
    mappingGap: null,
  };
}
