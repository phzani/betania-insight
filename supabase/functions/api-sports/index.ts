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

    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint');
    const params = Object.fromEntries(url.searchParams.entries());
    delete params.endpoint;

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

      default:
        throw new Error(`Unknown endpoint: ${endpoint}`);
    }

    // Check cache first
    const { data: cachedData } = await supabase
      .from('api_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (cachedData) {
      console.log(`[API-Sports] Cache hit for ${cacheKey}`);
      return new Response(
        JSON.stringify({
          ok: true,
          data: cachedData.data,
          meta: {
            cached: true,
            endpoint,
            params
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Build API URL with parameters
    const apiUrlWithParams = new URL(apiUrl);
    Object.entries(params).forEach(([key, value]) => {
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
      return new Response(
        JSON.stringify({
          ok: false,
          error: {
            code: 'API_ERROR',
            message: apiData.errors.join(', ')
          },
          meta: { endpoint, params }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Cache the result
    const expiresAt = new Date(Date.now() + cacheDuration * 1000);
    await supabase
      .from('api_cache')
      .upsert({
        cache_key: cacheKey,
        data: apiData.response,
        expires_at: expiresAt.toISOString(),
        endpoint,
        params
      });

    // Log rate limit info
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const limit = response.headers.get('X-RateLimit-Limit');
    console.log(`[API-Sports] Rate limit: ${remaining}/${limit} remaining`);

    // Return formatted response
    return new Response(
      JSON.stringify({
        ok: true,
        data: apiData.response,
        meta: {
          cached: false,
          endpoint,
          params,
          results: apiData.results,
          rateLimit: {
            remaining: remaining ? parseInt(remaining) : null,
            limit: limit ? parseInt(limit) : null
          }
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