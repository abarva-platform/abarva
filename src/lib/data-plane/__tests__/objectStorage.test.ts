jest.mock('server-only', () => ({}));

const createIfNotExists = jest.fn();
const exists = jest.fn();
const uploadData = jest.fn();
const deleteIfExists = jest.fn();
const downloadToBuffer = jest.fn();

jest.mock('@azure/storage-blob', () => {
  class BlobServiceClient {
    static fromConnectionString() {
      return new BlobServiceClient();
    }

    getContainerClient() {
      return {
        createIfNotExists,
        getBlockBlobClient: () => ({
          exists,
          uploadData,
          deleteIfExists,
        }),
        getBlobClient: () => ({
          downloadToBuffer,
          url: 'https://storage.example/container/blob',
        }),
      };
    }
  }

  class StorageSharedKeyCredential {}

  return {
    BlobSASPermissions: { parse: jest.fn((value: string) => value) },
    BlobServiceClient,
    generateBlobSASQueryParameters: jest.fn(() => ({ toString: () => 'sig=1' })),
    StorageSharedKeyCredential,
  };
});

jest.mock('@azure/identity', () => ({
  DefaultAzureCredential: jest.fn(),
}));

describe('Azure object storage adapter', () => {
  const previousEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = {
      ...previousEnv,
      DATA_PLANE_OBJECT_STORE_CONNECTION_STRING:
        'DefaultEndpointsProtocol=https;AccountName=acct;AccountKey=key;EndpointSuffix=core.windows.net',
      DATA_PLANE_OBJECT_STORE_CONTAINER: '',
    };
    exists.mockResolvedValue(false);
    uploadData.mockResolvedValue(undefined);
  });

  afterAll(() => {
    process.env = previousEnv;
  });

  it('continues to blob upload when container-create is not authorized', async () => {
    createIfNotExists.mockRejectedValue({
      statusCode: 403,
      code: 'AuthorizationPermissionMismatch',
    });

    const { getObjectStorageAdapter, resetObjectStorageAdapterForTests } =
      await import('@/lib/data-plane/objectStorage');
    resetObjectStorageAdapterForTests();

    await getObjectStorageAdapter().upload(
      'context-uploads',
      'meridian-health/load/file.csv',
      'ok',
      { contentType: 'text/csv' },
    );

    expect(createIfNotExists).toHaveBeenCalledTimes(1);
    expect(uploadData).toHaveBeenCalledTimes(1);
  });

  it('still surfaces upload authorization failures after container-create fallback', async () => {
    createIfNotExists.mockRejectedValue({ statusCode: 403 });
    uploadData.mockRejectedValue(new Error('upload_not_authorized'));

    const { getObjectStorageAdapter, resetObjectStorageAdapterForTests } =
      await import('@/lib/data-plane/objectStorage');
    resetObjectStorageAdapterForTests();

    await expect(
      getObjectStorageAdapter().upload(
        'context-uploads',
        'meridian-health/load/file.csv',
        'ok',
      ),
    ).rejects.toThrow('upload_not_authorized');
  });
});
