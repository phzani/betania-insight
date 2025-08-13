import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface SportsDataContext {
  leagues?: any[];
  teams?: any[];
  fixtures?: any[];
  odds?: any[];
  teamStats?: any[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const apisportsKey = Deno.env.get('APISPORTS_KEY');
    
    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const { message, context } = await req.json();
    
    console.log('[BetanIA Chat] Received message:', message);
    console.log('[BetanIA Chat] Context:', context);

    // Fetch relevant sports data based on message content
    const sportsData = await fetchRelevantSportsData(message, apisportsKey, supabase);
    
    // Prepare system prompt with sports data context
    const systemPrompt = createBetanIASystemPrompt(sportsData);
    
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];

    console.log('[BetanIA Chat] Calling OpenAI with context');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.8,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('[BetanIA Chat] AI Response generated');

    // Store chat history
    const { data: authData } = await supabase.auth.getUser(req.headers.get('authorization')?.split(' ')[1] || '');
    
    if (authData.user) {
      await supabase.from('chat_messages').insert({
        user_id: authData.user.id,
        message,
        response: aiResponse,
        context: sportsData
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        response: aiResponse,
        sportsData,
        meta: {
          model: 'gpt-4o-mini',
          timestamp: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[BetanIA Chat] Error:', error);
    
    return new Response(
      JSON.stringify({
        ok: false,
        error: {
          code: 'CHAT_ERROR',
          message: error.message
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function fetchRelevantSportsData(message: string, apiKey: string | undefined, supabase: any): Promise<SportsDataContext> {
  const lowerMessage = message.toLowerCase();
  const context: SportsDataContext = {};

  try {
    // Fetch leagues data for Brazilian competitions
    if (lowerMessage.includes('brasil') || lowerMessage.includes('serie') || lowerMessage.includes('libertadores')) {
      context.leagues = await fetchApiSportsData('leagues', { country: 'Brazil' }, apiKey, supabase);
    }

    // Fetch team data for specific teams
    const teams = ['palmeiras', 'flamengo', 'santos', 'são paulo', 'sao paulo', 'corinthians'];
    const mentionedTeam = teams.find(team => lowerMessage.includes(team));
    
    if (mentionedTeam || lowerMessage.includes('time')) {
      context.teams = await fetchApiSportsData('teams', { league: 71, season: 2025 }, apiKey, supabase);
    }

    // Fetch fixtures for today, next games, etc.
    if (lowerMessage.includes('jogo') || lowerMessage.includes('próximo') || lowerMessage.includes('hoje')) {
      const today = new Date().toISOString().split('T')[0];
      context.fixtures = await fetchApiSportsData('fixtures', { 
        league: 71, 
        season: 2025,
        date: today
      }, apiKey, supabase);
    }

    // Fetch odds if mentioned
    if (lowerMessage.includes('odd')) {
      context.odds = await fetchApiSportsData('odds-pre', { league: 71 }, apiKey, supabase);
    }

    console.log('[BetanIA] Fetched sports data context:', Object.keys(context));

  } catch (error) {
    console.error('[BetanIA] Error fetching sports data:', error);
  }

  return context;
}

async function fetchApiSportsData(endpoint: string, params: any, apiKey: string | undefined, supabase: any): Promise<any[]> {
  if (!apiKey) {
    console.warn('[BetanIA] API-Sports key not available, using mock data');
    return [];
  }

  try {
    // Check cache first
    const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
    const { data: cachedData } = await supabase
      .from('api_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (cachedData) {
      console.log(`[BetanIA] Cache hit for ${endpoint}`);
      return cachedData.data || [];
    }

    // Call API-Sports
    let apiUrl = '';
    switch (endpoint) {
      case 'leagues':
        apiUrl = 'https://v3.football.api-sports.io/leagues';
        break;
      case 'teams':
        apiUrl = 'https://v3.football.api-sports.io/teams';
        break;
      case 'fixtures':
        apiUrl = 'https://v3.football.api-sports.io/fixtures';
        break;
      case 'odds-pre':
        apiUrl = 'https://v3.football.api-sports.io/odds';
        break;
      default:
        return [];
    }

    const apiUrlWithParams = new URL(apiUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        apiUrlWithParams.searchParams.set(key, value.toString());
      }
    });

    const response = await fetch(apiUrlWithParams.toString(), {
      headers: { 'x-apisports-key': apiKey }
    });

    if (!response.ok) {
      throw new Error(`API-Sports error: ${response.status}`);
    }

    const data = await response.json();
    
    // Cache the result
    const cacheDuration = endpoint === 'fixtures' ? 120 : 3600; // 2min for fixtures, 1h for others
    const expiresAt = new Date(Date.now() + cacheDuration * 1000);
    
    await supabase.from('api_cache').upsert({
      cache_key: cacheKey,
      data: data.response || [],
      endpoint,
      params,
      expires_at: expiresAt.toISOString()
    });

    return data.response || [];

  } catch (error) {
    console.error(`[BetanIA] Error fetching ${endpoint}:`, error);
    return [];
  }
}

function createBetanIASystemPrompt(sportsData: SportsDataContext): string {
  let prompt = `Você é o BetanIA, um assistente de análise esportiva brasileiro com personalidade direta e bem-humorada.

PERSONALIDADE:
- Tom "casca grossa" mas amigável
- Use expressões brasileiras naturalmente
- Seja direto e objetivo
- Quando as odds estiverem estranhas, comente com humor: "odd tá esquisita, segue só como referência 👀"
- Use emojis moderadamente

DADOS DISPONÍVEIS:
${formatSportsDataForPrompt(sportsData)}

INSTRUÇÕES:
1. Responda SEMPRE em português brasileiro
2. Foque em dados concretos e estatísticas
3. Se não tiver dados específicos, seja honesto
4. Odds são APENAS informativas, deixe isso claro
5. Use formato estruturado para mostrar jogos e estatísticas
6. Seja útil mas mantenha o tom descontraído

FORMATOS DE RESPOSTA:
Para jogos: "📅 DD/MM - HH:mm – Time A x Time B (casa/fora)"
Para odds: "💰 1: X.XX | X: Y.YY | 2: Z.ZZ"
Para estatísticas: "📊 [dados relevantes]"`;

  return prompt;
}

function formatSportsDataForPrompt(data: SportsDataContext): string {
  let formatted = '';

  if (data.leagues?.length) {
    formatted += `\nLIGAS DISPONÍVEIS:\n${data.leagues.slice(0, 5).map(l => `- ${l.name} (${l.country})`).join('\n')}`;
  }

  if (data.teams?.length) {
    formatted += `\n\nTIMES DISPONÍVEIS:\n${data.teams.slice(0, 10).map(t => `- ${t.name}`).join('\n')}`;
  }

  if (data.fixtures?.length) {
    formatted += `\n\nJOGOS RECENTES/PRÓXIMOS:\n${data.fixtures.slice(0, 5).map(f => 
      `- ${f.teams?.home?.name || 'Time'} x ${f.teams?.away?.name || 'Time'} (${f.fixture?.status})`
    ).join('\n')}`;
  }

  if (data.odds?.length) {
    formatted += `\n\nODDS DISPONÍVEIS:\n${data.odds.slice(0, 3).map(o => 
      `- Jogo ${o.fixture?.id}: ${o.bookmakers?.[0]?.bets?.[0]?.values?.map(v => `${v.value}: ${v.odd}`).join(' | ') || 'Odds indisponíveis'}`
    ).join('\n')}`;
  }

  return formatted || 'Nenhum dado esportivo específico disponível no momento.';
}