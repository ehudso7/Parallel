// ===========================================
// PARALLEL - Memory Manager
// Handles storage and retrieval of AI memories
// ===========================================

import type { MemoryEntry } from '../types';
import * as openai from '../providers/openai';

// In-memory cache for quick access
const memoryCache = new Map<string, MemoryEntry[]>();

export class MemoryManager {
  private userId: string;
  private personaId: string;
  private cacheKey: string;

  constructor(userId: string, personaId: string) {
    this.userId = userId;
    this.personaId = personaId;
    this.cacheKey = `${userId}:${personaId}`;
  }

  // Store a new memory
  async storeMemory(memory: {
    type: MemoryEntry['type'];
    content: string;
    importance: number;
    expiresAt?: Date;
  }): Promise<MemoryEntry> {
    // Generate embedding for semantic search (used in production with Supabase)
    const _embedding = await openai.generateEmbedding(memory.content);

    // Generate summary for long memories
    let summary: string | undefined;
    if (memory.content.length > 200) {
      summary = await this.summarizeMemory(memory.content);
    }

    const newMemory: MemoryEntry = {
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type: memory.type,
      content: memory.content,
      summary,
      importance: memory.importance,
      createdAt: new Date(),
      expiresAt: memory.expiresAt,
    };

    // Store in cache
    const cached = memoryCache.get(this.cacheKey) || [];
    cached.push(newMemory);
    memoryCache.set(this.cacheKey, cached);

    // In production, also store in Supabase with embedding
    // await this.storeInDatabase(newMemory, embedding);

    return newMemory;
  }

  // Retrieve relevant memories for a given context
  async retrieveRelevantMemories(
    context: string,
    limit: number = 10
  ): Promise<MemoryEntry[]> {
    // Get all memories for this user-persona pair
    const allMemories = memoryCache.get(this.cacheKey) || [];

    if (allMemories.length === 0) {
      return [];
    }

    // Generate embedding for context (used in production with Supabase vector search)
    const _contextEmbedding = await openai.generateEmbedding(context);

    // In production, use vector similarity search in Supabase
    // For now, use simple keyword matching and importance scoring

    const scored = allMemories.map((memory) => {
      let score = memory.importance;

      // Boost score for keyword matches
      const contextWords = context.toLowerCase().split(/\s+/);
      const memoryWords = memory.content.toLowerCase().split(/\s+/);

      for (const word of contextWords) {
        if (memoryWords.includes(word)) {
          score += 0.1;
        }
      }

      // Recency boost
      const ageInDays =
        (Date.now() - memory.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (ageInDays < 1) score += 0.2;
      else if (ageInDays < 7) score += 0.1;

      // Type-based boost
      if (memory.type === 'preference') score += 0.15;
      if (memory.type === 'fact') score += 0.1;

      return { memory, score };
    });

    // Sort by score and return top memories
    scored.sort((a, b) => b.score - a.score);

    // Update access counts
    const topMemories = scored.slice(0, limit).map((s) => s.memory);
    // await this.updateAccessCounts(topMemories.map(m => m.id));

    return topMemories;
  }

  // Get memories by type
  getMemoriesByType(type: MemoryEntry['type']): MemoryEntry[] {
    const allMemories = memoryCache.get(this.cacheKey) || [];
    return allMemories.filter((m) => m.type === type);
  }

  // Get all memories
  getAllMemories(): MemoryEntry[] {
    return memoryCache.get(this.cacheKey) || [];
  }

  // Delete a memory
  deleteMemory(memoryId: string): boolean {
    const memories = memoryCache.get(this.cacheKey) || [];
    const filtered = memories.filter((m) => m.id !== memoryId);

    if (filtered.length < memories.length) {
      memoryCache.set(this.cacheKey, filtered);
      // In production, also delete from database
      return true;
    }
    return false;
  }

  // Clear all memories
  clearAllMemories(): void {
    memoryCache.delete(this.cacheKey);
    // In production, also clear from database
  }

  // Consolidate memories (merge similar ones)
  async consolidateMemories(): Promise<number> {
    const memories = memoryCache.get(this.cacheKey) || [];

    if (memories.length < 10) {
      return 0;
    }

    // Group similar memories
    const groups: MemoryEntry[][] = [];

    for (const memory of memories) {
      let addedToGroup = false;

      for (const group of groups) {
        if (this.areSimilar(memory, group[0])) {
          group.push(memory);
          addedToGroup = true;
          break;
        }
      }

      if (!addedToGroup) {
        groups.push([memory]);
      }
    }

    // Merge groups with more than one memory
    let mergedCount = 0;
    const newMemories: MemoryEntry[] = [];

    for (const group of groups) {
      if (group.length === 1) {
        newMemories.push(group[0]);
      } else {
        // Merge memories in this group
        const merged = await this.mergeMemories(group);
        newMemories.push(merged);
        mergedCount += group.length - 1;
      }
    }

    memoryCache.set(this.cacheKey, newMemories);
    return mergedCount;
  }

  // Check if two memories are similar
  private areSimilar(a: MemoryEntry, b: MemoryEntry): boolean {
    if (a.type !== b.type) return false;

    const wordsA = new Set(a.content.toLowerCase().split(/\s+/));
    const wordsB = new Set(b.content.toLowerCase().split(/\s+/));

    const intersection = new Set([...wordsA].filter((x) => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);

    const similarity = intersection.size / union.size;
    return similarity > 0.5;
  }

  // Merge multiple memories into one
  private async mergeMemories(memories: MemoryEntry[]): Promise<MemoryEntry> {
    const client = openai.getOpenAIClient();

    const content = memories.map((m) => m.content).join('\n- ');

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Merge these related memories into a single, concise memory that captures all important information. Keep it brief but comprehensive.',
        },
        { role: 'user', content: `Memories to merge:\n- ${content}` },
      ],
      temperature: 0.3,
    });

    const mergedContent =
      response.choices[0]?.message?.content || memories[0].content;

    return {
      id: `mem_${Date.now()}_merged`,
      type: memories[0].type,
      content: mergedContent,
      importance: Math.max(...memories.map((m) => m.importance)),
      createdAt: new Date(),
    };
  }

  // Summarize long memory
  private async summarizeMemory(content: string): Promise<string> {
    const client = openai.getOpenAIClient();

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Summarize this memory in one concise sentence.',
        },
        { role: 'user', content },
      ],
      temperature: 0.3,
      max_tokens: 100,
    });

    return response.choices[0]?.message?.content || content.slice(0, 100);
  }

  // Export memories for backup
  exportMemories(): string {
    const memories = memoryCache.get(this.cacheKey) || [];
    return JSON.stringify(memories, null, 2);
  }

  // Import memories from backup
  importMemories(json: string): number {
    try {
      const imported = JSON.parse(json) as MemoryEntry[];
      const existing = memoryCache.get(this.cacheKey) || [];

      // Merge, avoiding duplicates
      const existingIds = new Set(existing.map((m) => m.id));
      const newMemories = imported.filter((m) => !existingIds.has(m.id));

      memoryCache.set(this.cacheKey, [...existing, ...newMemories]);
      return newMemories.length;
    } catch {
      return 0;
    }
  }
}
