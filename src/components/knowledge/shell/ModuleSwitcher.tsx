"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import type { ModuleKnowledgePacketSummary } from "@/lib/knowledge/providers/read-models";

const MODULES: readonly {
  readonly key: ModuleKnowledgePacketSummary["targetModule"];
  readonly label: string;
}[] = [
  { key: "knowledge", label: "Knowledge" },
  { key: "intelligence", label: "Intelligence" },
  { key: "moves", label: "Moves" },
  { key: "source", label: "Source" },
  { key: "tower", label: "Tower" },
];

/**
 * Cross-product nav bar. Per matrix row 1: module tabs other than Knowledge
 * are disabled with "Not yet available for this tenant" until
 * module_knowledge_packet_v1 resolves for that target module -- checked live
 * against the provider rather than hardcoded, so this flips on automatically
 * once a real packet exists.
 */
export function ModuleSwitcher() {
  const { provider, providerCtx } = useKnowledgeApp();

  return (
    <nav className="flex items-center gap-1" aria-label="Product modules">
      {MODULES.map((m) => (
        <ModuleTab
          key={m.key}
          moduleKey={m.key}
          label={m.label}
          provider={provider}
          providerCtx={providerCtx}
        />
      ))}
    </nav>
  );
}

function ModuleTab({
  moduleKey,
  label,
  provider,
  providerCtx,
}: {
  readonly moduleKey: ModuleKnowledgePacketSummary["targetModule"];
  readonly label: string;
  readonly provider: ReturnType<typeof useKnowledgeApp>["provider"];
  readonly providerCtx: ReturnType<typeof useKnowledgeApp>["providerCtx"];
}) {
  const isKnowledge = moduleKey === "knowledge";
  // Knowledge itself is always the active surface and never needs a packet
  // gate; every other module gates on its own packet resolution.
  const envelope = useEnvelope(
    () => provider.getModuleKnowledgePacket(providerCtx, moduleKey),
    [provider, providerCtx, moduleKey],
  );

  const enabled = isKnowledge || (envelope?.data?.headerResolved ?? false);

  return (
    <button
      type="button"
      disabled={!enabled}
      title={enabled ? undefined : "Not yet available for this tenant"}
      className={`rounded-md px-2.5 py-1.5 text-sm ${
        isKnowledge
          ? "bg-white/15 font-medium text-white"
          : enabled
            ? "text-white/70 hover:bg-white/10 hover:text-white"
            : "cursor-not-allowed text-white/35"
      }`}
    >
      {label}
    </button>
  );
}
