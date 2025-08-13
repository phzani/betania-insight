import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ApiSportsResponse, Fixture, League, Team, Odds } from '@/types/sports';

interface UseApiSportsOptions {
  autoFetch?: boolean;
  cacheTime?: number;
  refetchInterval?: number;
}

interface UseApiSportsResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdate: Date | null;
}

/**
 * Enhanced hook for API-Sports data fetching with better error handling and caching
 */
export function useApiSports<T = any>(
  endpoint: string,
  params: Record<string, any> = {},
  options: UseApiSportsOptions = {}
): UseApiSportsResult<T> {
  const { autoFetch = true, cacheTime = 5 * 60 * 1000, refetchInterval } = options;
  
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`[useApiSports] Fetching ${endpoint} with params:`, params);

      const { data: result, error: supabaseError } = await supabase.functions.invoke('api-sports', {
        body: { endpoint, ...params }
      });

      if (supabaseError) {
        throw new Error(`Supabase error: ${supabaseError.message}`);
      }

      const apiResponse: ApiSportsResponse<T> = result;

      if (!apiResponse.ok) {
        throw new Error(apiResponse.error?.message || `API error for ${endpoint}`);
      }

      console.log(`[useApiSports] Success for ${endpoint}:`, {
        results: apiResponse.data?.length || 0,
        cached: apiResponse.meta?.cached,
        endpoint
      });

      // Validate data structure
      const validData = Array.isArray(apiResponse.data) ? apiResponse.data : [];
      setData(validData);
      setLastUpdate(new Date());

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Unknown error for ${endpoint}`;
      console.error(`[useApiSports] Error for ${endpoint}:`, errorMessage);
      setError(errorMessage);
      
      // Keep existing data on error
      if (data.length === 0) {
        setData([]);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, JSON.stringify(params), data.length]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  // Set up auto-refresh interval
  useEffect(() => {
    if (refetchInterval && refetchInterval > 0) {
      const interval = setInterval(fetchData, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [refetchInterval, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    lastUpdate
  };
}

// Specialized hooks for specific endpoints
export function useLeagues(country?: string, options?: UseApiSportsOptions) {
  return useApiSports<League>('leagues', country ? { country } : {}, {
    cacheTime: 60 * 60 * 1000, // 1 hour
    ...options
  });
}

export function useTeams(leagueId?: number, season?: number, options?: UseApiSportsOptions) {
  return useApiSports<Team>('teams', 
    leagueId && season ? { league: leagueId, season } : {}, 
    {
      autoFetch: !!(leagueId && season),
      cacheTime: 60 * 60 * 1000, // 1 hour
      ...options
    }
  );
}

export function useFixtures(params: {
  league?: number;
  season?: number;
  date?: string;
  team?: number;
  next?: number;
  last?: number;
  live?: 'all' | boolean;
} = {}, options?: UseApiSportsOptions) {
  
  const hasParams = Object.keys(params).length > 0;
  
  return useApiSports<Fixture>('fixtures', params, {
    autoFetch: hasParams,
    cacheTime: 2 * 60 * 1000, // 2 minutes for fixtures
    refetchInterval: params.live ? 30 * 1000 : undefined, // 30s for live data
    ...options
  });
}

export function useOdds(fixtureId?: number, live = false, options?: UseApiSportsOptions) {
  return useApiSports<Odds>(
    live ? 'odds-live' : 'odds-pre',
    fixtureId ? { fixture: fixtureId } : {},
    {
      autoFetch: !!fixtureId,
      cacheTime: live ? 30 * 1000 : 15 * 60 * 1000, // 30s for live, 15min for pre
      refetchInterval: live ? 30 * 1000 : undefined,
      ...options
    }
  );
}

export function useTeamStats(teamId?: number, leagueId?: number, season?: number, options?: UseApiSportsOptions) {
  return useApiSports('team-stats', 
    teamId && leagueId && season ? { team: teamId, league: leagueId, season } : {},
    {
      autoFetch: !!(teamId && leagueId && season),
      cacheTime: 30 * 60 * 1000, // 30 minutes
      ...options
    }
  );
}

// Composite hook for Brazilian football data
export function useBrazilianFootball(options?: UseApiSportsOptions) {
  const currentSeason = new Date().getFullYear();
  const today = new Date().toISOString().split('T')[0];

  // Fetch Brazilian Serie A data
  const leagues = useLeagues('Brazil', options);
  const serieAFixtures = useFixtures({
    league: 71, // Serie A
    season: currentSeason,
    date: today
  }, options);
  
  const liveFixtures = useFixtures({
    live: 'all'
  }, {
    ...options,
    refetchInterval: 30 * 1000 // Update every 30 seconds for live data
  });

  const todayOdds = useOdds(undefined, false, options);

  return {
    leagues,
    todayFixtures: serieAFixtures,
    liveFixtures,
    odds: todayOdds,
    loading: leagues.loading || serieAFixtures.loading || liveFixtures.loading,
    error: leagues.error || serieAFixtures.error || liveFixtures.error,
    lastUpdate: new Date()
  };
}
