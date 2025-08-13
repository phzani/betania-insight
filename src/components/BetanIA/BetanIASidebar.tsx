import React from "react";
import { Calendar, TrendingUp, Globe, Star, Trophy } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFilterStore } from "@/stores/filterStore";
import { formatTeamName, getLeagueEmoji, BRAZILIAN_LEAGUES } from "@/lib/sportsDataHelpers";
import { useLiveSportsData } from "@/hooks/useLiveSportsData";

export const BetanIASidebar = () => {
  const {
    activeFilter,
    selectedLeague,
    selectedTeam,
    favoriteTeams,
    todayCount,
    liveCount,
    upcomingCount,
    setActiveFilter,
    setSelectedLeague,
    setSelectedTeam,
    toggleFavoriteTeam,
    clearAllFilters
  } = useFilterStore();

  const sportsData = useLiveSportsData();

  // Get favorite teams data
  const favoriteTeamsData = sportsData.teams.filter(team => 
    favoriteTeams.includes(team.id)
  );

  // Pre-defined leagues for quick access
  const leagues = [
    { id: BRAZILIAN_LEAGUES.SERIE_A, name: "Brasileirão Série A", country: "🇧🇷", active: selectedLeague === BRAZILIAN_LEAGUES.SERIE_A },
    { id: BRAZILIAN_LEAGUES.SERIE_B, name: "Brasileirão Série B", country: "🇧🇷", active: selectedLeague === BRAZILIAN_LEAGUES.SERIE_B },
    { id: BRAZILIAN_LEAGUES.COPA_BRASIL, name: "Copa do Brasil", country: "🇧🇷", active: selectedLeague === BRAZILIAN_LEAGUES.COPA_BRASIL },
    { id: BRAZILIAN_LEAGUES.LIBERTADORES, name: "Libertadores", country: "🌎", active: selectedLeague === BRAZILIAN_LEAGUES.LIBERTADORES },
  ];

  const quickFilters = [
    { 
      key: 'today' as const, 
      label: "Hoje", 
      icon: Calendar, 
      count: todayCount,
      active: activeFilter === 'today'
    },
    { 
      key: 'live' as const, 
      label: "Ao Vivo", 
      icon: TrendingUp, 
      count: liveCount,
      active: activeFilter === 'live'
    },
    { 
      key: 'upcoming' as const, 
      label: "Próximos", 
      icon: Globe, 
      count: upcomingCount,
      active: activeFilter === 'upcoming'
    },
  ];

  const handleFilterClick = (filterKey: typeof activeFilter) => {
    if (activeFilter === filterKey) {
      setActiveFilter(null); // Toggle off if already active
    } else {
      setActiveFilter(filterKey);
    }
  };

  const handleLeagueClick = (leagueId: number) => {
    if (selectedLeague === leagueId) {
      setSelectedLeague(null); // Toggle off if already active
    } else {
      setSelectedLeague(leagueId);
    }
  };

  const handleTeamClick = (teamId: number) => {
    if (selectedTeam === teamId) {
      setSelectedTeam(null); // Toggle off if already selected
    } else {
      setSelectedTeam(teamId);
    }
  };

  const getTeamForm = (teamId: number): string => {
    // Mock form data - in real implementation, this would come from team stats
    const forms: Record<number, string> = {
      119: "WWDWL", // Palmeiras
      127: "WLWWW", // Flamengo  
      124: "DWLWW", // São Paulo
    };
    return forms[teamId] || "---";
  };

  return (
    <div className="h-full flex flex-col">
      {/* Clear Filters Button */}
      {(activeFilter || selectedTeam) && (
        <div className="p-4 border-b border-border/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="w-full text-xs text-muted-foreground hover:text-foreground"
          >
            Limpar Filtros
          </Button>
        </div>
      )}

      {/* Quick Filters */}
      <div className="p-4 border-b border-border/30">
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Filtros Rápidos</h3>
        <div className="space-y-2">
          {quickFilters.map((filter) => (
            <Button
              key={filter.key}
              variant={filter.active ? "secondary" : "ghost"}
              onClick={() => handleFilterClick(filter.key)}
              className={`w-full justify-between h-auto p-3 ${
                filter.active 
                  ? "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 betania-glow" 
                  : "betania-glass border-0 hover:bg-white/[0.08]"
              }`}
            >
              <div className="flex items-center gap-2">
                <filter.icon className="h-4 w-4" />
                <span className="text-sm">{filter.label}</span>
              </div>
              <Badge 
                variant={filter.active ? "default" : "secondary"} 
                className="text-xs"
              >
                {filter.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {/* Favorite Teams */}
        <div className="p-4 border-b border-border/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-400" />
              <h3 className="text-sm font-semibold text-muted-foreground">Times Favoritos</h3>
            </div>
          </div>
          
          <div className="space-y-2">
            {favoriteTeamsData.map((team) => {
              const isSelected = selectedTeam === team.id;
              return (
                <div key={team.id} className="flex items-center gap-2">
                  <Button
                    variant={isSelected ? "secondary" : "ghost"}
                    onClick={() => handleTeamClick(team.id)}
                    className={`flex-1 justify-between h-auto p-3 ${
                      isSelected 
                        ? "bg-green-500/20 text-green-300 hover:bg-green-500/30 betania-glow"
                        : "betania-glass border-0 hover:bg-white/[0.08]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs">
                        {formatTeamName(team.name, true)}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">{formatTeamName(team.name)}</span>
                        <span className="text-xs text-muted-foreground">{getTeamForm(team.id)}</span>
                      </div>
                    </div>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFavoriteTeam(team.id)}
                    className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-400"
                    title="Remover dos favoritos"
                  >
                    <Star className="h-3 w-3 fill-current" />
                  </Button>
                </div>
              );
            })}
            
            {favoriteTeamsData.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-4">
                Nenhum time favorito
              </div>
            )}
          </div>
        </div>

        {/* Leagues */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-muted-foreground">Competições</h3>
          </div>
          
          <div className="space-y-2">
            {leagues.map((league) => (
              <Button
                key={league.id}
                variant={league.active ? "secondary" : "ghost"}
                onClick={() => handleLeagueClick(league.id)}
                className={`w-full justify-start p-3 h-auto ${
                  league.active 
                    ? "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 betania-glow" 
                    : "betania-glass border-0 hover:bg-white/[0.08]"
                }`}
              >
                <div className="flex items-center gap-3 w-full">
                  <span className="text-base">{league.country}</span>
                  <div className="flex flex-col items-start flex-1">
                    <span className="text-sm font-medium">{league.name}</span>
                    <span className="text-xs text-muted-foreground">2025</span>
                  </div>
                  {league.active && (
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  )}
                </div>
              </Button>
            ))}
          </div>
          
          {/* Add Team to Favorites */}
          <div className="mt-4 pt-4 border-t border-border/30">
            <div className="text-xs text-muted-foreground mb-2">Times disponíveis:</div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {sportsData.teams.slice(0, 10).map((team) => (
                <Button
                  key={team.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleFavoriteTeam(team.id)}
                  disabled={favoriteTeams.includes(team.id)}
                  className="w-full justify-between text-xs h-8 px-2"
                >
                  <span>{formatTeamName(team.name)}</span>
                  <Star 
                    className={`h-3 w-3 ${
                      favoriteTeams.includes(team.id) 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-muted-foreground'
                    }`} 
                  />
                </Button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};