import React from "react";
import { Trophy, TrendingUp, Users, Calendar, BarChart3, RefreshCw, Zap, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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

  const handleRefresh = () => {
    console.log('[Widgets] Manual refresh triggered');
    refresh();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with refresh */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Dados Esportivos</h2>
          <div className="flex items-center gap-2">
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

        {/* API Status */}
        <Card className="betania-glass border-0">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4 text-blue-400" />
              Status da API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Jogos de Hoje:</span>
              <Badge variant={loading ? "secondary" : "outline"} className="text-xs">
                {loading ? "Carregando..." : todayFixtures.length}
              </Badge>
            </div>
            <div className="flex justify-between text-xs">
              <span>Jogos ao Vivo:</span>
              <Badge 
                variant={liveGames.length > 0 ? "default" : "outline"} 
                className={`text-xs ${liveGames.length > 0 ? "bg-red-500/20 text-red-400" : ""}`}
              >
                {liveGames.length}
              </Badge>
            </div>
            <div className="flex justify-between text-xs">
              <span>Última Atualização:</span>
              <span className="text-muted-foreground">
                {lastUpdate ? getMatchTime(lastUpdate) : '-'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Live Games */}
        {liveGames.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              <h3 className="text-sm font-semibold text-red-400">Ao Vivo</h3>
              <Badge variant="secondary" className="text-xs">{liveGames.length}</Badge>
            </div>
            
            <div className="space-y-3">
              {liveGames.slice(0, 3).map((game) => (
                <div key={game.id} className="betania-glass p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-red-400 flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                      <Zap className="h-3 w-3" />
                      {game.minute}'
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Ao vivo
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {formatTeamName(game.home, 10)}
                        </span>
                        <span className="text-lg font-bold">
                          {game.homeScore ?? 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {formatTeamName(game.away, 10)}
                        </span>
                        <span className="text-lg font-bold">
                          {game.awayScore ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {game.odds && (
                    <div className="flex justify-between text-xs pt-2 border-t border-border/30">
                      <span className="odds-positive px-2 py-1 rounded">
                        1: {game.odds.home.toFixed(2)}
                      </span>
                      <span className="odds-neutral px-2 py-1 rounded">
                        X: {game.odds.draw.toFixed(2)}
                      </span>
                      <span className="odds-negative px-2 py-1 rounded">
                        2: {game.odds.away.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Today's Fixtures */}
        {todayFixtures.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-muted-foreground">Jogos de Hoje</h3>
              <Badge variant="secondary" className="text-xs">{todayFixtures.length}</Badge>
            </div>
            
            <div className="space-y-2">
              {todayFixtures.slice(0, 5).map((fixture) => {
                const fixtureStatus = getFixtureStatus(fixture);
                const leagueEmoji = getLeagueEmoji(fixture.league.id);
                
                return (
                  <div key={fixture.fixture.id} className="betania-glass p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <span>{leagueEmoji}</span>
                        <span>{fixture.league.name}</span>
                      </div>
                      <Badge 
                        variant={fixtureStatus.isLive ? "default" : "outline"} 
                        className={`text-xs ${
                          fixtureStatus.isLive ? "bg-red-500/20 text-red-400 border-red-500/30" : ""
                        }`}
                      >
                        {fixtureStatus.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {formatTeamName(fixture.teams.home.name, 15)}
                          </span>
                          {(fixtureStatus.isFinished || fixtureStatus.isLive) && (
                            <span className="text-sm font-bold">
                              {fixture.goals.home ?? 0}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {formatTeamName(fixture.teams.away.name, 15)}
                          </span>
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

        {/* Hot Odds */}
        {hotOdds.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-yellow-400" />
              <h3 className="text-sm font-semibold text-muted-foreground">Odds em Movimento</h3>
            </div>
            
            <div className="space-y-3">
              {hotOdds.slice(0, 4).map((odd, index) => (
                <div key={index} className="betania-glass p-3 space-y-2">
                  <div className="text-xs font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {odd.match}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{odd.market}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{odd.odds.toFixed(2)}</span>
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

        {/* Top Performers */}
        {topPerformers.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-muted-foreground">Artilheiros</h3>
            </div>
            
            <div className="space-y-3">
              {topPerformers.slice(0, 5).map((player, index) => (
                <div key={index} className="betania-glass p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{player.name}</div>
                      <div className="text-xs text-muted-foreground">{player.team}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm text-blue-400">{player.stat}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Performance</span>
                      <span>{player.performance}%</span>
                    </div>
                    <Progress value={player.performance} className="h-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Insights */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-pulse" />
            <h3 className="text-sm font-semibold text-muted-foreground">Insights BetanIA</h3>
          </div>
          
          <div className="betania-glass p-4 space-y-2">
            <div className="text-sm font-medium text-purple-400">💡 Análise do Momento</div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {loading ? (
                "Analisando dados em tempo real..."
              ) : (
                `${todayFixtures.length} jogos programados hoje. ${liveGames.length} partidas ao vivo. Dados atualizados ${getMatchTime(lastUpdate || new Date())}.`
              )}
            </p>
            {!loading && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-purple-400">
                  Taxa de atualização: 2min
                </span>
                <Badge variant="outline" className="text-xs text-purple-400 border-purple-400/30">
                  Automático
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* No Data State */}
        {!loading && todayFixtures.length === 0 && liveGames.length === 0 && (
          <div className="betania-glass p-6 text-center space-y-3">
            <div className="text-4xl">⚽</div>
            <div className="text-sm text-muted-foreground">
              Nenhum jogo encontrado para hoje
            </div>
            <Button variant="ghost" size="sm" onClick={handleRefresh}>
              Atualizar dados
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};