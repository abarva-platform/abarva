import type { DemoVideoId } from "./policy";

export const DEMO_MEDIA_BUCKET = "demo-videos";
export const DEMO_VIDEOS = [
  {
    id: "executive" as const,
    title: "Executive overview",
    duration: "5 minutes",
    description:
      "The connected Nexus story: context, investment decisions, delivery, sourcing and outcomes.",
    blobPath: "2026-10-14/nexus-executive.mp4",
    captionsPath: "2026-10-14/nexus-executive.vtt",
    chapters: [
      { at: 0, title: "The connected vision" },
      { at: 41.133333, title: "Home: shared context" },
      { at: 66.5, title: "Intelligence: choose the problem" },
      { at: 93.766667, title: "Moves: six ordered phases" },
      { at: 159.6, title: "Source Optimize: existing agreements" },
      { at: 200.6, title: "Source New: a stronger competition" },
      { at: 235.8, title: "Tower: scale, repair or stop" },
      { at: 263.266667, title: "The partner opportunity" },
    ],
  },
  {
    id: "full" as const,
    title: "Full product walkthrough",
    duration: "13 minutes",
    description:
      "Follow the healthcare reference scenario through the product, its workflows and human decision gates.",
    blobPath: "2026-10-14/nexus-full.mp4",
    captionsPath: "2026-10-14/nexus-full.vtt",
    chapters: [
      { at: 0, title: "The connected vision" },
      { at: 61.566667, title: "Home: shared context" },
      { at: 120.333333, title: "Intelligence: the investment decision" },
      { at: 187.9, title: "Moves P0-P2: define, charter, diagnose" },
      { at: 253.633333, title: "Moves P3-P5: design, cost, mobilize" },
      { at: 320.166667, title: "Source Optimize: existing agreements" },
      { at: 392.4, title: "The next commercial action" },
      { at: 454.933333, title: "Source New: a governed market event" },
      { at: 559.466667, title: "Tower: investment and outcomes" },
      { at: 637.933333, title: "The architecture" },
      { at: 681.1, title: "Consulting partners" },
      { at: 733.066667, title: "The next investment decision" },
    ],
  },
] satisfies Array<{
  id: DemoVideoId;
  title: string;
  duration: string;
  description: string;
  blobPath: string;
  captionsPath: string;
  chapters: Array<{ at: number; title: string }>;
}>;

export type DemoVideo = (typeof DEMO_VIDEOS)[number];
export type DemoVideoAvailability = {
  id: DemoVideoId;
  ready: boolean;
  captionsReady: boolean;
};
export function getDemoVideo(id: string): DemoVideo | undefined {
  return DEMO_VIDEOS.find((video) => video.id === id);
}
