import React, { useState } from "react";
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

// Bookmakers data
const BOOKMAKERS = [
  { name: "Bet365", url: "https://www.bet365.com", color: "text-green-400" },
  { name: "Betano", url: "https://www.betano.com.br", color: "text-blue-400" },
  { name: "KTO", url: "https://www.kto.com", color: "text-yellow-400" },
  { name: "Betfair", url: "https://www.betfair.com.br", color: "text-purple-400" },
  { name: "Rivalo", url: "https://www.rivalo.com", color: "text-red-400" },
];

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

  // State for managing bookmaker rotation
  const [fixtureBookmakers, setFixtureBookmakers] = useState<{[key: string]: number}>({});
  const [playerBookmakers, setPlayerBookmakers] = useState<{[key: string]: number}>({});

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

  // Functions to handle bookmaker rotation
  const rotateFixtureBookmaker = (fixtureId: string) => {
    setFixtureBookmakers(prev => ({
      ...prev,
      [fixtureId]: ((prev[fixtureId] || 0) + 1) % BOOKMAKERS.length
    }));
  };

  const rotatePlayerBookmaker = (playerKey: string) => {
    setPlayerBookmakers(prev => ({
      ...prev,
      [playerKey]: ((prev[playerKey] || 0) + 1) % BOOKMAKERS.length
    }));
  };

  const getFixtureBookmaker = (fixtureId: string) => {
    const index = fixtureBookmakers[fixtureId] || 0;
    return BOOKMAKERS[index];
  };

  const getPlayerBookmaker = (playerKey: string) => {
    const index = playerBookmakers[playerKey] || 0;
    return BOOKMAKERS[index];
  };

  const generateOdds = (seed: number, bookmakerIndex: number) => {
    const base = 1.5 + (seed % 3);
    const variation = (bookmakerIndex * 0.1) + ((seed % 10) * 0.05);
    return (base + variation).toFixed(2);
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

      <div className="flex-1 grid grid-cols-1 gap-3 p-4 overflow-hidden">
        {/* Error State */}
        {error && (
          <Card className="betania-glass border-red-500/30 bg-red-500/10 h-16">
            <CardContent className="p-2">
              <div className="text-xs text-red-400">
                ⚠️ {error}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="mt-1 text-xs h-5 text-red-400 hover:text-red-300"
              >
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Today's Fixtures - Compact Widget */}
        <Card className="betania-glass">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <Calendar className="h-3 w-3 text-blue-400" />
              {activeFilter === 'today' ? 'Jogos do Dia' : 
               activeFilter === 'live' ? 'Jogos ao Vivo' :
               activeFilter === 'upcoming' ? 'Próximos Jogos' : 'Jogos do Dia'}
              <Badge variant="secondary" className="text-xs h-4">{filteredFixtures.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <ScrollArea className="h-32 w-full">
              <div className="space-y-1 pr-2">
                {filteredFixtures.slice(0, 8).map((fixture) => {
                const fixtureStatus = getFixtureStatus(fixture);
                const leagueEmoji = getLeagueEmoji(fixture.league.id);
                
                return (
                  <div 
                    key={fixture.fixture.id} 
                    onClick={() => handleGameClick(fixture.fixture.id)}
                    className="bg-white/[0.02] hover:bg-white/[0.04] p-2 rounded cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <span>{leagueEmoji}</span>
                        <span className="truncate max-w-20">{fixture.league.name}</span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs h-4 ${
                          fixtureStatus.isLive ? "bg-red-500/20 text-red-400 border-red-500/30" : ""
                        }`}
                      >
                        {fixtureStatus.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium truncate">
                            {formatTeamName(fixture.teams.home.name, 12)}
                          </span>
                          <div className="flex items-center gap-2">
                            {(fixtureStatus.isFinished || fixtureStatus.isLive) && (
                              <span className="text-xs font-bold">
                                {fixture.goals.home ?? 0}
                              </span>
                            )}
                            {!fixtureStatus.isFinished && (
                              <div 
                                className="flex items-center gap-1 cursor-pointer hover:bg-white/[0.05] px-1 rounded"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const bookmaker = getFixtureBookmaker(`${fixture.fixture.id}-home`);
                                  window.open(bookmaker.url, '_blank');
                                }}
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  rotateFixtureBookmaker(`${fixture.fixture.id}-home`);
                                }}
                              >
                                <span className={`text-xs font-semibold ${getFixtureBookmaker(`${fixture.fixture.id}-home`).color}`}>
                                  {generateOdds(fixture.fixture.id + fixture.teams.home.id, fixtureBookmakers[`${fixture.fixture.id}-home`] || 0)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {getFixtureBookmaker(`${fixture.fixture.id}-home`).name}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium truncate">
                            {formatTeamName(fixture.teams.away.name, 12)}
                          </span>
                          <div className="flex items-center gap-2">
                            {(fixtureStatus.isFinished || fixtureStatus.isLive) && (
                              <span className="text-xs font-bold">
                                {fixture.goals.away ?? 0}
                              </span>
                            )}
                            {!fixtureStatus.isFinished && (
                              <div 
                                className="flex items-center gap-1 cursor-pointer hover:bg-white/[0.05] px-1 rounded"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const bookmaker = getFixtureBookmaker(`${fixture.fixture.id}-away`);
                                  window.open(bookmaker.url, '_blank');
                                }}
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  rotateFixtureBookmaker(`${fixture.fixture.id}-away`);
                                }}
                              >
                                <span className={`text-xs font-semibold ${getFixtureBookmaker(`${fixture.fixture.id}-away`).color}`}>
                                  {generateOdds(fixture.fixture.id + fixture.teams.away.id, fixtureBookmakers[`${fixture.fixture.id}-away`] || 0)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {getFixtureBookmaker(`${fixture.fixture.id}-away`).name}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
                })}
                {filteredFixtures.length === 0 && (
                  <div className="text-center py-2">
                    <div className="text-xs text-muted-foreground">
                      Nenhum jogo encontrado
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Hot Odds - Compact Widget */}
        <Card className="betania-glass">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-yellow-400" />
              Odds em Movimento
              <Badge variant="secondary" className="text-xs h-4">{hotOdds.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <ScrollArea className="h-32 w-full">
              <div className="space-y-1 pr-2">
                {hotOdds.slice(0, 6).map((odd, index) => (
                  <div 
                    key={index} 
                    onClick={() => handleGameClick(odd.fixtureId)}
                    className="bg-white/[0.02] hover:bg-white/[0.04] p-2 rounded cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium truncate flex-1">
                        {odd.match}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold">
                          {odd.odds.toFixed(2)}
                        </span>
                        <div className={`text-xs ${
                          odd.trend === 'up' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {odd.trend === 'up' ? '↗' : '↘'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground truncate flex-1">
                        {odd.market}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {odd.bookmaker}
                      </span>
                    </div>
                  </div>
                ))}
                {hotOdds.length === 0 && (
                  <div className="text-center py-2">
                    <div className="text-xs text-muted-foreground">
                      Sem odds em movimento
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Top Scorers - Compact Widget */}
        <Card className="betania-glass">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <Trophy className="h-3 w-3 text-blue-400" />
              Artilheiros - {getLeagueName(selectedLeague)}
              <Badge variant="secondary" className="text-xs h-4">{enhancedPerformers.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <ScrollArea className="h-40 w-full">
              <div className="space-y-1 pr-2">
                {enhancedPerformers.slice(0, 8).map((player, index) => (
                <div 
                  key={index} 
                  onClick={() => handlePlayerClick(player.name, player.team)}
                  className={`bg-white/[0.02] hover:bg-white/[0.04] p-2 rounded cursor-pointer transition-all ${
                    player.isTeamSelected ? 'ring-1 ring-blue-400/30' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                        <Trophy className="h-3 w-3 text-white" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs truncate">{player.name}</span>
                        <span className="text-xs text-muted-foreground truncate">{formatTeamName(player.team, 15)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="font-bold text-sm">{player.value}</span>
                      <span className="text-xs text-muted-foreground">gols</span>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Marcar gol:</span>
                    <div 
                      className="flex items-center gap-1 cursor-pointer hover:bg-white/[0.05] px-1 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        const bookmaker = getPlayerBookmaker(`goal-${player.name}`);
                        window.open(bookmaker.url, '_blank');
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        rotatePlayerBookmaker(`goal-${player.name}`);
                      }}
                    >
                      <span className={`text-xs font-semibold ${getPlayerBookmaker(`goal-${player.name}`).color}`}>
                        {generateOdds(player.name.length + index, playerBookmakers[`goal-${player.name}`] || 0)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {getPlayerBookmaker(`goal-${player.name}`).name}
                      </span>
                    </div>
                  </div>
                </div>
                ))}
                {enhancedPerformers.length === 0 && (
                  <div className="text-center py-2">
                    <div className="text-xs text-muted-foreground">
                      Carregando artilheiros...
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Top Yellow Cards - Compact Widget */}
        <Card className="betania-glass">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-3 w-3 text-yellow-400" />
              Cartões Amarelos - {getLeagueName(selectedLeague)}
              <Badge variant="secondary" className="text-xs h-4">{topYellowCards.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <ScrollArea className="h-40 w-full">
              <div className="space-y-1 pr-2">
                {topYellowCards.slice(0, 8).map((player, index) => (
                <div 
                  key={index} 
                  onClick={() => handlePlayerClick(player.name, player.team)}
                  className="bg-white/[0.02] hover:bg-white/[0.04] p-2 rounded cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="h-3 w-3 text-black" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs truncate">{player.name}</span>
                        <span className="text-xs text-muted-foreground truncate">{formatTeamName(player.team, 15)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="font-bold text-sm">{player.value}</span>
                      <span className="text-xs text-muted-foreground">cartões</span>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Levar cartão:</span>
                    <div 
                      className="flex items-center gap-1 cursor-pointer hover:bg-white/[0.05] px-1 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        const bookmaker = getPlayerBookmaker(`yellow-${player.name}`);
                        window.open(bookmaker.url, '_blank');
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        rotatePlayerBookmaker(`yellow-${player.name}`);
                      }}
                    >
                      <span className={`text-xs font-semibold ${getPlayerBookmaker(`yellow-${player.name}`).color}`}>
                        {generateOdds(player.name.length + index + 10, playerBookmakers[`yellow-${player.name}`] || 0)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {getPlayerBookmaker(`yellow-${player.name}`).name}
                      </span>
                    </div>
                  </div>
                </div>
                ))}
                {topYellowCards.length === 0 && (
                  <div className="text-center py-2">
                    <div className="text-xs text-muted-foreground">
                      Carregando cartões amarelos...
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Top Red Cards - Compact Widget */}
        <Card className="betania-glass">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <Award className="h-3 w-3 text-red-400" />
              Cartões Vermelhos - {getLeagueName(selectedLeague)}
              <Badge variant="secondary" className="text-xs h-4">{topRedCards.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <ScrollArea className="h-40 w-full">
              <div className="space-y-1 pr-2">
                {topRedCards.slice(0, 8).map((player, index) => (
                <div 
                  key={index} 
                  onClick={() => handlePlayerClick(player.name, player.team)}
                  className="bg-white/[0.02] hover:bg-white/[0.04] p-2 rounded cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center flex-shrink-0">
                        <Award className="h-3 w-3 text-white" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs truncate">{player.name}</span>
                        <span className="text-xs text-muted-foreground truncate">{formatTeamName(player.team, 15)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="font-bold text-sm">{player.value}</span>
                      <span className="text-xs text-muted-foreground">cartões</span>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Levar cartão:</span>
                    <div 
                      className="flex items-center gap-1 cursor-pointer hover:bg-white/[0.05] px-1 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        const bookmaker = getPlayerBookmaker(`red-${player.name}`);
                        window.open(bookmaker.url, '_blank');
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        rotatePlayerBookmaker(`red-${player.name}`);
                      }}
                    >
                      <span className={`text-xs font-semibold ${getPlayerBookmaker(`red-${player.name}`).color}`}>
                        {generateOdds(player.name.length + index + 20, playerBookmakers[`red-${player.name}`] || 0)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {getPlayerBookmaker(`red-${player.name}`).name}
                      </span>
                    </div>
                  </div>
                </div>
                ))}
                {topRedCards.length === 0 && (
                  <div className="text-center py-2">
                    <div className="text-xs text-muted-foreground">
                      Carregando cartões vermelhos...
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* No Data State */}
        {!loading && filteredFixtures.length === 0 && liveGames.length === 0 && (
          <Card className="betania-glass">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-3 mx-auto">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold mb-2">Nenhum jogo encontrado</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Não há jogos para os filtros selecionados hoje.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setActiveFilter(null)}
                className="text-xs h-6"
              >
                Limpar filtros
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};