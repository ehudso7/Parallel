import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PersonaConfig, WorldConfig, AgentContext } from '../types';

// Mock the entire openai provider module
vi.mock('../providers/openai', () => ({
  getOpenAIClient: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Hello! How are you doing today?' } }],
          usage: { total_tokens: 100 },
        }),
      },
    },
    embeddings: {
      create: vi.fn().mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }],
      }),
    },
  })),
  generateChatResponse: vi.fn().mockResolvedValue({
    content: 'Hello! How are you doing today?',
    model: 'gpt-4o',
    tokensUsed: 100,
    generationTimeMs: 500,
  }),
  streamChatResponse: vi.fn().mockImplementation(async function* () {
    yield 'Hello! ';
    yield 'How are you ';
    yield 'doing today?';
  }),
  analyzeEmotions: vi.fn().mockResolvedValue({
    primaryEmotion: 'neutral',
    emotions: [{ emotion: 'neutral', confidence: 0.8 }],
    sentiment: 'neutral',
    sentimentScore: 0,
  }),
  extractMemories: vi.fn().mockResolvedValue([]),
  generateEmbedding: vi.fn().mockResolvedValue(new Array(1536).fill(0.1)),
}));

describe('PersonaBrainAgent', () => {
  let testPersona: PersonaConfig;
  let testContext: AgentContext;

  beforeEach(() => {
    vi.clearAllMocks();

    testPersona = {
      id: 'test-persona-1',
      name: 'Luna',
      type: 'friend',
      personality: {
        traits: ['friendly', 'supportive', 'curious'],
        speakingStyle: 'warm and casual',
        emotionalRange: 'wide',
        humorLevel: 'moderate',
        formality: 'casual',
        empathyLevel: 'high',
        assertiveness: 'medium',
      },
      systemPrompt: 'You are Luna, a friendly and supportive companion.',
    };

    testContext = {
      userId: 'test-user-1',
      personaId: 'test-persona-1',
      conversationId: 'test-conversation-1',
    };
  });

  it('should create an agent with correct configuration', async () => {
    const { PersonaBrainAgent } = await import('../agents/persona-brain');
    const agent = new PersonaBrainAgent({
      persona: testPersona,
      context: testContext,
    });

    expect(agent).toBeDefined();
  });

  it('should process messages and return response', async () => {
    const { PersonaBrainAgent } = await import('../agents/persona-brain');
    const agent = new PersonaBrainAgent({
      persona: testPersona,
      context: testContext,
    });

    const response = await agent.processMessage('Hello Luna!');

    expect(response).toBeDefined();
    expect(response.text).toBeDefined();
    expect(typeof response.text).toBe('string');
  });

  it('should include emotional state in response', async () => {
    const { PersonaBrainAgent } = await import('../agents/persona-brain');
    const agent = new PersonaBrainAgent({
      persona: testPersona,
      context: testContext,
    });

    const response = await agent.processMessage("I'm feeling a bit down today");

    expect(response).toBeDefined();
    expect(response.emotionalState).toBeDefined();
  });

  it('should handle different persona types', async () => {
    const { PersonaBrainAgent } = await import('../agents/persona-brain');

    const mentorPersona: PersonaConfig = {
      id: 'test-persona-2',
      name: 'Max',
      type: 'mentor',
      personality: {
        traits: ['wise', 'patient', 'motivating'],
        speakingStyle: 'encouraging and thoughtful',
        emotionalRange: 'measured',
        humorLevel: 'subtle',
        formality: 'professional',
        empathyLevel: 'high',
        assertiveness: 'high',
      },
      systemPrompt: 'You are Max, a wise and motivating mentor.',
    };

    const mentorAgent = new PersonaBrainAgent({
      persona: mentorPersona,
      context: testContext,
    });

    expect(mentorAgent).toBeDefined();
  });

  it('should incorporate world context when provided', async () => {
    const { PersonaBrainAgent } = await import('../agents/persona-brain');

    const worldConfig: WorldConfig = {
      id: 'cyber-tokyo',
      name: 'Cyber Tokyo 2089',
      theme: 'cyber',
      settingDescription: 'A neon-lit megacity in a dystopian future',
      atmosphere: 'gritty, electric, and mysterious',
      timePeriod: '2089',
      location: 'Neo Tokyo',
      scenarios: ['street race', 'hacker heist'],
      locations: ['neon district', 'underground market'],
    };

    const worldPersona: PersonaConfig = {
      id: 'test-persona-3',
      name: 'Aria',
      type: 'roleplay',
      personality: {
        traits: ['adventurous', 'creative'],
        speakingStyle: 'energetic',
        emotionalRange: 'expressive',
        humorLevel: 'moderate',
        formality: 'casual',
        empathyLevel: 'medium',
        assertiveness: 'high',
      },
      systemPrompt: 'You are Aria, an adventurous explorer in Cyber Tokyo.',
      worldId: 'cyber-tokyo',
    };

    const worldAgent = new PersonaBrainAgent({
      persona: worldPersona,
      world: worldConfig,
      context: testContext,
    });

    expect(worldAgent).toBeDefined();
  });

  it('should load and clear conversation history', async () => {
    const { PersonaBrainAgent } = await import('../agents/persona-brain');
    const agent = new PersonaBrainAgent({
      persona: testPersona,
      context: testContext,
    });

    agent.loadHistory([
      {
        id: '1',
        role: 'user',
        content: 'Hello!',
        createdAt: new Date(),
      },
      {
        id: '2',
        role: 'assistant',
        content: 'Hi there!',
        createdAt: new Date(),
      },
    ]);

    const history = agent.getHistory();
    expect(history.length).toBe(2);

    agent.clearHistory();
    expect(agent.getHistory().length).toBe(0);
  });
});
