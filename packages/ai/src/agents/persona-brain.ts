// ===========================================
// PARALLEL - Persona Brain Agent
// The core intelligence that powers each AI companion
// ===========================================

import type {
  ChatMessage,
  PersonaConfig,
  WorldConfig,
  MemoryEntry,
  AgentContext,
  AgentResponse,
  AgentAction,
} from '../types';
import * as openai from '../providers/openai';
import { MemoryManager } from '../memory/manager';

export interface PersonaBrainConfig {
  persona: PersonaConfig;
  world?: WorldConfig;
  context: AgentContext;
}

export class PersonaBrainAgent {
  private persona: PersonaConfig;
  private world?: WorldConfig;
  private context: AgentContext;
  private memoryManager: MemoryManager;
  private conversationHistory: ChatMessage[] = [];
  private emotionalState: string = 'neutral';

  constructor(config: PersonaBrainConfig) {
    this.persona = config.persona;
    this.world = config.world;
    this.context = config.context;
    this.memoryManager = new MemoryManager(config.context.userId, config.persona.id);
  }

  // Process user message and generate response
  async processMessage(userMessage: string): Promise<AgentResponse> {
    // Add user message to history
    this.conversationHistory.push({
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      createdAt: new Date(),
    });

    // Retrieve relevant memories
    const memories = await this.memoryManager.retrieveRelevantMemories(userMessage);

    // Analyze user's emotional state
    const userEmotions = await openai.analyzeEmotions(userMessage);

    // Generate response
    const response = await openai.generateChatResponse({
      messages: this.conversationHistory,
      persona: this.persona,
      world: this.world,
      memories,
      temperature: this.getTemperatureForMood(userEmotions.primaryEmotion),
    });

    // Add assistant message to history
    const assistantMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: response.content,
      createdAt: new Date(),
      metadata: {
        model: response.model,
        tokensUsed: response.tokensUsed,
        generationTimeMs: response.generationTimeMs,
        emotions: userEmotions.emotions.map((e) => e.emotion),
        sentimentScore: userEmotions.sentimentScore,
      },
    };
    this.conversationHistory.push(assistantMessage);

    // Extract and store new memories
    const actions = await this.processPostResponse(userMessage, response.content, memories);

    // Generate suggestions for user
    const suggestions = this.generateSuggestions(userEmotions.primaryEmotion);

    // Update emotional state
    this.emotionalState = this.calculateEmotionalResponse(userEmotions.primaryEmotion);

