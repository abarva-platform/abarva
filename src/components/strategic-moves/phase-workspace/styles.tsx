// Moves phase workspace — self-contained design tokens + utility classes.
// Tokens mirror the approved Claude Design standalone
// ("Moves Phase Workspace · standalone"). Emitted as one <style> block so the
// cards are self-contained (no Tailwind dependency) and render identically in
// the app and in the static render proof.

import * as React from 'react';

export const PHASE_WORKSPACE_CSS = `
.pw {
  --bg:#f7f5f1; --card:#ffffff; --soft:#faf9f6;
  --ink:#1a1a18; --ink-2:#3d3c39; --muted:#75736c; --faint:#a4a29a;
  --line:rgba(20,20,19,0.08); --line-2:rgba(20,20,19,0.14);
  --blue:#0057b8; --blue-tint:#eef4fb;
  --green:#1d8f68; --green-tint:#e8f5ef;
  --amber:#b0730f; --amber-tint:#fbf1df;
  --red:#b3261e; --red-tint:#fbe9e7;
  --teal:#1f8578; --purple:#6b3fa0; --gold:#9C7B3F;
  --shadow-sm:0 1px 2px rgba(20,20,19,0.05);
  --shadow:0 1px 2px rgba(20,20,19,0.04),0 8px 24px rgba(20,20,19,0.05);
  font-family:'DM Sans',system-ui,-apple-system,Segoe UI,sans-serif;
  color:var(--ink); background:var(--bg);
  -webkit-font-smoothing:antialiased; line-height:1.5;
}
.pw *{box-sizing:border-box;}
.pw .serif{font-family:Georgia,'Times New Roman',serif;}
.pw-shell{max-width:1080px;margin:0 auto;padding:28px 24px 64px;display:flex;flex-direction:column;gap:18px;}
.pw-head{display:flex;flex-direction:column;gap:6px;padding:4px 2px 8px;}
.pw-eyebrow{font-size:11px;font-weight:600;letter-spacing:.10em;text-transform:uppercase;color:var(--muted);}
.pw-h1{font-size:26px;font-weight:600;letter-spacing:-.01em;margin:0;}
.pw-sub{font-size:13.5px;color:var(--muted);}

.pw-card{background:var(--card);border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow-sm);padding:20px 22px;display:flex;flex-direction:column;gap:14px;}
.pw-card-head{display:flex;flex-direction:column;gap:3px;}
.pw-kicker{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--blue);}
.pw-title{font-size:17px;font-weight:600;letter-spacing:-.005em;margin:0;}
.pw-note{font-size:13px;color:var(--muted);}
.pw-lead{font-size:13.5px;color:var(--ink-2);}

.pw-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
@media (max-width:720px){.pw-grid-2{grid-template-columns:1fr;}}

.pw-chip{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;letter-spacing:.02em;padding:3px 9px;border-radius:999px;border:1px solid var(--line-2);color:var(--ink-2);background:var(--soft);white-space:nowrap;}
.pw-chip.green{color:var(--green);background:var(--green-tint);border-color:transparent;}
.pw-chip.amber{color:var(--amber);background:var(--amber-tint);border-color:transparent;}
.pw-chip.red{color:var(--red);background:var(--red-tint);border-color:transparent;}
.pw-chip.blue{color:var(--blue);background:var(--blue-tint);border-color:transparent;}

.pw-lane{display:inline-flex;align-items:center;font-size:11px;font-weight:600;padding:3px 9px;border-radius:7px;background:var(--blue-tint);color:var(--blue);white-space:nowrap;}

.pw-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px;}
.pw-li{display:flex;gap:10px;font-size:13px;color:var(--ink-2);align-items:flex-start;}
.pw-li .dot{flex:none;width:6px;height:6px;border-radius:999px;background:var(--blue);margin-top:6px;}
.pw-li .tick{flex:none;color:var(--green);font-weight:700;}

.pw-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid var(--line);}
.pw-row:last-child{border-bottom:none;}
.pw-row-main{display:flex;flex-direction:column;gap:2px;min-width:0;}
.pw-row-t{font-size:13.5px;font-weight:600;color:var(--ink);}
.pw-row-s{font-size:12px;color:var(--muted);}
.pw-row-meta{display:flex;gap:6px;align-items:center;flex:none;flex-wrap:wrap;justify-content:flex-end;}

.pw-tablewrap{overflow-x:auto;}
.pw-table{width:100%;border-collapse:collapse;font-size:12.5px;min-width:560px;}
.pw-table th{text-align:left;font-size:10.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);padding:0 12px 8px 0;border-bottom:1px solid var(--line);}
.pw-table td{padding:10px 12px 10px 0;border-bottom:1px solid var(--line);color:var(--ink-2);vertical-align:top;}
.pw-table tr:last-child td{border-bottom:none;}
.pw-table td.strong{color:var(--ink);font-weight:600;}

.pw-opt{border:1px solid var(--line);border-radius:11px;padding:13px 15px;display:flex;flex-direction:column;gap:6px;background:var(--soft);}
.pw-opt.rec{border-color:rgba(29,143,104,0.4);background:var(--green-tint);}
.pw-opt-head{display:flex;align-items:center;gap:9px;}
.pw-opt-id{width:22px;height:22px;border-radius:6px;background:var(--ink);color:#fff;font-size:12px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex:none;}
.pw-opt.rec .pw-opt-id{background:var(--green);}
.pw-opt-t{font-size:13.5px;font-weight:600;}
.pw-opt-d{font-size:12.5px;color:var(--muted);}

.pw-callout{border-left:3px solid var(--line-2);padding:9px 0 9px 13px;display:flex;flex-direction:column;gap:6px;}
.pw-callout.warn{border-color:var(--amber);}
.pw-callout-t{font-size:12px;font-weight:600;color:var(--ink-2);}

.pw-kv{display:flex;flex-direction:column;gap:3px;padding:11px 13px;border-radius:10px;background:var(--soft);border:1px solid var(--line);}
.pw-kv-k{font-size:10.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);}
.pw-kv-v{font-size:13px;color:var(--ink);}

.pw-gate{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;padding:14px 16px;border-radius:11px;background:var(--ink);color:#fff;}
.pw-gate-t{font-size:13.5px;font-weight:600;}
.pw-gate-s{font-size:12px;color:rgba(255,255,255,0.72);}
.pw-gate-btn{font-size:12.5px;font-weight:600;padding:9px 15px;border-radius:8px;background:#fff;color:var(--ink);white-space:nowrap;}

.pw-foot{font-size:11.5px;color:var(--faint);padding-top:2px;}

/* Stripe-style task checklist */
.pw-prog{display:flex;align-items:center;gap:10px;}
.pw-prog-track{flex:1;height:6px;border-radius:999px;background:var(--line);overflow:hidden;}
.pw-prog-fill{height:100%;border-radius:999px;background:var(--green);transition:width .2s;}
.pw-prog-label{font-size:12px;font-weight:600;color:var(--muted);white-space:nowrap;}
.pw-tasks{display:flex;flex-direction:column;}
.pw-task{display:flex;gap:12px;padding:13px 0;border-bottom:1px solid var(--line);align-items:flex-start;}
.pw-task:last-child{border-bottom:none;}
.pw-task-ico{flex:none;width:22px;height:22px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:1.5px solid var(--line-2);color:var(--muted);background:var(--soft);}
.pw-task.done .pw-task-ico{background:var(--green);border-color:transparent;color:#fff;}
.pw-task.active .pw-task-ico{border-color:var(--blue);color:var(--blue);background:var(--blue-tint);}
.pw-task.locked{opacity:.55;}
.pw-task-body{flex:1;display:flex;flex-direction:column;gap:2px;min-width:0;}
.pw-task-t{font-size:14px;font-weight:600;color:var(--ink);}
.pw-task.locked .pw-task-t{color:var(--muted);}
.pw-task-d{font-size:12.5px;color:var(--muted);}
.pw-task-side{flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:6px;}
.pw-task-prog{font-size:11.5px;font-weight:600;color:var(--muted);white-space:nowrap;}
.pw-task-btn{font-size:12px;font-weight:600;padding:6px 12px;border-radius:7px;white-space:nowrap;border:1px solid var(--line-2);color:var(--ink-2);background:var(--card);}
.pw-task.active .pw-task-btn{background:var(--ink);color:#fff;border-color:transparent;}
.pw-task.done .pw-task-btn{color:var(--green);border-color:transparent;background:var(--green-tint);}
.pw-task.locked .pw-task-btn{background:var(--soft);color:var(--faint);}
.pw-task-hint{font-size:11px;font-weight:600;letter-spacing:.02em;color:var(--muted);text-transform:uppercase;}
.pw-task.locked .pw-task-hint{color:var(--faint);}
.pw-dl-btn{font-size:11px;font-weight:600;padding:3px 9px;border-radius:7px;border:1px solid var(--line-2);background:var(--card);color:var(--ink-2);white-space:nowrap;cursor:pointer;}
.pw-dl-btn:hover{background:var(--soft);}
`;

/** Renders the phase-workspace token/utility stylesheet once. */
export function PhaseWorkspaceStyles(): React.ReactElement {
  return <style dangerouslySetInnerHTML={{ __html: PHASE_WORKSPACE_CSS }} />;
}
