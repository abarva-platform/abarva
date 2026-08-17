"use client";

import { useMemo, useState } from "react";

import type {
  EnterpriseLandscapeViewModel,
  LandscapeSection,
  LandscapeTone,
} from "@/lib/home/enterprise-landscape-view-model";

/**
 * The advisory sections, rendered.
 *
 * They were already being built — fourteen sections, projected from canonical, grouped by the
 * advisory question each answers. They were passed into `surfaceContext` so aVa could ground its
 * answers on them, and then the canvas slot beside the chat was set to `null`.
 *
 * So the work existed and nobody could see it. A reader arriving at Intelligence got a chat box and
 * three suggested prompts, with no way to know the estate had been analysed at all — and no way to
 * check a figure aVa quoted, because the section it came from was never on screen.
 *
 * This renders them. Every number shown carries where it came from, because a section that says
 * "804 applications" without saying which build and how well evidenced is the same unverifiable
 * assertion the authored view model used to make.
 */

const TONE_CLASS: Record<LandscapeTone, string> = {
  teal: "border-l-[#3d6b48] bg-[#f4f8f5]",
  amber: "border-l-[#c98a3b] bg-[#fdf8f1]",
  red: "border-l-[#a33a28] bg-[#fdf3f1]",
};

const TAG_CLASS: Record<string, string> = {
  EVIDENCED: "bg-[#e8f0e9] text-[#3d6b48] border-[#bcd4c1]",
  DIRECTIONAL: "bg-[#fdf3e6] text-[#8a6d3b] border-[#e6d3b3]",
  "NOT SUPPLIED": "bg-[#fdf0ee] text-[#8a4030] border-[#e2c0b8]",
  "NO DIMENSION": "bg-[#f2f0ec] text-[#6b6659] border-[#ddd8ce]",
};

export function AdvisorySectionsCanvas({
  viewModel,
}: {
  viewModel: EnterpriseLandscapeViewModel;
}) {
  const groups = viewModel.navGroups;
  const [activeId, setActiveId] = useState(viewModel.defaultSectionId);
  const section: LandscapeSection | undefined = useMemo(
    () => viewModel.sections[activeId] ?? Object.values(viewModel.sections)[0],
    [viewModel.sections, activeId],
  );

  if (!section) {
    return (
      <div className="p-6 text-sm leading-6 text-[#475467]">
        No advisory sections are available for this client yet.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0">
      <nav className="w-56 shrink-0 overflow-y-auto border-r border-[#e4e7ec] bg-[#fbfcfd] py-4">
        {groups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="px-4 pb-1 font-mono text-[10px] uppercase tracking-wider text-[#98a2b3]">
              {group.label}
            </p>
            {group.sections.map((nav) => {
              const target = viewModel.sections[nav.id];
              // Sections with nothing behind them stay listed and are marked. Hiding them would
              // present a partial estate as a complete one.
              const empty =
                !target || target.currentState.every((row) => row.tag === "NOT SUPPLIED");
              return (
                <button
                  key={nav.id}
                  type="button"
                  onClick={() => setActiveId(nav.id)}
                  className={`flex w-full items-center justify-between gap-2 px-4 py-1.5 text-left text-[13px] leading-5 ${
                    nav.id === activeId
                      ? "bg-white font-semibold text-[#111827]"
                      : "text-[#475467] hover:bg-white"
                  }`}
                >
                  <span>{nav.label}</span>
                  {empty ? (
                    <span className="font-mono text-[9px] uppercase text-[#b54708]">gap</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="min-w-0 flex-1 overflow-y-auto px-6 py-5">
        <p className="font-mono text-[10px] uppercase tracking-wider text-[#98a2b3]">
          {section.eyebrow}
        </p>
        <h2 className="mt-1 text-xl font-semibold text-[#111827]">{section.title}</h2>
        <p className="mt-1 text-sm text-[#667085]">{section.subtitle}</p>

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
          {section.meta.map((m) => (
            <span key={m.label} className="font-mono text-[10px] uppercase tracking-wider text-[#98a2b3]">
              {m.label} <span className="text-[#475467]">{m.value}</span>
            </span>
          ))}
        </div>

        <p className="mt-4 text-sm leading-6 text-[#344054]">{section.executiveSummary}</p>

        <div className="mt-5 space-y-2">
          {section.currentState.map((row) => (
            <div
              key={`${row.area}-${row.tag}`}
              className={`rounded-sm border border-[#e4e7ec] border-l-[3px] p-3 ${TONE_CLASS[row.tone]}`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-[#111827]">{row.area}</p>
                <span
                  className={`rounded-sm border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
                    TAG_CLASS[row.tag] ?? "border-[#ddd8ce] bg-[#f2f0ec] text-[#6b6659]"
                  }`}
                >
                  {row.tag}
                </span>
              </div>
              <p className="mt-1 text-[13px] leading-5 text-[#475467]">{row.assessment}</p>
            </div>
          ))}
        </div>

        {section.maturity.length > 0 ? (
          <div className="mt-6">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#98a2b3]">
              Evidence coverage
            </p>
            {/* Not a maturity score. Nothing canonical scores maturity, and a number derived from
                record counts would read as an assessment while measuring how much the client typed. */}
            <div className="mt-2 space-y-1.5">
              {section.maturity.map((m) => (
                <div key={m.label} className="flex items-center gap-3">
                  <span className="w-64 shrink-0 truncate text-[12px] text-[#475467]">{m.label}</span>
                  <div className="h-1.5 flex-1 rounded-full bg-[#eef0f3]">
                    <div
                      className="h-1.5 rounded-full bg-[#3d6b48]"
                      style={{ width: `${Math.min(100, (m.score / 5) * 100)}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right font-mono text-[11px] tabular-nums text-[#667085]">
                    {m.score}/5
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {section.sources.length > 0 ? (
          <div className="mt-6 border-t border-[#e4e7ec] pt-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#98a2b3]">
              Traces to
            </p>
            <ul className="mt-2 space-y-1">
              {section.sources.map((s) => (
                <li key={s.title} className="text-[12px] leading-5 text-[#667085]">
                  <code className="text-[#344054]">{s.title}</code> — {s.detail}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="mt-5 text-[12px] leading-5 text-[#667085]">{section.leadershipRead}</p>
      </div>
    </div>
  );
}
