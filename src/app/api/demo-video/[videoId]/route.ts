import { Readable } from "node:stream";
import { getDemoVideo } from "@/lib/demo-library/catalog";
import { parseVideoRange } from "@/lib/demo-library/policy";
import {
  demoBlob,
  PRIVATE_DEMO_HEADERS,
  readDemoSession,
} from "@/lib/demo-library/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ videoId: string }> };

async function serve(
  request: Request,
  context: Context,
  head: boolean,
): Promise<Response> {
  const json = (error: string, status: number) =>
    Response.json({ error }, { status, headers: PRIVATE_DEMO_HEADERS });
  try {
    const { user, access } = await readDemoSession();
    if (!user) return json("unauthenticated", 401);
    const video = getDemoVideo((await context.params).videoId);
    if (!video) return json("not_found", 404);
    if (!access.allowed || !access.videoIds.includes(video.id))
      return json("access_not_approved", 403);
    const asset = new URL(request.url).searchParams.get("asset") ?? "video";
    if (asset !== "video" && asset !== "captions")
      return json("invalid_asset", 400);
    const videoProperties = await (await demoBlob(video)).getProperties();
    if (
      videoProperties.metadata?.demo_published !== "true" ||
      videoProperties.contentType !== "video/mp4" ||
      !videoProperties.contentLength
    )
      return json("video_not_published", 404);
    const captions = asset === "captions";
    const blob = await demoBlob(video, captions);
    const properties = captions ? await blob.getProperties() : videoProperties;
    const size = properties.contentLength ?? 0;
    if (!size) return json("not_found", 404);
    const headers = new Headers({
      ...PRIVATE_DEMO_HEADERS,
      "Content-Type": captions ? "text/vtt; charset=utf-8" : "video/mp4",
      "Accept-Ranges": "bytes",
      "Content-Disposition": "inline",
      "Content-Length": String(size),
    });
    if (properties.etag) headers.set("ETag", properties.etag);
    if (head) return new Response(null, { status: 200, headers });
    let range;
    try {
      const ifRange = request.headers.get("if-range");
      range = parseVideoRange(
        !ifRange || ifRange === properties.etag
          ? request.headers.get("range")
          : null,
        size,
      );
    } catch {
      headers.set("Content-Range", `bytes */${size}`);
      headers.set("Content-Length", "0");
      return new Response(null, { status: 416, headers });
    }
    const start = range?.start ?? 0;
    const count = (range?.end ?? size - 1) - start + 1;
    const download = await blob.download(start, count, {
      abortSignal: request.signal,
      conditions: { ifMatch: properties.etag },
    });
    if (!download.readableStreamBody) return json("media_unavailable", 503);
    console.info("[demo-video]", {
      userId: user.id,
      videoId: video.id,
      asset,
      rangeStart: start,
      rangeBytes: count,
    });
    headers.set("Content-Length", String(count));
    if (range)
      headers.set("Content-Range", `bytes ${range.start}-${range.end}/${size}`);
    const body = Readable.toWeb(
      download.readableStreamBody as Readable,
    ) as ReadableStream<Uint8Array>;
    return new Response(body, { status: range ? 206 : 200, headers });
  } catch (error) {
    if ((error as { statusCode?: number })?.statusCode === 404)
      return json("not_found", 404);
    return json("media_unavailable", 503);
  }
}

export async function GET(request: Request, context: Context) {
  return serve(request, context, false);
}
export async function HEAD(request: Request, context: Context) {
  return serve(request, context, true);
}
