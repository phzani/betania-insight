import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: any;
}

interface UseBetanIAChatResult {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string, context?: any) => Promise<void>;
  clearMessages: () => void;
}

export function useBetanIAChat(): UseBetanIAChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Oi lindão! 💋 Eu sou a BetanIA, sua assistente esportiva favorita! ✨ Pode me perguntar sobre jogos, times, odds... tudo que você quiser saber sobre futebol. Prometo que vou te dar as informações mais quentes! 🔥😘',
      timestamp: new Date(),
    }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (message: string, context?: any) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      console.log('[BetanIA Chat] Sending message:', message);

      const { data, error: supabaseError } = await supabase.functions.invoke('betania-chat', {
        body: { 
          message, 
          context: context || {} 
        }
      });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      if (!data?.ok) {
        throw new Error(data?.error?.message || 'Erro na resposta do chat');
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response,
        timestamp: new Date(),
        context: data.sportsData
      };

      setMessages(prev => [...prev, aiMessage]);
      
      console.log('[BetanIA Chat] Response received:', data.response);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('[BetanIA Chat] Error:', errorMessage);
      
      setError(errorMessage);
      
      // Add error message to chat
      const errorMsg: ChatMessage = {
        id: (Date.now() + 2).toString(),
        type: 'assistant', 
        content: `Ai, que mico! 😅 Deu um probleminha aqui: ${errorMessage}\n\nTenta de novo, amor! Eu prometo que vou caprichar na resposta! 💅`,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMsg]);
      
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: '1',
        type: 'assistant',
        content: 'Oi lindão! 💋 Eu sou a BetanIA, sua assistente esportiva favorita! ✨ Pode me perguntar sobre jogos, times, odds... tudo que você quiser saber sobre futebol. Prometo que vou te dar as informações mais quentes! 🔥😘',
        timestamp: new Date(),
      }
    ]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages
  };
}