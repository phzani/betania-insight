-- BetanIA Database Schema
-- Core tables for sports data with proper caching and relationships

-- Leagues table
CREATE TABLE public.leagues (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  logo TEXT,
  season INTEGER NOT NULL,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Teams table
CREATE TABLE public.teams (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  country TEXT,
  founded INTEGER,
  venue_name TEXT,
  venue_capacity INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Fixtures table (jogos)
CREATE TABLE public.fixtures (
  id INTEGER PRIMARY KEY,
  league_id INTEGER REFERENCES public.leagues(id),
  season INTEGER NOT NULL,
  fixture_date TIMESTAMP WITH TIME ZONE NOT NULL,
  home_team_id INTEGER REFERENCES public.teams(id),
  away_team_id INTEGER REFERENCES public.teams(id),
  status TEXT NOT NULL DEFAULT 'scheduled',
  venue_name TEXT,
  home_goals INTEGER,
  away_goals INTEGER,
  elapsed INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Odds table (informativo)
CREATE TABLE public.odds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id INTEGER REFERENCES public.fixtures(id),
  bookmaker TEXT NOT NULL,
  odds_type TEXT NOT NULL DEFAULT '1X2',
  home_odds DECIMAL(4,2),
  draw_odds DECIMAL(4,2),
  away_odds DECIMAL(4,2),
  is_live BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Team statistics table
CREATE TABLE public.team_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id INTEGER REFERENCES public.teams(id),
  league_id INTEGER REFERENCES public.leagues(id),
  season INTEGER NOT NULL,
  games_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  yellow_cards INTEGER DEFAULT 0,
  red_cards INTEGER DEFAULT 0,
  form TEXT, -- "WWDLL" format
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Fixture statistics table
CREATE TABLE public.fixture_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id INTEGER REFERENCES public.fixtures(id),
  team_id INTEGER REFERENCES public.teams(id),
  shots_total INTEGER DEFAULT 0,
  shots_on_goal INTEGER DEFAULT 0,
  possession_percentage INTEGER DEFAULT 0,
  passes_total INTEGER DEFAULT 0,
  passes_accurate INTEGER DEFAULT 0,
  fouls INTEGER DEFAULT 0,
  yellow_cards INTEGER DEFAULT 0,
  red_cards INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User preferences table
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  favorite_leagues INTEGER[] DEFAULT '{71}', -- Brasil Série A por padrão
  favorite_teams INTEGER[] DEFAULT '{}',
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  last_league_id INTEGER,
  last_season INTEGER,
  last_team_id INTEGER,
  last_fixture_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Chat messages table for BetanIA conversation history
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT,
  context JSONB, -- Store fixture/team/league context
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.odds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixture_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public data (sports data is public)
CREATE POLICY "Sports data is publicly readable" ON public.leagues FOR SELECT USING (true);
CREATE POLICY "Sports data is publicly readable" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Sports data is publicly readable" ON public.fixtures FOR SELECT USING (true);
CREATE POLICY "Sports data is publicly readable" ON public.odds FOR SELECT USING (true);
CREATE POLICY "Sports data is publicly readable" ON public.team_stats FOR SELECT USING (true);
CREATE POLICY "Sports data is publicly readable" ON public.fixture_stats FOR SELECT USING (true);

-- RLS Policies for user-specific data
CREATE POLICY "Users can view their own preferences" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own preferences" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own preferences" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own chat history" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_fixtures_league_season ON public.fixtures(league_id, season);
CREATE INDEX idx_fixtures_date ON public.fixtures(fixture_date);
CREATE INDEX idx_fixtures_teams ON public.fixtures(home_team_id, away_team_id);
CREATE INDEX idx_odds_fixture ON public.odds(fixture_id);
CREATE INDEX idx_team_stats_league_season ON public.team_stats(league_id, season);
CREATE INDEX idx_fixture_stats_fixture ON public.fixture_stats(fixture_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_leagues_updated_at BEFORE UPDATE ON public.leagues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fixtures_updated_at BEFORE UPDATE ON public.fixtures FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_odds_updated_at BEFORE UPDATE ON public.odds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_team_stats_updated_at BEFORE UPDATE ON public.team_stats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fixture_stats_updated_at BEFORE UPDATE ON public.fixture_stats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();