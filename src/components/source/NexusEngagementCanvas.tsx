import type { SourcingEventDetail } from '@/lib/source/types';
import { SourceActiveStageWorkspace } from './SourceActiveStageWorkspace';
import { SourceAlertPanel } from './SourceAlertPanel';
import { SourceJourneyTracker } from './SourceJourneyTracker';
import { SourceStagePanel } from './SourceStagePanel';
import { PersistentNexusPanel } from './PersistentNexusPanel';

export function NexusEngagementCanvas({ event }: { event: SourcingEventDetail }) {
  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(320px, 0.8fr)', gap: 18 }}>
      <div style={{ display: 'grid', gap: 18 }}>
        <SourceJourneyTracker stages={event.stages} />
        <SourceAlertPanel alerts={event.alerts} />
        <SourceActiveStageWorkspace event={event} />
        <SourceStagePanel stages={event.stages} />
      </div>
      <PersistentNexusPanel event={event} />
    </section>
  );
}
