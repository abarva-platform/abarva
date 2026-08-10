import {
  parseSourceEventRoute,
  resolveSourceLifecycleRoute,
} from "@/lib/source/lifecycle-routing-guard";

describe("source lifecycle routing guard", () => {
  it("parses event canvas and lifecycle sub-routes", () => {
    expect(parseSourceEventRoute("/source/events/event-123")).toEqual({
      eventId: "event-123",
      section: "canvas",
    });
    expect(parseSourceEventRoute("/source/events/event-123/approval")).toEqual({
      eventId: "event-123",
      section: "approval",
    });
    expect(parseSourceEventRoute("/source/events/event-123/value")).toEqual({
      eventId: "event-123",
      section: "value",
    });
    expect(
      parseSourceEventRoute("/source/events/event-123/file-cabinet"),
    ).toEqual({
      eventId: "event-123",
      section: "file_cabinet",
    });
    expect(parseSourceEventRoute("/source/events")).toBeNull();
  });

  it("redirects waiting events away from canvas to approval", () => {
    expect(
      resolveSourceLifecycleRoute({
        eventId: "SRC-100",
        lifecycleState: "waiting_on_client",
        currentStageKey: "strategy",
        pathname: "/source/events/SRC-100",
      }),
    ).toEqual({
      type: "redirect",
      destination: "/source/events/SRC-100/approval",
      status: 302,
    });
  });

  it("allows waiting events to render approval", () => {
    expect(
      resolveSourceLifecycleRoute({
        eventId: "SRC-100",
        lifecycleState: "draft_revision",
        currentStageKey: "strategy",
        pathname: "/source/events/SRC-100/approval",
      }),
    ).toEqual({ type: "allow" });
  });

  it("allows waiting events to render the read-only File Cabinet", () => {
    expect(
      resolveSourceLifecycleRoute({
        eventId: "SRC-100",
        lifecycleState: "waiting_on_client",
        currentStageKey: "strategy",
        pathname: "/source/events/SRC-100/file-cabinet",
      }),
    ).toEqual({ type: "allow" });
  });

  it("redirects active approval URLs back to the current stage canvas", () => {
    expect(
      resolveSourceLifecycleRoute({
        eventId: "SRC-100",
        lifecycleState: "active",
        currentStageKey: "pricing",
        pathname: "/source/events/SRC-100/approval",
      }),
    ).toEqual({
      type: "redirect",
      destination: "/source/events/SRC-100?stage=pricing",
      status: 302,
    });
  });

  it("maps stale RFP-stage active approval URLs to the optimization commercial baseline", () => {
    expect(
      resolveSourceLifecycleRoute({
        eventId: "SRC-100",
        lifecycleState: "active",
        sourcingMotion: "contract_optimization",
        currentStageKey: "rfp",
        pathname: "/source/events/SRC-100/approval",
      }),
    ).toEqual({
      type: "redirect",
      destination: "/source/events/SRC-100?stage=pricing",
      status: 302,
    });
  });

  it("keeps RFP stage URLs for competitive sourcing events", () => {
    expect(
      resolveSourceLifecycleRoute({
        eventId: "SRC-100",
        lifecycleState: "active",
        sourcingMotion: "competitive_rfp",
        currentStageKey: "rfp",
        pathname: "/source/events/SRC-100/approval",
      }),
    ).toEqual({
      type: "redirect",
      destination: "/source/events/SRC-100?stage=rfp",
      status: 302,
    });
  });

  it("redirects closed events to summary and avoids a summary loop", () => {
    expect(
      resolveSourceLifecycleRoute({
        eventId: "SRC-100",
        lifecycleState: "closed_rejected",
        pathname: "/source/events/SRC-100",
      }),
    ).toEqual({
      type: "redirect",
      destination: "/source/events/SRC-100/summary",
      status: 302,
    });

    expect(
      resolveSourceLifecycleRoute({
        eventId: "SRC-100",
        lifecycleState: "completed",
        pathname: "/source/events/SRC-100/summary",
      }),
    ).toEqual({ type: "allow" });
  });

  it("redirects archived events to the Source portfolio book", () => {
    expect(
      resolveSourceLifecycleRoute({
        eventId: "SRC-100",
        lifecycleState: "archived",
        pathname: "/source/events/SRC-100",
      }),
    ).toEqual({
      type: "redirect",
      destination: "/source/portfolio",
      status: 302,
    });
  });

  it("fails open for unknown lifecycle states", () => {
    expect(
      resolveSourceLifecycleRoute({
        eventId: "SRC-100",
        lifecycleState: "waiting_on_vendor",
        pathname: "/source/events/SRC-100",
      }),
    ).toEqual({ type: "allow" });
  });
});
