// ===========================================
// PARALLEL - Anthropic Provider
// ===========================================

import Anthropic from '@anthropic-ai/sdk';
import type {
  TextGenerationRequest,
  TextGenerationResponse,
} from '../types';

let anthropicClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
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

// Generate chat response using Claude
export async function generateChatResponse(
  request: TextGenerationRequest
): Promise<TextGenerationResponse> {
  const client = getAnthropicClient();
  const startTime = Date.now();

  const systemPrompt = buildSystemPrompt(request);

  const messages: Anthropic.MessageParam[] = request.messages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content,
  }));

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: request.maxTokens || 1024,
    system: systemPrompt,
    messages,
  });

  const content =
    response.content[0].type === 'text' ? response.content[0].text : '';
  const generationTimeMs = Date.now() - startTime;

  return {
    content,
    model: 'claude-sonnet-4-20250514',
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    generationTimeMs,
  };
}

// Stream chat response using Claude
export async function* streamChatResponse(
  request: TextGenerationRequest
): AsyncGenerator<string, void, unknown> {
  const client = getAnthropicClient();

  const systemPrompt = buildSystemPrompt(request);

  const messages: Anthropic.MessageParam[] = request.messages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content,
  }));

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: request.maxTokens || 1024,
    system: systemPrompt,
    messages,
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text;
    }
  }
}
