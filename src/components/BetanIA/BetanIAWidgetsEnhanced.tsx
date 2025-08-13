import React from "react";
import { Trophy, TrendingUp, Users, Calendar, BarChart3, RefreshCw, Zap, Clock, Star, Target, Award } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useFilterStore } from "@/stores/filterStore";
import { useWidgetData } from "@/hooks/useLiveSportsData";
import { getMatchTime, formatTeamName } from "@/hooks/useLiveSportsData";
import { getFixtureStatus, formatFixtureTime, getLeagueEmoji } from "@/lib/sportsDataHelpers";

export const BetanIAWidgetsEnhanced = () => {
  const {
    liveGames,
    todayFixtures,
    hotOdds,
    topPerformers,
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
    activeFilter,
    favoriteTeams,
    toggleFavoriteTeam
  } = useFilterStore();

  // Get filtered fixtures based on current filters
  const filteredFixtures = getFilteredFixtures();

  const handleRefresh = () => {
    console.log('[Widgets] Manual refresh triggered');
    refresh();
  };

  const handlePlayerClick = (playerName: string, teamName: string) => {
    // Find team ID and set as filter
    console.log(`[Widgets] Player clicked: ${playerName} (${teamName})`);
    // This would need team mapping logic
    setActiveFilter('today'); // Show today's games for the team
  };

  const handleGameClick = (gameId: number) => {
    console.log(`[Widgets] Game clicked: ${gameId}`);
    // Could open game details or set specific filters
  };

  const handleTeamFavorite = (teamName: string) => {
    // This would need team ID mapping
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
          <h2 className="text-sm font-semibold text-muted-foreground">Dados Esportivos</h2>
          <div className="flex items-center gap-2">
            <Badge 
              variant={activeFilter ? "default" : "secondary"} 
              className={`text-xs ${
                activeFilter ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : ""
              }`}
            >
              {activeFilter ? `Filtro: ${activeFilter}` : 'Todos'}
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

        {/* API Status - Clickable */}
        <Card className="betania-glass border-0 cursor-pointer hover:bg-white/[0.02] transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4 text-blue-400" />
              Status da API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="ghost"
              onClick={() => setActiveFilter('today')}
              className="w-full justify-between text-xs h-auto p-2 hover:bg-blue-500/10"
            >
              <span>Jogos de Hoje:</span>
              <Badge variant={loading ? "secondary" : "outline"} className="text-xs">
                {loading ? "Carregando..." : todayFixtures.length}
              </Badge>
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => setActiveFilter('live')}
              className="w-full justify-between text-xs h-auto p-2 hover:bg-red-500/10"
            >
              <span>Jogos ao Vivo:</span>
              <Badge 
                variant={liveGames.length > 0 ? "default" : "outline"} 
                className={`text-xs ${liveGames.length > 0 ? "bg-red-500/20 text-red-400" : ""}`}
              >
                {liveGames.length}
              </Badge>
            </Button>
            
            <div className="flex justify-between text-xs pt-2 border-t border-border/30">
              <span>Última Atualização:</span>
              <span className="text-muted-foreground">
                {lastUpdate ? getMatchTime(lastUpdate) : '-'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Live Games - Clickable */}
        {liveGames.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              <h3 className="text-sm font-semibold text-red-400">Ao Vivo</h3>
              <Badge variant="secondary" className="text-xs">{liveGames.length}</Badge>
            </div>
            
            <div className="space-y-3">
              {liveGames.slice(0, 3).map((game) => (
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
          </div>
        )}

        {/* Today's Fixtures - Clickable */}
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
            
            <div className="space-y-2">
              {filteredFixtures.slice(0, 5).map((fixture) => {
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
          </div>
        )}

        {/* Hot Odds - Clickable */}
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

        {/* Top Performers - Clickable */}
        {enhancedPerformers.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-muted-foreground">Artilheiros</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveFilter('upcoming')}
                className="text-xs h-6 text-blue-400 hover:text-blue-300"
              >
                Ver todos →
              </Button>
            </div>
            
            <div className="space-y-3">
              {enhancedPerformers.slice(0, 5).map((player, index) => (
                <div 
                  key={index} 
                  onClick={() => handlePlayerClick(player.name, player.team)}
                  className={`betania-glass p-3 space-y-3 cursor-pointer transition-all betania-glow hover:bg-white/[0.02] ${
                    player.isTeamSelected ? 'ring-1 ring-blue-400/50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Award className="h-3 w-3 text-yellow-400" />
                        <span className="text-xs font-bold text-yellow-400">
                          #{player.position}
                        </span>
                      </div>
                      <div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 font-medium text-sm hover:text-blue-400"
                        >
                          {player.name}
                        </Button>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTeamFavorite(player.team);
                            }}
                            className="h-auto p-0 text-xs text-muted-foreground hover:text-blue-400"
                          >
                            {player.team}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTeamFavorite(player.team);
                            }}
                            className="h-4 w-4 p-0 hover:text-yellow-400"
                          >
                            <Star className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm text-blue-400 cursor-pointer hover:text-blue-300">
                        {player.stat}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Performance</span>
                      <span className="font-medium">{player.performance}%</span>
                    </div>
                    <Progress value={player.performance} className="h-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Insights - Clickable */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-pulse" />
            <h3 className="text-sm font-semibold text-muted-foreground">Insights BetanIA</h3>
          </div>
          
          <div className="betania-glass p-4 space-y-2 cursor-pointer hover:bg-white/[0.02] betania-glow transition-all">
            <div className="text-sm font-medium text-purple-400">💡 Análise do Momento</div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {loading ? (
                "Analisando dados em tempo real..."
              ) : (
                `${filteredFixtures.length} jogos ${activeFilter ? 'filtrados' : 'programados hoje'}. ${liveGames.length} partidas ao vivo. Dados atualizados ${getMatchTime(lastUpdate || new Date())}.`
              )}
            </p>
            {!loading && (
              <div className="flex justify-between items-center mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  className="text-xs h-6 text-purple-400 hover:text-purple-300"
                >
                  Atualizar análise
                </Button>
                <Badge 
                  variant="outline" 
                  className="text-xs text-purple-400 border-purple-400/30 cursor-pointer hover:bg-purple-500/10"
                >
                  Auto 2min
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* No Data State */}
        {!loading && filteredFixtures.length === 0 && liveGames.length === 0 && (
          <div className="betania-glass p-6 text-center space-y-3">
            <div className="text-4xl">⚽</div>
            <div className="text-sm text-muted-foreground">
              {activeFilter 
                ? `Nenhum jogo encontrado para o filtro: ${activeFilter}`
                : "Nenhum jogo encontrado para hoje"
              }
            </div>
            <div className="flex gap-2 justify-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setActiveFilter(null)}
                className="text-xs"
              >
                Limpar filtros
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRefresh}
                className="text-xs"
              >
                Atualizar dados
              </Button>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};