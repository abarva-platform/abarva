import {
  RESPONSIBLE_AI_TRAINING_COMPLETION_STATEMENT,
  RESPONSIBLE_AI_TRAINING_ESTIMATED_MINUTES,
  RESPONSIBLE_AI_TRAINING_MODULES,
  RESPONSIBLE_AI_TRAINING_VERSION,
  getResponsibleAiTrainingStatus,
  recordResponsibleAiTrainingCompletion,
  type ResponsibleAiTrainingCompletion,
  type ResponsibleAiTrainingStore,
  type ResponsibleAiTrainingSubject,
} from '@/lib/ai-liability/responsible-ai-training';

const subject: ResponsibleAiTrainingSubject = {
  userId: 'user_123',
  userEmail: 'cfo@example.com',
  clientId: '00000000-0000-4000-8000-000000000001',
  clientKey: 'apexretail',
};

function fakeStore(args: {
  completedAt?: string | null;
  failRead?: boolean;
  writes?: ResponsibleAiTrainingCompletion[];
} = {}): ResponsibleAiTrainingStore {
  return {
    async getCompletedRecord() {
      if (args.failRead) throw new Error('table missing');
      if (!args.completedAt) return null;
      return {
        id: 'training-1',
        client_id: subject.clientId,
        user_id: subject.userId,
        training_version: RESPONSIBLE_AI_TRAINING_VERSION,
        completed_at: args.completedAt,
      };
    },
    async insertCompletedRecord(input) {
      args.writes?.push(input);
      return { ok: true };
    },
  };
}

describe('responsible AI training', () => {
  it('requires the current training version when no per-user tenant row exists', async () => {
    const status = await getResponsibleAiTrainingStatus(subject, fakeStore());

    expect(status.required).toBe(true);
    expect(status.reason).toBe('missing');
    expect(status.trainingVersion).toBe(RESPONSIBLE_AI_TRAINING_VERSION);
    expect(status.completionStatement).toBe(RESPONSIBLE_AI_TRAINING_COMPLETION_STATEMENT);
    expect(status.estimatedMinutes).toBe(RESPONSIBLE_AI_TRAINING_ESTIMATED_MINUTES);
    expect(RESPONSIBLE_AI_TRAINING_MODULES).toHaveLength(4);
  });

  it('does not require training when the current version is already complete', async () => {
    const status = await getResponsibleAiTrainingStatus(
      subject,
      fakeStore({ completedAt: '2026-06-02T17:00:00.000Z' }),
    );

    expect(status.required).toBe(false);
    expect(status.reason).toBe('completed');
    expect(status.completedAt).toBe('2026-06-02T17:00:00.000Z');
  });

  it('fails closed when the training ledger is unavailable', async () => {
    const status = await getResponsibleAiTrainingStatus(
      subject,
      fakeStore({ failRead: true }),
    );

    expect(status.required).toBe(true);
    expect(status.storageAvailable).toBe(false);
    expect(status.reason).toBe('storage_unavailable');
  });

  it('records training completion with tenant, user, ip, user agent, and source', async () => {
    const writes: ResponsibleAiTrainingCompletion[] = [];

    const result = await recordResponsibleAiTrainingCompletion(
      {
        subject,
        ipAddress: '203.0.113.10',
        userAgent: 'UnitTest/1.0',
        source: 'responsible_ai_training_module',
      },
      fakeStore({ writes }),
    );

    expect(result.ok).toBe(true);
    expect(writes).toEqual([
      {
        subject,
        ipAddress: '203.0.113.10',
        userAgent: 'UnitTest/1.0',
        source: 'responsible_ai_training_module',
      },
    ]);
  });
});
