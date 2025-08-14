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
  topScorers?: any[];
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

    // Fetch relevant sports data based on message content and UI context
    const sportsData = await fetchRelevantSportsData(message, apisportsKey, supabase, context);
    
    
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

async function fetchRelevantSportsData(message: string, apiKey: string | undefined, supabase: any, uiContext?: any): Promise<SportsDataContext> {
  const lowerMessage = message.toLowerCase();
  const context: SportsDataContext = {};

  try {
    // Determine season dynamically
    const currentSeason = new Date().getFullYear();
    const leagueId = typeof uiContext?.selectedLeague === 'number' ? uiContext.selectedLeague : 71;
    const teamId = typeof uiContext?.selectedTeam === 'number' ? uiContext.selectedTeam : undefined;

    // Fetch leagues data for Brazilian competitions
    if (lowerMessage.includes('brasil') || lowerMessage.includes('serie') || lowerMessage.includes('libertadores')) {
      context.leagues = await fetchApiSportsData('leagues', { country: 'Brazil' }, apiKey, supabase);
    }

    // Fetch team data for specific teams
    const teams = ['palmeiras', 'flamengo', 'santos', 'são paulo', 'sao paulo', 'corinthians'];
    const mentionedTeam = teams.find(team => lowerMessage.includes(team));
    
    if (mentionedTeam || lowerMessage.includes('time')) {
      context.teams = await fetchApiSportsData('teams', { league: leagueId, season: currentSeason }, apiKey, supabase);
    }

    // Fetch fixtures for today, next games, etc.
    if (lowerMessage.includes('jogo') || lowerMessage.includes('próximo') || lowerMessage.includes('hoje')) {
      const today = new Date().toISOString().split('T')[0];
      const fixtureParams: any = { league: leagueId, season: currentSeason, date: today };
      if (teamId) fixtureParams.team = teamId;
      context.fixtures = await fetchApiSportsData('fixtures', fixtureParams, apiKey, supabase);
    }

  // Fetch odds if mentioned
  if (lowerMessage.includes('odd')) {
    context.odds = await fetchApiSportsData('odds-pre', { league: leagueId, season: currentSeason }, apiKey, supabase);
  }

  // Fetch top scorers when relevant
  if (lowerMessage.includes('artilheiro') || lowerMessage.includes('artilheiros') || lowerMessage.includes('gols')) {
    context.topScorers = await fetchApiSportsData('topscorers', { league: leagueId, season: currentSeason }, apiKey, supabase);
  }

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
      case 'topscorers':
        apiUrl = 'https://v3.football.api-sports.io/players/topscorers';
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
  let prompt = `Você é a BetanIA, uma assistente de análise esportiva brasileira com personalidade provocante, divertida e cheia de charme feminino.

PERSONALIDADE:
- Seja uma mulher confiante, esperta e provocativa de forma carinhosa
- Use toques femininos mas sem ser delicada demais - seja uma "mina descolada"
- Faça piadinhas espirituosas e comentários provocativos sobre os times e jogadores
- Use expressões como "gatinho", "amor", "querido" ocasionalmente para temperar
- Seja bem-humorada com rivalidades entre times: "Ah, é palmeirense né? Coitadinho 😏"
- Quando as odds estão estranhas: "Essa odd tá mais perdida que corintiano na Libertadores, hein amor? 🤭"
- Faça brincadeiras inteligentes sobre futebol e apostas
- Use um tom confiante como quem entende do assunto mas de forma sedutora e divertida

ESTILO DE COMUNICAÇÃO:
- Tom provocativo mas educado - uma mulher que sabe o que fala
- Misture conhecimento técnico com charme e humor
- Faça comentários picantes sobre times rivais de forma espirituosa
- Use emojis femininos e expressivos: 😏 💅 😘 🔥 💋 ✨
- Seja carinhosa mas mantenha a autoridade sobre futebol

DADOS DISPONÍVEIS:
${formatSportsDataForPrompt(sportsData)}

INSTRUÇÕES:
1. Responda SEMPRE em português brasileiro
2. Combine análise técnica com personalidade provocante e feminina
3. Faça piadas sobre times e situações do futebol brasileiro
4. Odds são informativas, mas comente com humor próprio
5. Use formato atrativo para mostrar jogos e estatísticas
6. Seja sedutora intelectualmente - mostre que entende de futebol

FORMATOS DE RESPOSTA:
Para jogos: "🔥 DD/MM - HH:mm – Time A x Time B (vamos ver quem é que pode, né?)"
Para odds: "💸 Casa: X.XX | Empate: Y.YY | Fora: Z.ZZ (mas cuidado com essas odds, gatinho)"
Para estatísticas: "📊 [dados + comentário provocativo]"

EXEMPLO DE TOM: "Olha só, querido, o Flamengo tá com uma defesa mais furada que peneira... mas o ataque compensa. Que nem relacionamento complicado, né? 😏🔥"`;

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

  if (data.topScorers?.length) {
    const lines = data.topScorers.slice(0, 5).map((it: any, idx: number) => {
      const player = it.player?.name || 'Jogador';
      const stats = Array.isArray(it.statistics) ? it.statistics[0] : undefined;
      const team = stats?.team?.name || '—';
      const goals = stats?.goals?.total ?? 0;
      return `- #${idx + 1} ${player} (${team}) – ${goals} gols`;
    });
    formatted += `\n\nARTILHEIROS:\n${lines.join('\n')}`;
  }

  return formatted || 'Nenhum dado esportivo específico disponível no momento.';
}