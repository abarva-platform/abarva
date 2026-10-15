/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { DemoLibrary } from "@/components/marketing/DemoLibrary";
import { LoggedOutLandingPage } from "@/components/marketing/LoggedOutLandingPage";
import { DEMO_VIDEOS } from "../catalog";
import MobileGuard from "@/components/MobileGuard";
import { metadata as landingMetadata } from "@/app/page";
jest.mock("next/navigation", () => ({ usePathname: () => "/demo" }));
jest.mock("@clerk/nextjs", () => ({
  SignOutButton: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));
jest.mock("@/components/auth/EmailCodeSignIn", () => ({
  EmailCodeSignIn: ({
    purpose,
    redirectUrl,
  }: {
    purpose: string;
    redirectUrl: string;
  }) => (
    <div data-testid="demo-sign-in">
      {purpose}:{redirectUrl}
    </div>
  ),
}));
jest.mock("@/components/marketing/RequestAccessController", () => ({
  RequestAccessController: () => null,
}));
const videos = DEMO_VIDEOS.map(
  ({ id, title, duration, description, chapters }) => ({
    id,
    title,
    duration,
    description,
    chapters,
    ready: true,
    captionsReady: true,
  }),
);

describe("demo library presentation", () => {
  it("offers scoped sign-in without any playable source or admin control to anonymous visitors", () => {
    const { container } = render(
      <DemoLibrary state="anonymous" admin={false} videos={[]} />,
    );
    expect(screen.getByTestId("demo-sign-in").textContent).toBe("demo:/demo");
    expect(container.querySelector("video")).toBeNull();
    expect(screen.queryByText("Viewer access")).toBeNull();
  });
  it("does not render either the player or sign-in as approval for a denied account", () => {
    const { container } = render(
      <DemoLibrary state="unapproved" admin={false} videos={[]} />,
    );
    expect(container.querySelector("video")).toBeNull();
    expect(screen.queryByTestId("demo-sign-in")).toBeNull();
    expect(
      screen.getByText("This account is not approved for the demo."),
    ).toBeTruthy();
  });
  it("shows honest unpublished states rather than broken video controls", () => {
    const { container } = render(
      <DemoLibrary
        state="approved"
        admin={false}
        videos={videos.map((video) => ({ ...video, ready: false }))}
      />,
    );
    expect(container.querySelector("video")).toBeNull();
    expect(screen.getByText("The final video is being prepared.")).toBeTruthy();
    expect(
      (screen.getByLabelText("Jump to chapter") as HTMLSelectElement).disabled,
    ).toBe(true);
  });
  it("uses same-origin protected media and captions, supports version switching and chapter seeking", () => {
    const { container } = render(
      <DemoLibrary state="approved" admin={false} videos={videos} />,
    );
    expect(container.querySelector("source")?.getAttribute("src")).toBe(
      "/api/demo-video/executive",
    );
    expect(container.querySelector("track")?.getAttribute("src")).toBe(
      "/api/demo-video/executive?asset=captions",
    );
    fireEvent.click(
      screen.getByRole("tab", { name: /Full product walkthrough/ }),
    );
    expect(container.querySelector("source")?.getAttribute("src")).toBe(
      "/api/demo-video/full",
    );
    fireEvent.change(screen.getByLabelText("Jump to chapter"), {
      target: { value: "343.133333" },
    });
    expect(container.querySelector("video")?.currentTime).toBe(343.133333);
    expect(container.querySelector("video")?.autoplay).toBe(false);
  });
  it("supports keyboard tabs and limits access management to administrators", () => {
    render(<DemoLibrary state="approved" admin={true} videos={videos} />);
    fireEvent.keyDown(screen.getByRole("tab", { name: /Executive overview/ }), {
      key: "ArrowRight",
    });
    expect(
      screen
        .getByRole("tab", { name: /Full product walkthrough/ })
        .getAttribute("aria-selected"),
    ).toBe("true");
    expect(screen.getByText("Viewer access")).toBeTruthy();
  });
  it("makes the demo reachable from the real landing page without invented readiness numbers", () => {
    const { container } = render(<LoggedOutLandingPage />);
    expect(container.querySelectorAll(".abarva-landing > section").length).toBe(
      5,
    );
    expect(
      [...container.querySelectorAll(".surf b")].map(
        (node) => node.textContent,
      ),
    ).toEqual(["Home", "Intelligence", "Moves", "Source", "Tower"]);
    expect(
      screen
        .getByRole("link", { name: "Watch the Nexus demo" })
        .getAttribute("href"),
    ).toBe("/demo");
    expect(
      screen.getByRole("link", { name: "Watch the demo" }).getAttribute("href"),
    ).toBe("/demo");
    expect(screen.queryByText("72% · reshape")).toBeNull();
    expect(screen.getAllByAltText("Abarva Nexus").length).toBe(2);
  });

  it("defines Nexus and carries the film's decision story onto the public landing page", () => {
    const { container } = render(<LoggedOutLandingPage />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(
      /Nexus.*AI Success Platform/,
    );
    for (const line of [
      "Make the case before you spend.",
      "Challenge the commitment before you renew.",
      "Prove the result before you scale.",
    ])
      expect(screen.getByText(line)).toBeTruthy();
    const text = container.textContent ?? "";
    expect(text).toContain("Anthropic Claude is the reasoning engine");
    expect(text).toContain(
      "Originate, Charter, Discover, Design, Roadmap and Mobilize",
    );
    expect(text).toContain("Source Optimize");
    expect(text).toContain("Source New");
    expect(text).toContain("recurring platform");
    expect(text).toContain("integration, transformation and advisory services");
    expect(screen.getByAltText(/connected Nexus journey/)).toBeTruthy();
    expect(text).not.toMatch(
      /move the money to two that will|Show exactly where the value showed up|which to kill/i,
    );
  });

  it("uses the published V3 versions and their actual chapter timeline", () => {
    expect(DEMO_VIDEOS.map((video) => video.duration)).toEqual([
      "5 min 02 sec",
      "8 min 31 sec",
    ]);
    expect(DEMO_VIDEOS.map((video) => video.blobPath)).toEqual([
      "2026-10-15/v3/nexus-executive.mp4",
      "2026-10-15/v3/nexus-full.mp4",
    ]);
    expect(
      DEMO_VIDEOS[0].chapters.find((chapter) =>
        chapter.title.startsWith("Tower"),
      )?.at,
    ).toBeCloseTo(218.833333, 5);
    expect(
      DEMO_VIDEOS[1].chapters.find((chapter) =>
        chapter.title.startsWith("Source New"),
      )?.at,
    ).toBeCloseTo(360.533333, 5);
    for (const video of DEMO_VIDEOS) {
      expect(video.captionsPath).toBe(video.blobPath.replace(/\.mp4$/, ".vtt"));
      expect(video.chapters[0].at).toBe(0);
      for (let index = 1; index < video.chapters.length; index++) {
        expect(video.chapters[index].at).toBeGreaterThan(
          video.chapters[index - 1].at,
        );
      }
    }
  });

  it("shares the current landing story instead of inheriting the legacy preview claim", () => {
    expect(landingMetadata.openGraph?.title).toBe(landingMetadata.title);
    expect(landingMetadata.openGraph?.description).toBe(
      landingMetadata.description,
    );
    expect(landingMetadata.openGraph?.url).toBe("https://app.abarva.ai");
  });

  it("keeps the video library accessible on an actual phone user agent", () => {
    const original = Object.getOwnPropertyDescriptor(
      window.navigator,
      "userAgent",
    );
    const width = window.innerWidth;
    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      value: "iPhone",
    });
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 390,
    });
    render(
      <MobileGuard>
        <p>Demo content</p>
      </MobileGuard>,
    );
    expect(screen.getByText("Demo content")).toBeTruthy();
    expect(screen.queryByText("AbarVa is built for desktop")).toBeNull();
    if (original)
      Object.defineProperty(window.navigator, "userAgent", original);
    else Reflect.deleteProperty(window.navigator, "userAgent");
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: width,
    });
  });
});
