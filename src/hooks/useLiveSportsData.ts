import { useState, useEffect, useCallback } from 'react';
const SUPABASE_URL = 'https://skeauyjradscjgfebkqa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrZWF1eWpyYWRzY2pnZmVia3FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNTg3MjAsImV4cCI6MjA3MDYzNDcyMH0.jdVE76iSSqfJkc_3OhrIH1K538w-Vfip3WIbK972VQ8';
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
  topScorers: TopPerformer[];
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
      topScorers: [],
      loading: true
    } as LiveSportsData;
  });
  
  const [refreshing, setRefreshing] = useState(false);
  const updateData = useFilterStore(state => state.updateData);

  const fetchAllData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      console.log('[LiveSportsData] Starting comprehensive data fetch...');

      const today = new Date().toISOString().split('T')[0];
      const currentSeason = new Date().getFullYear();

    // Helper to call Edge Function with GET
    const callApi = (p: Record<string, any>) => {
      const url = new URL(`${SUPABASE_URL}/functions/v1/api-sports`);
      Object.entries(p).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      });
      return fetch(url.toString(), {
        method: 'GET',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'content-type': 'application/json'
        }
      }).then(r => r.json());
    };

    // Parallel API calls for better performance
    const [
      todayFixturesResult,
      liveFixturesResult,
      brazilianLeaguesResult,
      preOddsResult,
      serieATeamsResult,
      topScorersResult
    ] = await Promise.allSettled([
      callApi({ endpoint: 'fixtures', date: today, league: BRAZILIAN_LEAGUES.SERIE_A, season: currentSeason }),
      callApi({ endpoint: 'fixtures', live: 'all' }),
      callApi({ endpoint: 'leagues', country: 'Brazil' }),
      callApi({ endpoint: 'odds-pre', league: BRAZILIAN_LEAGUES.SERIE_A, season: currentSeason }),
      callApi({ endpoint: 'teams', league: BRAZILIAN_LEAGUES.SERIE_A, season: currentSeason }),
      callApi({ endpoint: 'topscorers', league: BRAZILIAN_LEAGUES.SERIE_A, season: currentSeason }),
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
    const topScorersRaw = processResult(topScorersResult) as any[];

      // Check if we got any real data, otherwise use mock
    const hasRealData = todayFixtures.length > 0 || liveFixtures.length > 0 || 
                       leagues.length > 0 || teams.length > 0;

      if (!hasRealData) {
        console.log('[LiveSportsData] No real data available, avoiding mock fixtures');
        const mockData = getMockSportsData();
        setData({
          fixtures: [], // avoid showing non-existent games
          leagues: mockData.leagues,
          teams: mockData.teams,
          odds: [],
          teamStats: [],
          topScorers: [],
          loading: false,
          error: 'Sem dados reais no momento',
          lastUpdate: new Date()
        });
        // Update filter store with safe values
        updateData([], mockData.leagues, mockData.teams);
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

    const finalFixtures = allFixtures; // Do not use mock fixtures
    const finalLeagues = leagues.length > 0 ? leagues : getMockSportsData().leagues;
    const finalTeams = teams.length > 0 ? teams : getMockSportsData().teams;

    // Map top scorers
    const { mapTopScorersToPerformers } = await import('@/lib/sportsDataHelpers');
    const topScorers = mapTopScorersToPerformers(topScorersRaw);
    
    // Update filter store with new data
    updateData(finalFixtures, finalLeagues, finalTeams);

    setData({
      fixtures: finalFixtures,
      leagues: finalLeagues,
      teams: finalTeams,
      odds: odds.length > 0 ? odds : [],
      teamStats: [], // Will be populated as needed
      topScorers,
      lastUpdate: new Date(),
      loading: false,
      error: null
    });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados esportivos';
      console.error('[LiveSportsData] Error:', errorMessage);
      
      // Use safe fallback without mock fixtures
      const mockData = getMockSportsData();
      
      // Update filter store with safe values
      updateData([], mockData.leagues, mockData.teams);
      
      setData({
        fixtures: [],
        leagues: mockData.leagues,
        teams: mockData.teams,
        odds: [],
        teamStats: [],
        topScorers: [],
        loading: false,
        error: `API indisponível: ${errorMessage}`,
        lastUpdate: new Date()
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
  const { getFilteredFixtures } = useFilterStore();
  
  const fixturesFiltered = getFilteredFixtures();
  
  const processedData = {
    liveGames: convertFixturesToLiveGames(fixturesFiltered),
    todayFixtures: filterFixturesByDate(fixturesFiltered, 'today'),
    tomorrowFixtures: filterFixturesByDate(fixturesFiltered, 'tomorrow'),
    hotOdds: processOddsData(sportsData.odds),
    topPerformers: sportsData.topScorers ?? [],
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