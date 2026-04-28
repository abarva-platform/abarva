'use client';

import Link from 'next/link';
import { advancePhase, answerCxoTakeover, getCxoQuestionBank, getModuleName } from '@/lib/programs/mock';
import type { ProgramDetailProps, ProgramFullState, ViewerRole } from '@/lib/programs/types.ui';
import { ActivityFeed, DeliverableList, MetricCard, ProgressSegments } from '@/components/programs/common';
import { CxoTakeover, NexusPanel } from '@/components/programs/NexusPanel';
import { ExecuteSurface } from '@/components/programs/ExecuteSurface';

function PhaseGate({
  program,
}: {
  program: ProgramFullState;
}) {
  const tone = program.gateStatus === 'blocked' ? 'blocked' : program.gateStatus === 'cleared' ? 'cleared' : 'pending';
  return (
    <div className={`programs-gate-card ${tone}`}>
      <div className="programs-eyebrow">Phase gate</div>
      <div className="programs-name" style={{ fontSize: 24 }}>{program.currentPhase < 6 ? `Advance to phase ${program.currentPhase + 1}` : 'Closeout verification'}</div>
      <div className="programs-muted" style={{ marginTop: 8 }}>{program.gateSummary}</div>
      <div className="programs-row" style={{ gap: 10, marginTop: 14 }}>
        <span className={`programs-chip ${tone === 'blocked' ? 'red' : tone === 'cleared' ? 'green' : 'amber'}`}>{program.gateStatus}</span>
        <span className="programs-chip">{program.phaseStatus.replace('_', ' ')}</span>
      </div>
    </div>
  );
}

