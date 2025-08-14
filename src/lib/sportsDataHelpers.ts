import { Fixture, League, Team, Odds, LiveGame, HotOdd, TopPerformer } from '@/types/sports';
import { format, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Brazilian leagues IDs
export const BRAZILIAN_LEAGUES = {
  SERIE_A: 71,
  SERIE_B: 72,
  COPA_BRASIL: 73,
  LIBERTADORES: 13
} as const;

// Team name mappings for better display
export const TEAM_DISPLAY_NAMES: Record<string, string> = {
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
  'Atlético-MG': 'CAM',
  'Bragantino': 'BGT',
  'Ceará': 'CEA',
  'Coritiba': 'COR',
  'Cuiabá': 'CUI',
  'Fortaleza': 'FOR',
  'Goiás': 'GOI',
  'Juventude': 'JUV',
  'Sport': 'SPT'
};

/**
 * Formats team name for display in widgets
 */
export function formatTeamName(name: string, short: boolean = false): string {
  if (!name) return 'N/A';
  
  if (short) {
    return TEAM_DISPLAY_NAMES[name] || name.substring(0, 3).toUpperCase();
  }
  
  return name;
}

/**
 * Formats fixture time for display
 */
export function formatFixtureTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  
  if (isToday(date)) {
    return format(date, 'HH:mm', { locale: ptBR });
  }
  
  if (isTomorrow(date)) {
    return `Amanhã ${format(date, 'HH:mm', { locale: ptBR })}`;
  }
  
  return format(date, 'dd/MM HH:mm', { locale: ptBR });
}

/**
 * Gets fixture status in Portuguese
 */
export function getFixtureStatus(fixture: Fixture): {
  status: string;
  isLive: boolean;
  isFinished: boolean;
  isScheduled: boolean;
} {
  const status = fixture.fixture.status.short;
  const elapsed = fixture.fixture.status.elapsed;
  
  switch (status) {
    case 'NS': // Not Started
      return {
        status: formatFixtureTime(fixture.fixture.date),
        isLive: false,
        isFinished: false,
        isScheduled: true
      };
    case '1H': // First Half
    case '2H': // Second Half
    case 'HT': // Half Time
      return {
        status: `${elapsed || 0}'`,
        isLive: true,
        isFinished: false,
        isScheduled: false
      };
    case 'FT': // Full Time
    case 'AET': // After Extra Time
    case 'PEN': // Penalty
      return {
        status: 'Encerrado',
        isLive: false,
        isFinished: true,
        isScheduled: false
      };
    case 'CANC': // Cancelled
      return {
        status: 'Cancelado',
        isLive: false,
        isFinished: true,
        isScheduled: false
      };
    case 'SUSP': // Suspended
      return {
        status: 'Suspenso',
        isLive: false,
        isFinished: false,
        isScheduled: false
      };
    default:
      return {
        status: 'Agendado',
        isLive: false,
        isFinished: false,
        isScheduled: true
      };
  }
}

/**
 * Converts API fixtures to LiveGame format for widgets
 */
export function convertFixturesToLiveGames(fixtures: Fixture[]): LiveGame[] {
  return fixtures
    .filter(fixture => {
      const fixtureStatus = getFixtureStatus(fixture);
      return fixtureStatus.isLive;
    })
    .map(fixture => {
      const fixtureStatus = getFixtureStatus(fixture);
      return {
        id: fixture.fixture.id,
        home: fixture.teams.home.name,
        away: fixture.teams.away.name,
        homeScore: fixture.goals.home,
        awayScore: fixture.goals.away,
        minute: fixture.fixture.status.elapsed || 0,
        status: fixtureStatus.status,
        odds: undefined // Will be populated from odds data
      };
    });
}

/**
 * Processes odds data to extract hot odds with real market data
 */
