// ===========================================
// PARALLEL - AI Types
// ===========================================

import type { PersonaType, WorldTheme } from '@parallel/database';

// Chat Message Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
  metadata?: {
    model?: string;
    tokensUsed?: number;
    generationTimeMs?: number;
    emotions?: string[];
    sentimentScore?: number;
  };
}

// Persona Configuration
export interface PersonaConfig {
  id: string;
  name: string;
  type: PersonaType;
  personality: {
    traits: string[];
    speakingStyle: string;
    emotionalRange: string;
    humorLevel: string;
    formality: string;
    empathyLevel: string;
    assertiveness: string;
  };
  systemPrompt: string;
  voiceId?: string;
  worldId?: string;
}

// World Configuration
export interface WorldConfig {
  id: string;
  name: string;
  theme: WorldTheme;
  settingDescription: string;
  atmosphere: string;
  timePeriod?: string;
  location?: string;
  scenarios: string[];
  locations: string[];
}

// Memory Types
export interface MemoryEntry {
  id: string;
  type: 'fact' | 'preference' | 'event' | 'emotion' | 'relationship';
  content: string;
  summary?: string;
  importance: number;
  createdAt: Date;
  expiresAt?: Date;
}

// Generation Request Types
export interface TextGenerationRequest {
  messages: ChatMessage[];
  persona: PersonaConfig;
  world?: WorldConfig;
  memories?: MemoryEntry[];
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface TextGenerationResponse {
  content: string;
  model: string;
  tokensUsed: number;
  generationTimeMs: number;
  newMemories?: MemoryEntry[];
}

// Content Generation Types
export type ContentGenerationType = 'music' | 'video' | 'image' | 'voice';

export interface MusicGenerationRequest {
  prompt: string;
  style?: string;
  duration?: number; // in seconds
  instrumental?: boolean;
  tags?: string[];
}

export interface MusicGenerationResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  audioUrl?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface ImageGenerationRequest {
  prompt: string;
  style?: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  numImages?: number;
}

export interface ImageGenerationResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  imageUrls?: string[];
  metadata?: Record<string, unknown>;
}

export interface VideoGenerationRequest {
  prompt: string;
  imageUrl?: string; // for image-to-video
  duration?: number;
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

export interface VideoGenerationResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface VoiceGenerationRequest {
  text: string;
  voiceId: string;
  stability?: number;
  similarityBoost?: number;
}

export interface VoiceGenerationResponse {
  id: string;
  audioUrl: string;
  duration: number;
}

// Agent Types
export interface AgentContext {
  userId: string;
  personaId: string;
  conversationId: string;
  worldId?: string;
}

export interface AgentResponse {
  text: string;
  actions?: AgentAction[];
  suggestions?: string[];
  emotionalState?: string;
}

export interface AgentAction {
  type: 'create_memory' | 'update_relationship' | 'trigger_event' | 'suggest_content';
  payload: Record<string, unknown>;
}

// Emotion Detection
export interface EmotionAnalysis {
  primaryEmotion: string;
  emotions: { emotion: string; confidence: number }[];
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
}

// Provider Configuration
export interface AIProviderConfig {
  provider: 'openai' | 'anthropic';
  model: string;
  apiKey: string;
  maxTokens?: number;
  temperature?: number;
}
