import React from "react";
import { Trophy, Star, Calendar, TrendingUp, Globe } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const BetanIASidebar = () => {
  const favoriteTeams = [
    { id: 1, name: "Palmeiras", logo: "🏆", form: "WWDWL" },
    { id: 2, name: "Flamengo", logo: "🔴", form: "WLWWW" },
    { id: 3, name: "São Paulo", logo: "⚪", form: "DWLWW" },
  ];

  const leagues = [
    { id: 71, name: "Brasileirão Série A", country: "🇧🇷", active: true },
    { id: 72, name: "Brasileirão Série B", country: "🇧🇷", active: false },
    { id: 73, name: "Copa do Brasil", country: "🇧🇷", active: false },
    { id: 13, name: "Libertadores", country: "🌎", active: false },
  ];

  const quickFilters = [
    { label: "Hoje", icon: Calendar, count: 12 },
    { label: "Ao Vivo", icon: TrendingUp, count: 3 },
    { label: "Próximos", icon: Globe, count: 24 },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Quick Filters */}
      <div className="p-4 border-b border-border/30">
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Filtros Rápidos</h3>
        <div className="space-y-2">
          {quickFilters.map((filter) => (
            <Button
              key={filter.label}
              variant="ghost"
              className="w-full justify-between betania-glass border-0 hover:bg-white/[0.08] text-left"
            >
              <div className="flex items-center gap-2">
                <filter.icon className="h-4 w-4" />
                <span className="text-sm">{filter.label}</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {filter.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {/* Favorite Teams */}
        <div className="p-4 border-b border-border/30">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-yellow-400" />
            <h3 className="text-sm font-semibold text-muted-foreground">Times Favoritos</h3>
          </div>
          <div className="space-y-2">
            {favoriteTeams.map((team) => (
              <Button
                key={team.id}
                variant="ghost"
                className="w-full justify-between betania-glass border-0 hover:bg-white/[0.08] p-3 h-auto"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{team.logo}</span>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{team.name}</span>
                    <span className="text-xs text-muted-foreground">{team.form}</span>
                  </div>
                </div>
              </Button>
            ))}
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
                className={`w-full justify-start p-3 h-auto ${
                  league.active 
                    ? "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30" 
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
        </div>
      </ScrollArea>
    </div>
  );
};