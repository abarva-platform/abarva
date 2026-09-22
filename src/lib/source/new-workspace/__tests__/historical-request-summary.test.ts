import {
  buildHistoricalRequestSummary,
  historicalRequestOriginForEvent,
} from "../historical-request-summary";

const event = {
  trigger: "A contract is nearing renewal.",
  scope: "Run, maintain, and enhance the application estate.",
  category: "ams",
  decisionOwner: "VP Technology Operations",
};

describe("historical Request summary", () => {
  it("uses only an exact governed event-link and version-matched mapping decision", () => {
    expect(
      historicalRequestOriginForEvent({
        eventId: "event-1",
        registryAvailable: true,
        requests: [
          {
            sourceSystem: "ServiceNow",
            requestNumber: "SRC0010042",
            sourceVersion: "v2",
            requestedByDisplayName: "IT Service Portfolio Lead",
            eventLink: { eventId: "event-1", sourceVersion: "v2" },
            mappingDecision: {
              state: "accepted",
              categoryId: "ams",
              archetypeId: "AMS_MANAGED_SERVICES",
              decidedByName: "Procurement Lead",
              sourceVersion: "v2",
            },
          },
        ],
      }),
    ).toEqual({
      sourceSystem: "ServiceNow",
      requestNumber: "SRC0010042",
      requesterName: "IT Service Portfolio Lead",
      mappingDecision: {
        state: "accepted",
        categoryId: "ams",
        archetypeId: "AMS_MANAGED_SERVICES",
        decidedByName: "Procurement Lead",
      },
    });
  });

  it("keeps origin but withholds mapping when the linked request version is stale", () => {
    expect(
      historicalRequestOriginForEvent({
        eventId: "event-1",
        registryAvailable: true,
        requests: [
          {
            sourceSystem: "ServiceNow",
            requestNumber: "SRC0010042",
            sourceVersion: "v3",
            requestedByDisplayName: "IT Service Portfolio Lead",
            eventLink: { eventId: "event-1", sourceVersion: "v2" },
            mappingDecision: {
              state: "accepted",
              categoryId: "ams",
              archetypeId: "AMS_MANAGED_SERVICES",
              decidedByName: "Procurement Lead",
              sourceVersion: "v3",
            },
          },
        ],
      }),
    ).toEqual({
      sourceSystem: "ServiceNow",
      requestNumber: "SRC0010042",
      requesterName: "IT Service Portfolio Lead",
      mappingDecision: null,
    });
  });

  it("does not infer origin from an unlinked request or an unavailable registry", () => {
    const request = {
      sourceSystem: "ServiceNow" as const,
      requestNumber: "SRC0010042",
      sourceVersion: "v2",
      requestedByDisplayName: "IT Service Portfolio Lead",
      eventLink: null,
      mappingDecision: null,
    };

    expect(
      historicalRequestOriginForEvent({
        eventId: "event-1",
        registryAvailable: true,
        requests: [request],
      }),
    ).toBeNull();
    expect(
      historicalRequestOriginForEvent({
        eventId: "event-1",
        registryAvailable: false,
        requests: [
          {
            ...request,
            eventLink: { eventId: "event-1", sourceVersion: "v2" },
          },
        ],
      }),
    ).toBeNull();
  });

  it("projects recorded event facts and a governed linked intake decision", () => {
    expect(
      buildHistoricalRequestSummary({
        event,
        origin: {
          sourceSystem: "ServiceNow",
          requestNumber: "SRC0010042",
          requesterName: "IT Service Portfolio Lead",
          mappingDecision: {
            state: "accepted",
            categoryId: "ams",
            archetypeId: "AMS_MANAGED_SERVICES",
            decidedByName: "Procurement Lead",
          },
        },
      }),
    ).toEqual({
      requestFacts: [
        { key: "need", label: "Need", value: event.trigger },
        { key: "scope", label: "Scope", value: event.scope },
        {
          key: "category",
          label: "Category",
          value: "Application Managed Services (AMS)",
        },
        {
          key: "decision-owner",
          label: "Decision owner",
          value: event.decisionOwner,
        },
      ],
      originFacts: [
        {
          key: "source-request",
          label: "Source request",
          value: "ServiceNow · SRC0010042",
        },
        {
          key: "requester",
          label: "Requester",
          value: "IT Service Portfolio Lead",
        },
      ],
      mappingFacts: [
        {
          key: "mapping-category",
          label: "Mapping category",
          value: "Application Managed Services (AMS)",
        },
        {
          key: "mapping-archetype",
          label: "Mapping archetype",
          value: "AMS_MANAGED_SERVICES",
        },
        {
          key: "mapping-decision",
          label: "Mapping decision",
          value: "Accepted by Procurement Lead",
        },
      ],
      mappingGap: null,
    });
  });

  it("does not infer ServiceNow origin or mapping for an older event", () => {
    const summary = buildHistoricalRequestSummary({ event, origin: null });

    expect(summary.requestFacts).toHaveLength(4);
    expect(summary.originFacts).toEqual([]);
    expect(summary.mappingFacts).toEqual([]);
    expect(summary.mappingGap).toBeNull();
  });

  it("keeps a linked intake proposal out of the named mapping decision", () => {
    const summary = buildHistoricalRequestSummary({
      event,
      origin: {
        sourceSystem: "ServiceNow",
        requestNumber: "SRC0010043",
        requesterName: null,
        mappingDecision: null,
      },
    });

    expect(summary.originFacts).toEqual([
      {
        key: "source-request",
        label: "Source request",
        value: "ServiceNow · SRC0010043",
      },
    ]);
    expect(summary.mappingFacts).toEqual([]);
    expect(summary.mappingGap).toBe(
      "No named mapping decision is recorded for this request.",
    );
  });

  it("fails closed on generic reviewer and requester identities", () => {
    const summary = buildHistoricalRequestSummary({
      event,
      origin: {
        sourceSystem: "ServiceNow",
        requestNumber: "SRC0010044",
        requesterName: "User",
        mappingDecision: {
          state: "overridden",
          categoryId: "ams",
          archetypeId: "AMS_MANAGED_SERVICES",
          decidedByName: "Admin",
        },
      },
    });

    expect(summary.originFacts).toHaveLength(1);
    expect(summary.mappingFacts).toEqual([]);
    expect(summary.mappingGap).toBe(
      "No named mapping decision is recorded for this request.",
    );
  });

  it("says which core Request facts are not recorded without filling them in", () => {
    const summary = buildHistoricalRequestSummary({
      event: {
        trigger: null,
        scope: null,
        category: null,
        decisionOwner: null,
      },
      origin: null,
    });

    expect(summary.requestFacts.map((fact) => fact.value)).toEqual([
      "Not recorded",
      "Not recorded",
      "Not established",
      "Not recorded",
    ]);
  });
});
