'use server';

export interface NotifySponsorResult {
  ok: false;
  notifiedAt: null;
  notifyCount: 0;
  escalationLevel: 0;
  error: 'retired';
  detail: string;
}

/** Legacy approval reminders are retired; sponsors receive opt-in progress updates only. */
export async function notifySponsorAction(): Promise<NotifySponsorResult> {
  return {
    ok: false,
    notifiedAt: null,
    notifyCount: 0,
    escalationLevel: 0,
    error: 'retired',
    detail:
      'Sponsor approval reminders are retired. Progress updates use the Move contact email preference.',
  };
}
