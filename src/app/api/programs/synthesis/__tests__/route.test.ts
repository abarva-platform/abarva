const mockAnthropicStream = jest.fn();

jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: { stream: mockAnthropicStream },
  })),
}));

jest.mock('@/lib/agent/userContext', () => ({
  getUserContextPromptBlock: jest.fn().mockResolvedValue('USER CONTEXT'),
}));

jest.mock('@/lib/reasoning/synthesis-telemetry', () => ({
  recordSynthesisEvent: jest.fn(() => ({ id: 'evt-1' })),
}));

describe('POST /api/programs/synthesis', () => {
  it('does not fall back to the Apex CDP fixture for unknown live program ids', async () => {
    const { POST } = await import('../route');
    const res = await POST(
      new Request('http://test/api/programs/synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programId: 'f9fc92e8-3bbc-45d2-8e78-59671bb4feb3' }),
      }),
    );

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({
      error: 'program_synthesis_not_available',
    });
    expect(mockAnthropicStream).not.toHaveBeenCalled();
  });
});

export {};
