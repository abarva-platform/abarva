"use client";

import { useId, useState } from "react";
import type { SourceNewPhaseKey } from "@/lib/source/new-workspace/phase-state";

type PreviewStep = {
  title: string;
  question: string;
  fields: readonly [string, string];
};

// Presentation structure only. These are not canonical stages or readiness gates.
const PHASE_PREVIEW_STEPS: Record<SourceNewPhaseKey, readonly PreviewStep[]> = {
  request: [
    {
      title: "Capture need",
      question: "What is the business need and who owns the decision?",
      fields: ["Business need", "Decision owner"],
    },
    {
      title: "Intake review",
      question: "Has the request been reviewed by the named authority?",
      fields: ["Request version", "Review decision"],
    },
  ],
  define: [
    {
      title: "Scope boundary",
      question: "What is in scope, and what is excluded?",
      fields: ["Scope", "Exclusions"],
    },
    {
      title: "Sourcing strategy",
      question: "Which approach and approvals govern this event?",
      fields: ["Sourcing motion", "Strategy approval"],
    },
  ],
  suppliers: [
    {
      title: "Candidate panel",
      question: "Which prospective suppliers are eligible for this event?",
      fields: ["Candidate", "Eligibility evidence"],
    },
    {
      title: "Contact authority",
      question: "Who may be contacted under the recorded policy?",
      fields: ["Named contact", "Contact policy"],
    },
    {
      title: "NDA coverage",
      question: "Which selected suppliers have executed NDA coverage?",
      fields: ["Published template", "Executed NDA"],
    },
  ],
  rfi: [
    {
      title: "Package content",
      question: "What scope and requirements will the market receive?",
      fields: ["Requirements", "Package version"],
    },
    {
      title: "Release review",
      question: "Who has approved this package for release?",
      fields: ["Approval authority", "Release decision"],
    },
    {
      title: "Issue record",
      question: "Which recipients and issue evidence are recorded?",
      fields: ["Recipients", "Issue evidence"],
    },
  ],
};

export function SourceNewPhasePreview({ phase }: { phase: SourceNewPhaseKey }) {
  const steps = PHASE_PREVIEW_STEPS[phase];
  const [selected, setSelected] = useState(0);
  const panelId = useId();
  const step = steps[selected];

  return (
    <section className="snw-preview" aria-label="Phase preview">
      <p className="snw-preview-status">
        Preview only. No step below is recorded for this event.
      </p>
      <div className="snw-preview-steps" role="tablist" aria-label="Preview steps">
        {steps.map((item, index) => (
          <button
            key={item.title}
            type="button"
            role="tab"
            id={`${panelId}-tab-${index}`}
            aria-controls={`${panelId}-panel`}
            aria-selected={selected === index}
            tabIndex={selected === index ? 0 : -1}
            onClick={() => setSelected(index)}
            onKeyDown={(event) => {
              let next = index;
              if (event.key === "ArrowRight") next = (index + 1) % steps.length;
              else if (event.key === "ArrowLeft") next = (index - 1 + steps.length) % steps.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = steps.length - 1;
              else return;
              event.preventDefault();
              setSelected(next);
              event.currentTarget.parentElement
                ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]
                ?.focus();
            }}
          >
            <span>{String(index + 1).padStart(2, "0")}</span> {item.title}
          </button>
        ))}
      </div>
      <div
        className="snw-preview-panel"
        id={`${panelId}-panel`}
        role="tabpanel"
        aria-labelledby={`${panelId}-tab-${selected}`}
      >
        <h3>{step.title}</h3>
        <p>{step.question}</p>
        <dl>
          {step.fields.map((field) => (
            <div key={field}>
              <dt>{field}</dt>
              <dd>Not recorded</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
