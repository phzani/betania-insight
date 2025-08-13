import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  LiveSportsData, 
  Fixture, 
  League, 
  Team, 
  Odds,
  LiveGame,
  HotOdd,
  TopPerformer
} from '@/types/sports';
import { 
  convertFixturesToLiveGames, 
  processOddsData, 
  generateTopPerformers,
  filterFixturesByDate,
  validateSportsData,
  BRAZILIAN_LEAGUES
} from '@/lib/sportsDataHelpers';
import { getMockSportsData } from '@/lib/mockSportsData';
import { useFilterStore } from '@/stores/filterStore';

interface UseLiveSportsDataResult {
  fixtures: Fixture[];
  leagues: League[];
  teams: Team[];
  odds: Odds[];
  teamStats: any[];
  lastUpdate: Date;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshing: boolean;
}

/**
 * Comprehensive hook for live sports data with real-time updates
 */
export function useLiveSportsData(): UseLiveSportsDataResult {
  const [data, setData] = useState<LiveSportsData>(() => {
    // Initialize with mock data for immediate display
    const mockData = getMockSportsData();
    return {
      ...mockData,
      loading: true
    };
  });
  
  const [refreshing, setRefreshing] = useState(false);
  const updateData = useFilterStore(state => state.updateData);

  const fetchAllData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      console.log('[LiveSportsData] Starting comprehensive data fetch...');

      const today = new Date().toISOString().split('T')[0];
      const currentSeason = new Date().getFullYear();

      // Parallel API calls for better performance
      const [
        todayFixturesResult,
        liveFixturesResult,
        brazilianLeaguesResult,
        preOddsResult,
        serieATeamsResult
      ] = await Promise.allSettled([
        // Today's fixtures
        supabase.functions.invoke('api-sports', {
          body: {
            endpoint: 'fixtures',
            date: today,
            league: BRAZILIAN_LEAGUES.SERIE_A,
            season: currentSeason
          }
        }),
        
        // Live fixtures
        supabase.functions.invoke('api-sports', {
          body: {
            endpoint: 'fixtures',
            live: 'all'
          }
        }),
        
        // Brazilian leagues
        supabase.functions.invoke('api-sports', {
          body: {
            endpoint: 'leagues',
            country: 'Brazil'
          }
        }),
        
        // Pre-match odds for today
        supabase.functions.invoke('api-sports', {
          body: {
            endpoint: 'odds-pre',
            league: BRAZILIAN_LEAGUES.SERIE_A,
            season: currentSeason
          }
        }),
        
        // Serie A teams
        supabase.functions.invoke('api-sports', {
          body: {
            endpoint: 'teams',
            league: BRAZILIAN_LEAGUES.SERIE_A,
            season: currentSeason
          }
        })
      ]);

      // Process results with error handling
      const processResult = (result: any, fallback: any[] = []) => {
        if (result.status === 'fulfilled' && result.value?.data) {
          const apiResponse = result.value.data;
          if (apiResponse?.ok && apiResponse?.data) {
            return validateSportsData(apiResponse.data);
          }
        }
        if (result.status === 'rejected') {
          console.warn('[LiveSportsData] API call rejected:', result.reason);
        } else {
          console.warn('[LiveSportsData] API call failed or returned invalid data:', {
            status: result.status,
            hasValue: !!result.value,
            hasData: !!result.value?.data,
            error: result.value?.error || result.value?.data?.error
          });
        }
        return fallback;
      };

      const todayFixtures = processResult(todayFixturesResult) as Fixture[];
      const liveFixtures = processResult(liveFixturesResult) as Fixture[];
      const leagues = processResult(brazilianLeaguesResult) as League[];
      const odds = processResult(preOddsResult) as Odds[];
      const teams = processResult(serieATeamsResult) as Team[];

      // Check if we got any real data, otherwise use mock
      const hasRealData = todayFixtures.length > 0 || liveFixtures.length > 0 || 
                         leagues.length > 0 || teams.length > 0;

      if (!hasRealData) {
        console.log('[LiveSportsData] No real data available, using enhanced mock data');
        const mockData = getMockSportsData();
        setData({
          ...mockData,
          loading: false,
          error: null,
          lastUpdate: new Date()
        });
        return;
      }

      // Combine all fixtures (remove duplicates)
      const allFixtures = [...todayFixtures];
      liveFixtures.forEach(liveFixture => {
        if (!allFixtures.find(f => f.fixture.id === liveFixture.fixture.id)) {
          allFixtures.push(liveFixture);
        }
      });

      console.log('[LiveSportsData] Real data processed:', {
        fixtures: allFixtures.length,
        leagues: leagues.length,
        teams: teams.length,
        odds: odds.length
      });

      const finalFixtures = allFixtures.length > 0 ? allFixtures : getMockSportsData().fixtures;
      const finalLeagues = leagues.length > 0 ? leagues : getMockSportsData().leagues;
      const finalTeams = teams.length > 0 ? teams : getMockSportsData().teams;
      
      // Update filter store with new data
      updateData(finalFixtures, finalLeagues, finalTeams);

      setData({
        fixtures: finalFixtures,
        leagues: finalLeagues,
        teams: finalTeams,
        odds: odds.length > 0 ? odds : getMockSportsData().odds,
        teamStats: [], // Will be populated as needed
        lastUpdate: new Date(),
        loading: false,
        error: null
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados esportivos';
      console.error('[LiveSportsData] Error:', errorMessage);
      
      // Fallback to mock data on error
      const mockData = getMockSportsData();
      
      // Update filter store even with mock data
      updateData(mockData.fixtures, mockData.leagues, mockData.teams);
      
      setData({
        ...mockData,
        loading: false,
        error: `API indisponível (usando dados demo): ${errorMessage}`
      });
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  }, [fetchAllData]);

  // Initial load
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('[LiveSportsData] Auto-refresh triggered');
      fetchAllData();
    }, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchAllData]);

  return {
    ...data,
    refresh,
    refreshing
  };
}

