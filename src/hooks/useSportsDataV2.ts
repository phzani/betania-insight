import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useFilterStore } from '@/stores/filterStore';
import { getCurrentSeason } from '@/lib/seasonHelpers';
import { 
  Fixture, 
  TopPerformer
} from '@/types/sports';
import { 
  validateSportsData, 
  BRAZILIAN_LEAGUES
} from '@/lib/sportsDataHelpers';

const SUPABASE_URL = 'https://skeauyjradscjgfebkqa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrZWF1eWpyYWRzY2pnZmVia3FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNTg3MjAsImV4cCI6MjA3MDYzNDcyMH0.jdVE76iSSqfJkc_3OhrIH1K538w-Vfip3WIbK972VQ8';

interface DataState {
  fixtures: Fixture[];
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
  todayFixtures: Fixture[];
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

  // Enhanced API call
  const callApiSports = useCallback(async (endpoint: string, params: Record<string, any> = {}) => {
    try {
      console.log(`[SportsDataV2] API call for ${endpoint}`, params);
      
      const searchParams = new URLSearchParams({
        endpoint,
        ...params
      });

      const response = await fetch(`${SUPABASE_URL}/functions/v1/api-sports?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'content-type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error?.message || `API error for ${endpoint}`);
      }

      const validatedData = validateSportsData(result.data || []);
      return { data: validatedData, fromCache: false };
      
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
      
      console.log(`[SportsDataV2] Fetching data for league: ${currentLeague}, season: ${seasonConfig.current}`);

      // Fetch data sequentially to avoid overwhelming the API
      const todayFixtures = await callApiSports('fixtures', { 
        date: today, 
        league: currentLeague, 
        season: seasonConfig.current 
      });

      const topScorers = await callApiSports('topscorers', { 
        league: currentLeague, 
        season: seasonConfig.current 
      });

      const topYellowCards = await callApiSports('topyellowcards', { 
        league: currentLeague, 
        season: seasonConfig.current 
      });

      const topRedCards = await callApiSports('topredcards', { 
        league: currentLeague, 
        season: seasonConfig.current 
      });

      // Process top performers
      const processedTopScorers = processTopPerformers(topScorers.data, 'goals');
      const processedTopYellowCards = processTopPerformers(topYellowCards.data, 'yellow');
      const processedTopRedCards = processTopPerformers(topRedCards.data, 'red');

      setState(prev => ({
        ...prev,
        fixtures: todayFixtures.data as Fixture[],
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
      
      toast({
        title: "Erro ao Carregar Dados",
        description: `Falha ao carregar informações: ${errorMessage}`,
        variant: "destructive"
      });
    }
  }, [selectedLeague, seasonConfig, callApiSports, processTopPerformers, state.refreshing, toast]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, refreshing: true }));
    await fetchAllData();
    setState(prev => ({ ...prev, refreshing: false }));
  }, [fetchAllData]);

  // Initial load and league change
  useEffect(() => {
    fetchAllData();
  }, [selectedLeague, seasonConfig.current]);

  // Computed values
  const todayFixtures = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return state.fixtures.filter(f => f.fixture.date.startsWith(today));
  }, [state.fixtures]);

  return {
    ...state,
    refresh,
    todayFixtures,
    healthStatus
  };
}