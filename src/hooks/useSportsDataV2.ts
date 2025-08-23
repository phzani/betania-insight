import { useState, useEffect, useCallback, useMemo } from 'react';
import { useFilterStore } from '@/stores/filterStore';
import { getCurrentSeason } from '@/lib/seasonHelpers';
import { useToast } from '@/hooks/use-toast';
import { 
  Fixture, 
  League, 
  Team, 
  Odds,
  TopPerformer,
  LiveGame,
  HotOdd
} from '@/types/sports';
import { 
  validateSportsData, 
  BRAZILIAN_LEAGUES,
  processOddsData,
  convertFixturesToLiveGames
} from '@/lib/sportsDataHelpers';

const SUPABASE_URL = 'https://skeauyjradscjgfebkqa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrZWF1eWpyYWRzY2pnZmVia3FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNTg3MjAsImV4cCI6MjA3MDYzNDcyMH0.jdVE76iSSqfJkc_3OhrIH1K538w-Vfip3WIbK972VQ8';

interface DataState {
  fixtures: Fixture[];
  leagues: League[];
  teams: Team[];
  odds: Odds[];
  topScorers: TopPerformer[];
  topYellowCards: TopPerformer[];
  topRedCards: TopPerformer[];
  standings: any[];
  lastUpdate: Date | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
}

interface UseSportsDataV2Result extends DataState {
  refresh: () => Promise<void>;
  liveGames: LiveGame[];
  todayFixtures: Fixture[];
  hotOdds: HotOdd[];
  healthStatus: {
    cacheHitRate: number;
    lastSuccessfulFetch: Date | null;
    failureCount: number;
  };
}

