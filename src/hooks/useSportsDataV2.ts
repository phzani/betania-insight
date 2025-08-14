import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSmartCache, CACHE_CONFIGS } from './useSmartCache';
import { useSystemMonitor } from './useSystemMonitor';
import { useDebounce, useBatchedRequests } from './usePerformanceOptimizations';
import { useFilterStore } from '@/stores/filterStore';
import { getCurrentSeason, shouldUseFallback } from '@/lib/seasonHelpers';
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
  const { cache } = useSmartCache();
  const { recordApiCall, recordCacheHit } = useSystemMonitor();
  const { addToBatch } = useBatchedRequests();
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

  // Enhanced API call with intelligent caching, monitoring and batching
  const callApiSmart = useCallback(async (endpoint: string, params: Record<string, any> = {}) => {
    const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
    const startTime = performance.now();
    
    // Try cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      recordCacheHit();
      console.log(`[SportsDataV2] Cache hit for ${endpoint}`, params);
      return { data: cached, fromCache: true };
    }

    try {
      console.log(`[SportsDataV2] API call for ${endpoint}`, params);
      
      // Use batched requests for better performance
      const result = await addToBatch(endpoint, params);
      
      const responseTime = performance.now() - startTime;
      recordApiCall(responseTime, true, false);
      
      if (!result.ok) {
        throw new Error(result.error?.message || `API error for ${endpoint}`);
      }

      const validatedData = validateSportsData(result.data || []);
      
      // Cache the result based on endpoint type
      const config = getCacheConfig(endpoint);
      if (config) {
        cache.set(cacheKey, validatedData, config);
      }

      return { data: validatedData, fromCache: false };
      
    } catch (error) {
      const responseTime = performance.now() - startTime;
      recordApiCall(responseTime, false, false);
      
      console.error(`[SportsDataV2] API error for ${endpoint}:`, error);
      
      // Show toast for critical errors
      if (endpoint === 'topscorers' || endpoint === 'fixtures') {
        toast({
          title: "Erro na API",
          description: `Falha ao carregar ${endpoint}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          variant: "destructive"
        });
      }
      
      // For critical endpoints, try fallback season
      if (['topscorers', 'topyellowcards', 'topredcards'].includes(endpoint) && params.season) {
        const fallbackParams = { ...params, season: seasonConfig.fallback };
        const fallbackCacheKey = `${endpoint}_${JSON.stringify(fallbackParams)}`;
        
        console.log(`[SportsDataV2] Trying fallback season for ${endpoint}`, fallbackParams);
        
        try {
          // Check cache for fallback first
          const fallbackCached = cache.get(fallbackCacheKey);
          if (fallbackCached) {
            recordCacheHit();
            return { data: fallbackCached, fromCache: true, fallback: true };
          }

          // Make fallback API call
          const fallbackResult = await addToBatch(endpoint, fallbackParams);
          
          if (fallbackResult.ok) {
            const fallbackData = validateSportsData(fallbackResult.data || []);
            const config = getCacheConfig(endpoint);
            if (config) {
              cache.set(fallbackCacheKey, fallbackData, config);
            }
            
            console.log(`[SportsDataV2] Fallback success for ${endpoint}`);
            return { data: fallbackData, fromCache: false, fallback: true };
          }
        } catch (fallbackError) {
          console.error(`[SportsDataV2] Fallback also failed for ${endpoint}:`, fallbackError);
        }
      }

      throw error;
    }
  }, [cache, seasonConfig, addToBatch, recordApiCall, recordCacheHit, toast]);

  // Get cache configuration for endpoint
  const getCacheConfig = (endpoint: string) => {
    switch (endpoint) {
      case 'fixtures':
        return CACHE_CONFIGS.TODAY_FIXTURES;
      case 'leagues':
        return CACHE_CONFIGS.LEAGUES;
      case 'teams':
        return CACHE_CONFIGS.TEAMS;
      case 'odds-pre':
        return CACHE_CONFIGS.ODDS_PRE;
      case 'topscorers':
        return CACHE_CONFIGS.TOP_SCORERS;
      case 'topyellowcards':
      case 'topredcards':
        return CACHE_CONFIGS.TOP_CARDS;
      default:
        return null;
    }
  };

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

  // Main data fetching function with performance optimizations
  const fetchAllData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const currentLeague = selectedLeague || BRAZILIAN_LEAGUES.SERIE_A;
      const today = new Date().toISOString().split('T')[0];
      
      console.log(`[SportsDataV2] Fetching data for league: ${currentLeague}, season: ${seasonConfig.current}`);

      // Execute parallel requests with smart caching and batching
      const [
        todayFixtures,
        liveFixtures,
        leagues,
        odds,
        teams,
        topScorers,
        topYellowCards,
        topRedCards
      ] = await Promise.allSettled([
        callApiSmart('fixtures', { date: today, league: currentLeague, season: seasonConfig.current }),
        callApiSmart('fixtures', { live: 'all', league: currentLeague, season: seasonConfig.current }),
        callApiSmart('leagues', { country: 'Brazil' }),
        callApiSmart('odds-pre', { league: currentLeague, season: seasonConfig.current }),
        callApiSmart('teams', { league: currentLeague, season: seasonConfig.current }),
        callApiSmart('topscorers', { league: currentLeague, season: seasonConfig.current }),
        callApiSmart('topyellowcards', { league: currentLeague, season: seasonConfig.current }),
        callApiSmart('topredcards', { league: currentLeague, season: seasonConfig.current })
      ]);

      // Process results
      const processResult = (result: PromiseSettledResult<any>) => {
        if (result.status === 'fulfilled') {
          return result.value.data;
        }
        console.warn('[SportsDataV2] Request failed:', result.reason);
        return [];
      };

      const todayFixturesData = processResult(todayFixtures) as Fixture[];
      const liveFixturesData = processResult(liveFixtures) as Fixture[];
      const leaguesData = processResult(leagues) as League[];
      const oddsData = processResult(odds) as Odds[];
      const teamsData = processResult(teams) as Team[];
      const topScorersRaw = processResult(topScorers);
      const topYellowCardsRaw = processResult(topYellowCards);
      const topRedCardsRaw = processResult(topRedCards);

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
        odds: oddsData,
        topScorers: processedTopScorers,
        topYellowCards: processedTopYellowCards,
        topRedCards: processedTopRedCards,
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

      // Show success toast for manual refreshes
      if (state.refreshing) {
        toast({
          title: "Dados Atualizados",
          description: "Informações esportivas foram atualizadas com sucesso.",
          variant: "default"
        });
      }

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
  }, [selectedLeague, seasonConfig, callApiSmart, processTopPerformers, state.refreshing, toast]);

  // Debounced data fetching to prevent excessive API calls
  const debouncedFetchAllData = useDebounce(fetchAllData, 1000, {
    leading: false,
    trailing: true,
    maxWait: 3000
  });

  // Manual refresh function
  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, refreshing: true }));
    
    // Invalidate relevant cache entries
    cache.invalidatePattern(`fixtures_.*league.*${selectedLeague || BRAZILIAN_LEAGUES.SERIE_A}`);
    cache.invalidatePattern(`topscorers_.*league.*${selectedLeague || BRAZILIAN_LEAGUES.SERIE_A}`);
    cache.invalidatePattern(`topyellowcards_.*league.*${selectedLeague || BRAZILIAN_LEAGUES.SERIE_A}`);
    cache.invalidatePattern(`topredcards_.*league.*${selectedLeague || BRAZILIAN_LEAGUES.SERIE_A}`);
    
    await fetchAllData();
    setState(prev => ({ ...prev, refreshing: false }));
  }, [fetchAllData, cache, selectedLeague]);

  // Initial load and league change
  useEffect(() => {
    debouncedFetchAllData();
  }, [debouncedFetchAllData]);

  // Auto-refresh for live data
  useEffect(() => {
    const interval = setInterval(() => {
      // Only auto-refresh if we have successful data and no current error
      if (state.lastUpdate && !state.error && !state.loading) {
        console.log('[SportsDataV2] Auto-refresh triggered');
        fetchAllData();
      }
    }, 60 * 1000); // Every minute

    return () => clearInterval(interval);
  }, [fetchAllData, state.lastUpdate, state.error, state.loading]);

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
    () => processOddsData(state.odds, state.fixtures),
    [state.odds, state.fixtures]
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