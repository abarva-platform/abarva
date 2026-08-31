import type { BusinessBriefing } from "./business-briefing";
import { MONO, PAGE_X, SANS, SERIF, V4, eyebrow } from "./tokens";

/**
 * The first-ten-minutes briefing, rendered above anything about the technology estate.
 *
 * A new executive reads down: how the money is made, what the enterprise says it is trying to do,
 * where its leaders agree and disagree, what they actually said, and which industry patterns the
 * record says apply. Then the blind spots, in the same visual weight as everything else, because a
 * briefing that hides its own gaps is the one that gets someone in trouble in their second week.
 */
export function BusinessBriefingSections({ briefing }: { briefing: BusinessBriefing }) {
  if (briefing.sections.length === 0) return null;
  return (
    <div data-home-briefing style={{ display: "flex", flexDirection: "column", gap: 30, padding: `30px ${PAGE_X}px 0` }}>
      {briefing.sections.map((section) => (
        <section key={section.heading} data-home-briefing-section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={eyebrow(V4.slate)}>{section.heading}</span>
            {section.standfirst ? (
              <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 14.5, color: V4.slate }}>
                {section.standfirst}
              </span>
            ) : null}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {section.items.map((item, i) => (
              <div
                key={`${section.heading}-${i}`}
                style={{
                  background: V4.surface,
                  border: `1px solid ${V4.rule}`,
                  padding: "15px 18px",
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  gap: "5px 20px",
                  alignItems: "start",
                }}
              >
                <p style={{ margin: 0, fontFamily: SANS, fontSize: 15, lineHeight: 1.52, maxWidth: "74ch" }}>
                  {item.text}
                </p>
                {item.detail && !item.attribution ? (
                  item.detail.length <= 24 ? (
                    <span style={{ ...eyebrow(V4.stone), fontSize: 10, whiteSpace: "nowrap", paddingTop: 4 }}>{item.detail}</span>
                  ) : (
                    <p style={{ margin: 0, gridColumn: "1 / -1", fontFamily: SANS, fontSize: 13, color: V4.slate, lineHeight: 1.5, maxWidth: "80ch" }}>
                      {item.detail}
                    </p>
                  )
                ) : null}
                {item.attribution ? (
                  <span style={{ fontFamily: MONO, fontSize: 10.5, color: V4.slate, textAlign: "right", whiteSpace: "nowrap", paddingTop: 3 }}>
                    {item.attribution}
                  </span>
                ) : null}
                {item.detail && item.attribution ? (
                  <p style={{ margin: 0, gridColumn: "1 / -1", fontFamily: SANS, fontSize: 13, color: V4.slate, lineHeight: 1.5, maxWidth: "80ch" }}>
                    {item.detail}
                  </p>
                ) : null}
                {item.caveat ? (
                  <p
                    data-home-briefing-caveat
                    style={{
                      margin: 0,
                      gridColumn: "1 / -1",
                      fontFamily: SANS,
                      fontSize: 12.5,
                      lineHeight: 1.5,
                      color: V4.slate,
                      maxWidth: "80ch",
                      borderLeft: `2px solid ${V4.amber}`,
                      paddingLeft: 11,
                    }}
                  >
                    {item.caveat}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ))}

      {briefing.notInTheRecord.length > 0 ? (
        <section data-home-briefing-gaps style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={eyebrow(V4.amber)}>What a new executive would ask that this record cannot answer</span>
            <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 14.5, color: V4.slate }}>
              Named rather than omitted — silence here would read as &ldquo;no issue&rdquo;.
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {briefing.notInTheRecord.map((gap) => (
              <div
                key={gap.question}
                style={{
                  background: V4.surface,
                  border: `1px solid ${V4.rule}`,
                  boxShadow: `inset 3px 0 0 ${V4.amber}`,
                  padding: "15px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                }}
              >
                <p style={{ margin: 0, fontFamily: SANS, fontSize: 15, lineHeight: 1.5, maxWidth: "70ch" }}>{gap.question}</p>
                <p style={{ margin: 0, fontFamily: SANS, fontSize: 13, lineHeight: 1.5, color: V4.slate, maxWidth: "76ch" }}>
                  {gap.why}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
