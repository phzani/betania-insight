import React from "react";
import { Trophy, TrendingUp, Users, Calendar, BarChart3 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFixtures, useLeagues, useApiSports } from "@/hooks/useApiSports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const BetanIAWidgetsEnhanced = () => {
  // Fetch real-time data
  const { data: todayFixtures, loading: fixturesLoading } = useFixtures({
    date: new Date().toISOString().split('T')[0],
    league: 71, // Brasil Série A
    season: 2025
  });

  const { data: leagues, loading: leaguesLoading } = useLeagues('Brazil');

  const { data: liveOdds, loading: oddsLoading } = useApiSports('odds-live', {}, false);

  // Mock data for demonstration
  const mockLiveGames = [
    {
      id: 1,
      home: "Palmeiras",
      away: "Santos", 
      homeScore: 2,
      awayScore: 1,
      minute: 67,
      homeOdds: 1.45,
      drawOdds: 4.20,
      awayOdds: 6.80
    },
    {
      id: 2,
      home: "Flamengo",
      away: "Vasco",
      homeScore: 0,
      awayScore: 1,
      minute: 23,
      homeOdds: 2.10,
      drawOdds: 3.40,
      awayOdds: 3.20
    }
  ];

  const hotOdds = [
    {
      match: "Corinthians x São Paulo",
      market: "Mais de 2.5 gols", 
      odds: 1.85,
      change: +0.15,
      trend: "up"
    },
    {
      match: "Internacional x Grêmio",
      market: "Ambas marcam",
      odds: 1.92,
      change: -0.08,
      trend: "down"
    }
  ];

  const topPerformers = [
    {
      name: "Endrick",
      team: "Palmeiras",
      stat: "5 gols",
      performance: 92
    },
    {
      name: "Pedro",
      team: "Flamengo",
      stat: "4 gols", 
      performance: 88
    }
  ];

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1 p-4 space-y-6">
        {/* Real-time Data Status */}
        <Card className="betania-glass border-0">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4 text-blue-400" />
              Status da API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Fixtures:</span>
              <Badge variant={fixturesLoading ? "secondary" : "outline"} className="text-xs">
                {fixturesLoading ? "Carregando..." : todayFixtures?.length || 0}
              </Badge>
            </div>
            <div className="flex justify-between text-xs">
              <span>Ligas:</span>
              <Badge variant={leaguesLoading ? "secondary" : "outline"} className="text-xs">
                {leaguesLoading ? "Carregando..." : leagues?.length || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Live Games */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            <h3 className="text-sm font-semibold text-red-400">Ao Vivo</h3>
            <Badge variant="secondary" className="text-xs">{mockLiveGames.length}</Badge>
          </div>
          
          <div className="space-y-3">
            {mockLiveGames.map((game) => (
              <div key={game.id} className="betania-glass p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-red-400 flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                    {game.minute}'
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs h-6">
                    Detalhes
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{game.home}</span>
                    <span className="text-sm font-medium">{game.away}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-bold">{game.homeScore}</span>
                    <span className="text-lg font-bold">{game.awayScore}</span>
                  </div>
                </div>

                <div className="flex justify-between text-xs pt-2 border-t border-border/30">
                  <span className="odds-positive px-2 py-1 rounded">1: {game.homeOdds}</span>
                  <span className="odds-neutral px-2 py-1 rounded">X: {game.drawOdds}</span>
                  <span className="odds-negative px-2 py-1 rounded">2: {game.awayOdds}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Fixtures */}
        {todayFixtures && todayFixtures.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-muted-foreground">Jogos Hoje</h3>
              <Badge variant="secondary" className="text-xs">{todayFixtures.length}</Badge>
            </div>
            
            <div className="space-y-2">
              {todayFixtures.slice(0, 3).map((fixture: any, index: number) => (
                <div key={index} className="betania-glass p-3">
                  <div className="text-xs font-medium mb-1">
                    {fixture.league?.name || 'Liga desconhecida'}
                  </div>
                  <div className="text-sm">
                    {fixture.teams?.home?.name || 'Time A'} x {fixture.teams?.away?.name || 'Time B'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(fixture.fixture?.date).toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hot Odds */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-yellow-400" />
            <h3 className="text-sm font-semibold text-muted-foreground">Odds em Alta</h3>
          </div>
          
          <div className="space-y-3">
            {hotOdds.map((odd, index) => (
              <div key={index} className="betania-glass p-3 space-y-2">
                <div className="text-xs font-medium">{odd.match}</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{odd.market}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{odd.odds}</span>
                    <div className={`flex items-center text-xs ${
                      odd.trend === 'up' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {odd.trend === 'up' ? '↗' : '↘'}
                      {Math.abs(odd.change).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performers */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-muted-foreground">Destaques</h3>
          </div>
          
          <div className="space-y-3">
            {topPerformers.map((player, index) => (
              <div key={index} className="betania-glass p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{player.name}</div>
                    <div className="text-xs text-muted-foreground">{player.team}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-blue-400">{player.stat}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insight */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full" />
            <h3 className="text-sm font-semibold text-muted-foreground">Insight BetanIA</h3>
          </div>
          
          <div className="betania-glass p-4 space-y-2">
            <div className="text-sm font-medium text-purple-400">💡 Análise do Momento</div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {fixturesLoading ? 
                "Carregando dados em tempo real..." :
                `${todayFixtures?.length || 0} jogos programados para hoje. Dados atualizados há ${new Date().getMinutes()} min.`
              }
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs mt-2 p-0 h-auto text-purple-400 hover:text-purple-300"
            >
              Ver análise completa →
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};