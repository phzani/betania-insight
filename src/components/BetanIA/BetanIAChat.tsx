import React, { useRef, useEffect } from "react";
import { Send, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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

  // Generate contextual placeholder text based on active filters
  const getContextualPlaceholder = () => {
    if (selectedTeam && selectedLeague) {
      const leagueName = selectedLeague === 71 ? 'Brasileirão' : 
                        selectedLeague === 72 ? 'Série B' :
                        selectedLeague === 73 ? 'Copa do Brasil' : 'Libertadores';
      return `Me pergunta sobre o time no ${leagueName}, amor! 😏`;
    }
    
    if (selectedTeam) {
      return "Quer saber dos perrengues do seu time, querido? 💅";
    }
    
    if (selectedLeague) {
      const leagueName = selectedLeague === 71 ? 'Brasileirão' : 
                        selectedLeague === 72 ? 'Série B' :
                        selectedLeague === 73 ? 'Copa do Brasil' : 'Libertadores';
      return `Fala do ${leagueName}, gatinho! Tô aqui pra isso 🔥`;
    }
    
    if (activeFilter === 'today') {
      return "Jogos de hoje? Odds? Vai que a sorte tá do nosso lado! 💸";
    }
    
    if (activeFilter === 'live') {
      return "Rolando ao vivo? Conta pra mim, gato! ⚽";
    }
    
    if (activeFilter === 'upcoming') {
      return "Próximos jogos? Vou te dar umas dicas especiais 😘";
    }
    
    return "O que cê quer saber, lindão? Futebol é minha especialidade! ✨";
  };

  // Generate smart quick actions based on active filters
  const getSmartQuickActions = () => {
    const actions = [];
    
    // Actions based on selected team and league
    if (selectedTeam && selectedLeague) {
      actions.push({ label: "Próximo jogo 🔥", message: "Quando é o próximo jogo do time?" });
      actions.push({ label: "Posição na tabela", message: "Qual a posição do time na tabela?" });
      actions.push({ label: "Estatísticas quentes 💅", message: "Estatísticas do time na temporada" });
      return actions;
    }
    
    // Actions based on selected team only
    if (selectedTeam) {
      actions.push({ label: "Próximos jogos", message: "Próximos jogos do time" });
      actions.push({ label: "Estatísticas", message: "Estatísticas do time" });
      actions.push({ label: "Elenco", message: "Elenco e artilheiros do time" });
      return actions;
    }
    
    // Actions based on selected league
    if (selectedLeague) {
      const leagueName = selectedLeague === 71 ? 'Brasileirão' : 
                        selectedLeague === 72 ? 'Série B' :
                        selectedLeague === 73 ? 'Copa do Brasil' : 'Libertadores';
      actions.push({ label: "Tabela", message: `Tabela do ${leagueName}` });
      actions.push({ label: "Artilheiros", message: `Artilheiros do ${leagueName}` });
      actions.push({ label: "Próximos jogos", message: `Próximos jogos do ${leagueName}` });
      return actions;
    }
    
    // Actions based on active filter
    if (activeFilter === 'today') {
      actions.push({ label: "Jogos hoje 🎯", message: "Análise dos jogos de hoje" });
      actions.push({ label: "Odds especiais 💸", message: "Melhores odds para hoje" });
      actions.push({ label: "Dicas da BetanIA 😘", message: "Palpites para os jogos de hoje" });
      return actions;
    }
    
    if (activeFilter === 'live') {
      actions.push({ label: "Ao vivo agora 🔴", message: "Estatísticas dos jogos ao vivo" });
      actions.push({ label: "Placar quente", message: "Resultados em tempo real" });
      actions.push({ label: "Gols fresquinhos ⚽", message: "Últimos gols marcados" });
      return actions;
    }
    
    if (activeFilter === 'upcoming') {
      actions.push({ label: "Próximos jogos 🔮", message: "Análise dos próximos jogos" });
      actions.push({ label: "Odds tentadoras", message: "Melhores odds para apostar" });
      actions.push({ label: "Palpites especiais 💋", message: "Palpites para os próximos jogos" });
      return actions;
    }
    
    // Default actions when no filters are active
    actions.push({ label: "Jogos hoje 🌟", message: "Jogos de hoje" });
    actions.push({ label: "Ao vivo 🎯", message: "Jogos ao vivo" });
    actions.push({ label: "Artilheiros 👑", message: "Artilheiros do Brasileirão" });
    return actions;
  };

  const smartQuickActions = getSmartQuickActions();

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
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse delay-100" />
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse delay-200" />
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
              placeholder={getContextualPlaceholder()}
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
        
        {/* Smart Quick Actions */}
        <div className="flex flex-wrap gap-2 mt-3">
          {smartQuickActions.map((action, index) => (
            <Button 
              key={index}
              variant="ghost" 
              size="sm" 
              className="betania-glass border-0 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => handleQuickAction(action.message)}
              disabled={isLoading}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};