/**
 * Hook specifically for widget data processing
 */
export function useWidgetData() {
  const sportsData = useLiveSportsData();
  
  const processedData = {
    liveGames: convertFixturesToLiveGames(sportsData.fixtures),
    todayFixtures: filterFixturesByDate(sportsData.fixtures, 'today'),
    tomorrowFixtures: filterFixturesByDate(sportsData.fixtures, 'tomorrow'),
    hotOdds: processOddsData(sportsData.odds),
    topPerformers: generateTopPerformers(sportsData.teams),
    loading: sportsData.loading,
    error: sportsData.error,
    lastUpdate: sportsData.lastUpdate,
    refresh: sportsData.refresh
  };

  return processedData;
}

/**
 * Helper functions for formatted data
 */
export function getMatchTime(fixtureDate: string | Date): string {
  const date = new Date(fixtureDate);
  const now = new Date();
  
  const diffInMs = date.getTime() - now.getTime();
  const diffInHours = Math.round(diffInMs / (1000 * 60 * 60));
  
  if (diffInHours < 0) {
    const absDiffInHours = Math.abs(diffInHours);
    if (absDiffInHours < 1) {
      return 'Agora';
    } else if (absDiffInHours < 24) {
      return `${absDiffInHours}h atrás`;
    } else {
      return 'Encerrado';
    }
  } else if (diffInHours === 0) {
    return 'Agora';
  } else if (diffInHours < 24) {
    return `Em ${diffInHours}h`;
  } else {
    const diffInDays = Math.round(diffInHours / 24);
    return `Em ${diffInDays}d`;
  }
}

export function formatTeamName(name: string, maxLength: number = 12): string {
  if (!name) return 'N/A';
  
  if (name.length <= maxLength) {
    return name;
  }
  
  // Common team abbreviations
  const abbreviations: Record<string, string> = {
    'Palmeiras': 'PAL',
    'Flamengo': 'FLA',
    'Corinthians': 'COR',
    'São Paulo': 'SAO',
    'Santos': 'SAN',
    'Grêmio': 'GRE',
    'Internacional': 'INT',
    'Botafogo': 'BOT',
    'Vasco da Gama': 'VAS',
    'Fluminense': 'FLU',
    'Athletico-PR': 'CAP',
    'Atlético-MG': 'CAM'
  };
  
  return abbreviations[name] || name.substring(0, maxLength - 3) + '...';
}