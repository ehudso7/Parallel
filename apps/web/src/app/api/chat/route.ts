import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PersonaBrainAgent } from '@parallel/ai';
import type { PersonaConfig, WorldConfig, ChatMessage } from '@parallel/ai';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, message } = await request.json();

    if (!conversationId || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch conversation with persona and world
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        persona:personas(*),
        world:worlds(*)
      `)
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Fetch recent messages for context
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(20);

    // Save user message
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: message,
    });

    // Prepare persona config
    const personaConfig: PersonaConfig = {
      id: conversation.persona.id,
      name: conversation.persona.name,
      type: conversation.persona.persona_type,
      personality: conversation.persona.personality,
      systemPrompt: conversation.persona.system_prompt || '',
      voiceId: conversation.persona.voice_id || undefined,
      worldId: conversation.world?.id,
    };

    // Prepare world config if exists
    let worldConfig: WorldConfig | undefined;
    if (conversation.world) {
      worldConfig = {
        id: conversation.world.id,
        name: conversation.world.name,
        theme: conversation.world.theme,
        settingDescription: conversation.world.setting_description || '',
        atmosphere: conversation.world.atmosphere || '',
        timePeriod: conversation.world.time_period || undefined,
        location: conversation.world.location || undefined,
        scenarios: conversation.world.available_scenarios || [],
        locations: conversation.world.available_locations || [],
      };
    }

    // Prepare chat history
    const chatHistory: ChatMessage[] = (recentMessages || [])
      .reverse()
      .map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
        createdAt: new Date(m.created_at),
      }));

    // Add current message
    chatHistory.push({
      id: 'current',
      role: 'user',
      content: message,
      createdAt: new Date(),
    });

    // Create agent and generate response
    const agent = new PersonaBrainAgent({
      persona: personaConfig,
      world: worldConfig,
      context: {
        userId: user.id,
        personaId: conversation.persona.id,
        conversationId,
        worldId: conversation.world?.id,
      },
    });

    // Load history into agent
    agent.loadHistory(chatHistory);

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = '';

          // Stream the response
          for await (const chunk of agent.streamMessage(message)) {
            fullResponse += chunk;
            controller.enqueue(encoder.encode(chunk));
          }

          // Save assistant message
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: fullResponse,
            model: 'gpt-4o',
          });

          // Update conversation
          await supabase
            .from('conversations')
            .update({
              last_message_at: new Date().toISOString(),
            })
            .eq('id', conversationId);

          // Update user stats
          await supabase.rpc('increment_message_count', { user_id: user.id });

          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
