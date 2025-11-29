import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryManager } from '../memory/manager';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ data: null, error: null })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              data: [
                {
                  id: '1',
                  content: 'Test memory 1',
                  importance: 0.8,
                  created_at: new Date().toISOString(),
                },
                {
                  id: '2',
                  content: 'Test memory 2',
                  importance: 0.6,
                  created_at: new Date().toISOString(),
                },
              ],
              error: null,
            })),
          })),
        })),
      })),
      rpc: vi.fn(() => ({
        data: [
          {
            id: '1',
            content: 'Similar memory 1',
            similarity: 0.9,
          },
        ],
        error: null,
      })),
    })),
  })),
}));

// Mock OpenAI for embeddings
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    embeddings: {
      create: vi.fn().mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }],
      }),
    },
  })),
}));

describe('MemoryManager', () => {
  let memoryManager: MemoryManager;

  beforeEach(() => {
    memoryManager = new MemoryManager({
      userId: 'test-user-1',
      personaId: 'test-persona-1',
    });
  });

  it('should create memory manager with correct configuration', () => {
    expect(memoryManager).toBeDefined();
  });

  it('should add a new memory', async () => {
    const result = await memoryManager.addMemory({
      content: 'User mentioned they love hiking',
      type: 'fact',
      importance: 0.7,
    });

    expect(result).toBeDefined();
  });

  it('should retrieve recent memories', async () => {
    const memories = await memoryManager.getRecentMemories(10);

    expect(memories).toBeDefined();
    expect(Array.isArray(memories)).toBe(true);
  });

  it('should search memories by semantic similarity', async () => {
    const memories = await memoryManager.searchMemories('hiking in mountains');

    expect(memories).toBeDefined();
    expect(Array.isArray(memories)).toBe(true);
  });

  it('should categorize memory types correctly', () => {
    const factMemory = memoryManager.categorizeMemory('User said their birthday is March 15th');
    const emotionMemory = memoryManager.categorizeMemory("User seemed really happy when talking about their dog");
    const preferenceMemory = memoryManager.categorizeMemory('User prefers morning conversations');

    expect(factMemory.type).toBe('fact');
    expect(emotionMemory.type).toBe('emotion');
    expect(preferenceMemory.type).toBe('preference');
  });

  it('should calculate memory importance correctly', () => {
    const highImportance = memoryManager.calculateImportance(
      'User shared that their parent passed away recently'
    );
    const lowImportance = memoryManager.calculateImportance(
      'User mentioned the weather is nice'
    );

    expect(highImportance).toBeGreaterThan(lowImportance);
  });

  it('should consolidate memories over time', async () => {
    const consolidatedMemories = await memoryManager.consolidateMemories();

    expect(consolidatedMemories).toBeDefined();
  });

  it('should generate memory summary', async () => {
    const summary = await memoryManager.generateSummary();

    expect(summary).toBeDefined();
    expect(typeof summary).toBe('string');
  });
});
