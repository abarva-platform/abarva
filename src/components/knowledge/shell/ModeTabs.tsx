"use client";

import { useKnowledgeApp, type KnowledgeMode } from "../knowledge-app-context";

const TABS: readonly { readonly key: KnowledgeMode; readonly label: string }[] =
  [
    { key: "brief", label: "Brief" },
    { key: "explore", label: "Explore" },
    { key: "relationships", label: "Relationships" },
    { key: "evidence", label: "Evidence & gaps" },
  ];

/**
 * Brief / Explore / Relationships / Evidence & gaps. The prototype's fifth tab
 * ("Design notes", its own authoring notes) is intentionally NOT reproduced
 * here per the binding matrix row for that tab: "Do not ship this tab in
 * production; retain its content only as internal design documentation."
 */
export function ModeTabs() {
  const { mode, setMode } = useKnowledgeApp();
  return (
    <nav
      className="flex items-center gap-1 border-b border-[rgba(10,10,11,0.1)] px-1"
      aria-label="Knowledge mode"
    >
      {TABS.map((tab) => {
        const active = mode === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => setMode(tab.key)}
            aria-current={active ? "page" : undefined}
            className={`border-b-2 px-3 py-2.5 text-sm transition-colors ${
              active
                ? "border-[#0066CC] font-medium text-[#2c2c2a]"
                : "border-transparent text-[#5f5e5a] hover:text-[#2c2c2a]"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