    return {
      text: response.content,
      actions,
      suggestions,
      emotionalState: this.emotionalState,
    };
  }

  // Stream response for real-time display
  async *streamMessage(userMessage: string): AsyncGenerator<string, AgentResponse, unknown> {
    // Add user message to history
    this.conversationHistory.push({
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      createdAt: new Date(),
    });

    // Retrieve relevant memories
    const memories = await this.memoryManager.retrieveRelevantMemories(userMessage);

    // Stream response
    let fullResponse = '';
    const stream = openai.streamChatResponse({
      messages: this.conversationHistory,
      persona: this.persona,
      world: this.world,
      memories,
    });

    for await (const chunk of stream) {
      fullResponse += chunk;
      yield chunk;
    }

    // Add assistant message to history
    this.conversationHistory.push({
      id: Date.now().toString(),
      role: 'assistant',
      content: fullResponse,
      createdAt: new Date(),
    });

    // Process post-response actions
    const actions = await this.processPostResponse(userMessage, fullResponse, memories);

    return {
      text: fullResponse,
      actions,
      emotionalState: this.emotionalState,
    };
  }

  // Process actions after generating response
  private async processPostResponse(
    userMessage: string,
    response: string,
    existingMemories: MemoryEntry[]
  ): Promise<AgentAction[]> {
    const actions: AgentAction[] = [];

    // Extract new memories from conversation
    const newMemories = await openai.extractMemories(
      this.conversationHistory.slice(-6),
      existingMemories.map((m) => m.content)
    );

    for (const memory of newMemories) {
      if (memory.importance > 0.5) {
        await this.memoryManager.storeMemory({
          type: memory.type as MemoryEntry['type'],
          content: memory.content,
          importance: memory.importance,
        });

        actions.push({
          type: 'create_memory',
          payload: memory,
        });
      }
    }

    // Check for relationship updates
    const relationshipIndicators = this.detectRelationshipChanges(userMessage, response);
    if (relationshipIndicators.shouldUpdate) {
      actions.push({
        type: 'update_relationship',
        payload: relationshipIndicators,
      });
    }

    return actions;
  }

  // Detect if relationship level should change
  private detectRelationshipChanges(
    userMessage: string,
    _response: string
  ): { shouldUpdate: boolean; change: number; reason?: string } {
    const positiveIndicators = [
      'love',
      'amazing',
      'best',
      'thank',
      'appreciate',
      'happy',
      'wonderful',
      'perfect',
    ];
    const negativeIndicators = ['hate', 'annoying', 'boring', 'leave', 'goodbye', 'stop'];

    const messageLower = userMessage.toLowerCase();

    const positiveCount = positiveIndicators.filter((i) => messageLower.includes(i)).length;
    const negativeCount = negativeIndicators.filter((i) => messageLower.includes(i)).length;

    if (positiveCount > negativeCount && positiveCount >= 2) {
      return { shouldUpdate: true, change: 1, reason: 'positive_interaction' };
    }
    if (negativeCount > positiveCount && negativeCount >= 2) {
      return { shouldUpdate: true, change: -1, reason: 'negative_interaction' };
    }

    return { shouldUpdate: false, change: 0 };
  }

  // Adjust temperature based on user mood
  private getTemperatureForMood(mood: string): number {
    const moodTemperatures: Record<string, number> = {
      excited: 1.0,
      happy: 0.9,
      neutral: 0.8,
      sad: 0.7,
      angry: 0.6,
      anxious: 0.7,
    };
    return moodTemperatures[mood] || 0.8;
  }

  // Calculate persona's emotional response
  private calculateEmotionalResponse(userEmotion: string): string {
    const empathyLevel = this.persona.personality.empathyLevel;

    // High empathy personas mirror emotions more
    if (empathyLevel === 'high') {
      if (userEmotion === 'sad') return 'caring';
      if (userEmotion === 'happy') return 'joyful';
      if (userEmotion === 'anxious') return 'reassuring';
    }

    // Map emotions based on persona type
    const emotionMaps: Record<string, Record<string, string>> = {
      romantic: {
        sad: 'affectionate',
        happy: 'loving',
        anxious: 'supportive',
        neutral: 'warm',
      },
      friend: {
        sad: 'supportive',
        happy: 'excited',
        anxious: 'calming',
        neutral: 'friendly',
      },
      mentor: {
        sad: 'encouraging',
        happy: 'proud',
        anxious: 'wise',
        neutral: 'focused',
      },
      hype: {
        sad: 'motivating',
        happy: 'hyped',
        anxious: 'reassuring',
        neutral: 'energetic',
      },
    };

    return emotionMaps[this.persona.type]?.[userEmotion] || 'engaged';
  }

  // Generate conversation suggestions
  private generateSuggestions(userMood: string): string[] {
    const suggestionsByMood: Record<string, string[]> = {
      happy: [
        'Tell me more about what made you happy!',
        'Want to celebrate together?',
        "Let's make something creative!",
      ],
      sad: [
        "I'm here for you",
        'Want to talk about it?',
        'Let me cheer you up',
      ],
      anxious: [
        "Let's take a deep breath together",
        'What would help you feel better?',
        'Want me to distract you?',
      ],
      neutral: [
        'How was your day?',
        "Let's do something fun",
        'Tell me about your dreams',
      ],
    };

    return suggestionsByMood[userMood] || suggestionsByMood.neutral;
  }

  // Load conversation history
  loadHistory(messages: ChatMessage[]) {
    this.conversationHistory = messages;
  }

  // Get current conversation history
  getHistory(): ChatMessage[] {
    return this.conversationHistory;
  }

  // Clear conversation history
  clearHistory() {
    this.conversationHistory = [];
  }

  // Update world
  setWorld(world: WorldConfig) {
    this.world = world;
  }
}
