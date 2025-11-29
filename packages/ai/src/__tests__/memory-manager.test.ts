import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the entire openai provider module
vi.mock('../providers/openai', () => ({
  getOpenAIClient: vi.fn(() => ({
    embeddings: {
      create: vi.fn().mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }],
      }),
    },
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Summarized memory content' } }],
        }),
      },
    },
  })),
  generateEmbedding: vi.fn().mockResolvedValue(new Array(1536).fill(0.1)),
}));

describe('MemoryManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should create memory manager with correct configuration', async () => {
    const { MemoryManager } = await import('../memory/manager');
    const memoryManager = new MemoryManager('test-user-1', 'test-persona-1');
    expect(memoryManager).toBeDefined();
  });

  it('should store a new memory', async () => {
    const { MemoryManager } = await import('../memory/manager');
    const memoryManager = new MemoryManager('test-user-1', 'test-persona-1');

    const result = await memoryManager.storeMemory({
      content: 'User mentioned they love hiking',
      type: 'fact',
      importance: 0.7,
    });

    expect(result).toBeDefined();
    expect(result.content).toBe('User mentioned they love hiking');
    expect(result.type).toBe('fact');
    expect(result.importance).toBe(0.7);
  });

  it('should retrieve all memories', async () => {
    const { MemoryManager } = await import('../memory/manager');
    const memoryManager = new MemoryManager('test-user-1', 'test-persona-1');

    const memories = memoryManager.getAllMemories();

    expect(memories).toBeDefined();
    expect(Array.isArray(memories)).toBe(true);
  });

  it('should retrieve relevant memories by context', async () => {
    const { MemoryManager } = await import('../memory/manager');
    const memoryManager = new MemoryManager('test-user-1', 'test-persona-1');

    // First store some memories
    await memoryManager.storeMemory({
      content: 'User loves hiking in mountains',
      type: 'preference',
      importance: 0.8,
    });

    const memories = await memoryManager.retrieveRelevantMemories('hiking in mountains');

    expect(memories).toBeDefined();
    expect(Array.isArray(memories)).toBe(true);
  });

  it('should get memories by type', async () => {
    const { MemoryManager } = await import('../memory/manager');
    const memoryManager = new MemoryManager('test-user-1', 'test-persona-1');

    await memoryManager.storeMemory({
      content: 'User birthday is March 15th',
      type: 'fact',
      importance: 0.9,
    });

    await memoryManager.storeMemory({
      content: 'User prefers morning conversations',
      type: 'preference',
      importance: 0.7,
    });

    const facts = memoryManager.getMemoriesByType('fact');
    expect(facts.every((m) => m.type === 'fact')).toBe(true);

    const preferences = memoryManager.getMemoriesByType('preference');
    expect(preferences.every((m) => m.type === 'preference')).toBe(true);
  });

  it('should delete a memory', async () => {
    const { MemoryManager } = await import('../memory/manager');
    const memoryManager = new MemoryManager('test-user-1', 'test-persona-1');

    const memory = await memoryManager.storeMemory({
      content: 'Temporary memory',
      type: 'fact',
      importance: 0.5,
    });

    const deleted = memoryManager.deleteMemory(memory.id);
    expect(deleted).toBe(true);

    const allMemories = memoryManager.getAllMemories();
    expect(allMemories.find((m) => m.id === memory.id)).toBeUndefined();
  });

  it('should clear all memories', async () => {
    const { MemoryManager } = await import('../memory/manager');
    const memoryManager = new MemoryManager('test-user-1', 'test-persona-1');

    await memoryManager.storeMemory({
      content: 'Memory 1',
      type: 'fact',
      importance: 0.5,
    });

    await memoryManager.storeMemory({
      content: 'Memory 2',
      type: 'preference',
      importance: 0.6,
    });

    memoryManager.clearAllMemories();

    const memories = memoryManager.getAllMemories();
    expect(memories.length).toBe(0);
  });

  it('should export and import memories', async () => {
    const { MemoryManager } = await import('../memory/manager');
    const memoryManager = new MemoryManager('test-user-1', 'test-persona-1');

    await memoryManager.storeMemory({
      content: 'Exportable memory',
      type: 'fact',
      importance: 0.7,
    });

    const exported = memoryManager.exportMemories();
    expect(typeof exported).toBe('string');

    // Clear and reimport
    memoryManager.clearAllMemories();
    const importedCount = memoryManager.importMemories(exported);
    expect(importedCount).toBeGreaterThan(0);
  });

  it('should consolidate memories', async () => {
    const { MemoryManager } = await import('../memory/manager');
    const memoryManager = new MemoryManager('test-user-1', 'test-persona-1');

    const consolidatedCount = await memoryManager.consolidateMemories();
    expect(typeof consolidatedCount).toBe('number');
  });
});
