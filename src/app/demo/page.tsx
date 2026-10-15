import { DemoLibrary } from "@/components/marketing/DemoLibrary";
import type { ComponentProps } from "react";
import { DEMO_VIDEOS } from "@/lib/demo-library/catalog";
import { inspectDemoVideo, readDemoSession } from "@/lib/demo-library/server";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Nexus | Private demo",
  robots: { index: false, follow: false },
};

async function loadDemo(): Promise<ComponentProps<typeof DemoLibrary>> {
  try {
    const { user, access } = await readDemoSession();
    const videos = access.allowed
      ? await Promise.all(
          DEMO_VIDEOS.filter((video) => access.videoIds.includes(video.id)).map(
            async (video) => ({
              title: video.title,
              duration: video.duration,
              description: video.description,
              chapters: video.chapters,
              ...(await inspectDemoVideo(video)),
            }),
          ),
        )
      : [];
    return {
      state: access.allowed ? "approved" : user ? "unapproved" : "anonymous",
      admin: access.admin,
      videos,
    };
  } catch {
    return { state: "unavailable", admin: false, videos: [] };
  }
}

export default async function DemoPage() {
  return <DemoLibrary {...await loadDemo()} />;
}
