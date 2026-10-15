import Link from "next/link";
import { RequestAccessController } from "./RequestAccessController";

type LoggedOutLandingPageProps = {
  signedOut?: boolean;
};

export function LoggedOutLandingPage({
  signedOut = false,
}: LoggedOutLandingPageProps) {
  return (
    <div className="abarva-landing">
      {/* ===== FULL-BLEED HERO ===== */}
      <header className="fbhero">
        <nav className="fb-nav">
          <div className="wrap">
            <img
              src="/brand/nexus/abarva-nexus-navbar-dark-clearance.svg"
              alt="Abarva Nexus"
              style={{
                height: 34,
                width: "auto",
                display: "block",
                maxWidth: "45vw",
              }}
            />
            <div className="navlinks">
              <Link className="btn btn-line" href="/demo">
                Watch the demo
              </Link>
              <Link className="btn btn-dark" href="/sign-in">
                Sign in
              </Link>
              <button
                className="btn btn-prime"
                type="button"
                data-request-access
              >
                Request access
              </button>
            </div>
          </div>
        </nav>
        <div className="wrap fb-content">
          <div className="fb-left">
            <span className="fb-pill">
              <span className="dot" />
              Private preview · founder-led
            </span>
            <h1 className="fb-head">
              Nexus. The <span className="grad">AI Success Platform.</span>
            </h1>
            <p className="fb-sub">
              Anthropic Claude is the reasoning engine. Nexus brings the
              enterprise context, workflows, governance and human decisions
              around it, so your team can build a credible investment case, act
              on supplier evidence and review the result.
            </p>
            <div className="fb-cta">
              <Link className="btn btn-line" href="/demo">
                Watch the Nexus demo
              </Link>
              <Link className="btn btn-dark" href="/sign-in">
                Sign in
              </Link>
            </div>
            <div className="fb-micro">
              <span>
                <i />
                Evidence before funding
              </span>
              <span>
                <i />
                Human approval at every gate
              </span>
              <span>
                <i />
                Evidence of outcomes
              </span>
            </div>
            {signedOut && (
              <div className="signed-out-note">
                You are signed out. The active workspace context has been
                cleared; use the private credentials from your invite to
                re-enter.
              </div>
            )}
          </div>
          <div className="fb-dims">
            <div className="fb-dim">
              <span className="fb-dim-n">01</span>
              <div className="fb-dim-card">
                <div className="fb-dim-k">Decide · before funding</div>
                <div className="fb-dim-h">Make the case before you spend.</div>
                <div className="fb-dim-sig">
                  <span>Decide</span>
                  <b>Compare options. Test the case.</b>
                </div>
              </div>
            </div>
            <div className="fb-dim">
              <span className="fb-dim-n">02</span>
              <div className="fb-dim-card">
                <div className="fb-dim-k">Source · at the table</div>
                <div className="fb-dim-h">
                  Challenge the commitment before you renew.
                </div>
                <div className="fb-dim-sig">
                  <span>Leverage</span>
                  <b>Connect terms, spend and service evidence.</b>
                </div>
              </div>
            </div>
            <div className="fb-dim">
              <span className="fb-dim-n">03</span>
              <div className="fb-dim-card">
                <div className="fb-dim-k">Prove · after launch</div>
                <div className="fb-dim-h">
                  Prove the result before you scale.
                </div>
                <div className="fb-dim-sig">
                  <span>Review</span>
                  <b>Separate usage from business value.</b>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="fb-stats">
          <div className="wrap">
            <div className="fb-stats-grid">
              <div className="fb-stat">
                <b>Evidence</b>
                <span>before a dollar is funded</span>
              </div>
              <div className="fb-stat">
                <b>5 modules</b>
                <span>one governed loop</span>
              </div>
              <div className="fb-stat">
                <b>Every gate</b>
                <span>human-approved</span>
              </div>
              <div className="fb-stat">
                <b>Outcome review</b>
                <span>projected · observed · validated</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ===== WHY NOW ===== */}
      <section className="why">
        <div className="wrap rv">
          <div className="eyebrow">Why now</div>
          <h2 className="lead">A capable model is not a business outcome.</h2>
          <p className="body body-wide">
            Buying an AI tool does not resolve fragmented information, unclear
            ownership or unchanged ways of working. Before funding a new idea,
            leaders need to understand the problem, the data it depends on, the
            people and processes that must change, and how the result will be
            measured.
          </p>
          <div className="question-grid">
            <div className="quote-box">
              <div>
                <div className="eyebrow" style={{ color: "#8fb6ff" }}>
                  The real failure point
                </div>
                <h3>
                  The model can reason. The enterprise still needs a way to
                  decide, fund, deliver and prove the change.
                </h3>
              </div>
              <p>
                Nexus connects those decisions to the same enterprise context,
                with evidence gaps, accountable owners and human review kept
                visible.
              </p>
            </div>
            <div className="q-list">
              <div className="q-line">
                <span>→</span>
                <b>
                  Is this problem worth solving, and is AI the right answer?
                </b>
              </div>
              <div className="q-line">
                <span>→</span>
                <b>
                  What data, operating model and adoption changes are needed?
                </b>
              </div>
              <div className="q-line">
                <span>→</span>
                <b>What will delivery cost, and who owns the business case?</b>
              </div>
              <div className="q-line">
                <span>→</span>
                <b>What should we challenge in our supplier commitments?</b>
              </div>
              <div className="q-line">
                <span>→</span>
                <b>
                  What evidence justifies scaling, repairing, pausing or
                  stopping?
                </b>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHERE VALUE LEAKS ===== */}

      {/* ===== OPERATING LOOP ===== */}

      {/* ===== PICTURE THIS — THREE MOMENTS ===== */}

      {/* ===== FIVE SURFACES ===== */}
      <section>
        <div className="wrap rv">
          <div className="eyebrow">One platform · five connected modules</div>
          <h2 className="lead">Five modules. One continuous loop.</h2>
          <p className="body">
            Home establishes the starting point. Intelligence tests the idea.
            Moves builds the plan. Source addresses supplier commitments. Tower
            reviews the result. Reviewed evidence informs the next decision.
          </p>
          <div className="surfaces" id="surfaces-row">
            <div className="surf">
              <div
                className="smg"
                style={{ backgroundImage: "url(/marketing/surf-context.png)" }}
              />
              <b>Home</b>
              <p>
                Establish the enterprise context: its strategy, operations,
                systems, owners and evidence gaps.
              </p>
            </div>
            <div className="surf">
              <div
                className="smg"
                style={{
                  backgroundImage: "url(/marketing/surf-intelligence.png)",
                }}
              />
              <b>Intelligence</b>
              <p>
                Compare AI assistance, process redesign and other options
                against your enterprise context. Identify the evidence needed
                before funding.
              </p>
            </div>
            <div className="surf">
              <div
                className="smg"
                style={{ backgroundImage: "url(/marketing/surf-moves.png)" }}
              />
              <b>Moves</b>
              <p>
                Originate, Charter, Discover, Design, Roadmap and Mobilize.
                Build the data foundation, governance, operating model, adoption
                plan, estimates and business case, with human decisions.
              </p>
            </div>
            <div className="surf">
              <div
                className="smg"
                style={{ backgroundImage: "url(/marketing/surf-source.png)" }}
              />
              <b>Source</b>
              <p>
                Source Optimize connects existing terms with spend and
                operational evidence. Source New structures the next event with
                deal-specific questions, requirements and release gates.
              </p>
            </div>
            <div className="surf">
              <div
                className="smg"
                style={{ backgroundImage: "url(/marketing/surf-tower.png)" }}
              />
              <b>Tower</b>
              <p>
                Review AI initiatives separately from tool adoption. Ask what
                outcome evidence is needed before scaling, repairing, pausing or
                stopping.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== INSIDE THE PRODUCT ===== */}
      <section
        style={{ background: "linear-gradient(180deg,#F8F7F4,#F3F1EC)" }}
      >
        <div className="wrap rv">
          <div className="section-head">
            <div>
              <div className="eyebrow">The connected product vision</div>
              <h2 className="lead">
                One enterprise context. Decisions that carry forward.
              </h2>
            </div>
            <p className="body">
              Strategy, operations, systems, owners and evidence form the
              reusable starting point. Claude reasons over the supplied context;
              workflows and people govern what happens next. Follow the actual
              recorded examples in the private walkthrough.
            </p>
          </div>
          <div className="product-frame">
            <img
              src="/marketing/nexus-governed-journey.png"
              alt="The connected Nexus journey: Home, Intelligence, Moves and Source, and Tower, above the governed enterprise context layer"
            />
            <span className="pf-tag">Product vision</span>
          </div>
        </div>
      </section>

      {/* ===== ROLES ===== */}

      {/* ===== PROOF MODEL ===== */}

      {/* ===== WHAT CHANGES ===== */}

      {/* ===== TRUST ===== */}
      <section>
        <div className="wrap rv">
          <div className="eyebrow">Designed for trust and control</div>
          <h2 className="lead">Governed by design. Human in command.</h2>
          <div className="trust">
            <span className="chip">Governed enterprise evidence</span>
            <span className="chip">Source-aware recommendations</span>
            <span className="chip">Human approval at every gate</span>
            <span className="chip">Decision and risk traceability</span>
            <span className="chip">Outcome evidence</span>
            <span className="chip">Clear accountability</span>
          </div>
          <p className="body" style={{ marginTop: 24 }}>
            Built for CIOs, CDAOs, CFOs, CPOs, and transformation leaders
            accountable for outcomes. Client-specific detail, methodology, and
            sample value loops are shown only in private preview.
          </p>
          <p className="body" style={{ marginTop: 18 }}>
            Recorded facts and deterministic calculations stay separate from
            Claude&apos;s explanations and proposed actions. A recommendation is
            not an approval, adoption is not ROI, and a projected benefit is not
            a Finance-confirmed result.
          </p>
        </div>
      </section>

      {/* ===== COHORT CTA ===== */}
      <section>
        <div className="wrap rv">
          <div className="cohort">
            <span
              className="pill"
              style={{
                background: "rgba(255,255,255,.08)",
                borderColor: "rgba(255,255,255,.16)",
                color: "#cdd8ea",
              }}
            >
              <span className="dot" />
              Start with one consequential decision
            </span>
            <h2>A Nexus decision review with Anand.</h2>
            <p>
              Bring one AI investment or one major contract. Review the context,
              the evidence gaps and the next accountable action with your team.
            </p>
            <button className="btn btn-prime" type="button" data-request-access>
              Request access
            </button>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer>
        <div
          className="wrap"
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 18,
            alignItems: "center",
          }}
        >
          <img
            src="/brand/nexus/abarva-nexus-navbar-light-clearance.svg"
            alt="Abarva Nexus"
            style={{ height: 26, width: "auto", display: "block" }}
          />
          <div>
            The AI Success Platform. Context, decisions, action and proof.
            <br />
            <span style={{ fontSize: 11 }}>© 2026 AbarVa, Inc.</span>
          </div>
          <p style={{ flexBasis: "100%", margin: 0, maxWidth: 780 }}>
            <strong>For consulting partners.</strong> A recurring platform
            relationship supported by integration, transformation and advisory
            services.
          </p>
        </div>
      </footer>

      <RequestAccessController />
    </div>
  );
}
