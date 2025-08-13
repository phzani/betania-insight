import React from "react";
import { Clock, MapPin, TrendingUp, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FixtureData {
  id: number;
  home: {
    id: number;
    name: string;
    logo: string;
  };
  away: {
    id: number;
    name: string;
    logo: string;
  };
  datetime: Date;
  league: {
    id: number;
    name: string;
    country: string;
  };
  venue: string;
  status: string;
  odds?: {
    home: number;
    draw: number;
    away: number;
  };
  stats?: {
    homeGoals: number;
    awayGoals: number;
    homeShots: number;
    awayShots: number;
  };
}

interface FixtureCardProps {
  fixture: FixtureData;
  compact?: boolean;
}

export const FixtureCard: React.FC<FixtureCardProps> = ({ fixture, compact = false }) => {
  const isLive = fixture.status === 'live';
  const isFinished = fixture.status === 'finished';
  const isScheduled = fixture.status === 'scheduled';

  const getStatusBadge = () => {
    if (isLive) return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Ao Vivo</Badge>;
    if (isFinished) return <Badge variant="secondary">Finalizado</Badge>;
    return <Badge variant="outline">{fixture.datetime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Badge>;
  };

  const getOddsColor = (value: number, type: 'home' | 'draw' | 'away') => {
    if (!fixture.odds) return '';
    const { home, draw, away } = fixture.odds;
    const lowest = Math.min(home, draw, away);
    
    if (value === lowest) return 'odds-positive';
    if (value > lowest * 1.5) return 'odds-negative';
    return 'odds-neutral';
  };

  return (
    <div className={`betania-glass betania-glow p-4 ${compact ? 'space-y-2' : 'space-y-4'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {fixture.league.country} {fixture.league.name}
          </Badge>
          {getStatusBadge()}
        </div>
        {isLive && (
          <div className="flex items-center gap-1 text-red-400">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            <TrendingUp className="h-3 w-3" />
          </div>
        )}
      </div>

      {/* Match */}
      <div className="flex items-center justify-between">
        {/* Home Team */}
        <div className="flex items-center gap-3 flex-1">
          <img 
            src={fixture.home.logo} 
            alt={fixture.home.name}
            className="w-8 h-8 rounded-full bg-white/10"
            onError={(e) => {
              e.currentTarget.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23374151"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="40">⚽</text></svg>`;
            }}
          />
          <div className="flex flex-col">
            <span className="font-medium text-sm">{fixture.home.name}</span>
            {!compact && <span className="text-xs text-muted-foreground">Casa</span>}
          </div>
        </div>

        {/* Score/Time */}
        <div className="px-4 py-2 betania-glass text-center min-w-[60px]">
          {isFinished || isLive ? (
            <div className="text-lg font-bold">
              {fixture.stats?.homeGoals ?? 0} - {fixture.stats?.awayGoals ?? 0}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span className="text-xs">
                {fixture.datetime.toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="flex items-center gap-3 flex-1 flex-row-reverse">
          <img 
            src={fixture.away.logo} 
            alt={fixture.away.name}
            className="w-8 h-8 rounded-full bg-white/10"
            onError={(e) => {
              e.currentTarget.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23374151"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="40">⚽</text></svg>`;
            }}
          />
          <div className="flex flex-col items-end">
            <span className="font-medium text-sm">{fixture.away.name}</span>
            {!compact && <span className="text-xs text-muted-foreground">Fora</span>}
          </div>
        </div>
      </div>

      {/* Venue */}
      {!compact && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground justify-center">
          <MapPin className="h-3 w-3" />
          <span>{fixture.venue}</span>
        </div>
      )}

      {/* Odds */}
      {fixture.odds && !compact && (
        <div className="flex justify-center gap-2 pt-2 border-t border-border/30">
          <div className={`px-3 py-1 rounded-lg text-xs font-medium ${getOddsColor(fixture.odds.home, 'home')}`}>
            1: {fixture.odds.home.toFixed(2)}
          </div>
          <div className={`px-3 py-1 rounded-lg text-xs font-medium ${getOddsColor(fixture.odds.draw, 'draw')}`}>
            X: {fixture.odds.draw.toFixed(2)}
          </div>
          <div className={`px-3 py-1 rounded-lg text-xs font-medium ${getOddsColor(fixture.odds.away, 'away')}`}>
            2: {fixture.odds.away.toFixed(2)}
          </div>
        </div>
      )}

      {/* Actions */}
      {!compact && (
        <div className="flex gap-2 pt-2">
          <Button variant="ghost" size="sm" className="flex-1 text-xs">
            Estatísticas
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 text-xs">
            Ver Jogo
          </Button>
        </div>
      )}
    </div>
  );
};