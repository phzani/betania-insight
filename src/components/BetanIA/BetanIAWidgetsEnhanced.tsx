import React from "react";
import { Trophy, TrendingUp, Users, Calendar, RefreshCw, Zap, Clock, Star, Target, Award, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useFilterStore } from "@/stores/filterStore";
import { useWidgetData } from "@/hooks/useLiveSportsData";
import { getMatchTime, formatTeamName } from "@/hooks/useLiveSportsData";
import { getFixtureStatus, formatFixtureTime, getLeagueEmoji, BRAZILIAN_LEAGUES } from "@/lib/sportsDataHelpers";

export const BetanIAWidgetsEnhanced = () => {
  const {
    liveGames,
    todayFixtures,
    hotOdds,
    topPerformers,
    topYellowCards,
    topRedCards,
    loading,
    error,
    lastUpdate,
    refresh
  } = useWidgetData();

  const {
    getFilteredFixtures,
    setSelectedTeam,
    setActiveFilter,
    selectedTeam,
    selectedLeague,
    activeFilter,
    favoriteTeams,
    toggleFavoriteTeam
  } = useFilterStore();

  // Get filtered fixtures based on current filters
  const filteredFixtures = getFilteredFixtures();
  
  // Get league name for display
  const getLeagueName = (leagueId: number | null) => {
    switch (leagueId) {
      case BRAZILIAN_LEAGUES.SERIE_A:
        return 'Brasileirão Série A';
      case BRAZILIAN_LEAGUES.SERIE_B:
        return 'Brasileirão Série B';
      case BRAZILIAN_LEAGUES.COPA_BRASIL:
        return 'Copa do Brasil';
      case BRAZILIAN_LEAGUES.LIBERTADORES:
        return 'Libertadores';
      default:
        return 'Todas as Competições';
    }
  };

  const handleRefresh = () => {
    console.log('[Widgets] Manual refresh triggered');
    refresh();
  };

  const handlePlayerClick = (playerName: string, teamName: string) => {
    // Find team ID and set as filter
    console.log(`[Widgets] Player clicked: ${playerName} (${teamName})`);
    setActiveFilter('today'); // Show today's games for the team
  };

  const handleGameClick = (gameId: number) => {
    console.log(`[Widgets] Game clicked: ${gameId}`);
    // Could open game details or set specific filters
  };

  const handleTeamFavorite = (teamName: string) => {
    console.log(`[Widgets] Toggle favorite for: ${teamName}`);
  };

  // Enhanced top performers with click actions
  const enhancedPerformers = topPerformers.map((performer, index) => ({
    ...performer,
    position: index + 1,
    isTeamSelected: selectedTeam && performer.team === 'Palmeiras' ? selectedTeam === 119 : false
  }));

  return (
    <div className="h-full flex flex-col">
      {/* Header with refresh */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-muted-foreground">Dados Esportivos</h2>
            {selectedTeam && (
              <Badge variant="outline" className="text-xs">
                Time Selecionado
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="default"
              className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30"
            >
              {getLeagueName(selectedLeague)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {lastUpdate ? formatFixtureTime(lastUpdate.toISOString()) : '-'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="h-6 w-6 p-0 hover:bg-white/[0.08]"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4 space-y-6">
        {/* Error State */}
        {error && (
          <Card className="betania-glass border-red-500/30 bg-red-500/10">
            <CardContent className="p-3">
              <div className="text-sm text-red-400">
                ⚠️ {error}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="mt-2 text-xs h-6 text-red-400 hover:text-red-300"
              >
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Live Games - Filtered by competition */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            <h3 className="text-sm font-semibold text-red-400">Ao Vivo - {getLeagueName(selectedLeague)}</h3>
            <Badge variant="secondary" className="text-xs">{liveGames.length}</Badge>
          </div>
          
          {liveGames.length > 0 ? (
            <ScrollArea className="h-64 w-full">
              <div className="space-y-3 pr-4">
                {liveGames.map((game) => (
                <div 
                  key={game.id} 
                  onClick={() => handleGameClick(game.id)}
                  className="betania-glass p-3 space-y-2 cursor-pointer hover:bg-white/[0.02] betania-glow transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-red-400 flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                      <Zap className="h-3 w-3" />
                      {game.minute}'
                    </div>
                    <Badge variant="outline" className="text-xs hover:bg-red-500/20">
                      Ver detalhes
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-1 hover:text-blue-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTeamFavorite(game.home);
                          }}
                        >
                          <span className="text-sm font-medium">
                            {formatTeamName(game.home, 10)}
                          </span>
                        </Button>
                        <span className="text-lg font-bold">
                          {game.homeScore ?? 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-1 hover:text-blue-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTeamFavorite(game.away);
                          }}
                        >
                          <span className="text-sm font-medium">
                            {formatTeamName(game.away, 10)}
                          </span>
                        </Button>
                        <span className="text-lg font-bold">
                          {game.awayScore ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {game.odds && (
                    <div className="flex justify-between text-xs pt-2 border-t border-border/30">
                      <span className="odds-positive px-2 py-1 rounded cursor-pointer hover:bg-green-500/20">
                        1: {game.odds.home.toFixed(2)}
                      </span>
                      <span className="odds-neutral px-2 py-1 rounded cursor-pointer hover:bg-yellow-500/20">
                        X: {game.odds.draw.toFixed(2)}
                      </span>
                      <span className="odds-negative px-2 py-1 rounded cursor-pointer hover:bg-red-500/20">
                        2: {game.odds.away.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="betania-glass p-4 text-center">
              <div className="text-sm text-muted-foreground">
                Não há jogos ao vivo desta competição no momento
              </div>
            </div>
          )}
        </div>

        {/* Today's Fixtures - Respects filters from sidebar */}
        {filteredFixtures.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-muted-foreground">
                {activeFilter === 'today' ? 'Jogos de Hoje' : 
                 activeFilter === 'live' ? 'Jogos ao Vivo' :
                 activeFilter === 'upcoming' ? 'Próximos Jogos' : 'Jogos Filtrados'}
              </h3>
              <Badge variant="secondary" className="text-xs">{filteredFixtures.length}</Badge>
            </div>
            
            <ScrollArea className="h-80 w-full">
              <div className="space-y-2 pr-4">
                {filteredFixtures.slice(0, 10).map((fixture) => {
                const fixtureStatus = getFixtureStatus(fixture);
                const leagueEmoji = getLeagueEmoji(fixture.league.id);
                
                return (
                  <div 
                    key={fixture.fixture.id} 
                    onClick={() => handleGameClick(fixture.fixture.id)}
                    className="betania-glass p-3 space-y-2 cursor-pointer hover:bg-white/[0.02] transition-all betania-glow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <span>{leagueEmoji}</span>
                        <span>{fixture.league.name}</span>
                      </div>
                      <Badge 
                        variant={fixtureStatus.isLive ? "default" : "outline"} 
                        className={`text-xs cursor-pointer ${
                          fixtureStatus.isLive ? "bg-red-500/20 text-red-400 border-red-500/30" : ""
                        }`}
                      >
                        {fixtureStatus.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1 hover:text-blue-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTeamFavorite(fixture.teams.home.name);
                            }}
                          >
                            <span className="text-sm font-medium">
                              {formatTeamName(fixture.teams.home.name, 15)}
                            </span>
                          </Button>
                          {(fixtureStatus.isFinished || fixtureStatus.isLive) && (
                            <span className="text-sm font-bold">
                              {fixture.goals.home ?? 0}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1 hover:text-blue-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTeamFavorite(fixture.teams.away.name);
                            }}
                          >
                            <span className="text-sm font-medium">
                              {formatTeamName(fixture.teams.away.name, 15)}
                            </span>
                          </Button>
                          {(fixtureStatus.isFinished || fixtureStatus.isLive) && (
                            <span className="text-sm font-bold">
                              {fixture.goals.away ?? 0}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {fixture.fixture.venue?.name && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {fixture.fixture.venue.name}
                      </div>
                    )}
                  </div>
                );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Hot Odds */}
        {hotOdds.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-yellow-400" />
              <h3 className="text-sm font-semibold text-muted-foreground">Odds em Movimento</h3>
            </div>
            
            <div className="space-y-3">
              {hotOdds.slice(0, 4).map((odd, index) => (
                <div 
                  key={index} 
                  onClick={() => handleGameClick(odd.fixtureId)}
                  className="betania-glass p-3 space-y-2 cursor-pointer hover:bg-white/[0.02] betania-glow transition-all"
                >
                  <div className="text-xs font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs font-medium hover:text-blue-400"
                    >
                      {odd.match}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{odd.market}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold cursor-pointer hover:text-blue-400">
                        {odd.odds.toFixed(2)}
                      </span>
                      <div className={`flex items-center text-xs ${
                        odd.trend === 'up' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {odd.trend === 'up' ? '↗' : '↘'}
                        {Math.abs(odd.change).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {odd.bookmaker}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Scorers */}
        {enhancedPerformers.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-muted-foreground">Artilheiros - {getLeagueName(selectedLeague)}</h3>
              </div>
            </div>
            
            <ScrollArea className="h-96 w-full">
              <div className="space-y-3 pr-4">
                {enhancedPerformers.slice(0, 10).map((player, index) => (
                <div 
                  key={index} 
                  onClick={() => handlePlayerClick(player.name, player.team)}
                  className={`betania-glass p-3 space-y-3 cursor-pointer transition-all betania-glow hover:bg-white/[0.02] ${
                    player.isTeamSelected ? 'ring-1 ring-blue-400/50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                        <Trophy className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{player.name}</span>
                        <span className="text-xs text-muted-foreground">{formatTeamName(player.team)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-lg">{player.value}</span>
                      <span className="text-xs text-muted-foreground">gols</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span>Performance</span>
                      <span>{Math.round(player.performance)}%</span>
                    </div>
                    <Progress value={player.performance} className="h-1" />
                  </div>
                </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Top Yellow Cards */}
        {topYellowCards.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <h3 className="text-sm font-semibold text-muted-foreground">Cartões Amarelos - {getLeagueName(selectedLeague)}</h3>
              </div>
            </div>
            
            <ScrollArea className="h-80 w-full">
              <div className="space-y-3 pr-4">
                {topYellowCards.slice(0, 10).map((player, index) => (
                <div 
                  key={index} 
                  onClick={() => handlePlayerClick(player.name, player.team)}
                  className="betania-glass p-3 space-y-3 cursor-pointer transition-all betania-glow hover:bg-white/[0.02]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-black" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{player.name}</span>
                        <span className="text-xs text-muted-foreground">{formatTeamName(player.team)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-lg">{player.value}</span>
                      <span className="text-xs text-muted-foreground">cartões</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span>Performance</span>
                      <span>{Math.round(player.performance)}%</span>
                    </div>
                    <Progress value={player.performance} className="h-1" />
                  </div>
                </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Top Red Cards */}
        {topRedCards.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-red-400" />
                <h3 className="text-sm font-semibold text-muted-foreground">Cartões Vermelhos - {getLeagueName(selectedLeague)}</h3>
              </div>
            </div>
            
            <ScrollArea className="h-80 w-full">
              <div className="space-y-3 pr-4">
                {topRedCards.slice(0, 10).map((player, index) => (
                <div 
                  key={index} 
                  onClick={() => handlePlayerClick(player.name, player.team)}
                  className="betania-glass p-3 space-y-3 cursor-pointer transition-all betania-glow hover:bg-white/[0.02]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                        <Award className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{player.name}</span>
                        <span className="text-xs text-muted-foreground">{formatTeamName(player.team)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-lg">{player.value}</span>
                      <span className="text-xs text-muted-foreground">cartões</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span>Performance</span>
                      <span>{Math.round(player.performance)}%</span>
                    </div>
                    <Progress value={player.performance} className="h-1" />
                  </div>
                </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* No Data State */}
        {!loading && filteredFixtures.length === 0 && liveGames.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum jogo encontrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Não há jogos para os filtros selecionados hoje.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setActiveFilter(null)}
              className="text-xs"
            >
              Limpar filtros
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};