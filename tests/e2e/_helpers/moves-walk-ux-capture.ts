import type { Page } from "@playwright/test";
import type { WalkDomSnapshot } from "./moves-walk-ux-score";

/** Read the rendered page; never click, save, or mutate a Move. */
export async function captureWalkDomSnapshot(
  page: Page,
  expectedStepIndex: number,
): Promise<WalkDomSnapshot> {
  return page.evaluate((stepIndex) => {
    const main = document.querySelector<HTMLElement>(
      'main[aria-labelledby="step-panel-title"]',
    );
    const next = main?.querySelector<HTMLElement>(
      '[role="status"][aria-label="What to do next"]',
    );
    const stepRoot = main?.closest<HTMLElement>('[class*="root"]') ?? null;
    const work = main?.querySelector<HTMLElement>('[class*="work"]');
    const stepItems = Array.from(
      document.querySelectorAll('nav[aria-label$=" steps"] ol > li'),
    );
    const currentStepIndex = stepItems.findIndex((item) =>
      item.querySelector('[aria-current="step"]'),
    );
    const viewportWidth = document.documentElement.clientWidth;
    const visible = (element: Element): boolean => {
      const style = getComputedStyle(element);
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        element.getBoundingClientRect().width > 0
      );
    };
    const label = (element: Element): string =>
      `${element.tagName.toLowerCase()} ${(
        element.getAttribute("aria-label") ||
        element.textContent ||
        ""
      )
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 70)}`;
    const insideHorizontalScroller = (element: Element): boolean => {
      let parent = element.parentElement;
      while (parent) {
        if (getComputedStyle(parent).overflowX === "auto") return true;
        parent = parent.parentElement;
      }
      return false;
    };
    const wideElements: string[] = [];
    const clippedTextElements: string[] = [];
    for (const element of document.body.querySelectorAll<HTMLElement>("*")) {
      if (!visible(element) || insideHorizontalScroller(element)) continue;
      const rect = element.getBoundingClientRect();
      if (rect.width > viewportWidth + 1 && wideElements.length < 30) {
        wideElements.push(`${label(element)} ${Math.ceil(rect.width)}px`);
      }
      const overflowX = getComputedStyle(element).overflowX;
      if (
        element.children.length === 0 &&
        element.textContent?.trim() &&
        (overflowX === "hidden" || overflowX === "clip") &&
        element.scrollWidth > element.clientWidth + 1 &&
        clippedTextElements.length < 30
      ) {
        clippedTextElements.push(
          `${label(element)} ${element.scrollWidth}/${element.clientWidth}`,
        );
      }
    }

    const figures: WalkDomSnapshot["figures"] = [];
    if (main) {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
      );
      const figurePattern = /(?:[$€£]\s?\d[\d,.]*|\b\d+(?:\.\d+)?\s?%)/g;
      while (walker.nextNode() && figures.length < 150) {
        const node = walker.currentNode;
        const parent = node.parentElement;
        if (!parent || !visible(parent)) continue;
        const text = node.textContent ?? "";
        for (const match of text.matchAll(figurePattern)) {
          const container =
            parent.closest<HTMLElement>(
              'tr, [id^="row-"], [class*="metric"], figure, article',
            ) ??
            parent.parentElement ??
            parent;
          figures.push({
            value: match[0],
            nearbyText: container.innerText,
          });
        }
      }
    }

    return {
      stepHead: Boolean(main?.querySelector("#step-panel-title")),
      nextAction: Boolean(next),
      contextLine: Boolean(
        main?.querySelector('[class*="context-line"], details.context'),
      ),
      workGroupOrEmptyState: Boolean(
        work?.querySelector('section[class*="group"], [class*="empty-note"]'),
      ),
      footer: Boolean(main?.querySelector("footer")),
      currentStepMatches: currentStepIndex === stepIndex,
      nextActionText: next?.querySelector("p")?.innerText.trim() ?? "",
      countLabel:
        next
          ?.querySelector<HTMLElement>('[class*="next-count"]')
          ?.innerText.trim() ?? null,
      workRowCount: work?.querySelectorAll('[id^="row-"]').length ?? 0,
      viewportWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      documentClientWidth: document.documentElement.clientWidth,
      wideElements,
      clippedTextElements,
      figures,
      tenantName:
        document
          .querySelector<HTMLElement>('[class*="tenant-identity"]')
          ?.innerText.trim() ?? null,
      themeScheme: stepRoot ? getComputedStyle(stepRoot).colorScheme : null,
      unreviewedReadError: null,
    };
  }, expectedStepIndex);
}
