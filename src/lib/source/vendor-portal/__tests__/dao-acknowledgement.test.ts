jest.mock('server-only', () => ({}));
jest.mock('@/lib/data-plane/azureRead', () => ({ azureRead: {} }));
jest.mock('@/lib/data-plane/postgresCompat', () => ({
  getAzureWriteFluentClient: jest.fn(),
}));

import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import { recordAcknowledgement } from '../dao';

const getClient = getAzureWriteFluentClient as jest.Mock;
const input = {
  vendorId: '00000000-0000-4000-8000-000000000001',
  intendsToRespond: true,
  declaredName: 'A. Contact',
  declaredTitle: 'Lead',
  declaredEmail: 'contact@example.invalid',
};

function updateResult(count: number) {
  const query = {
    eq: jest.fn(),
    then: (resolve: (value: { error: null; count: number }) => unknown) =>
      Promise.resolve(resolve({ error: null, count })),
  };
  query.eq.mockReturnValue(query);
  getClient.mockReturnValue({ from: () => ({ update: () => query }) });
}

describe('vendor acknowledgement write', () => {
  it('does not claim success when another responder already changed the invitation', async () => {
    updateResult(0);
    await expect(recordAcknowledgement(input)).resolves.toBe(false);
  });

  it('succeeds only when exactly one invitation was updated', async () => {
    updateResult(1);
    await expect(recordAcknowledgement(input)).resolves.toBe(true);
  });
});
