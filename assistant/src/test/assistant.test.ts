import { describe, it, expect, vi } from 'vitest';
import { AssistantManager } from '../main/core/assistant';

describe('AssistantManager', () => {
  it('should initialize with a window', () => {
    const mockWin = { webContents: { send: vi.fn() } } as any;
    const manager = new AssistantManager(mockWin);
    expect(manager).toBeDefined();
  });
});
