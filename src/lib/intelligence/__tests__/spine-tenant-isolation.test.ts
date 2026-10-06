import { getEnterpriseLandscapeViewModel } from "@/lib/home/enterprise-landscape-view-model";
import { ALL_CLIENTS } from "@/lib/client-config";
import { buildEnterpriseContextSpine } from "../enterprise-context-spine";

const GENERIC_WORDS = new Set([
  "clinical",
  "demo",
  "financial",
  "global",
  "group",
  "health",
  "holdings",
  "retail",
  "system",
  "technology",
]);

function searchTermsFor(name: string): string[] {
  const normalized = name.toLowerCase();
  const words = normalized
    .split(/\W+/)
    .filter((word) => word.length >= 5 && !GENERIC_WORDS.has(word));
  return Array.from(new Set([normalized, ...words]));
}

const CASES = ALL_CLIENTS.map((client, index) => ({
  index,
  client,
  terms: searchTermsFor(client.name),
}));

describe("context spine must never carry a foreign tenant name", () => {
  for (const { client, index, terms } of CASES) {
    it(`keeps tenant case ${index + 1} free of other tenants' names`, () => {
      const vm = getEnterpriseLandscapeViewModel({ clientKey: client.id });
      const spine = buildEnterpriseContextSpine(vm, Object.values(vm.sections));
      const all = Object.values(spine).flat().join("\n").toLowerCase();
      const ownTerms = new Set(terms);
      const foreignTerms = CASES.flatMap((tenant) =>
        tenant.client.id === client.id
          ? []
          : tenant.terms.filter((term) => !ownTerms.has(term)),
      );
      const hits = foreignTerms.filter((term) => all.includes(term));

      expect([index, hits]).toEqual([index, []]);
    });
  }
});
