"use client";

const MODULES: readonly {
  readonly key: "knowledge" | "intelligence" | "moves" | "source" | "tower";
  readonly label: string;
}[] = [
  { key: "knowledge", label: "Knowledge" },
  { key: "intelligence", label: "Intelligence" },
  { key: "moves", label: "Moves" },
  { key: "source", label: "Source" },
  { key: "tower", label: "Tower" },
];

/**
 * Cross-product nav bar. Per the reconciliation matrix's `getModuleKnowledgePacket`
 * row (UI_VIEW_MODEL_ONLY): the real consumption contract has no "fetch a
 * cross-module packet header" query at all -- aVa's packet is built
 * server-side at ask() time from refs the current module already has in
 * view, by design, not pre-fetched for a nav bar. There is therefore no real
 * signal this component can check per non-Knowledge module today; every
 * module other than Knowledge itself stays disabled with an honest
 * "Not yet available for this tenant" reason rather than performing a
 * round-trip this build has nothing real to answer it with.
 */
export function ModuleSwitcher() {
  return (
    <nav className="flex items-center gap-1" aria-label="Product modules">
      {MODULES.map((m) => (
        <ModuleTab key={m.key} moduleKey={m.key} label={m.label} />
      ))}
    </nav>
  );
}

function ModuleTab({
  moduleKey,
  label,
}: {
  readonly moduleKey: (typeof MODULES)[number]["key"];
  readonly label: string;
}) {
  const isKnowledge = moduleKey === "knowledge";

  return (
    <button
      type="button"
      disabled={!isKnowledge}
      title={isKnowledge ? undefined : "Not yet available for this tenant"}
      className={`rounded-md px-2.5 py-1.5 text-sm ${
        isKnowledge
          ? "bg-white/15 font-medium text-white"
          : "cursor-not-allowed text-white/35"
      }`}
    >
      {label}
    </button>
  );
}
