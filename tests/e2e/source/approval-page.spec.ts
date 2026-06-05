import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

test.describe("Source approval page contract", () => {
  test("approval page and governed action endpoints are present", () => {
    const root = process.cwd();
    const pagePath = join(
      root,
      "src/app/(maestro)/source/events/[eventId]/approval/page.tsx",
    );
    const cardPath = join(
      root,
      "src/components/source/approval/EventApprovalCard.tsx",
    );
    const coApproverRoute = join(
      root,
      "src/app/api/v1/source/events/[eventId]/route-to-co-approver/route.ts",
    );
    const requestChangesRoute = join(
      root,
      "src/app/api/v1/source/events/[eventId]/request-changes/route.ts",
    );

    for (const path of [
      pagePath,
      cardPath,
      coApproverRoute,
      requestChangesRoute,
    ]) {
      expect(existsSync(path), path).toBe(true);
    }

    const card = readFileSync(cardPath, "utf8");
    expect(card).toContain('data-testid="source-approval-approve"');
    expect(card).toContain("Other decisions");
    expect(card).toContain("source-approval-rationale");
    expect(card).toContain("source-approval-confirmation");
    expect(card).toContain("Self-approval notice");

    const page = readFileSync(pagePath, "utf8");
    expect(page).toContain("waiting_on_co_approver");
    expect(page).toContain("draft_revision");
    expect(page).toContain("currentUserCanApprove");
  });
});

