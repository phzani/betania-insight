import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseApiSportsResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface ApiSportsResponse {
  ok: boolean;
  data: any;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    cached: boolean;
    endpoint: string;
    params: any;
    results?: number;
    rateLimit?: {
      remaining: number;
      limit: number;
    };
  };
}

export function useApiSports<T = any>(
  endpoint: string,
  params: Record<string, any> = {},
  autoFetch = true
): UseApiSportsResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`[useApiSports] Calling ${endpoint} with params:`, params);

      const { data: result, error: supabaseError } = await supabase.functions.invoke('api-sports', {
        body: { endpoint, ...params }
      });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      const apiResponse: ApiSportsResponse = result;

      if (!apiResponse.ok) {
        throw new Error(apiResponse.error?.message || 'API error');
      }

      console.log(`[useApiSports] Success for ${endpoint}:`, {
        results: apiResponse.meta?.results,
        cached: apiResponse.meta?.cached
      });

      setData(apiResponse.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[useApiSports] Error for ${endpoint}:`, errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [endpoint, JSON.stringify(params), autoFetch]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}

// Specific hooks for BetanIA endpoints
export function useLeagues(country?: string) {
  return useApiSports('leagues', country ? { country } : {});
}

export function useTeams(leagueId?: number, season?: number) {
  return useApiSports('teams', 
    leagueId && season ? { league: leagueId, season } : {}, 
    !!(leagueId && season)
  );
}

export function useFixtures(params: {
  league?: number;
  season?: number;
  date?: string;
  team?: number;
  next?: number;
  last?: number;
} = {}) {
  return useApiSports('fixtures', params, Object.keys(params).length > 0);
}

export function useOdds(fixtureId?: number, live = false) {
  return useApiSports(
    live ? 'odds-live' : 'odds-pre',
    fixtureId ? { fixture: fixtureId } : {},
    !!fixtureId
  );
}