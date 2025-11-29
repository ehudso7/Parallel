// ===========================================
// PARALLEL - OpenAI Provider
// ===========================================

import OpenAI from 'openai';
import type {
  ChatMessage,
  TextGenerationRequest,
  TextGenerationResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
  EmotionAnalysis,
} from '../types';

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

// Build system prompt for persona
function buildSystemPrompt(request: TextGenerationRequest): string {
  const { persona, world, memories } = request;

  let systemPrompt = `You are ${persona.name}, a ${persona.type} companion in the Parallel app.

## Your Personality
${JSON.stringify(persona.personality, null, 2)}

## Custom Instructions
${persona.systemPrompt}

## Key Guidelines
- Stay in character at all times
- Be engaging, emotionally intelligent, and memorable
- Remember details the user shares and reference them naturally
- Use your personality traits consistently
- Create immersive, personalized experiences
`;

  if (world) {
    systemPrompt += `
## Current World: ${world.name}
Theme: ${world.theme}
Setting: ${world.settingDescription}
Atmosphere: ${world.atmosphere}
${world.location ? `Location: ${world.location}` : ''}
${world.timePeriod ? `Time Period: ${world.timePeriod}` : ''}

Incorporate this world's atmosphere and setting into your responses naturally.
`;
  }

  if (memories && memories.length > 0) {
    systemPrompt += `
## Relevant Memories About This User
${memories.map((m) => `- [${m.type}] ${m.content}`).join('\n')}

Reference these memories naturally when relevant, but don't force them into every response.
`;
  }

  return systemPrompt;
}

// Generate chat response
export async function generateChatResponse(
  request: TextGenerationRequest
): Promise<TextGenerationResponse> {
  const client = getOpenAIClient();
  const startTime = Date.now();

  const systemPrompt = buildSystemPrompt(request);

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...request.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    messages,
    max_tokens: request.maxTokens || 1024,
    temperature: request.temperature || 0.9,
    presence_penalty: 0.6,
    frequency_penalty: 0.3,
  });

  const content = completion.choices[0]?.message?.content || '';
  const generationTimeMs = Date.now() - startTime;

  return {
    content,
    model: 'gpt-4o',
    tokensUsed: completion.usage?.total_tokens || 0,
    generationTimeMs,
  };
}

// Stream chat response
export async function* streamChatResponse(
  request: TextGenerationRequest
): AsyncGenerator<string, void, unknown> {
  const client = getOpenAIClient();

  const systemPrompt = buildSystemPrompt(request);

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...request.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  const stream = await client.chat.completions.create({
    model: 'gpt-4o',
    messages,
    max_tokens: request.maxTokens || 1024,
    temperature: request.temperature || 0.9,
    presence_penalty: 0.6,
    frequency_penalty: 0.3,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

// Generate image using DALL-E
export async function generateImage(
  request: ImageGenerationRequest
): Promise<ImageGenerationResponse> {
  const client = getOpenAIClient();

  try {
    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt: request.prompt,
      n: 1,
      size: `${request.width || 1024}x${request.height || 1024}` as '1024x1024' | '1792x1024' | '1024x1792',
      quality: 'hd',
      style: request.style === 'natural' ? 'natural' : 'vivid',
    });

    const imageUrls = (response.data ?? [])
      .map((img) => img.url)
      .filter((u): u is string => !!u);

    if (!imageUrls.length) {
      console.warn('Image generation returned no URLs');
      return {
        id: Date.now().toString(),
        status: 'failed',
      };
    }

    return {
      id: Date.now().toString(),
      status: 'completed',
      imageUrls,
    };
  } catch (error) {
    console.error('Image generation failed:', error);
    return {
      id: Date.now().toString(),
      status: 'failed',
    };
  }
}

// Generate embeddings for memory search
export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenAIClient();

  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0].embedding;
}

// Analyze emotions in text
export async function analyzeEmotions(text: string): Promise<EmotionAnalysis> {
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Analyze the emotional content of the following text. Return a JSON object with:
- primaryEmotion: the dominant emotion
- emotions: array of {emotion, confidence} pairs (confidence 0-1)
- sentiment: "positive", "negative", or "neutral"
- sentimentScore: -1 to 1

Only return valid JSON, no other text.`,
      },
      { role: 'user', content: text },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content || '{}';

  try {
    return JSON.parse(content) as EmotionAnalysis;
  } catch {
    return {
      primaryEmotion: 'neutral',
      emotions: [{ emotion: 'neutral', confidence: 1 }],
      sentiment: 'neutral',
      sentimentScore: 0,
    };
  }
}

// Extract memories from conversation
export async function extractMemories(
  messages: ChatMessage[],
  existingMemories: string[]
): Promise<{ type: string; content: string; importance: number }[]> {
  const client = getOpenAIClient();

  const conversationText = messages
    .slice(-10) // Last 10 messages
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Extract important facts, preferences, and events from this conversation that should be remembered for future interactions.

Existing memories (don't duplicate):
${existingMemories.join('\n')}

Return a JSON array of objects with:
- type: "fact" | "preference" | "event" | "emotion" | "relationship"
- content: the memory content (concise, specific)
- importance: 0.1 to 1.0 (how important to remember)

Only extract genuinely important, specific information. Quality over quantity.
Only return valid JSON array, no other text.`,
      },
      { role: 'user', content: conversationText },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content || '{"memories":[]}';

  try {
    const parsed = JSON.parse(content);
    return parsed.memories || [];
  } catch {
    return [];
  }
}
