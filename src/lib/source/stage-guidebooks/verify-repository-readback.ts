// Proves the migration is not just applied but actually usable: calls the
// real repository function (`getSourceStageGuidebook`), the same seam
// production code will use, rather than asserting on raw SQL. "Schema
// exists" and "application can use it" are different claims — this checks
// the second one.
//
// Run with NODE_OPTIONS=--conditions=react-server (repository.ts imports
// "server-only", a Next.js build-time guard, not a runtime one; the
// react-server condition satisfies it outside the Next.js server-component
// tree, matching the pattern used elsewhere for CLI/CI verification of
// server-only modules).

import { getSourceStageGuidebook } from "./repository";

async function main() {
  const stageKey = "strategy" as const;
  // A tenant key with no override authored — this must fall back to the
  // global (client_key IS NULL) default, exercising the same fallback path
  // every real tenant without an override will hit.
  const clientKey = "verify-repository-readback-nonexistent-tenant";

  const guidebook = await getSourceStageGuidebook(stageKey, clientKey);

  if (!guidebook) {
    console.error(
      `x getSourceStageGuidebook("${stageKey}", ...) returned null — the seeded global guidebook was not readable through the repository function.`,
    );
    process.exit(1);
  }

  const problems: string[] = [];
  if (guidebook.stageKey !== stageKey) problems.push(`stageKey mismatch: ${guidebook.stageKey}`);
  if (guidebook.clientKey !== null) problems.push(`expected global (null) clientKey, got ${guidebook.clientKey}`);
  if (guidebook.status !== "published") problems.push(`expected status "published", got ${guidebook.status}`);
  if (!guidebook.title) problems.push("title is empty");
  if (guidebook.sections.length === 0) problems.push("sections array is empty");

  if (problems.length > 0) {
    console.error("x Repository readback returned a record, but it failed shape checks:");
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        stageKey: guidebook.stageKey,
        clientKey: guidebook.clientKey,
        title: guidebook.title,
        status: guidebook.status,
        sectionCount: guidebook.sections.length,
        version: guidebook.version,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("x Repository readback threw.");
  console.error(error);
  process.exit(1);
});
