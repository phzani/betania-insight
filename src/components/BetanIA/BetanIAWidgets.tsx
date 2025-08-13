import React from "react";
import { TrendingUp, Clock, Trophy, Zap } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const BetanIAWidgets = () => {
  const liveGames = [
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
    },
    {
      match: "Athletico x Coritiba",
      market: "Casa vence",
      odds: 2.40,
      change: +0.25,
      trend: "up"
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
    },
    {
      name: "Calleri",
      team: "São Paulo",
      stat: "3 gols",
      performance: 82
    }
  ];

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1 p-4 space-y-6">
        {/* Live Games */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            <h3 className="text-sm font-semibold text-red-400">Ao Vivo</h3>
            <Badge variant="secondary" className="text-xs">{liveGames.length}</Badge>
          </div>
          
          <div className="space-y-3">
            {liveGames.map((game) => (
              <div key={game.id} className="betania-glass p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-red-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {game.minute}'
                  </div>
                  <div className="text-red-400 animate-pulse">●</div>
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

        {/* AI Insights */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-muted-foreground">Insights IA</h3>
          </div>
          
          <div className="betania-glass p-4 space-y-2">
            <div className="text-sm font-medium text-purple-400">💡 Dica do Dia</div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Palmeiras tem 73% de aproveitamento como mandante nesta temporada. 
              Odds estão 12% abaixo do valor teórico contra o Santos.
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};