import React, { useRef, useEffect } from "react";
import { Send, RotateCcw, Filter, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ChatMessage } from "./ChatMessage";
import { useBetanIAChat } from "@/hooks/useBetanIAChat";
import { useFilterStore } from "@/stores/filterStore";
import { useToast } from "@/hooks/use-toast";

export const BetanIAChat = () => {
  const { messages, isLoading, error, sendMessage, clearMessages } = useBetanIAChat();
  const [inputMessage, setInputMessage] = React.useState('');
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Get filter state to enhance quick actions
  const {
    activeFilter,
    selectedLeague,
    selectedTeam,
    favoriteTeams,
    todayCount,
    liveCount,
    upcomingCount,
    clearAllFilters
  } = useFilterStore();

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Create context from current filters
    const context = {
      activeFilter,
      selectedLeague,
      selectedTeam,
      favoriteTeams,
      todayCount,
      liveCount,
      upcomingCount
    };

    setInputMessage('');
    
    try {
      await sendMessage(inputMessage, context);
    } catch (err) {
      toast({
        title: "Erro no Chat",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleQuickAction = async (message: string) => {
    const context = {
      activeFilter,
      selectedLeague,
      selectedTeam,
      favoriteTeams
    };
    
    try {
      await sendMessage(message, context);
    } catch (err) {
      toast({
        title: "Erro no Chat",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Generate dynamic quick actions based on filters
  const getQuickActions = () => {
    const actions = [];
    
    // Default actions
    if (!activeFilter) {
      actions.push({ label: "Próximos jogos", message: "Próximos jogos do Palmeiras" });
      actions.push({ label: "Jogos hoje", message: "Jogos de hoje" });
      actions.push({ label: "Libertadores", message: "Libertadores 2025" });
    }
    
    // Filter-specific actions
    if (activeFilter === 'today') {
      actions.push({ label: "Análise dos jogos", message: "Analise os jogos de hoje" });
      actions.push({ label: "Melhores odds", message: "Melhores odds para hoje" });
    }
    
    if (activeFilter === 'live') {
      actions.push({ label: "Jogos ao vivo", message: "Estatísticas dos jogos ao vivo" });
      actions.push({ label: "Resultados", message: "Resultados em tempo real" });
    }
    
    // Team-specific actions
    if (selectedTeam) {
      actions.push({ label: "Estatísticas", message: "Estatísticas do time selecionado" });
      actions.push({ label: "Próximo jogo", message: "Próximo jogo do time" });
    }
    
    // League-specific actions  
    if (selectedLeague === 71) {
      actions.push({ label: "Brasileirão", message: "Tabela do Brasileirão 2025" });
    } else if (selectedLeague === 13) {
      actions.push({ label: "Libertadores", message: "Jogos da Libertadores" });
    }
    
    return actions.slice(0, 3); // Limit to 3 actions
  };

  const quickActions = getQuickActions();

  return (
    <div className="flex flex-col h-full relative">
      {/* Filter Status Bar */}
      {(activeFilter || selectedTeam || selectedLeague) && (
        <div className="px-6 py-3 bg-blue-500/10 border-b border-blue-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-3 w-3 text-blue-400" />
              <span className="text-xs text-blue-400">Filtros ativos:</span>
              
              {activeFilter && (
                <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-300">
                  {activeFilter === 'today' ? 'Hoje' : 
                   activeFilter === 'live' ? 'Ao Vivo' : 'Próximos'}
                </Badge>
              )}
              
              {selectedLeague && (
                <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-300">
                  {selectedLeague === 71 ? 'Série A' :
                   selectedLeague === 72 ? 'Série B' :
                   selectedLeague === 73 ? 'Copa BR' : 'Libertadores'}
                </Badge>
              )}
              
              {selectedTeam && (
                <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-300">
                  <Target className="h-2 w-2 mr-1" />
                  Time específico
                </Badge>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs h-6 text-blue-400 hover:text-blue-300"
            >
              Limpar
            </Button>
          </div>
        </div>
      )}

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
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
              placeholder={
                activeFilter 
                  ? `Pergunte sobre ${activeFilter === 'today' ? 'jogos de hoje' : 
                                     activeFilter === 'live' ? 'jogos ao vivo' : 'próximos jogos'}...`
                  : "Pergunte sobre jogos, times, odds..."
              }
              className="betania-glass border-0 bg-white/[0.02] placeholder:text-muted-foreground/70 pr-12"
              disabled={isLoading}
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
        
        {/* Quick Actions - Simplified */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="betania-glass border-0 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => handleQuickAction("Jogos de hoje")}
            disabled={isLoading}
          >
            Jogos hoje
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="betania-glass border-0 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => handleQuickAction("Jogos ao vivo")}
            disabled={isLoading}
          >
            Ao vivo
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="betania-glass border-0 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => handleQuickAction("Artilheiros")}
            disabled={isLoading}
          >
            Artilheiros
          </Button>
        </div>
      </div>
    </div>
  );
};