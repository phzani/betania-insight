import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LiveSportsData {
  fixtures: any[];
  odds: any[];
  leagues: any[];
  teams: any[];
  lastUpdate: Date;
}

export function useLiveSportsData(): {
  data: LiveSportsData;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const [data, setData] = useState<LiveSportsData>({
    fixtures: [],
    odds: [],
    leagues: [],
    teams: [],
    lastUpdate: new Date()
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch today's fixtures
      const { data: fixturesResult, error: fixturesError } = await supabase.functions.invoke('api-sports', {
        body: {
          endpoint: 'fixtures',
          date: new Date().toISOString().split('T')[0],
          league: 71,
          season: 2025
        }
      });

      // Fetch Brazilian leagues
      const { data: leaguesResult, error: leaguesError } = await supabase.functions.invoke('api-sports', {
        body: {
          endpoint: 'leagues',
          country: 'Brazil'
        }
      });

      // Handle results
      const fixtures = fixturesResult?.ok ? fixturesResult.data : [];
      const leagues = leaguesResult?.ok ? leaguesResult.data : [];

      setData({
        fixtures: fixtures || [],
        odds: [], // Will be populated when live odds are fetched
        leagues: leagues || [],
        teams: [], // Will be populated based on fixtures
        lastUpdate: new Date()
      });

      console.log('[LiveSportsData] Data updated:', {
        fixtures: fixtures?.length || 0,
        leagues: leagues?.length || 0
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados esportivos';
      setError(errorMessage);
      console.error('[LiveSportsData] Error:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set up auto-refresh every 2 minutes
    const interval = setInterval(fetchData, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    data,
    loading,
    error,
    refresh: fetchData
  };
}

// Helper function to get formatted match time
export function getMatchTime(fixtureDate: string | Date): string {
  const date = new Date(fixtureDate);
  const now = new Date();
  
  const diffInMs = date.getTime() - now.getTime();
  const diffInHours = Math.round(diffInMs / (1000 * 60 * 60));
  
  if (diffInHours < 0) {
    return 'Encerrado';
  } else if (diffInHours === 0) {
    return 'Agora';
  } else if (diffInHours < 24) {
    return `Em ${diffInHours}h`;
  } else {
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  }
}

// Helper function to format team names
export function formatTeamName(name: string): string {
  if (!name) return 'N/A';
  
  // Shorten common long names
  const shortNames: Record<string, string> = {
    'Palmeiras': 'PAL',
    'Flamengo': 'FLA', 
    'Corinthians': 'COR',
    'São Paulo': 'SAO',
    'Santos': 'SAN',
    'Grêmio': 'GRE',
    'Internacional': 'INT',
    'Botafogo': 'BOT',
    'Vasco da Gama': 'VAS',
    'Fluminense': 'FLU'
  };
  
  return shortNames[name] || name.substring(0, 3).toUpperCase();
}