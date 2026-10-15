import { Readable } from "node:stream";
const readDemoSession = jest.fn();
const getProperties = jest.fn();
const download = jest.fn();
const demoBlob = jest.fn((...args: unknown[]) => {
  void args;
  return { getProperties, download };
});
jest.mock("@/lib/demo-library/server", () => ({
  readDemoSession: (...args: unknown[]) => readDemoSession(...args),
  demoBlob: (...args: unknown[]) => demoBlob(...args),
  PRIVATE_DEMO_HEADERS: {
    "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
    Vary: "Cookie",
  },
}));
import { GET, HEAD } from "@/app/api/demo-video/[videoId]/route";
const ctx = (videoId = "full") => ({ params: Promise.resolve({ videoId }) });
const req = (headers = {}, query = "") =>
  new Request(`https://app.example.com/api/demo-video/full${query}`, {
    headers,
  });

beforeEach(() => {
  jest.clearAllMocks();
  readDemoSession.mockResolvedValue({
    user: { id: "viewer" },
    access: { allowed: true, videoIds: ["full"] },
  });
  getProperties.mockResolvedValue({
    contentLength: 1000,
    contentType: "video/mp4",
    etag: '"v1"',
    metadata: { demo_published: "true" },
  });
  download.mockImplementation(async (offset: number, count: number) => ({
    readableStreamBody: Readable.from(Buffer.alloc(count ?? 1000 - offset, 1)),
  }));
});
describe("private demo media delivery", () => {
  it("rejects anonymous requests before opening storage", async () => {
    readDemoSession.mockResolvedValue({
      user: null,
      access: { allowed: false, videoIds: [] },
    });
    expect((await GET(req(), ctx())).status).toBe(401);
    expect(demoBlob).not.toHaveBeenCalled();
  });
  it("checks current approval and video scope for GET and HEAD", async () => {
    readDemoSession.mockResolvedValue({
      user: { id: "viewer" },
      access: { allowed: false, videoIds: [] },
    });
    expect((await GET(req(), ctx())).status).toBe(403);
    expect((await HEAD(req(), ctx())).status).toBe(403);
    expect(demoBlob).not.toHaveBeenCalled();
    readDemoSession.mockResolvedValue({
      user: { id: "viewer" },
      access: { allowed: true, videoIds: ["executive"] },
    });
    expect((await GET(req(), ctx())).status).toBe(403);
  });
  it("streams the requested range without exposing a storage URL", async () => {
    const response = await GET(req({ Range: "bytes=20-29" }), ctx());
    expect(response.status).toBe(206);
    expect(response.headers.get("content-range")).toBe("bytes 20-29/1000");
    expect(response.headers.get("content-length")).toBe("10");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("location")).toBeNull();
    expect((await response.arrayBuffer()).byteLength).toBe(10);
    expect(download).toHaveBeenCalledWith(
      20,
      10,
      expect.objectContaining({ conditions: { ifMatch: '"v1"' } }),
    );
  });
  it("supports seeking near the end and full-file responses", async () => {
    expect(
      (await GET(req({ Range: "bytes=-10" }), ctx())).headers.get(
        "content-range",
      ),
    ).toBe("bytes 990-999/1000");
    const full = await GET(req(), ctx());
    expect(full.status).toBe(200);
    expect((await full.arrayBuffer()).byteLength).toBe(1000);
  });
  it("returns HEAD metadata without downloading any bytes", async () => {
    const response = await HEAD(req(), ctx());
    expect(response.status).toBe(200);
    expect(response.headers.get("content-length")).toBe("1000");
    expect(await response.text()).toBe("");
    expect(download).not.toHaveBeenCalled();
  });
  it("returns a bounded 416 for malformed or unsatisfiable ranges", async () => {
    const response = await GET(req({ Range: "bytes=9999-" }), ctx());
    expect(response.status).toBe(416);
    expect(response.headers.get("content-range")).toBe("bytes */1000");
    expect(download).not.toHaveBeenCalled();
  });
  it("never accepts arbitrary IDs, asset paths or unpublished media", async () => {
    expect((await GET(req(), ctx("private-client-file"))).status).toBe(404);
    expect((await GET(req({}, "?asset=../../secret"), ctx())).status).toBe(400);
    expect(demoBlob).not.toHaveBeenCalled();
    getProperties.mockResolvedValue({
      contentLength: 1000,
      contentType: "video/mp4",
      metadata: {},
    });
    expect((await GET(req(), ctx())).status).toBe(404);
    expect(download).not.toHaveBeenCalled();
  });
  it("fails closed on provider errors without revealing their details", async () => {
    readDemoSession.mockRejectedValue(new Error("provider secret detail"));
    const response = await GET(req(), ctx());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("secret detail");
  });
});
