import { GET } from "../route";

it("serves allowlisted Claude architecture review SVGs", async () => {
  const response = await GET(new Request("http://localhost"), {
    params: Promise.resolve({
      diagramId: "patterns-enterprise-operating-system",
    }),
  });

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe(
    "image/svg+xml; charset=utf-8",
  );
  expect(response.headers.get("x-home-review-only")).toBe("true");
  expect(await response.text()).toContain("<svg");
});

it("rejects non-allowlisted Claude architecture review SVGs", async () => {
  const response = await GET(new Request("http://localhost"), {
    params: Promise.resolve({
      diagramId: "../approved-content",
    }),
  });

  expect(response.status).toBe(404);
  await expect(response.json()).resolves.toMatchObject({
    error: "not_found",
  });
});
