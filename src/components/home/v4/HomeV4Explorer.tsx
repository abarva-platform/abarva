"use client";

import { useState } from "react";

import { COLORS } from "@/components/home/HomeEnterpriseBriefApp";

export interface HomeV4ExplorerItem {
  key: string;
  label: string;
  tone?: "green" | "amber" | "red" | "blue";
}

export interface HomeV4ExplorerGroup {
  title: string;
  items: HomeV4ExplorerItem[];
  defaultOpen?: boolean;
}

const TONE_COLOR: Record<NonNullable<HomeV4ExplorerItem["tone"]>, string> = {
  green: COLORS.teal,
  amber: COLORS.amber,
  red: COLORS.red,
  blue: COLORS.blue,
};

export function HomeV4Explorer({
  groups,
  selectedKey,
  onSelect,
}: {
  groups: HomeV4ExplorerGroup[];
  selectedKey: string;
  onSelect: (key: string) => void;
}) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((g) => [g.title, g.defaultOpen ?? true])),
  );

  return (
    <aside className="heb-v4-explorer" aria-label="Context Explorer">
      {groups.map((group) => {
        const isOpen = openGroups[group.title] ?? true;
        return (
          <div key={group.title} className="heb-v4-explorer-group">
            <button
              type="button"
              className="heb-v4-explorer-group-head"
              onClick={() => setOpenGroups((prev) => ({ ...prev, [group.title]: !isOpen }))}
              aria-expanded={isOpen}
            >
              <span className={`heb-v4-explorer-disclosure${isOpen ? " open" : ""}`}>▶</span>
              {group.title}
            </button>
            {isOpen ? (
              <ul className="heb-v4-explorer-items">
                {group.items.map((item) => (
                  <li key={item.key}>
                    <button
                      type="button"
                      className={
                        item.key === selectedKey
                          ? "heb-v4-explorer-item selected"
                          : "heb-v4-explorer-item"
                      }
                      onClick={() => onSelect(item.key)}
                    >
                      <span
                        className="heb-v4-explorer-dot"
                        style={{ background: TONE_COLOR[item.tone ?? "blue"] }}
                      />
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
      <style jsx global>{`
        .heb-v4-explorer {
          width: 240px;
          flex: none;
          padding: 8px 6px;
          border-right: 1px solid ${COLORS.line};
          background: ${COLORS.rail};
          position: sticky;
          top: 0;
          align-self: start;
          height: calc(100vh - 64px);
          overflow: auto;
        }
        .heb-v4-explorer-group {
          margin-bottom: 4px;
        }
        .heb-v4-explorer-group-head {
          display: flex;
          align-items: center;
          gap: 6px;
          width: 100%;
          padding: 6px 8px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          font-weight: 800;
          color: #6c778b;
          text-align: left;
        }
        .heb-v4-explorer-disclosure {
          display: inline-block;
          font-size: 8px;
          color: #8b887f;
          transition: transform 0.12s ease;
          transform: rotate(0deg);
        }
        .heb-v4-explorer-disclosure.open {
          transform: rotate(90deg);
        }
        .heb-v4-explorer-items {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .heb-v4-explorer-item {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 6px 10px 6px 26px;
          background: none;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          color: ${COLORS.ink};
          text-align: left;
        }
        .heb-v4-explorer-item:hover {
          background: rgba(0, 0, 0, 0.04);
        }
        .heb-v4-explorer-item.selected {
          background: ${COLORS.ink};
          color: #fffdf8;
        }
        .heb-v4-explorer-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          flex: none;
        }
      `}</style>
    </aside>
  );
}
