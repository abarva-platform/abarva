"use client";

import { ClaimCard } from "./ClaimCard";
import { GovernedVisual } from "./visuals/GovernedVisual";
import { HOME_HEX } from "./visuals/home-chart-kit";
import { StateBadge } from "@/components/knowledge/state/StateBanner";
import type { ChapterView, EnterpriseSignalPacket } from "@/lib/home/preview/types";

interface OnPageSection {
  id: string;
  label: string;
  count: number;
}

/**
 * One chapter's full composition: answer-first headline, executive synthesis, what matters (with
 * evidence one click away on every claim), a visual exhibit where one was assigned, tensions and
 * what to watch, and the questions worth asking management. This is the exact production payload
 * shape (ChapterView) -- nothing here is reshaped for the preview, so this component is what
 * `/home` would eventually render, not a preview-only stand-in for it.
 *
 * Two-column layout: prose stays a readable width (~720px, not stretched edge-to-edge -- wider
 * paragraphs hurt reading, not help it), with a sticky "On this page" + at-a-glance rail filling
 * the remaining width purposefully rather than leaving a wide monitor's right side empty.
 */
export function ChapterSection({
  chapter,
  signalPacket,
  visualDatasets,
}: {
  chapter: ChapterView;
  signalPacket: EnterpriseSignalPacket;
  visualDatasets: Record<string, Array<Record<string, unknown>>>;
}) {
  const hasContent = chapter.key_insights.length > 0 || chapter.tensions.length > 0;
  const tensionsAndWatch = [...chapter.tensions, ...chapter.what_to_watch];

  const sections: OnPageSection[] = [
    chapter.key_insights.length > 0 ? { id: "what-matters", label: "What matters", count: chapter.key_insights.length } : null,
    chapter.visual_opportunities.length > 0 ? { id: "exhibit", label: "Exhibit", count: chapter.visual_opportunities.length } : null,
    tensionsAndWatch.length > 0 ? { id: "tensions", label: "Tensions & what to watch", count: tensionsAndWatch.length } : null,
    chapter.questions_to_ask.length > 0 ? { id: "questions", label: "Questions worth asking", count: chapter.questions_to_ask.length } : null,
  ].filter((s): s is OnPageSection => s !== null);

  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 56, padding: "40px 56px 72px" }}>
      <section style={{ flex: "1 1 520px", maxWidth: 780, minWidth: 0 }}>
        <p style={{ margin: "0 0 8px", fontFamily: "var(--font-body-sans)", fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: HOME_HEX.teal }}>
          {chapter.title}
        </p>
        <h2 style={{ margin: "0 0 18px", fontFamily: "var(--font-body-serif)", fontSize: 28, lineHeight: 1.28, fontWeight: 600, color: HOME_HEX.textPrimary }}>
          {chapter.headline}
        </h2>
        <p style={{ margin: "0 0 32px", fontFamily: "var(--font-body-sans)", fontSize: 16, lineHeight: 1.65, color: HOME_HEX.textSecondary }}>
          {chapter.executive_synthesis}
        </p>

        {!hasContent ? (
          <div style={{ marginBottom: 32 }}>
            <StateBadge tone="gap" label="Coverage gap" />
            {chapter.limitations.map((note) => (
              <p key={note} style={{ marginTop: 10, fontFamily: "var(--font-body-sans)", fontSize: 13.5, color: HOME_HEX.textMuted, fontStyle: "italic" }}>
                {note}
              </p>
            ))}
          </div>
        ) : null}

        {chapter.key_insights.length > 0 ? (
          <ChapterBlock id="what-matters" heading="What matters">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {chapter.key_insights.map((claim) => (
                <ClaimCard key={claim.statement} claim={claim} signalPacket={signalPacket} />
              ))}
            </div>
          </ChapterBlock>
        ) : null}

        {chapter.visual_opportunities.length > 0 ? (
          <ChapterBlock id="exhibit" heading="Exhibit">
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {chapter.visual_opportunities.map((visual) => (
                <GovernedVisual key={visual.dataset_ref + visual.title} visual={visual} visualDatasets={visualDatasets} />
              ))}
            </div>
          </ChapterBlock>
        ) : null}

        {tensionsAndWatch.length > 0 ? (
          <ChapterBlock id="tensions" heading="Tensions & what to watch">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tensionsAndWatch.map((claim) => (
                <ClaimCard key={claim.statement} claim={claim} signalPacket={signalPacket} tone="tension" />
              ))}
            </div>
          </ChapterBlock>
        ) : null}

        {chapter.questions_to_ask.length > 0 ? (
          <ChapterBlock id="questions" heading="Questions worth asking management">
            <ul style={{ margin: 0, paddingLeft: 20, fontFamily: "var(--font-body-sans)", fontSize: 14.5, lineHeight: 1.75, color: HOME_HEX.textSecondary }}>
              {chapter.questions_to_ask.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </ChapterBlock>
        ) : null}

        {hasContent && chapter.limitations.length > 0 ? (
          <p style={{ marginTop: 24, fontFamily: "var(--font-body-sans)", fontSize: 12.5, color: HOME_HEX.textDisabled, fontStyle: "italic" }}>
            {chapter.limitations.join(" ")}
          </p>
        ) : null}
      </section>

      {sections.length > 0 ? <OnPageRail sections={sections} guidingQuestion={chapter.guidingQuestion} /> : null}
    </div>
  );
}

function ChapterBlock({ id, heading, children }: { id: string; heading: string; children: React.ReactNode }) {
  return (
    <div id={id} style={{ marginBottom: 32, scrollMarginTop: 24 }}>
      <h3 style={{ margin: "0 0 12px", fontFamily: "var(--font-body-sans)", fontSize: 13, fontWeight: 600, color: HOME_HEX.textMuted, textTransform: "uppercase", letterSpacing: "0.03em" }}>
        {heading}
      </h3>
      {children}
    </div>
  );
}

function OnPageRail({ sections, guidingQuestion }: { sections: OnPageSection[]; guidingQuestion: string }) {
  return (
    <aside
      style={{
        width: 264,
        flexShrink: 0,
        position: "sticky",
        top: 40,
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <div>
        <p style={{ margin: "0 0 6px", fontFamily: "var(--font-body-sans)", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: HOME_HEX.textDisabled }}>
          Guiding question
        </p>
        <p style={{ margin: 0, fontFamily: "var(--font-body-serif)", fontSize: 14.5, fontStyle: "italic", color: HOME_HEX.textMuted, lineHeight: 1.4 }}>
          {guidingQuestion}
        </p>
      </div>

      <div style={{ borderTop: `1px solid ${HOME_HEX.border}`, paddingTop: 16 }}>
        <p style={{ margin: "0 0 8px", fontFamily: "var(--font-body-sans)", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: HOME_HEX.textDisabled }}>
          On this page
        </p>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "5px 0",
                fontFamily: "var(--font-body-sans)",
                fontSize: 13,
                color: HOME_HEX.textSecondary,
                textDecoration: "none",
              }}
            >
              <span>{s.label}</span>
              <span style={{ color: HOME_HEX.textDisabled, fontFamily: "var(--font-body-mono)", fontSize: 11.5 }}>{s.count}</span>
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}
