'use client';

import { Suspense, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { getProgramModuleSync, getViewerRole } from '@/lib/programs/mock';
import { ModuleWorkspaceShell } from '@/components/programs/ModuleWorkspace';
import { ProgramShell } from '@/components/programs/ProgramSurface';
import type { ModuleWorkspaceProps } from '@/lib/programs/types';

function inferPattern(moduleKey: string): ModuleWorkspaceProps['renderPattern'] {
  if (['problem-framing', 'stakeholder-map', 'success-criteria', 'baseline-data-request', 'diagnostic-instrument', 'implementation-plan', 'change-management-plan'].includes(moduleKey)) {
    return 'form';
  }
  if (['data-analysis-findings', 'contradiction-surface'].includes(moduleKey)) {
    return 'analysis';
  }
  if (['business-case-roi', 'benefits-realization', 'cxo-interview'].includes(moduleKey)) {
    return 'narrative';
  }
  if (['solution-library-match', 'vendor-tech-evaluation', 'tradeoff-matrix'].includes(moduleKey)) {
    return 'matrix';
  }
  return 'tracker';
}

function ProgramModulePageContent({
  params,
}: {
  params: Promise<{ programId: string; key: string }>;
}) {
  const { programId, key } = use(params);
  const searchParams = useSearchParams();
  const viewerRole = getViewerRole(searchParams.get('role'));
  const result = getProgramModuleSync(programId, key);

  if (!result.program || !result.moduleState) {
    return <div className="programs-page programs-empty">Module not found.</div>;
  }

  return (
    <ProgramShell program={{ ...result.program, currentPhase: result.moduleState.phase }} viewerRole={viewerRole}>
      <ModuleWorkspaceShell
        program={result.program}
        moduleState={result.moduleState}
        viewerRole={viewerRole}
        renderPattern={inferPattern(key)}
      />
    </ProgramShell>
  );
}

export default function ProgramModulePage({
  params,
}: {
  params: Promise<{ programId: string; key: string }>;
}) {
  return (
    <Suspense fallback={<div className="programs-page programs-empty">Loading module…</div>}>
      <ProgramModulePageContent params={params} />
    </Suspense>
  );
}
