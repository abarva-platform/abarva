import "../preview/workspace/workspace.css";

export default function SourceWorkspaceLoading() {
  return (
    <div className="sw-root sw-v2-root" aria-label="Loading Source workspace">
      <main className="sw-v2-shell" aria-label="Source workspace loading">
        <header className="sw-v2-frame-bar" aria-label="Source workspace header">
          <div className="sw-v2-frame-brand">
            <span>
              Abar<i>Va</i>
            </span>
            <b>Source 360</b>
          </div>
          <div className="sw-v2-frame-meta">
            Loading governed contract book
          </div>
        </header>
        <section className="sw-v2-main">
          <header className="sw-v2-loading-hero">
            <span>Source 360</span>
            <h1>Preparing the contract decision set</h1>
            <p>
              Loading contract rows, vendor rollups, evidence coverage, and
              action candidates from the governed Source projection.
            </p>
          </header>
          <div className="sw-v2-loading-grid" aria-hidden="true">
            {["Contracts", "Vendors", "Annual value", "Evidence", "Actions"].map(
              (label) => (
                <div key={label} className="sw-v2-loading-card">
                  <span>{label}</span>
                  <b />
                  <small />
                </div>
              ),
            )}
          </div>
          <div className="sw-v2-loading-canvas" aria-hidden="true">
            <div />
            <div />
            <div />
          </div>
        </section>
      </main>
    </div>
  );
}
