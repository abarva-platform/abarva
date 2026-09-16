import { createdEventDestination } from "./navigation";

describe("createdEventDestination", () => {
  it("opens the event workspace after normal creation", () => {
    expect(createdEventDestination("event-1", "/source/events/event-1/approval", false))
      .toBe("/source/new/event-1");
  });

  it("keeps the guided tour on its approval path", () => {
    expect(createdEventDestination("event-1", "/source/events/event-1/approval", true))
      .toBe("/source/events/event-1/approval?tour=1");
  });

  it("keeps contract optimization on its governed approval path", () => {
    expect(createdEventDestination("event-1", "/source/events/event-1/approval", false, "contract_optimization"))
      .toBe("/source/events/event-1/approval");
  });

  it("encodes the event id as a single path segment", () => {
    expect(createdEventDestination("event/1", "/source/events/event-1/approval", false))
      .toBe("/source/new/event%2F1");
  });
});
