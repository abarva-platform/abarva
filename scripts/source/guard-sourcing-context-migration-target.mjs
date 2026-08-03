#!/usr/bin/env node

const target = process.env.SOURCE_CONTEXT_MIGRATION_TARGET;
const productionApproved = process.env.SOURCE_CONTEXT_PRODUCTION_APPROVED === "true";

if (target === "lab" || target === "test") {
  console.log(JSON.stringify({ ok: true, target }));
  process.exit(0);
}

if (target === "production" && productionApproved) {
  console.log(JSON.stringify({ ok: true, target, productionApproved }));
  process.exit(0);
}

console.error(JSON.stringify({
  ok: false,
  error: "Refusing Source sourcing-context migration apply without explicit target approval.",
  required: "Set SOURCE_CONTEXT_MIGRATION_TARGET=lab for lab/test apply. For production promotion set SOURCE_CONTEXT_MIGRATION_TARGET=production and SOURCE_CONTEXT_PRODUCTION_APPROVED=true after lab proof review.",
}, null, 2));
process.exit(1);
