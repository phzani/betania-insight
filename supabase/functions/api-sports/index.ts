import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface ApiSportsResponse {
  get: string;
  parameters: any;
  errors: any[];
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: any[];
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced helper functions for smart caching
function isMatchDay(): boolean {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  
  // More matches on weekends and evenings
  const isWeekend = day === 0 || day === 6;
  const isEvening = hour >= 15 && hour <= 23;
  
  return isWeekend || isEvening;
}

function hasActiveMatches(): boolean {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  return month >= 2 && month <= 12;
}

function getSeasonForLeague(leagueId: string): { current: string; fallback: string } {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  // Brazilian leagues (calendar year)
  const brazilianLeagues = ['71', '72', '73', '74', '75']; // Serie A, B, C, D, Copa do Brasil
  
  if (brazilianLeagues.includes(leagueId)) {
    return {
      current: currentYear.toString(),
      fallback: (currentYear - 1).toString()
    };
  }
  
  // European leagues (span years)
  if (currentMonth >= 8) {
    return {
      current: currentYear.toString(),
      fallback: (currentYear - 1).toString()
    };
  } else {
    return {
      current: (currentYear - 1).toString(),
      fallback: (currentYear - 2).toString()
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const apiKey = Deno.env.get('APISPORTS_KEY');
    if (!apiKey) {
      throw new Error('APISPORTS_KEY not configured');
    }

    // Handle both GET and POST requests
    let endpoint: string;
    let params: any = {};

    if (req.method === 'GET') {
      const url = new URL(req.url);
      endpoint = url.searchParams.get('endpoint') || '';
      params = Object.fromEntries(url.searchParams.entries());
      delete params.endpoint;
    } else {
      const body = await req.json();
      endpoint = body.endpoint || '';
      params = { ...body };
      delete params.endpoint;
    }

    console.log(`[API-Sports] Calling endpoint: ${endpoint}`, params);

    let apiUrl = '';
    let cacheKey = '';
    let cacheDuration = 300; // 5 minutes default

    // Route endpoints based on BetanIA spec
    switch (endpoint) {
      case 'leagues':
        apiUrl = 'https://v3.football.api-sports.io/leagues';
        cacheKey = `leagues_${JSON.stringify(params)}`;
        cacheDuration = 3600; // 1 hour
        break;

      case 'seasons':
        apiUrl = 'https://v3.football.api-sports.io/leagues/seasons';
        cacheKey = `seasons`;
        cacheDuration = 86400; // 24 hours
        break;

      case 'teams':
        apiUrl = 'https://v3.football.api-sports.io/teams';
        cacheKey = `teams_${JSON.stringify(params)}`;
        cacheDuration = 3600; // 1 hour
        break;

      case 'team-stats':
        apiUrl = 'https://v3.football.api-sports.io/teams/statistics';
        cacheKey = `team_stats_${JSON.stringify(params)}`;
        cacheDuration = 300; // 5 minutes
        break;

      case 'fixtures':
        apiUrl = 'https://v3.football.api-sports.io/fixtures';
        cacheKey = `fixtures_${JSON.stringify(params)}`;
        cacheDuration = 120; // 2 minutes
        break;

      case 'fixture-stats':
        apiUrl = 'https://v3.football.api-sports.io/fixtures/statistics';
        cacheKey = `fixture_stats_${JSON.stringify(params)}`;
        cacheDuration = 180; // 3 minutes
        break;

      case 'odds-pre':
        apiUrl = 'https://v3.football.api-sports.io/odds';
        cacheKey = `odds_pre_${JSON.stringify(params)}`;
        cacheDuration = 900; // 15 minutes
        break;

      case 'odds-live':
        apiUrl = 'https://v3.football.api-sports.io/odds/live';
        cacheKey = `odds_live_${JSON.stringify(params)}`;
        cacheDuration = 30; // 30 seconds
        break;

      case 'topscorers':
      case 'topyellowcards':  
      case 'topredcards':
        // Smart caching: 5 minutes during match days, 15 minutes otherwise
        const isActiveMatchDay = isMatchDay() && hasActiveMatches();
        
        if (endpoint === 'topscorers') {
          apiUrl = 'https://v3.football.api-sports.io/players/topscorers';
          cacheKey = `topscorers_${JSON.stringify(params)}`;
        } else if (endpoint === 'topyellowcards') {
          apiUrl = 'https://v3.football.api-sports.io/players/topyellowcards';
          cacheKey = `topyellowcards_${JSON.stringify(params)}`;
        } else if (endpoint === 'topredcards') {
          apiUrl = 'https://v3.football.api-sports.io/players/topredcards';
          cacheKey = `topredcards_${JSON.stringify(params)}`;
        }
        
        cacheDuration = isActiveMatchDay ? 300 : 900; // 5 or 15 minutes
        break;

      case 'odds-bookmakers':
        apiUrl = 'https://v3.football.api-sports.io/odds/bookmakers';
        cacheKey = `odds_bookmakers_${JSON.stringify(params)}`;
        cacheDuration = 86400; // 24 hours
        break;

      case 'odds-bets':
        apiUrl = 'https://v3.football.api-sports.io/odds/bets';
        cacheKey = `odds_bets_${JSON.stringify(params)}`;
        cacheDuration = 86400; // 24 hours
        break;

      default:
        throw new Error(`Unknown endpoint: ${endpoint}`);
    }

    // Helper function to make API call with caching
    const makeApiCall = async (callParams: any, callCacheKey: string) => {
      // Check cache first
      const { data: cachedData } = await supabase
        .from('api_cache')
        .select('*')
        .eq('cache_key', callCacheKey)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (cachedData) {
        console.log(`[API-Sports] Cache hit for ${callCacheKey}`);
        return {
          ok: true,
          data: cachedData.data,
          cached: true,
          meta: {
            lastUpdate: cachedData.created_at || cachedData.updated_at,
            cacheExpiry: cachedData.expires_at
          }
        };
      }

      // Build API URL with parameters
      const apiUrlWithParams = new URL(apiUrl);
      Object.entries(callParams).forEach(([key, value]) => {
        if (value && key !== 'endpoint') {
          apiUrlWithParams.searchParams.set(key, value as string);
        }
      });

      // Call API-Sports
      console.log(`[API-Sports] Making API call to: ${apiUrlWithParams.toString()}`);
      
      const response = await fetch(apiUrlWithParams.toString(), {
        headers: {
          'x-apisports-key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`API-Sports error: ${response.status} ${response.statusText}`);
      }

      const apiData: ApiSportsResponse = await response.json();

      // Check for API errors
      if (apiData.errors && apiData.errors.length > 0) {
        console.error('[API-Sports] API returned errors:', apiData.errors);
        throw new Error(apiData.errors.join(', '));
      }

      // Cache the result
      const expiresAt = new Date(Date.now() + cacheDuration * 1000);
      await supabase
        .from('api_cache')
        .upsert({
          cache_key: callCacheKey,
          data: apiData.response,
          expires_at: expiresAt.toISOString(),
          endpoint,
          params: callParams
        });

      // Log rate limit info
      const remaining = response.headers.get('X-RateLimit-Remaining');
      const limit = response.headers.get('X-RateLimit-Limit');
      console.log(`[API-Sports] Rate limit: ${remaining}/${limit} remaining`);

      return {
        ok: true,
        data: apiData.response,
        cached: false,
        results: apiData.results,
        rateLimit: {
          remaining: remaining ? parseInt(remaining) : null,
          limit: limit ? parseInt(limit) : null
        }
      };
    };

    // Enhanced fallback logic for season-based endpoints
    const seasonEndpoints = ['topscorers', 'topyellowcards', 'topredcards'];
    let finalResult;
    let usedFallback = false;

    if (seasonEndpoints.includes(endpoint) && params.season) {
      const leagueId = params.league?.toString() || '71';
      const { fallback: fallbackSeason } = getSeasonForLeague(leagueId);
      const primarySeason = params.season;
      
      // Try primary season first
      const primaryResult = await makeApiCall(params, cacheKey);
      
      // If no data with primary season and it's different from fallback, try fallback
      if (primaryResult.data && Array.isArray(primaryResult.data) && 
          primaryResult.data.length === 0 && fallbackSeason !== primarySeason) {
        console.log(`[API-Sports] No data for season ${primarySeason}, trying intelligent fallback ${fallbackSeason}`);
        
        const fallbackParams = { ...params, season: fallbackSeason };
        const fallbackCacheKey = `${endpoint}_${JSON.stringify(fallbackParams)}`;
        
        try {
          const fallbackResult = await makeApiCall(fallbackParams, fallbackCacheKey);
          
          if (fallbackResult.data && Array.isArray(fallbackResult.data) && fallbackResult.data.length > 0) {
            console.log(`[API-Sports] Using intelligent fallback season ${fallbackSeason} data`);
            finalResult = fallbackResult;
            usedFallback = true;
          } else {
            finalResult = primaryResult;
          }
        } catch (error) {
          console.log(`[API-Sports] Fallback season ${fallbackSeason} also failed, using primary result`);
          finalResult = primaryResult;
        }
      } else {
        finalResult = primaryResult;
      }
    } else {
      // For non-season endpoints, use regular API call
      finalResult = await makeApiCall(params, cacheKey);
    }

    // Return formatted response
    return new Response(
      JSON.stringify({
        ok: true,
        data: finalResult.data,
        meta: {
          cached: finalResult.cached || false,
          endpoint,
          params,
          results: finalResult.results,
          lastUpdate: finalResult.cached ? finalResult.meta?.lastUpdate : new Date().toISOString(),
          cacheExpiry: finalResult.cached ? finalResult.meta?.cacheExpiry : new Date(Date.now() + cacheDuration * 1000).toISOString(),
          rateLimit: finalResult.rateLimit,
          usedFallback: usedFallback,
          season: usedFallback ? getSeasonForLeague(params.league?.toString() || '71').fallback : params.season
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[API-Sports] Error:', error);
    
    return new Response(
      JSON.stringify({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});