export function useSportsDataV2(): UseSportsDataV2Result {
  const { toast } = useToast();
  const { selectedLeague } = useFilterStore();
  
  const [state, setState] = useState<DataState>({
    fixtures: [],
    leagues: [],
    teams: [],
    odds: [],
    topScorers: [],
    topYellowCards: [],
    topRedCards: [],
    standings: [],
    lastUpdate: null,
    loading: true,
    error: null,
    refreshing: false
  });

  const [healthStatus, setHealthStatus] = useState({
    cacheHitRate: 0,
    lastSuccessfulFetch: null as Date | null,
    failureCount: 0
  });

  // Get season configuration for selected league
  const seasonConfig = useMemo(() => {
    const league = selectedLeague || BRAZILIAN_LEAGUES.SERIE_A;
    return getCurrentSeason(league);
  }, [selectedLeague]);

  // Simple API call function
  const callApi = useCallback(async (endpoint: string, params: Record<string, any> = {}) => {
    try {
      console.log(`[SportsDataV2] API call for ${endpoint}`, params);
      
      const url = new URL(`${SUPABASE_URL}/functions/v1/api-sports`);
      url.searchParams.set('endpoint', endpoint);
      
      Object.entries(params).forEach(([key, value]) => {
        if (value && key !== 'endpoint') {
          url.searchParams.set(key, String(value));
        }
      });

      const response = await fetch(url.toString(), {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'content-type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error?.message || `API error for ${endpoint}`);
      }

      return validateSportsData(result.data || []);
      
    } catch (error) {
      console.error(`[SportsDataV2] API error for ${endpoint}:`, error);
      throw error;
    }
  }, []);

  // Process top performers data
  const processTopPerformers = useCallback((rawData: any[], type: 'goals' | 'yellow' | 'red'): TopPerformer[] => {
    if (!Array.isArray(rawData)) return [];

    return rawData.slice(0, 10).map((player: any) => {
      let value = 0;
      let maxValue = 20;
      
      switch (type) {
        case 'goals':
          value = player.statistics?.[0]?.goals?.total || 0;
          maxValue = 20;
          break;
        case 'yellow':
          value = player.statistics?.[0]?.cards?.yellow || 0;
          maxValue = 10;
          break;
        case 'red':
          value = player.statistics?.[0]?.cards?.red || 0;
          maxValue = 5;
          break;
      }

      return {
        name: player.player?.name || 'Unknown',
        team: player.statistics?.[0]?.team?.name || 'Unknown',
        stat: type === 'goals' ? 'goals' : type === 'yellow' ? 'yellow_cards' : 'red_cards',
        value,
        performance: Math.min((value / maxValue) * 100, 100)
      };
    });
  }, []);

  // Main data fetching function
  const fetchAllData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const currentLeague = selectedLeague || BRAZILIAN_LEAGUES.SERIE_A;
      const today = new Date().toISOString().split('T')[0];
      const season = 2024; // Use 2024 season explicitly
      
      console.log(`[SportsDataV2] Fetching data for league: ${currentLeague}, season: ${season}`);

      // Execute parallel requests
      const [
        todayFixtures,
        liveFixtures,
        leagues,
        teams,
        topScorers,
        topYellowCards,
        topRedCards,
        standings
      ] = await Promise.allSettled([
        callApi('fixtures', { date: today, league: currentLeague, season }),
        callApi('fixtures', { live: 'all', league: currentLeague, season }),
        callApi('leagues', { country: 'Brazil' }),
        callApi('teams', { league: currentLeague, season }),
        callApi('topscorers', { league: currentLeague, season }),
        callApi('topyellowcards', { league: currentLeague, season }),
        callApi('topredcards', { league: currentLeague, season }),
        callApi('standings', { league: currentLeague, season })
      ]);

      // Process results
      const processResult = (result: PromiseSettledResult<any>) => {
        if (result.status === 'fulfilled') {
          return result.value;
        }
        console.warn('[SportsDataV2] Request failed:', result.reason);
        return [];
      };

      const todayFixturesData = processResult(todayFixtures) as Fixture[];
      const liveFixturesData = processResult(liveFixtures) as Fixture[];
      const leaguesData = processResult(leagues) as League[];
      const teamsData = processResult(teams) as Team[];
      const topScorersRaw = processResult(topScorers);
      const topYellowCardsRaw = processResult(topYellowCards);
      const topRedCardsRaw = processResult(topRedCards);
      const standingsData = processResult(standings);

      // Combine fixtures and remove duplicates
      const allFixtures = [...todayFixturesData];
      liveFixturesData.forEach(liveFixture => {
        if (!allFixtures.find(f => f.fixture.id === liveFixture.fixture.id)) {
          allFixtures.push(liveFixture);
        }
      });

      // Process top performers
      const processedTopScorers = processTopPerformers(topScorersRaw, 'goals');
      const processedTopYellowCards = processTopPerformers(topYellowCardsRaw, 'yellow');
      const processedTopRedCards = processTopPerformers(topRedCardsRaw, 'red');

      setState(prev => ({
        ...prev,
        fixtures: allFixtures,
        leagues: leaguesData,
        teams: teamsData,
        odds: [],
        topScorers: processedTopScorers,
        topYellowCards: processedTopYellowCards,
        topRedCards: processedTopRedCards,
        standings: standingsData,
        lastUpdate: new Date(),
        loading: false,
        error: null
      }));

      setHealthStatus(prev => ({
        ...prev,
        lastSuccessfulFetch: new Date(),
        failureCount: 0
      }));

      console.log('[SportsDataV2] Data fetch completed successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: `Falha ao carregar dados: ${errorMessage}`
      }));

      setHealthStatus(prev => ({
        ...prev,
        failureCount: prev.failureCount + 1
      }));

      console.error('[SportsDataV2] Data fetch failed:', errorMessage);
    }
  }, [selectedLeague, callApi, processTopPerformers]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, refreshing: true }));
    await fetchAllData();
    setState(prev => ({ ...prev, refreshing: false }));
  }, [fetchAllData]);

  // Initial load and league change
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Computed values
  const liveGames = useMemo(
    () => convertFixturesToLiveGames(state.fixtures.filter(f => 
      !selectedLeague || f.league.id === selectedLeague
    )),
    [state.fixtures, selectedLeague]
  );

  const todayFixtures = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return state.fixtures.filter(f => f.fixture.date.startsWith(today));
  }, [state.fixtures]);

  const hotOdds = useMemo(
    () => [],
    []
  );

  return {
    ...state,
    refresh,
    liveGames,
    todayFixtures,
    hotOdds,
    healthStatus
  };
}