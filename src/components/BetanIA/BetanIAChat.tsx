import React, { useRef, useEffect } from "react";
import { Send, Paperclip, Zap, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { useBetanIAChat } from "@/hooks/useBetanIAChat";
import { useToast } from "@/hooks/use-toast";

export const BetanIAChat = () => {
  const { messages, isLoading, error, sendMessage, clearMessages } = useBetanIAChat();
  const [inputMessage, setInputMessage] = React.useState('');
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    setInputMessage('');
    
    try {
      await sendMessage(inputMessage);
    } catch (err) {
      toast({
        title: "Erro no Chat",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleQuickAction = async (message: string) => {
    setInputMessage(message);
    await sendMessage(message);
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
          
          {isLoading && (
            <div className="flex items-center gap-3 p-4 betania-glass max-w-md message-enter">
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
        {error && (
          <div className="mb-3 p-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="betania-glass border-0 hover:bg-white/[0.08] text-muted-foreground"
            onClick={clearMessages}
            title="Limpar conversa"
          >
            <RotateCcw className="h-4 w-4" />
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
              disabled={!inputMessage.trim() || isLoading}
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
            onClick={() => handleQuickAction('Próximos jogos do Palmeiras')}
            disabled={isLoading}
          >
            Próximos jogos
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="betania-glass border-0 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => handleQuickAction('Jogos de hoje')}
            disabled={isLoading}
          >
            Jogos hoje
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="betania-glass border-0 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => handleQuickAction('Libertadores 2025')}
            disabled={isLoading}
          >
            Libertadores
          </Button>
        </div>
      </div>
    </div>
  );
};