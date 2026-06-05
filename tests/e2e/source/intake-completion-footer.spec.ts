import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

test.describe("Source intake completion footer contract", () => {
  test("completed intake routes to approval instead of the event canvas", () => {
    const root = process.cwd();
    const pagePath = join(root, "src/components/source/SourceOriginatePage.tsx");
    const footerPath = join(root, "src/components/source/intake/IntakeCompletionFooter.tsx");

    expect(existsSync(pagePath), pagePath).toBe(true);
    expect(existsSync(footerPath), footerPath).toBe(true);

    const page = readFileSync(pagePath, "utf8");
    const footer = readFileSync(footerPath, "utf8");

    expect(page).toContain("capturedFactsCount === intakeFields.length");
    expect(page).toContain("`/source/events/${payload.event.id}/approval`");
    expect(page).not.toContain("Opening event canvas");
    expect(page).not.toContain("Trigger is the only field required to open the event canvas");

    expect(footer).toContain('data-testid="source-intake-completion-footer"');
    expect(footer).toContain("Open event for approval");
    expect(footer).toContain("Captured facts checklist");
    expect(footer).toContain("After submit, you&apos;ll land on the approval page, not the canvas");
  });
});