export function processOddsData(odds: Odds[], fixtures: Fixture[]): HotOdd[] {
  const hotOdds: HotOdd[] = [];
  
  odds.forEach(odd => {
    const fixture = fixtures.find(f => f.fixture.id === odd.fixture.id);
    if (!fixture) return;
    
    const matchName = `${formatTeamName(fixture.teams.home.name, true)} x ${formatTeamName(fixture.teams.away.name, true)}`;
    
    odd.bookmakers.forEach(bookmaker => {
      bookmaker.bets.forEach(bet => {
        if (bet.name === 'Match Winner' && bet.values.length >= 3) {
          const homeOdd = parseFloat(bet.values[0].odd);
          const drawOdd = parseFloat(bet.values[1].odd);
          const awayOdd = parseFloat(bet.values[2].odd);
          
          // Add different markets for variety
          [
            { market: 'Casa vence', odds: homeOdd },
            { market: 'Empate', odds: drawOdd },
            { market: 'Visitante vence', odds: awayOdd }
          ].forEach(({ market, odds: marketOdds }) => {
            if (marketOdds >= 1.5 && marketOdds <= 5.0) { // Only interesting odds
              hotOdds.push({
                fixtureId: odd.fixture.id,
                match: matchName,
                market,
                odds: marketOdds,
                change: 0, // Will be calculated from historical data in future
                trend: marketOdds < 2.0 ? 'down' : 'up', // Favorites trending down, underdogs up
                bookmaker: bookmaker.name
              });
            }
          });
        }
        
        // Add Over/Under markets if available
        if (bet.name.includes('Goals Over/Under') && bet.values.length >= 2) {
          bet.values.forEach((value, index) => {
            const odds = parseFloat(value.odd);
            if (odds >= 1.5 && odds <= 4.0) {
              hotOdds.push({
                fixtureId: odd.fixture.id,
                match: matchName,
                market: value.value.includes('Over') ? `Over ${value.value.match(/\d+\.?\d*/)?.[0]} gols` : `Under ${value.value.match(/\d+\.?\d*/)?.[0]} gols`,
                odds,
                change: 0,
                trend: index % 2 === 0 ? 'up' : 'down',
                bookmaker: bookmaker.name
              });
            }
          });
        }
      });
    });
  });
  
  return hotOdds
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change)) // Sort by biggest changes
    .slice(0, 6); // Limit to top 6
}

/**
 * Map API top scorers to TopPerformer[]
 */
export function mapTopScorersToPerformers(items: any[]): TopPerformer[] {
  if (!Array.isArray(items)) return [];
  const performers: TopPerformer[] = [];
  items.forEach((item) => {
    const player = item.player;
    const stats = Array.isArray(item.statistics) ? item.statistics[0] : undefined;
    const teamName = stats?.team?.name || '—';
    const goals = stats?.goals?.total ?? 0;
    performers.push({
      playerId: player?.id,
      name: player?.name || 'Jogador',
      team: teamName,
      stat: `${goals} gols`,
      value: goals,
      performance: Math.min(100, 50 + (goals || 0) * 5)
    });
  });
  return performers.sort((a,b) => b.value - a.value).slice(0, 10);
}

// Removed fallback generator - using only real API data


/**
 * Filters fixtures by date range
 */
export function filterFixturesByDate(fixtures: Fixture[], dateRange: 'today' | 'tomorrow' | 'week'): Fixture[] {
  const now = new Date();
  
  return fixtures.filter(fixture => {
    const fixtureDate = new Date(fixture.fixture.date);
    
    switch (dateRange) {
      case 'today':
        return isToday(fixtureDate);
      case 'tomorrow':
        return isTomorrow(fixtureDate);
      case 'week':
        const weekFromNow = new Date();
        weekFromNow.setDate(now.getDate() + 7);
        return fixtureDate >= now && fixtureDate <= weekFromNow;
      default:
        return false;
    }
  });
}

/**
 * Gets league emoji/flag for display
 */
export function getLeagueEmoji(leagueId: number): string {
  switch (leagueId) {
    case BRAZILIAN_LEAGUES.SERIE_A:
      return '🇧🇷';
    case BRAZILIAN_LEAGUES.SERIE_B:
      return '🇧🇷';
    case BRAZILIAN_LEAGUES.COPA_BRASIL:
      return '🏆';
    case BRAZILIAN_LEAGUES.LIBERTADORES:
      return '🌎';
    default:
      return '⚽';
  }
}

/**
 * Calculates team form from recent results
 */
export function calculateForm(results: string[]): {
  form: string;
  percentage: number;
  trend: 'good' | 'average' | 'poor';
} {
  if (!results.length) {
    return { form: '-', percentage: 0, trend: 'average' };
  }
  
  const wins = results.filter(r => r === 'W').length;
  const draws = results.filter(r => r === 'D').length;
  const percentage = Math.round(((wins * 3 + draws) / (results.length * 3)) * 100);
  
  let trend: 'good' | 'average' | 'poor' = 'average';
  if (percentage >= 70) trend = 'good';
  else if (percentage < 40) trend = 'poor';
  
  return {
    form: results.join(''),
    percentage,
    trend
  };
}

/**
 * Validates and cleans sports data
 */
export function validateSportsData<T>(data: any): T[] {
  if (!Array.isArray(data)) {
    console.warn('[SportsDataHelpers] Expected array, got:', typeof data);
    return [];
  }
  
  return data.filter(item => item && typeof item === 'object');
}