import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PersonaBrainAgent } from '../agents/persona-brain';

// Mock OpenAI
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'Hello! How are you doing today?',
              },
            },
          ],
        }),
      },
    },
  })),
}));

describe('PersonaBrainAgent', () => {
  let agent: PersonaBrainAgent;

  beforeEach(() => {
    agent = new PersonaBrainAgent({
      personaId: 'test-persona-1',
      personaType: 'companion',
      name: 'Luna',
      personality: {
        traits: ['friendly', 'supportive', 'curious'],
        speakingStyle: 'warm and casual',
        interests: ['music', 'art', 'philosophy'],
      },
      memories: [],
      worldContext: null,
    });
  });

  it('should create an agent with correct configuration', () => {
    expect(agent).toBeDefined();
  });

  it('should generate system prompt based on persona type', () => {
    // @ts-ignore - accessing private method for testing
    const systemPrompt = agent.buildSystemPrompt();

    expect(systemPrompt).toContain('Luna');
    expect(systemPrompt).toContain('companion');
    expect(systemPrompt).toContain('friendly');
  });

  it('should process messages and return response', async () => {
    const response = await agent.processMessage('Hello Luna!');

    expect(response).toBeDefined();
    expect(response.content).toBeDefined();
    expect(typeof response.content).toBe('string');
  });

  it('should include emotion analysis in response', async () => {
    const response = await agent.processMessage("I'm feeling a bit down today");

    expect(response).toBeDefined();
    expect(response.emotionalContext).toBeDefined();
  });

  it('should handle different persona types', () => {
    const mentorAgent = new PersonaBrainAgent({
      personaId: 'test-persona-2',
      personaType: 'mentor',
      name: 'Max',
      personality: {
        traits: ['wise', 'patient', 'motivating'],
        speakingStyle: 'encouraging and thoughtful',
        interests: ['personal development', 'strategy', 'leadership'],
      },
      memories: [],
      worldContext: null,
    });

    expect(mentorAgent).toBeDefined();
    // @ts-ignore - accessing private method for testing
    const systemPrompt = mentorAgent.buildSystemPrompt();
    expect(systemPrompt).toContain('mentor');
  });

  it('should incorporate world context when provided', () => {
    const worldAgent = new PersonaBrainAgent({
      personaId: 'test-persona-3',
      personaType: 'companion',
      name: 'Aria',
      personality: {
        traits: ['adventurous', 'creative'],
        speakingStyle: 'energetic',
        interests: ['exploration'],
      },
      memories: [],
      worldContext: {
        worldId: 'cyber-tokyo',
        worldName: 'Cyber Tokyo 2089',
        theme: 'cyberpunk',
        setting: 'A neon-lit megacity in a dystopian future',
        rules: ['Use tech slang', 'Reference cyber implants'],
      },
    });

    // @ts-ignore - accessing private method for testing
    const systemPrompt = worldAgent.buildSystemPrompt();
    expect(systemPrompt).toContain('Cyber Tokyo');
    expect(systemPrompt).toContain('cyberpunk');
  });
});
