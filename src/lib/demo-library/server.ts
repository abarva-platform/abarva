import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getPrivateObjectStorageBlobClient } from "@/lib/data-plane/objectStorage";
import { evaluateDemoAccess } from "./policy";
import {
  DEMO_MEDIA_BUCKET,
  type DemoVideo,
  type DemoVideoAvailability,
} from "./catalog";

export const PRIVATE_DEMO_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  Vary: "Cookie",
};
export async function readDemoSession() {
  // Current provider metadata keeps revoked grants independent of stale JWT claims.
  const session = await auth();
  if (!session.userId) return { user: null, access: evaluateDemoAccess(null) };
  const user = await currentUser();
  return { user, access: evaluateDemoAccess(user) };
}
export function demoBlob(video: DemoVideo, captions = false) {
  return getPrivateObjectStorageBlobClient(
    DEMO_MEDIA_BUCKET,
    captions ? video.captionsPath : video.blobPath,
  );
}
export async function inspectDemoVideo(
  video: DemoVideo,
): Promise<DemoVideoAvailability> {
  try {
    const properties = await (await demoBlob(video)).getProperties();
    const ready =
      properties.contentType === "video/mp4" &&
      (properties.contentLength ?? 0) > 0 &&
      properties.metadata?.demo_published === "true";
    const captionsReady =
      ready && (await (await demoBlob(video, true)).exists());
    return { id: video.id, ready, captionsReady };
  } catch {
    return { id: video.id, ready: false, captionsReady: false };
  }
}
