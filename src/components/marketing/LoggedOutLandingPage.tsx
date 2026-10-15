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
              style={{ height: 34, width: "auto", display: "block", maxWidth: "45vw" }}
            />
            <div className="navlinks">
              <Link className="btn btn-line" href="/demo">Watch the demo</Link>
              <Link className="btn btn-dark" href="/sign-in">
                Sign in
              </Link>
              <button className="btn btn-prime" type="button" data-request-access>
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
              Turn AI ambition into{" "}
              <span className="grad">governed execution</span> and measurable
              value.
            </h1>
            <p className="fb-sub">
              Nexus connects enterprise context, Anthropic Claude reasoning and human
              decisions. Choose the right investments, build the business case,
              improve supplier economics, and track the outcome.
            </p>
            <div className="fb-cta">
              <Link className="btn btn-line" href="/demo">Watch the Nexus demo</Link>
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
                Measurable value
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
                <div className="fb-dim-h">
                  See the bet that won&rsquo;t land — and move the money to two
                  that will.
                </div>
                <div className="fb-dim-sig">
                  <span>Readiness</span>
                  <b>Review before funding</b>
                </div>
              </div>
            </div>
            <div className="fb-dim">
              <span className="fb-dim-n">02</span>
              <div className="fb-dim-card">
                <div className="fb-dim-k">Source · at the table</div>
                <div className="fb-dim-h">
                  Walk into the negotiation already holding the evidence.
                </div>
                <div className="fb-dim-sig">
                  <span>Leverage</span>
                  <b>Compare on evidence</b>
                </div>
              </div>
            </div>
            <div className="fb-dim">
              <span className="fb-dim-n">03</span>
              <div className="fb-dim-card">
                <div className="fb-dim-k">Prove · after launch</div>
                <div className="fb-dim-h">
                  Show exactly where the value showed up — and defend it.
                </div>
                <div className="fb-dim-sig">
                  <span>Value</span>
                  <b>projected → validated</b>
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
                <b>5 surfaces</b>
                <span>one governed loop</span>
              </div>
              <div className="fb-stat">
                <b>Every gate</b>
                <span>human-approved</span>
              </div>
              <div className="fb-stat">
                <b>Value proof</b>
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
          <h2 className="lead">
            AI spend is moving faster than enterprise control.
          </h2>
          <p className="body body-wide">
            Boards are asking for AI growth. Business units are launching
            pilots. Vendors are pushing platforms. Transformation teams are
            trying to scale use cases. But most companies still lack one
            governed system to connect funding decisions, program execution,
            sourcing choices, adoption, risk, and value proof.
          </p>
          <div className="question-grid">
            <div className="quote-box">
              <div>
                <div className="eyebrow" style={{ color: "#8fb6ff" }}>
                  The real failure point
                </div>
                <h3>
                  Enterprise AI is not failing only at the model layer. It is
                  failing at the decision, funding, sourcing, execution, and
                  value-realization layer.
                </h3>
              </div>
              <p>
                The bottleneck is not ambition. It is the missing operating
                system from board intent to measurable outcome.
              </p>
            </div>
            <div className="q-list">
              <div className="q-line">
                <span>→</span>
                <b>Which AI bets should we fund?</b>
              </div>
              <div className="q-line">
                <span>→</span>
                <b>Which should we stop early?</b>
              </div>
              <div className="q-line">
                <span>→</span>
                <b>Who owns the value?</b>
              </div>
              <div className="q-line">
                <span>→</span>
                <b>Are we sourcing the right partners?</b>
              </div>
              <div className="q-line">
                <span>→</span>
                <b>Can we prove the outcome after launch?</b>
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
          <div className="eyebrow">One platform · five connected surfaces</div>
          <h2 className="lead">Five surfaces. One continuous loop.</h2>
          <p className="body">
            Each module reuses the same governed enterprise context. Decisions
            and reviewed outcomes carry forward, instead of becoming another
            disconnected report.
          </p>
          <div className="surfaces" id="surfaces-row">
            <div className="surf">
              <div className="smg" style={{ backgroundImage: "url(/marketing/surf-context.png)" }} />
              <b>Home</b>
              <p>Establish the enterprise context: its strategy, operations, systems, owners and evidence gaps.</p>
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
                Decide which AI bets are worth it — and which to kill or reshape
                early.
              </p>
            </div>
            <div className="surf">
              <div
                className="smg"
                style={{ backgroundImage: "url(/marketing/surf-moves.png)" }}
              />
              <b>Moves</b>
              <p>
                Turn a bet into an execution-ready program — sponsor, scope,
                value logic, gates.
              </p>
            </div>
            <div className="surf">
              <div
                className="smg"
                style={{ backgroundImage: "url(/marketing/surf-source.png)" }}
              />
              <b>Source</b>
              <p>
                Negotiate from evidence on every vendor, SI, and platform
                decision.
              </p>
            </div>
            <div className="surf">
              <div
                className="smg"
                style={{ backgroundImage: "url(/marketing/surf-tower.png)" }}
              />
              <b>Tower</b>
              <p>
                Connect investment, adoption and outcomes to the next decision:
                scale, repair or stop.
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
              <div className="eyebrow">Inside the product</div>
          <h2 className="lead">Inside the Nexus workflow.</h2>
            </div>
            <p className="body">
            An illustrative product preview. Watch the walkthrough to follow
            the workflow, decision gates and evidence together.
            </p>
          </div>
          <div className="product-frame">
            <img
              src="/marketing/moves-real.png"
              alt="AbarVa Strategic Moves — illustrative product view"
            />
            <span className="pf-tag">Illustrative</span>
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
            <span className="chip">Measurable value</span>
            <span className="chip">Clear accountability</span>
          </div>
          <p className="body" style={{ marginTop: 24 }}>
            Built for CIOs, CDAOs, CFOs, CPOs, and transformation leaders
            accountable for outcomes. Client-specific detail, methodology, and
            sample value loops are shown only in private preview.
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
              Limited launch cohort
            </span>
            <h2>
              Bring one real AI initiative. We will pressure-test the bet
              together.
            </h2>
            <p>
              AbarVa is opening a small number of founder-led private previews
              for enterprise leaders preparing to fund, scale, source, or govern
              major AI programs.
            </p>
            <div className="bring">
              Pressure-test value · expose execution risk · clarify the path to
              proof
            </div>
            <br />
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
            The AI value operating system for governed execution and measurable
            outcomes.
            <br />
            <span style={{ fontSize: 11 }}>© 2026 AbarVa, Inc.</span>
          </div>
        </div>
      </footer>

      <RequestAccessController />
    </div>
  );
}
