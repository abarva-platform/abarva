import { notifySponsorAction } from '../notify-sponsor';

describe('notifySponsorAction', () => {
  it('retires sponsor approval reminders and directs callers to opt-in progress updates', async () => {
    await expect(notifySponsorAction()).resolves.toMatchObject({
      ok: false,
      error: 'retired',
      detail: expect.stringContaining('Move contact email preference'),
    });
  });
});
