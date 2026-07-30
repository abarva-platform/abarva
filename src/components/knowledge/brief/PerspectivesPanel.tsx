"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";

/** Matrix row gate: "never show a quote without its paired evidence-tension
 * rows" -- a perspective missing any of the 4 structured rows is filtered
 * out here rather than rendered with blanks. */
export function PerspectivesPanel() {
  const { provider, providerCtx, lensId } = useKnowledgeApp();
  const envelope = useEnvelope(
    () => provider.listLeadershipPerspectives({ ...providerCtx, lensId }),
    [provider, providerCtx, lensId],
  );

  return (
    <GatedSection
      envelope={envelope}
      label="Leadership against evidence"
      emptyTitle="No leadership perspective published for this lens"
      emptyBody="executive_perspective_v1 must have all four structured evidence rows populated before a quote can render."
    >
      {(perspectives) => {
        const complete = perspectives.filter(
          (p) =>
            p.evidenceSupports &&
            p.evidenceChallenges &&
            p.stillUncertain &&
            p.ourReading,
        );
        if (complete.length === 0) {
          return (
            <p className="text-sm italic text-[#888780]">
              No leadership perspective published for this lens yet.
            </p>
          );
        }
        return (
          <div className="space-y-3">
            {complete.map((p) => (
              <article
                key={p.perspectiveId}
                className="rounded-md border border-[rgba(186,117,23,0.3)] bg-[rgba(186,117,23,0.06)] p-4"
              >
                <p className="text-sm italic text-[#2c2c2a]">
                  &ldquo;{p.quote}&rdquo;
                </p>
                <p className="mt-1 text-xs text-[#888780]">
                  {p.who} - {p.meta}
                  {p.sensitive ? " - restricted" : ""}
                </p>
                <dl className="mt-3 space-y-1.5 text-sm">
                  <Row label="Evidence supports" value={p.evidenceSupports} />
                  <Row
                    label="Evidence challenges"
                    value={p.evidenceChallenges}
                  />
                  <Row label="Still uncertain" value={p.stillUncertain} />
                  <Row label="Our reading" value={p.ourReading} />
                </dl>
              </article>
            ))}
          </div>
        );
      }}
    </GatedSection>
  );
}

function Row({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string | null;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-[#888780]">
        {label}
      </dt>
      <dd className="text-[#2c2c2a]">{value}</dd>
    </div>
  );
}
