import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const workflow = readFileSync(
  resolve(process.cwd(), ".github/workflows/aca-main-deploy.yml"),
  "utf8",
);

describe("shared ACA Clerk configuration", () => {
  it("takes the browser key from the protected production environment", () => {
    expect(workflow).toContain(
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ vars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY }}",
    );
  });

  it("fails closed unless the browser key belongs to a live Clerk instance", () => {
    expect(workflow).toContain(
      'if [[ "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" != pk_live_* ]]; then',
    );
    expect(workflow).toContain(
      "Shared app.abarva.ai releases require a Clerk live publishable key.",
    );
  });

  it("updates auth configuration only alongside the digest-pinned image", () => {
    const updateStart = workflow.indexOf("if az containerapp update");
    const updateEnd = workflow.indexOf(
      "--output json | tee audit-artifacts/aca-main-deploy/containerapp-update.json",
      updateStart,
    );
    const updateBlock = workflow.slice(updateStart, updateEnd);

    expect(updateBlock).toContain('--image "$IMAGE"');
    expect(updateBlock).toContain(
      '"NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"',
    );
    expect(updateBlock).toContain(
      '"CLERK_SECRET_KEY=secretref:clerk-secret-key"',
    );
  });
});
