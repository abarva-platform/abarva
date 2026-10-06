import { GET } from "../route";

it("does not generate an upload template for an in-step decision", async () => {
  const response = await GET({} as import("next/server").NextRequest, {
    params: Promise.resolve({
      eventId: "event-1",
      requirementId: "EVID-SRC-SCOPE-RETAINED-VENDOR-DECISION",
    }),
  });
  expect(response.status).toBe(404);
  expect(await response.json()).toMatchObject({ error: "unknown_requirement" });
});
