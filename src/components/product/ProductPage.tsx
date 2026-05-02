"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { ProductDiagram } from "@/components/product/ProductDiagrams";
import {
  PRODUCT_TAB_BY_KEY,
  PRODUCT_TABS,
  type ProductTabKey,
} from "@/lib/product/product-page-content";
import { SHELL } from "@/lib/shell/shell-tokens";

function normalizeHash(hash: string): ProductTabKey {
  const key = hash.replace(/^#/, "") as ProductTabKey;
  return PRODUCT_TAB_BY_KEY.has(key) ? key : "architecture";
}

const AGENT_STATES = [
  {
    key: "ambient",
    label: "Ambient",
    title: "Atlas watches the operating picture.",
    body: "Portfolio signals, tenant context, and corpus gaps stay close without interrupting the workspace.",
  },
  {
    key: "engaged",
    label: "Engaged",
    title: "Atlas explains what changed.",
    body: "The agent turns Product doctrine into route guidance, training prompts, and validation questions.",
  },
  {
    key: "focus",
    label: "Focus",
    title: "Atlas helps convert intent into action.",
    body: "An executive, operator, or client team can move from concept to Setup, Intelligence, Programs, Source, or Tower.",
  },
] as const;

type AgentStateKey = (typeof AGENT_STATES)[number]["key"];

export function ProductPage() {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [activeKey, setActiveKey] = useState<ProductTabKey>(() =>
    typeof window === "undefined"
      ? "architecture"
      : normalizeHash(window.location.hash),
  );
  const [agentStateKey, setAgentStateKey] = useState<AgentStateKey>("ambient");
  const activeTab = useMemo(
    () => PRODUCT_TAB_BY_KEY.get(activeKey) ?? PRODUCT_TABS[0],
    [activeKey],
  );
  const activeAgentState = useMemo(
    () =>
      AGENT_STATES.find((state) => state.key === agentStateKey) ??
      AGENT_STATES[0],
    [agentStateKey],
  );

  useEffect(() => {
    const handleHashChange = () =>
      setActiveKey(normalizeHash(window.location.hash));
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  function selectTab(key: ProductTabKey) {
    setActiveKey(key);
    window.history.replaceState(null, "", `#${key}`);
  }

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const lastIndex = PRODUCT_TABS.length - 1;
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight")
      nextIndex = index === lastIndex ? 0 : index + 1;
    if (event.key === "ArrowLeft")
      nextIndex = index === 0 ? lastIndex : index - 1;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = lastIndex;

    if (nextIndex === null) return;
    event.preventDefault();
    const nextTab = PRODUCT_TABS[nextIndex];
    selectTab(nextTab.key);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <main className="product-page" data-testid="product-page">
      <style jsx>{`
        .product-page {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          background:
            radial-gradient(
              circle at 12% 8%,
              rgba(216, 161, 95, 0.2),
              transparent 26%
            ),
            radial-gradient(
              circle at 82% 12%,
              rgba(169, 207, 208, 0.28),
              transparent 28%
            ),
            linear-gradient(135deg, #fbfaf7 0%, #f3eee4 56%, #eae1d2 100%);
          color: ${SHELL.INK};
          padding: clamp(24px, 4vw, 52px);
        }

        .product-page__shell {
          max-width: 1220px;
          margin: 0 auto;
          display: grid;
          gap: 24px;
        }

        .product-page__hero {
          border: 1px solid rgba(12, 26, 58, 0.12);
          border-radius: 28px;
          background: rgba(253, 251, 246, 0.86);
          box-shadow: 0 28px 80px rgba(12, 26, 58, 0.11);
          padding: clamp(24px, 4vw, 46px);
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(280px, 0.7fr);
          gap: clamp(26px, 5vw, 64px);
          align-items: center;
          position: relative;
          overflow: hidden;
        }

        .product-page__hero::after {
          content: "";
          position: absolute;
          inset: auto -80px -120px auto;
          width: 340px;
          height: 340px;
          border-radius: 999px;
          border: 1px solid rgba(12, 26, 58, 0.12);
          background: rgba(198, 215, 194, 0.28);
        }

        .product-page__eyebrow,
        .product-page__mono {
          font-family: ${SHELL.MONO};
          font-size: 10px;
          line-height: 1.45;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: ${SHELL.INK_MUTED};
          font-weight: 800;
        }

        .product-page__title {
          margin: 14px 0 18px;
          font-family: ${SHELL.SERIF};
          font-size: clamp(42px, 7vw, 82px);
          line-height: 0.9;
          letter-spacing: -0.06em;
          max-width: 860px;
        }

        .product-page__lede {
          margin: 0;
          max-width: 760px;
          color: ${SHELL.INK_SOFT};
          font-family: ${SHELL.SANS};
          font-size: clamp(17px, 2vw, 21px);
          line-height: 1.55;
        }

        .product-page__hero-card {
          position: relative;
          z-index: 1;
          border: 1px solid ${SHELL.CARD_LINE};
          border-radius: 22px;
          padding: 22px;
          background: #fffdf8;
          display: grid;
          gap: 18px;
        }

        .product-page__hero-card-title {
          margin: 0;
          font-family: ${SHELL.SERIF};
          font-size: 30px;
          line-height: 1.02;
          letter-spacing: -0.04em;
        }

        .product-page__hero-card p {
          margin: 0;
          color: ${SHELL.INK_SOFT};
          font-family: ${SHELL.SANS};
          font-size: 14px;
          line-height: 1.55;
        }

        .product-page__agent-state-card {
          border: 1px solid ${SHELL.CARD_LINE};
          border-radius: 18px;
          background: linear-gradient(135deg, #f8f2e8 0%, #eef3e9 100%);
          padding: 14px;
          display: grid;
          gap: 12px;
        }

        .product-page__agent-state-controls {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 6px;
        }

        .product-page__agent-state-button {
          border: 1px solid transparent;
          border-radius: 999px;
          min-height: 30px;
          background: rgba(255, 253, 248, 0.72);
          color: ${SHELL.INK_SOFT};
          font-family: ${SHELL.MONO};
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.11em;
          text-transform: uppercase;
          cursor: pointer;
        }

        .product-page__agent-state-button[aria-pressed="true"] {
          border-color: rgba(12, 26, 58, 0.18);
          background: ${SHELL.INK};
          color: #fffdf8;
        }

        .product-page__agent-state-body {
          display: grid;
          gap: 5px;
          min-height: 86px;
        }

        .product-page__agent-state-body strong {
          font-family: ${SHELL.SERIF};
          font-size: 24px;
          line-height: 1.02;
          letter-spacing: -0.035em;
          color: ${SHELL.INK};
        }

        .product-page__tabs {
          position: sticky;
          top: 0;
          z-index: 3;
          border: 1px solid rgba(12, 26, 58, 0.12);
          border-radius: 18px;
          background: rgba(253, 251, 246, 0.94);
          backdrop-filter: blur(18px);
          padding: 8px;
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 6px;
          box-shadow: 0 18px 44px rgba(12, 26, 58, 0.07);
        }

        .product-page__tab {
          border: 0;
          border-radius: 13px;
          min-height: 44px;
          padding: 0 12px;
          background: transparent;
          color: ${SHELL.INK_SOFT};
          font-family: ${SHELL.SANS};
          font-size: 13px;
          font-weight: 720;
          letter-spacing: -0.02em;
          cursor: pointer;
          transition:
            background 160ms ease,
            color 160ms ease,
            box-shadow 160ms ease,
            transform 160ms ease;
        }

        .product-page__tab:hover {
          color: ${SHELL.INK};
          background: rgba(237, 228, 213, 0.54);
        }

        .product-page__tab[aria-selected="true"] {
          color: ${SHELL.INK};
          background: #ede4d5;
          box-shadow: inset 0 0 0 1px rgba(12, 26, 58, 0.08);
        }

        .product-page__tab:focus-visible,
        .product-page__agent-state-button:focus-visible {
          outline: 2px solid ${SHELL.INK};
          outline-offset: 3px;
        }

        .product-page__content {
          display: grid;
          grid-template-columns: minmax(0, 0.88fr) minmax(360px, 1.12fr);
          gap: 24px;
          align-items: start;
          scroll-margin-top: 88px;
        }

        .product-page__panel,
        .product-page__diagram-card {
          border: 1px solid rgba(12, 26, 58, 0.12);
          border-radius: 24px;
          background: rgba(253, 251, 246, 0.9);
          box-shadow: 0 20px 54px rgba(12, 26, 58, 0.075);
        }

        .product-page__panel {
          padding: clamp(22px, 3vw, 34px);
          display: grid;
          gap: 26px;
        }

        .product-page__panel h2 {
          margin: 8px 0 0;
          font-family: ${SHELL.SERIF};
          font-size: clamp(34px, 4.6vw, 58px);
          line-height: 0.95;
          letter-spacing: -0.055em;
        }

        .product-page__summary,
        .product-page__question {
          margin: 0;
          color: ${SHELL.INK_SOFT};
          font-family: ${SHELL.SANS};
          font-size: 16px;
          line-height: 1.62;
        }

        .product-page__question {
          color: ${SHELL.INK_MID};
          border-left: 3px solid #d8a15f;
          padding-left: 14px;
          font-weight: 650;
        }

        .product-page__proof-grid {
          display: grid;
          gap: 12px;
        }

        .product-page__proof-card {
          border: 1px solid ${SHELL.CARD_LINE};
          border-radius: 16px;
          background: #fffdf8;
          padding: 16px;
          transition:
            transform 180ms ease,
            box-shadow 180ms ease,
            border-color 180ms ease;
        }

        .product-page__proof-card:hover {
          border-color: rgba(12, 26, 58, 0.2);
          box-shadow: 0 12px 30px rgba(12, 26, 58, 0.06);
          transform: translateY(-1px);
        }

        .product-page__proof-card strong {
          display: block;
          margin: 6px 0;
          font-family: ${SHELL.SERIF};
          font-size: 22px;
          letter-spacing: -0.035em;
        }

        .product-page__proof-card p,
        .product-page__list li {
          color: ${SHELL.INK_SOFT};
          font-family: ${SHELL.SANS};
          font-size: 14px;
          line-height: 1.55;
        }

        .product-page__proof-card p {
          margin: 0;
        }

        .product-page__section-title {
          margin: 0 0 12px;
          font-family: ${SHELL.MONO};
          color: ${SHELL.INK_MUTED};
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .product-page__list {
          margin: 0;
          padding-left: 19px;
          display: grid;
          gap: 9px;
        }

        .product-page__diagram-card {
          position: sticky;
          top: 82px;
          overflow: hidden;
        }

        .product-page__diagram-card figure {
          margin: 0;
        }

        .product-page__diagram-card svg {
          display: block;
          width: 100%;
          height: auto;
        }

        .product-page__diagram-caption {
          padding: 18px 22px 22px;
          border-top: 1px solid ${SHELL.CARD_LINE};
          background: #fffdf8;
        }

        .product-page__diagram-caption h3 {
          margin: 0 0 7px;
          font-family: ${SHELL.SERIF};
          font-size: 27px;
          letter-spacing: -0.04em;
        }

        .product-page__diagram-caption p {
          margin: 0;
          color: ${SHELL.INK_SOFT};
          font-family: ${SHELL.SANS};
          font-size: 14px;
          line-height: 1.55;
        }

        @media (max-width: 980px) {
          .product-page__hero,
          .product-page__content {
            grid-template-columns: 1fr;
          }

          .product-page__tabs {
            display: flex;
            overflow-x: auto;
            scrollbar-width: none;
          }

          .product-page__tab {
            flex: 0 0 auto;
            min-width: max-content;
          }

          .product-page__diagram-card {
            position: static;
          }
        }

        @media (max-width: 720px) {
          .product-page {
            padding: 16px;
          }

          .product-page__hero {
            border-radius: 22px;
          }

          .product-page__tabs {
            position: static;
            display: grid;
            grid-template-columns: 1fr;
            overflow: visible;
          }

          .product-page__tab {
            text-align: left;
            width: 100%;
          }

          .product-page__agent-state-controls {
            grid-template-columns: 1fr;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .product-page__tab,
          .product-page__proof-card {
            transition: none;
          }

          .product-page__proof-card:hover {
            transform: none;
          }
        }
      `}</style>

      <div className="product-page__shell">
        <section
          className="product-page__hero"
          aria-labelledby="product-page-title"
        >
          <div>
            <p className="product-page__eyebrow">
              Product narrative - enterprise AI operating layer
            </p>
            <h1 id="product-page-title" className="product-page__title">
              The cockpit for turning AI strategy into governed execution.
            </h1>
            <p className="product-page__lede">
              AbarVa combines client context, industry knowledge, lifecycle
              discipline, sourcing rigor, and portfolio observation so leaders
              can move from AI ambition to programs, decisions, savings, and
              measurable outcomes.
            </p>
          </div>
          <aside
            className="product-page__hero-card"
            aria-label="Product promise"
          >
            <p className="product-page__mono">Why this matters</p>
            <h2 className="product-page__hero-card-title">
              The agent is only powerful when the operating layer is powerful.
            </h2>
            <p>
              The Product surface explains what the app is, why its knowledge
              layer matters, and how a program team should train agents through
              structured context instead of one-off prompts.
            </p>
            <div
              className="product-page__agent-state-card"
              aria-label="Atlas agent state model"
            >
              <p className="product-page__mono">Atlas state model</p>
              <div
                className="product-page__agent-state-controls"
                aria-label="Choose agent state"
              >
                {AGENT_STATES.map((state) => (
                  <button
                    key={state.key}
                    type="button"
                    className="product-page__agent-state-button"
                    aria-pressed={agentStateKey === state.key}
                    onClick={() => setAgentStateKey(state.key)}
                  >
                    {state.label}
                  </button>
                ))}
              </div>
              <div
                className="product-page__agent-state-body"
                aria-live="polite"
              >
                <strong>{activeAgentState.title}</strong>
                <p>{activeAgentState.body}</p>
              </div>
            </div>
          </aside>
        </section>

        <nav
          className="product-page__tabs"
          aria-label="Product explanation tabs"
          role="tablist"
        >
          {PRODUCT_TABS.map((tab, index) => (
            <button
              key={tab.key}
              type="button"
              id={`${tab.key}-tab`}
              role="tab"
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              className="product-page__tab"
              aria-selected={activeKey === tab.key}
              aria-controls={`${tab.key}-panel`}
              tabIndex={activeKey === tab.key ? 0 : -1}
              onClick={() => selectTab(tab.key)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <section
          className="product-page__content"
          aria-labelledby={`${activeTab.key}-title`}
          id={`${activeTab.key}-panel`}
          role="tabpanel"
        >
          <article className="product-page__panel">
            <div>
              <p className="product-page__eyebrow">{activeTab.eyebrow}</p>
              <h2 id={`${activeTab.key}-title`}>{activeTab.title}</h2>
            </div>
            <p className="product-page__summary">{activeTab.summary}</p>
            <p className="product-page__question">
              {activeTab.operatorQuestion}
            </p>

            <div className="product-page__proof-grid" aria-label="Proof points">
              {activeTab.proofPoints.map((point) => (
                <div className="product-page__proof-card" key={point.label}>
                  <span className="product-page__mono">{point.label}</span>
                  <strong>{point.value}</strong>
                  <p>{point.explanation}</p>
                </div>
              ))}
            </div>

            <section>
              <h3 className="product-page__section-title">
                How a program team uses this
              </h3>
              <ol className="product-page__list">
                {activeTab.applicationSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>

            <section>
              <h3 className="product-page__section-title">
                How it translates to value
              </h3>
              <ul className="product-page__list">
                {activeTab.valueTranslation.map((value) => (
                  <li key={value}>{value}</li>
                ))}
              </ul>
            </section>
          </article>

          <aside
            className="product-page__diagram-card"
            aria-label={`${activeTab.diagramTitle} diagram`}
          >
            <figure>
              <ProductDiagram tabKey={activeTab.key} />
              <figcaption className="product-page__diagram-caption">
                <h3>{activeTab.diagramTitle}</h3>
                <p>{activeTab.diagramCaption}</p>
              </figcaption>
            </figure>
          </aside>
        </section>
      </div>
    </main>
  );
}
