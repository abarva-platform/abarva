#!/usr/bin/env node

const command = process.argv[2] || "legacy dataset generation";

if (process.env.ALLOW_LEGACY_DATASET_GENERATION === "1") {
  console.error(
    `${command} is legacy-only. Invoke the underlying compatibility script directly with documented approval.`,
  );
  process.exit(2);
}

console.error(
  `${command} is blocked. Use standard v3 tenant inputs and neutral approved artifact stores instead.`,
);
process.exit(1);
