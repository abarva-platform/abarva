import { buildHomeDataQualityModel } from "@/lib/home/home-data-quality";

const repoRoot = process.cwd();
const prompts = [
  "What do we know about this context?",
  "What evidence supports this?",
  "What is missing?",
  "How complete is this context?",
  "Can aVa safely answer questions about this?",
  "Is this active context or candidate preview?",
  "What should the client provide next?",
  "What should be sent to Intelligence?",
];

const tenants = [
  { tenantKey: "skyharbor-air", tenantDisplayName: "SkyHarbor Air" },
  { tenantKey: "lakeshore-holdings", tenantDisplayName: "Lakeshore Holdings" },
];

const failures: string[] = [];

for (const tenant of tenants) {
  const model = buildHomeDataQualityModel({
    repoRoot,
    tenantKey: tenant.tenantKey,
    tenantDisplayName: tenant.tenantDisplayName,
  });
  for (const prompt of prompts) {
    const visiblePacket = [
      model.activeContextLabel,
      model.answerability.label,
      model.answerability.rationale,
      model.answerability.safeToAnswer.join(" "),
      model.answerability.routeToIntelligence.join(" "),
      model.answerability.limits.join(" "),
      model.gaps.map((gap) => gap.title).join(" "),
    ].join(" ");
    if (!visiblePacket.includes("Active Home context")) {
      failures.push(`${tenant.tenantKey}: prompt "${prompt}" does not preserve Active Home context.`);
    }
    if (!/partial|evidence|relationship|candidate|context/i.test(visiblePacket)) {
      failures.push(`${tenant.tenantKey}: prompt "${prompt}" lacks quality caveat language.`);
    }
    if (/strategy|portfolio|use-case|recommendations/i.test(prompt)) {
      failures.push(`${tenant.tenantKey}: Home QA prompt should not invite advisory synthesis.`);
    }
  }
  if (model.candidatePreview.previewRequested) {
    failures.push(`${tenant.tenantKey}: default Home model should not request candidate preview.`);
  }
  if (model.guardrails.candidateReadByDefault) {
    failures.push(`${tenant.tenantKey}: candidate data read by default.`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(
  `[home-data-quality-ava] passed ${prompts.length * tenants.length} scoped prompt checks.`,
);
