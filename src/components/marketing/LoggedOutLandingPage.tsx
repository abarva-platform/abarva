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
              src="/brand/abarva-logo-inverse.svg"
              alt="AbarVa"
              style={{ height: 24, width: "auto", display: "block" }}
            />
            <div className="navlinks">
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
              AbarVa helps enterprise leaders decide which AI bets deserve
              funding, turn them into governed programs, source with leverage,
              and prove whether value actually landed.
            </p>
            <div className="fb-cta">
              <Link className="btn btn-dark" href="/sign-in">
                Sign in
              </Link>
              <button className="btn btn-prime" type="button" data-request-access>
                Request access
              </button>
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
                  <b>72% · reshape</b>
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
                  <b>comparison ready</b>
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
      <section>
        <div className="wrap rv">
          <div className="eyebrow">Where value leaks</div>
          <h2 className="lead">
            Four places enterprise AI quietly loses its value.
          </h2>
          <div className="quad">
            <div className="qcard">
              <div className="qn">01</div>
              <b>Wrong bets get funded</b>
              <p>
                AI investments often move forward because they are visible,
                sponsored, or exciting — not because the evidence says they will
                land.
              </p>
            </div>
            <div className="qcard">
              <div className="qn">02</div>
              <b>Pilots never become programs</b>
              <p>
                Promising prototypes stall because ownership, workflow impact,
                data readiness, compliance, and adoption were never governed
                upfront.
              </p>
            </div>
            <div className="qcard">
              <div className="qn">03</div>
              <b>Vendors shape the agenda</b>
              <p>
                Enterprises enter platform, SI, and product decisions without a
                clear comparison model, value case, or negotiation leverage.
              </p>
            </div>
            <div className="qcard">
              <div className="qn">04</div>
              <b>Value becomes a story</b>
              <p>
                Benefits are claimed in business cases, but rarely tracked
                through adoption, operational change, financial impact, and
                accountability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== OPERATING LOOP ===== */}
      <section className="loop" id="loop">
        <div className="wrap rv">
          <div className="section-head">
            <div>
              <div className="eyebrow">What AbarVa does</div>
              <h2 className="lead">
                One governed AI value loop — from &ldquo;which bet?&rdquo; to
                &ldquo;did it land?&rdquo;
              </h2>
            </div>
            <p className="body">
              AbarVa keeps leaders in command while agents do the rigorous work:
              evidence assembly, program shaping, sourcing intelligence,
              governance signals, and value proof.
            </p>
          </div>

          <div className="loop-board">
            <div className="loop-step">
              <div className="num">01</div>
              <h3>Prioritize</h3>
              <p>
                Score AI opportunities against value potential, readiness, risk,
                sponsorship, data dependency, and execution complexity.
              </p>
              <div className="outcome">
                Output: ranked bets and kill/reshape signals.
              </div>
            </div>
            <div className="loop-step">
              <div className="num">02</div>
              <h3>Shape</h3>
              <p>
                Convert the selected bet into an execution-ready program with
                scope, sponsor, milestones, value logic, dependencies, and
                approval gates.
              </p>
              <div className="outcome">Output: governed program charter.</div>
            </div>
            <div className="loop-step">
              <div className="num">03</div>
              <h3>Source</h3>
              <p>
                Compare vendors, SIs, platforms, and internal build paths using
                structured evidence — not only sales narratives.
              </p>
              <div className="outcome">
                Output: sourcing leverage and deal risk.
              </div>
            </div>
            <div className="loop-step">
              <div className="num">04</div>
              <h3>Govern</h3>
              <p>
                Track execution across blockers, decisions, owners, risks,
                milestones, compliance gates, and human approvals.
              </p>
              <div className="outcome">
                Output: accountable execution rhythm.
              </div>
            </div>
            <div className="loop-step">
              <div className="num">05</div>
              <h3>Prove</h3>
              <p>
                Connect projected value to observed outcomes, adoption,
                operational change, and defensible executive reporting.
              </p>
              <div className="outcome">
                Output: value proof the board can trust.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PICTURE THIS — THREE MOMENTS ===== */}
      <section className="picture">
        <div className="wrap rv">
          <div className="eyebrow">Picture this</div>
          <h2 className="lead">Three moments where the outcome changes.</h2>
          <p className="body">
            The same governed loop, seen at the three points where AI value is
            usually won or lost.
          </p>
          <div className="moments">
            <div className="moment">
              <div className="moment-gfx">
                <svg viewBox="0 0 240 130">
                  <circle cx="24" cy="64" r="8" fill="#5b8cff" />
                  <path
                    d="M32 63 C95 63 120 28 184 28"
                    fill="none"
                    stroke="rgba(255,255,255,.16)"
                    strokeWidth="2"
                    strokeDasharray="5 5"
                  />
                  <g transform="translate(196,28)">
                    <circle
                      r="11"
                      fill="rgba(255,122,122,.12)"
                      stroke="#ff7a7a"
                      strokeWidth="2"
                    />
                    <path
                      d="M-4 -4 L4 4 M4 -4 L-4 4"
                      stroke="#ff7a7a"
                      strokeWidth="2.2"
                    />
                  </g>
                  <path
                    d="M32 66 C95 66 128 71 188 65"
                    fill="none"
                    stroke="#37e0c0"
                    strokeWidth="2.6"
                  />
                  <circle cx="197" cy="65" r="8" fill="#37e0c0" />
                  <path
                    d="M32 67 C95 67 132 102 188 100"
                    fill="none"
                    stroke="#5b8cff"
                    strokeWidth="2.6"
                  />
                  <circle cx="197" cy="100" r="8" fill="#5b8cff" />
                </svg>
              </div>
              <div className="moment-k">01 · Before funding</div>
              <h3>
                Before a major AI program is funded, your leaders can see that
                the business case is strong — but{" "}
                <span className="hl">
                  the data readiness, adoption path, and operating model are
                  not.
                </span>
              </h3>
              <p className="punch">
                You do not kill the ambition.{" "}
                <b>You reshape the bet before the money moves.</b>
              </p>
            </div>
            <div className="moment">
              <div className="moment-gfx">
                <svg viewBox="0 0 240 130">
                  <line
                    x1="36"
                    y1="113"
                    x2="204"
                    y2="113"
                    stroke="rgba(255,255,255,.13)"
                    strokeWidth="1.5"
                  />
                  <rect
                    x="56"
                    y="74"
                    width="30"
                    height="38"
                    rx="4"
                    fill="rgba(91,140,255,.4)"
                  />
                  <rect
                    x="106"
                    y="48"
                    width="30"
                    height="64"
                    rx="4"
                    fill="#5b8cff"
                  />
                  <rect
                    x="156"
                    y="84"
                    width="30"
                    height="28"
                    rx="4"
                    fill="rgba(91,140,255,.4)"
                  />
                  <g transform="translate(121,34)">
                    <circle r="13" fill="#37e0c0" />
                    <path
                      d="M-5 0 L-1 4 L6 -5"
                      fill="none"
                      stroke="#06101e"
                      strokeWidth="2.6"
                    />
                  </g>
                </svg>
              </div>
              <div className="moment-k">02 · At the negotiation</div>
              <h3>
                Before a vendor negotiation, you know which capabilities matter,
                where pricing has leverage, and{" "}
                <span className="hl">
                  which implementation risks should be contracted upfront.
                </span>
              </h3>
              <p className="punch">
                You do not buy the best pitch.{" "}
                <b>You buy the best path to value.</b>
              </p>
            </div>
            <div className="moment">
              <div className="moment-gfx">
                <svg viewBox="0 0 240 130">
                  <defs>
                    <linearGradient id="pv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#37e0c0" stopOpacity=".34" />
                      <stop offset="1" stopColor="#37e0c0" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M26 100 L88 78 L150 56 L210 30"
                    fill="none"
                    stroke="rgba(255,255,255,.22)"
                    strokeWidth="2"
                    strokeDasharray="5 4"
                  />
                  <path
                    d="M26 108 L82 92 L134 70 L188 44 L210 34"
                    fill="none"
                    stroke="#37e0c0"
                    strokeWidth="2.8"
                  />
                  <path
                    d="M26 108 L82 92 L134 70 L188 44 L210 34 L210 116 L26 116 Z"
                    fill="url(#pv)"
                  />
                  <circle cx="82" cy="92" r="6" fill="#5b8cff" />
                  <circle cx="134" cy="70" r="6" fill="#49b6ff" />
                  <g transform="translate(198,40)">
                    <circle r="12" fill="#37e0c0" />
                    <path
                      d="M-5 0 L-1 4 L6 -5"
                      fill="none"
                      stroke="#06101e"
                      strokeWidth="2.4"
                    />
                  </g>
                </svg>
              </div>
              <div className="moment-k">03 · After launch</div>
              <h3>
                Six months after launch, the board does not hear &ldquo;the
                pilot was successful.&rdquo; They see{" "}
                <span className="hl">
                  what was funded, what changed, who adopted it, and what value
                  showed up.
                </span>
              </h3>
              <p className="punch">
                Projected, observed, and validated outcomes —{" "}
                <b>in one governed loop.</b>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FIVE SURFACES ===== */}
      <section>
        <div className="wrap rv">
          <div className="eyebrow">One platform · five connected surfaces</div>
          <h2 className="lead">Five surfaces. One continuous loop.</h2>
          <p className="body">
            Each surface hands the next one evidence — so the decision you make
            in month one is the value you can defend in month twelve.
          </p>
          <div className="surfaces" id="surfaces-row">
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
              <b>Strategic Moves</b>
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
                Govern execution — adoption, decisions, blockers, risk,
                milestones, outcomes.
              </p>
            </div>
            <div className="surf">
              <div
                className="smg"
                style={{ backgroundImage: "url(/marketing/surf-context.png)" }}
              />
              <b>Context</b>
              <p>
                Grounded in your enterprise evidence — not generic AI
                recommendations.
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
              <h2 className="lead">The actual Strategic Moves surface.</h2>
            </div>
            <p className="body">
              A real view of the governed portfolio — moves in flight, value at
              stake, decision gates, and what needs attention. Illustrative data
              shown.
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
      <section className="roles">
        <div className="wrap rv">
          <div className="eyebrow">Built for executive accountability</div>
          <h2 className="lead">
            Different leaders. One shared version of AI value.
          </h2>
          <div className="role-grid">
            <div className="role">
              <span className="tag">CIO</span>
              <h3>Technology investment clarity</h3>
              <p>
                Know which AI programs deserve platform investment, where
                execution risk is building, and which architecture choices
                create leverage.
              </p>
            </div>
            <div className="role">
              <span className="tag">CDAO</span>
              <h3>From models to adoption</h3>
              <p>
                Move beyond pilots and dashboards into governed data readiness,
                workflow adoption, and measurable business outcomes.
              </p>
            </div>
            <div className="role">
              <span className="tag">CFO</span>
              <h3>Spend tied to proof</h3>
              <p>
                See which AI investments have defensible value logic,
                accountable ownership, and evidence of realized financial
                impact.
              </p>
            </div>
            <div className="role">
              <span className="tag">CPO</span>
              <h3>Sourcing leverage</h3>
              <p>
                Enter vendor and SI negotiations with structured comparisons,
                deal risks, and value evidence before the terms are shaped.
              </p>
            </div>
            <div className="role">
              <span className="tag">Transformation</span>
              <h3>Programs that land</h3>
              <p>
                Turn scattered AI use cases into governed programs with
                decisions, gates, owners, risks, and value tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PROOF MODEL ===== */}
      <section>
        <div className="wrap rv">
          <div className="proof-model">
            <div className="board-card">
              <div className="eyebrow">The board-ready value model</div>
              <h2>Move from AI theater to AI accountability.</h2>
              <p>
                AbarVa creates the evidence trail leaders need to defend AI
                spend: why the bet was funded, what assumptions mattered, how
                execution was governed, and whether value showed up.
              </p>
              <div className="mini">
                <div>
                  <b>Projected</b>Business case, value pool, assumptions.
                </div>
                <div>
                  <b>Observed</b>Adoption, workflow change, operating signals.
                </div>
                <div>
                  <b>Validated</b>Outcome evidence, owner approval, executive
                  proof.
                </div>
              </div>
            </div>
            <div className="stack">
              <div className="stack-row">
                <b>Evidence before funding</b>
                <p>
                  Pressure-test value, readiness, risk, sponsorship, and data
                  dependency before resources are committed.
                </p>
              </div>
              <div className="stack-row">
                <b>Governance during execution</b>
                <p>
                  Keep humans in command with approval gates, decision logs,
                  risk signals, and clear ownership.
                </p>
              </div>
              <div className="stack-row">
                <b>Leverage during sourcing</b>
                <p>
                  Compare vendors, SIs, platforms, and internal build paths
                  against the same value logic.
                </p>
              </div>
              <div className="stack-row">
                <b>Proof after launch</b>
                <p>
                  Connect adoption and operational change back to the value case
                  — not just the launch milestone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHAT CHANGES ===== */}
      <section
        style={{
          background: "#fff",
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div className="wrap rv">
          <div className="eyebrow">What changes with AbarVa</div>
          <h2 className="lead">
            A governed path from AI ambition to business value.
          </h2>
          <div className="quad">
            <div className="qcard win">
              <div className="qn">→</div>
              <b>From AI theater to accountability</b>
              <p>
                Every funded bet has evidence, ownership, gates, and value
                logic.
              </p>
            </div>
            <div className="qcard win">
              <div className="qn">→</div>
              <b>From pilots to programs</b>
              <p>
                Use cases move through a repeatable path from idea to execution
                to measurable outcome.
              </p>
            </div>
            <div className="qcard win">
              <div className="qn">→</div>
              <b>From vendor dependency to leverage</b>
              <p>
                Platform, SI, and product decisions are shaped by your evidence
                — not only vendor narratives.
              </p>
            </div>
            <div className="qcard win">
              <div className="qn">→</div>
              <b>From optimism to proof</b>
              <p>
                Projected, observed, and validated outcomes are tracked in one
                continuous loop.
              </p>
            </div>
          </div>
        </div>
      </section>

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
            src="/brand/abarva-logo.svg"
            alt="AbarVa"
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
