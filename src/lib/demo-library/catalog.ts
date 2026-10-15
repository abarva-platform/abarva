import type { DemoVideoId } from "./policy";

export const DEMO_MEDIA_BUCKET = "demo-videos";
export const DEMO_VIDEOS = [
  {
    id: "executive" as const,
    title: "Executive overview",
    duration: "5 min 26 sec",
    description:
      "Make the case, challenge the commitment and prove the result through the connected Nexus journey.",
    blobPath: "2026-10-15/v3-2/nexus-executive.mp4",
    captionsPath: "2026-10-15/v3-2/nexus-executive.vtt",
    chapters: [
      { at: 0, title: "The decision story" },
      { at: 29.733333, title: "The connected journey" },
      { at: 54.366667, title: "Home: shared context" },
      { at: 72.7, title: "Intelligence: make the case" },
      { at: 98.066667, title: "Moves P0-P1: originate and charter" },
      { at: 115.133333, title: "Moves P2: diagnose before designing" },
      { at: 134.033333, title: "Moves P3: design the whole change" },
      { at: 154.933333, title: "Moves P4-P5: justify and mobilize" },
      { at: 174.8, title: "Source Optimize: challenge the commitment" },
      { at: 196.133333, title: "Source Optimize: the commercial ask" },
      { at: 216.133333, title: "Source New: deal-specific questions" },
      { at: 244.633333, title: "Tower: prove the result" },
      { at: 266.5, title: "The client outcome" },
      { at: 293.166667, title: "Product and services opportunity" },
      { at: 309.133333, title: "A Nexus decision review" },
    ],
  },
  {
    id: "full" as const,
    title: "Full product walkthrough",
    duration: "9 min 10 sec",
    description:
      "Follow the synthetic healthcare scenario through evidence, ordered Moves phases, supplier decisions and outcome review.",
    blobPath: "2026-10-15/v3-2/nexus-full.mp4",
    captionsPath: "2026-10-15/v3-2/nexus-full.vtt",
    chapters: [
      { at: 0, title: "The decision story" },
      { at: 29.733333, title: "The connected journey" },
      { at: 54.366667, title: "The healthcare transformation" },
      { at: 83.266667, title: "Home: shared context" },
      { at: 113.433333, title: "Home: inspect the record" },
      { at: 134.6, title: "Intelligence: make the case" },
      { at: 159.966667, title: "Intelligence: reasoning and sources" },
      { at: 184.5, title: "Moves P0: Originate" },
      { at: 208.633333, title: "Moves P1: Charter" },
      { at: 229.466667, title: "Moves P2: Discover and Diagnose" },
      { at: 248.366667, title: "Moves P3: Design" },
      { at: 269.266667, title: "Moves P4: Roadmap and Business Case" },
      { at: 304.466667, title: "Moves P5: Mobilize" },
      { at: 329.033333, title: "Source Optimize: challenge the commitment" },
      { at: 350.366667, title: "Source Optimize: evidence and terms" },
      { at: 372.4, title: "Source Optimize: the commercial ask" },
      { at: 392.4, title: "Source New: deal-specific questions" },
      { at: 420.9, title: "Tower: prove the result" },
      { at: 442.766667, title: "Tower: the next investment decision" },
      { at: 466.833333, title: "The governed architecture" },
      { at: 490.5, title: "The client outcome" },
      { at: 517.166667, title: "Product and services opportunity" },
      { at: 533.133333, title: "A Nexus decision review" },
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
