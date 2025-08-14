import React from "react";
import { Search, Globe, Calendar, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const BetanIAHeader = () => {
  return (
    <header className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center justify-between h-full px-6">
        {/* Logo & Branding */}
        <div className="flex items-center gap-3">
          <div className="betania-glass p-2 betania-glow">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 via-purple-600 to-blue-500" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              BetanIA 💋
            </h1>
            <p className="text-xs text-muted-foreground">Sua assistente esportiva favorita ✨</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-lg mx-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="O que você quer saber, gatinho? 😏" 
              className="pl-10 betania-glass border-0 bg-white/[0.02] placeholder:text-muted-foreground/70"
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Active League */}
          <Badge variant="secondary" className="betania-glass border-0 bg-pink-500/20 text-pink-300">
            <Globe className="w-3 h-3 mr-1" />
            BR Série A 2024 🔥
          </Badge>

          {/* Timezone */}
          <Badge variant="outline" className="betania-glass border-white/[0.08]">
            <Calendar className="w-3 h-3 mr-1" />
            GMT-3
          </Badge>

          {/* Settings */}
          <Button variant="ghost" size="sm" className="betania-glass border-0 hover:bg-white/[0.08]">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};