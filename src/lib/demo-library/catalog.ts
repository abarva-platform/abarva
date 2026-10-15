import type { DemoVideoId } from "./policy";

export const DEMO_MEDIA_BUCKET = "demo-videos";
export const DEMO_VIDEOS = [
  {
    id: "executive" as const,
    title: "Executive overview",
    duration: "5 min 02 sec",
    description:
      "Make the case, challenge the commitment and prove the result through the connected Nexus journey.",
    blobPath: "2026-10-15/v3/nexus-executive.mp4",
    captionsPath: "2026-10-15/v3/nexus-executive.vtt",
    chapters: [
      { at: 0, title: "The decision story" },
      { at: 24.7, title: "The connected journey" },
      { at: 51.633333, title: "Home: shared context" },
      { at: 69.6, title: "Intelligence: make the case" },
      { at: 89.866667, title: "Moves P0-P1: originate and charter" },
      { at: 102.9, title: "Moves P2: diagnose before designing" },
      { at: 122.8, title: "Moves P3: design the whole change" },
      { at: 142.633333, title: "Moves P4-P5: justify and mobilize" },
      { at: 161.666667, title: "Source Optimize: challenge the commitment" },
      { at: 178.833333, title: "Source Optimize: the commercial ask" },
      { at: 196.233333, title: "Source New: deal-specific questions" },
      { at: 218.833333, title: "Tower: prove the result" },
      { at: 240.533333, title: "The client outcome" },
      { at: 263.4, title: "Product and services opportunity" },
      { at: 282.466667, title: "A Nexus decision review" },
    ],
  },
  {
    id: "full" as const,
    title: "Full product walkthrough",
    duration: "8 min 31 sec",
    description:
      "Follow the synthetic healthcare scenario through evidence, ordered Moves phases, supplier decisions and outcome review.",
    blobPath: "2026-10-15/v3/nexus-full.mp4",
    captionsPath: "2026-10-15/v3/nexus-full.vtt",
    chapters: [
      { at: 0, title: "The decision story" },
      { at: 24.7, title: "The connected journey" },
      { at: 51.633333, title: "The healthcare transformation" },
      { at: 79.666667, title: "Home: shared context" },
      { at: 103.966667, title: "Home: inspect the record" },
      { at: 125, title: "Intelligence: make the case" },
      { at: 145.266667, title: "Intelligence: reasoning and sources" },
      { at: 168.1, title: "Moves P0: Originate" },
      { at: 188.2, title: "Moves P1: Charter" },
      { at: 206.766667, title: "Moves P2: Discover and Diagnose" },
      { at: 226.666667, title: "Moves P3: Design" },
      { at: 246.5, title: "Moves P4: Roadmap and Business Case" },
      { at: 276.866667, title: "Moves P5: Mobilize" },
      { at: 303.133333, title: "Source Optimize: challenge the commitment" },
      { at: 320.3, title: "Source Optimize: evidence and terms" },
      { at: 343.133333, title: "Source Optimize: the commercial ask" },
      { at: 360.533333, title: "Source New: deal-specific questions" },
      { at: 383.133333, title: "Tower: prove the result" },
      { at: 404.833333, title: "Tower: the next investment decision" },
      { at: 426.166667, title: "The governed architecture" },
      { at: 449.633333, title: "The client outcome" },
      { at: 472.5, title: "Product and services opportunity" },
      { at: 491.566667, title: "A Nexus decision review" },
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
