"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { EXPLORE_DOMAINS, findInventoryKindConfig } from "./inventory-config";
import { InventoryTable } from "./InventoryTable";

/**
 * Explore mode: domain navigation is always visible (matrix row's own gate:
 * "Domain tab always visible; inventory panel underneath shows its own
 * gate/empty state") -- only the inventory panel itself gates on data.
 */
export function ExploreMode() {
  const { exploreInventoryKind, setExploreInventoryKind } = useKnowledgeApp();
  const config = findInventoryKindConfig(exploreInventoryKind);

  return (
    <div className="flex gap-6">
      <nav className="w-56 shrink-0 space-y-4" aria-label="Explore domains">
        {EXPLORE_DOMAINS.map((domain) => (
          <div key={domain.id}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#888780]">
              {domain.label}
            </p>
            <ul className="space-y-0.5">
              {domain.kinds.map((kind) => {
                const kindConfig = findInventoryKindConfig(kind);
                const active = kind === exploreInventoryKind;
                return (
                  <li key={kind}>
                    <button
                      type="button"
                      onClick={() => setExploreInventoryKind(kind)}
                      className={`w-full rounded-md px-2 py-1.5 text-left text-sm ${
                        active
                          ? "bg-white font-medium text-[#2c2c2a] shadow-sm"
                          : "text-[#444441] hover:bg-white/60"
                      }`}
                    >
                      {kindConfig.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="min-w-0 flex-1">
        <InventoryTable config={config} />
      </div>
    </div>
  );
}
