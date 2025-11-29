'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Avatar, AvatarFallback, Badge, ScrollArea } from '@parallel/ui';
import { toast } from '@parallel/ui';
import {
  Send,
  Mic,
  Image as ImageIcon,
  Sparkles,
  MoreVertical,
  ArrowLeft,
  Globe,
  Phone,
  Video,
  Heart,
  Smile,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase/client';
import type { Message, Conversation, Persona, World } from '@parallel/database';
import { cn } from '@parallel/ui';

interface ChatMessage extends Message {
  isStreaming?: boolean;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const [_conversation, setConversation] = useState<Conversation | null>(null);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [world, setWorld] = useState<World | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load conversation and messages
  useEffect(() => {
    loadConversation();
  }, [conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversation = async () => {
    const supabase = getSupabase();

    // Fetch conversation with persona and world
    const { data: conv, error } = await supabase
      .from('conversations')
      .select(`
        *,
        persona:personas(*),
        world:worlds(*)
      `)
      .eq('id', conversationId)
      .single();

    if (error || !conv) {
      toast({ title: 'Conversation not found', variant: 'error' });
      router.push('/chat');
      return;
    }

    setConversation(conv);
    setPersona(conv.persona);
    setWorld(conv.world);

    // Fetch messages
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    setMessages(msgs || []);
    setIsLoading(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isSending) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsSending(true);

    // Add user message to UI immediately
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
      attachments: [],
      tokens_used: 0,
      is_edited: false,
      is_regenerated: false,
      reaction: null,
      detected_emotions: [],
      sentiment_score: null,
      generated_content_id: null,
      model: null,
      generation_time_ms: null,
      metadata: {},
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    // Add streaming placeholder for AI response
    const tempAiMsg: ChatMessage = {
      id: `temp-ai-${Date.now()}`,
      conversation_id: conversationId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      attachments: [],
      tokens_used: 0,
      is_edited: false,
      is_regenerated: false,
      reaction: null,
      detected_emotions: [],
      sentiment_score: null,
      generated_content_id: null,
      model: null,
      generation_time_ms: null,
      metadata: {},
      isStreaming: true,
    };
    setMessages((prev) => [...prev, tempAiMsg]);

    try {
      // Call API to generate response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: userMessage,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      // Stream response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          fullResponse += chunk;

          // Update streaming message
          setMessages((prev) =>
            prev.map((msg) =>
              msg.isStreaming ? { ...msg, content: fullResponse } : msg
            )
          );
        }
      }

      // Finalize message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.isStreaming ? { ...msg, isStreaming: false } : msg
        )
      );

      // Reload to get proper message IDs
      await loadConversation();
    } catch (_error) {
      toast({ title: 'Failed to send message', variant: 'error' });
      // Remove failed messages
      setMessages((prev) => prev.filter((m) => !m.id.startsWith('temp-')));
    } finally {
      setIsSending(false);
    }
  }, [inputValue, isSending, conversationId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 h-16 border-b border-white/10 flex items-center justify-between px-4 lg:px-6 bg-slate-900/50 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/chat')} className="lg:hidden">
            <ArrowLeft className="w-6 h-6" />
          </button>

          <Avatar size="md" status="online">
            <AvatarFallback>{persona?.name?.[0] || '?'}</AvatarFallback>
          </Avatar>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold">{persona?.name || 'Unknown'}</h1>
              <Badge variant="secondary" className="text-xs capitalize">
                {persona?.persona_type}
              </Badge>
            </div>
            {world && (
              <p className="text-xs text-white/60 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {world.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 lg:p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Greeting */}
          {messages.length === 0 && persona?.greeting_message && (
            <div className="flex items-start gap-3">
              <Avatar size="md">
                <AvatarFallback>{persona.name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="bg-white/5 rounded-2xl rounded-tl-sm p-4 max-w-[80%]">
                  <p className="text-white/90">{persona.greeting_message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex items-start gap-3 message-animation',
                message.role === 'user' && 'flex-row-reverse'
              )}
            >
              {message.role === 'assistant' && (
                <Avatar size="md">
                  <AvatarFallback>{persona?.name?.[0]}</AvatarFallback>
                </Avatar>
              )}

              <div
                className={cn(
                  'flex-1',
                  message.role === 'user' && 'flex justify-end'
                )}
              >
                <div
                  className={cn(
                    'rounded-2xl p-4 max-w-[80%] inline-block',
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-tr-sm'
                      : 'bg-white/5 text-white/90 rounded-tl-sm'
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.isStreaming && (
                    <span className="inline-flex gap-1 ml-2">
                      <span className="w-1.5 h-1.5 bg-white/60 rounded-full typing-dot" />
                      <span className="w-1.5 h-1.5 bg-white/60 rounded-full typing-dot" />
                      <span className="w-1.5 h-1.5 bg-white/60 rounded-full typing-dot" />
                    </span>
                  )}
                </div>

                {/* Message actions */}
                {message.role === 'assistant' && !message.isStreaming && (
                  <div className="flex items-center gap-2 mt-2 opacity-0 hover:opacity-100 transition">
                    <button className="text-white/40 hover:text-white">
                      <Heart className="w-4 h-4" />
                    </button>
                    <button className="text-white/40 hover:text-white">
                      <Smile className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t border-white/10 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${persona?.name || 'AI'}...`}
                className="w-full min-h-[48px] max-h-[200px] px-4 py-3 pr-24 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 resize-none"
                rows={1}
              />

              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ImageIcon className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Mic className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Sparkles className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Button
              variant="glow"
              size="icon"
              className="h-12 w-12 rounded-xl"
              onClick={handleSend}
              disabled={!inputValue.trim() || isSending}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>

          {/* Suggestions */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
            {['Tell me a story', 'How are you?', 'Create something', 'Play a game'].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setInputValue(suggestion)}
                className="flex-shrink-0 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/60 hover:bg-white/10 hover:text-white transition"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