function ModuleDashboard({
  program,
  viewerRole,
}: {
  program: ProgramFullState;
  viewerRole: ViewerRole;
}) {
  const visibleModules = program.modules.filter((module) => module.phase === program.currentPhase);

  return (
    <div className="programs-stack">
      <div className="programs-card programs-section">
        <div className="programs-header-bar">
          <div>
            <div className="programs-eyebrow">Module dashboard</div>
            <div className="programs-name" style={{ fontSize: 28 }}>Current phase modules</div>
          </div>
          {viewerRole === 'maestro' || viewerRole === 'founder' ? <span className="programs-chip amber">Oversight overlay</span> : null}
        </div>
        <div className="programs-module-grid" style={{ marginTop: 16 }}>
          {visibleModules.map((module) => (
            <Link key={module.moduleKey} href={`/programs/${program.id}/module/${module.moduleKey}`} className="programs-link programs-module-tile">
              <div className="programs-row" style={{ justifyContent: 'space-between', alignItems: 'start' }}>
                <div className="programs-name" style={{ fontSize: 21 }}>{module.name}</div>
                <span className={`programs-chip ${module.status === 'blocked' ? 'red' : module.status === 'signed_off' ? 'green' : module.status === 'in_review' || module.status === 'in_progress' ? 'amber' : 'teal'}`}>
                  {module.status.replace('_', ' ')}
                </span>
              </div>
              <div className="programs-muted" style={{ fontSize: 13 }}>
                {module.blockerReason ?? `${module.currentVersion ? `Version ${module.currentVersion}` : 'Draft state'} · last edited ${module.lastEditedAt?.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) ?? 'today'}`}
              </div>
              <div className="programs-row" style={{ justifyContent: 'space-between' }}>
                <span className="programs-chip">{getModuleName(module.moduleKey)}</span>
                {module.nexusDraftPending ? <span className="programs-chip teal">Nexus assist</span> : null}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <PhaseGate program={program} />
    </div>
  );
}

export function ProgramShell({
  program,
  viewerRole,
  activeSecondary = 'overview',
  children,
}: {
  program: ProgramFullState;
  viewerRole: ViewerRole;
  activeSecondary?: 'overview' | 'timeline' | 'team' | 'settings';
  children: React.ReactNode;
}) {
  return (
    <div className="programs-page programs-stack">
      <div className="programs-card programs-section">
        <div className="programs-header-bar">
          <div className="programs-stack" style={{ gap: 12 }}>
            <div className="programs-row" style={{ gap: 8, flexWrap: 'wrap' }}>
              <Link href="/engagements" className="programs-tab is-active">Programs</Link>
              <span className="programs-chip">{program.clientName}</span>
              <span className="programs-chip teal">{program.patternName ?? 'Custom shape'}</span>
              <span className="programs-chip">{program.shape}</span>
            </div>
            <div>
              <div className="programs-name" style={{ fontSize: 34 }}>{program.name}</div>
              <div className="programs-muted" style={{ marginTop: 8 }}>{program.charter.headline}</div>
            </div>
          </div>
          <div className="programs-stack" style={{ alignItems: 'end', gap: 12 }}>
            <div className="programs-row" style={{ gap: 8, flexWrap: 'wrap' }}>
              <span className="programs-chip">{viewerRole}</span>
              <span className={`programs-chip ${program.phaseStatus === 'blocked' ? 'red' : program.phaseStatus === 'awaiting_gate' ? 'amber' : 'teal'}`}>
                {program.phaseStatus.replace('_', ' ')}
              </span>
            </div>
            <div className="programs-secondary-nav">
              <Link href={`/programs/${program.id}`} className={`programs-tab ${activeSecondary === 'overview' ? 'is-active' : ''}`}>Overview</Link>
              <Link href={`/programs/${program.id}/timeline`} className={`programs-tab ${activeSecondary === 'timeline' ? 'is-active' : ''}`}>Timeline</Link>
              <Link href={`/programs/${program.id}/team`} className={`programs-tab ${activeSecondary === 'team' ? 'is-active' : ''}`}>Team</Link>
              <Link href={`/programs/${program.id}/settings`} className={`programs-tab ${activeSecondary === 'settings' ? 'is-active' : ''}`}>Settings</Link>
            </div>
          </div>
        </div>
        <div className="programs-metrics" style={{ marginTop: 18 }}>
          {program.metrics.map((metric) => <MetricCard key={metric.label} label={metric.label} value={metric.value} tone={metric.tone} />)}
        </div>
        <div style={{ marginTop: 18 }}>
          <ProgressSegments currentPhase={program.currentPhase} />
        </div>
        <div className="programs-phase-nav" style={{ marginTop: 18 }}>
          {program.phases.map((phase) => (
            <Link
              key={phase.canonicalPhase}
              href={`/programs/${program.id}/phase/${phase.canonicalPhase}`}
              className={`programs-phase-pill ${phase.canonicalPhase === program.currentPhase ? 'is-active' : ''} ${phase.state === 'locked' ? 'is-locked' : ''} ${phase.state === 'pending_gate' ? 'is-pending' : ''}`}
            >
              <div className="programs-mono-label" style={{ color: 'var(--programs-subtle)' }}>
                Phase {phase.canonicalPhase}
              </div>
              <div className="programs-name" style={{ fontSize: 20, marginTop: 8 }}>{phase.name}</div>
              <div className="programs-muted" style={{ marginTop: 6, fontSize: 13 }}>{phase.summary}</div>
            </Link>
          ))}
        </div>
      </div>
      <div className="programs-program-grid">
        <div className="programs-stack">
          {children}
        </div>
        <NexusPanel {...program.nexusPanel} />
      </div>
    </div>
  );
}

export function ProgramSurface(props: ProgramDetailProps) {
  const program = props.program;

  async function handleAdvance() {
    await advancePhase(program.id, program.currentPhase);
  }

  const cxoPreviewMode = program.currentPhase === 6 ? 'phase_6_verification' : 'phase_3_interview';
  const questionBank = getCxoQuestionBank(cxoPreviewMode);

  const mainCanvas =
    program.currentPhase === 5 && program.executeData ? (
      <ExecuteSurface {...program.executeData} viewerRole={props.viewerRole} />
    ) : (
      <ModuleDashboard program={program} viewerRole={props.viewerRole} />
    );

  return (
    <ProgramShell program={program} viewerRole={props.viewerRole}>
      <div className="programs-card programs-section">
        <div className="programs-header-bar">
          <div>
            <div className="programs-eyebrow">Overview</div>
            <div className="programs-name" style={{ fontSize: 28 }}>Current phase orientation</div>
            <div className="programs-muted" style={{ marginTop: 8 }}>{program.charter.sponsorDecision}</div>
          </div>
          <button className="programs-button programs-button-primary" type="button" onClick={handleAdvance}>
            Advance phase
          </button>
        </div>
        <div className="programs-split" style={{ marginTop: 18 }}>
          <div className="programs-card programs-section">
            <div className="programs-eyebrow">Charter summary</div>
            <div className="programs-list">
              {program.charter.bullets.map((bullet) => (
                <div key={bullet} className="programs-list-item">{bullet}</div>
              ))}
            </div>
          </div>
          <div className="programs-card programs-section">
            <div className="programs-eyebrow">Sponsor dashboard</div>
            <div className="programs-list">
              {program.sponsorDashboard.openDecisions.map((decision) => <div key={decision} className="programs-list-item">{decision}</div>)}
            </div>
          </div>
        </div>
      </div>
      {program.recommendationPin ? (
        <div className="programs-card programs-section">
          <div className="programs-eyebrow">Recommendation pin</div>
          <div className="programs-name" style={{ fontSize: 24 }}>{program.recommendationPin}</div>
        </div>
      ) : null}
      {mainCanvas}
      {(program.currentPhase === 3 || program.currentPhase === 6) ? (
        <CxoTakeover
          programId={program.id}
          mode={cxoPreviewMode}
          questionBank={questionBank}
          currentQuestion={questionBank[0]}
          transcript={[
            { id: 'preview-1', speaker: 'nexus', text: cxoPreviewMode === 'phase_3_interview' ? 'I will ask a short sequence of structured questions tied to the findings pack.' : 'I will confirm outcomes, unexpected results, and pattern feedback in a short verification cadence.' },
            { id: 'preview-2', speaker: 'sponsor', text: 'Understood. Keep it tight and decision-oriented.' },
          ]}
          onAnswer={(answer) => answerCxoTakeover(program.id, cxoPreviewMode, answer)}
          onClose={async () => ({ headline: 'Static close', bullets: ['Preview only'] })}
        />
      ) : null}
      <div className="programs-grid-2">
        <div className="programs-card programs-section">
          <div className="programs-eyebrow">Recent activity</div>
          <ActivityFeed items={program.activity} />
        </div>
        <div className="programs-card programs-section">
          <div className="programs-eyebrow">Deliverables</div>
          <DeliverableList programId={program.id} deliverables={program.deliverables} />
        </div>
      </div>
      <div className="programs-hero-note">
        Nexus Mode B drafting and Mode C takeover are preview surfaces in this release. Live drafting, interview capture, and synthesis will activate through the shared Nexus interaction layer.
      </div>
    </ProgramShell>
  );
}
