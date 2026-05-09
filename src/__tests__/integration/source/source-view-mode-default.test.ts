import { readStoredViewMode } from '@/components/source/SourceEventsViewToggle';

type MockWindow = {
  localStorage: {
    getItem: jest.Mock<string | null, [string]>;
    setItem: jest.Mock<void, [string, string]>;
  };
};

function installMockWindow(storedValue: string | null): MockWindow {
  const mockWindow: MockWindow = {
    localStorage: {
      getItem: jest.fn(() => storedValue),
      setItem: jest.fn(),
    },
  };

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: mockWindow,
  });

  return mockWindow;
}

function removeMockWindow() {
  delete (globalThis as typeof globalThis & { window?: unknown }).window;
}

describe('Source portfolio view-mode default', () => {
  afterEach(() => {
    removeMockWindow();
  });

  it('defaults to Kanban during server rendering', () => {
    removeMockWindow();
    expect(readStoredViewMode()).toBe('kanban');
  });

  it('defaults to Kanban when no browser preference exists', () => {
    installMockWindow(null);
    expect(readStoredViewMode()).toBe('kanban');
  });

  it('migrates the old table preference back to Kanban', () => {
    const mockWindow = installMockWindow('list');
    expect(readStoredViewMode()).toBe('kanban');
    expect(mockWindow.localStorage.setItem).toHaveBeenCalledWith(
      'source-events-view-mode',
      'kanban',
    );
  });

  it('preserves explicit Kanban and Value chart preferences', () => {
    installMockWindow('scatter');
    expect(readStoredViewMode()).toBe('scatter');
    removeMockWindow();

    installMockWindow('kanban');
    expect(readStoredViewMode()).toBe('kanban');
  });
});
