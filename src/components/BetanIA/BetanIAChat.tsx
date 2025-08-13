import React, { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FixtureCard } from "./FixtureCard";
import { ChatMessage } from "./ChatMessage";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: any;
}

export const BetanIAChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: '👋 E aí! Sou o BetanIA, seu assistente de análise esportiva. Pode me perguntar sobre jogos, times, odds... Vamos nessa!',
      timestamp: new Date(),
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: getBetanIAResponse(inputMessage),
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const getBetanIAResponse = (query: string): string => {
    const responses = [
      'Beleza! Deixa eu dar uma olhada nos dados aqui... 📊',
      'Opa, achei uns jogos interessantes pra você! ⚽',
      'As odds tão meio esquisitas hoje, mas vou te mostrar mesmo assim 👀',
      'Eita, esse time tá numa sequência boa hein! Vamos aos números... 📈'
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full relative">
      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6">
          {messages.map((message) => (
            <ChatMessage 
              key={message.id} 
              message={message}
              className="message-enter"
            />
          ))}
          
          {isTyping && (
            <div className="flex items-center gap-3 p-4 betania-glass max-w-md">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-100" />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-200" />
              </div>
            </div>
          )}
          
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-6 border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="betania-glass border-0 hover:bg-white/[0.08] text-muted-foreground"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Pergunte sobre jogos, times, odds..."
              className="betania-glass border-0 bg-white/[0.02] placeholder:text-muted-foreground/70 pr-12"
            />
            <Button
              onClick={handleSendMessage}
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600"
              disabled={!inputMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2 mt-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="betania-glass border-0 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setInputMessage('Próximos jogos do Palmeiras')}
          >
            Próximos jogos
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="betania-glass border-0 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setInputMessage('Jogos de hoje')}
          >
            Jogos hoje
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="betania-glass border-0 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setInputMessage('Libertadores 2025')}
          >
            Libertadores
          </Button>
        </div>
      </div>
    </div>
  );
};