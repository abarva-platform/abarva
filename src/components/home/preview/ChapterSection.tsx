"use client";

import { ClaimCard } from "./ClaimCard";
import { GovernedVisual } from "./visuals/GovernedVisual";
import { HOME_HEX } from "./visuals/home-chart-kit";
import { StateBadge } from "@/components/knowledge/state/StateBanner";
import type { ChapterView, EnterpriseSignalPacket } from "@/lib/home/preview/types";

/**
 * One chapter's full composition: answer-first headline, executive synthesis, what matters (with
 * evidence one click away on every claim), a visual exhibit where one was assigned, tensions and
 * what to watch, and the questions worth asking management. This is the exact production payload
 * shape (ChapterView) -- nothing here is reshaped for the preview, so this component is what
 * `/home` would eventually render, not a preview-only stand-in for it.
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
  return (
    <section style={{ maxWidth: 860, padding: "40px 40px 96px" }}>
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
        <ChapterBlock heading="What matters">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {chapter.key_insights.map((claim) => (
              <ClaimCard key={claim.statement} claim={claim} signalPacket={signalPacket} />
            ))}
          </div>
        </ChapterBlock>
      ) : null}

      {chapter.visual_opportunities.length > 0 ? (
        <ChapterBlock heading="Exhibit">
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {chapter.visual_opportunities.map((visual) => (
              <GovernedVisual key={visual.dataset_ref + visual.title} visual={visual} visualDatasets={visualDatasets} />
            ))}
          </div>
        </ChapterBlock>
      ) : null}

      {chapter.tensions.length > 0 || chapter.what_to_watch.length > 0 ? (
        <ChapterBlock heading="Tensions & what to watch">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[...chapter.tensions, ...chapter.what_to_watch].map((claim) => (
              <ClaimCard key={claim.statement} claim={claim} signalPacket={signalPacket} tone="tension" />
            ))}
          </div>
        </ChapterBlock>
      ) : null}

      {chapter.questions_to_ask.length > 0 ? (
        <ChapterBlock heading="Questions worth asking management">
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
  );
}

function ChapterBlock({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{ margin: "0 0 12px", fontFamily: "var(--font-body-sans)", fontSize: 13, fontWeight: 600, color: HOME_HEX.textMuted, textTransform: "uppercase", letterSpacing: "0.03em" }}>
        {heading}
      </h3>
      {children}
    </div>
  );
}
