import { useState, useEffect, useCallback } from 'react';
const SUPABASE_URL = 'https://skeauyjradscjgfebkqa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrZWF1eWpyYWRzY2pnZmVia3FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNTg3MjAsImV4cCI6MjA3MDYzNDcyMH0.jdVE76iSSqfJkc_3OhrIH1K538w-Vfip3WIbK972VQ8';
import { 
  LiveSportsData, 
  Fixture, 
  League, 
  Team, 
  Odds,
  LiveGame,
  HotOdd,
  TopPerformer
} from '@/types/sports';
import { 
  convertFixturesToLiveGames, 
  processOddsData, 
  generateTopPerformers,
  filterFixturesByDate,
  validateSportsData,
  BRAZILIAN_LEAGUES
} from '@/lib/sportsDataHelpers';
import { getMockSportsData } from '@/lib/mockSportsData';
import { useFilterStore } from '@/stores/filterStore';

interface UseLiveSportsDataResult {
  fixtures: Fixture[];
  leagues: League[];
  teams: Team[];
  odds: Odds[];
  teamStats: any[];
  topScorers: TopPerformer[];
  topYellowCards: TopPerformer[];
  topRedCards: TopPerformer[];
  lastUpdate: Date;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshing: boolean;
}

/**
 * Comprehensive hook for live sports data with real-time updates
 */
export function useLiveSportsData(): UseLiveSportsDataResult {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [odds, setOdds] = useState<Odds[]>([]);
  const [teamStats, setTeamStats] = useState<any[]>([]);
  const [topScorers, setTopScorers] = useState<TopPerformer[]>([]);
  const [topYellowCards, setTopYellowCards] = useState<TopPerformer[]>([]);
  const [topRedCards, setTopRedCards] = useState<TopPerformer[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Get selected league from filter store
  const { selectedLeague } = useFilterStore();

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const currentLeague = selectedLeague || BRAZILIAN_LEAGUES.SERIE_A;
      console.log(`[LiveSportsData] Starting data fetch for league: ${currentLeague}...`);

      const today = new Date().toISOString().split('T')[0];
      const currentSeason = new Date().getFullYear();

      // Helper to call Edge Function with GET
      const callApi = (p: Record<string, any>) => {
        const url = new URL(`${SUPABASE_URL}/functions/v1/api-sports`);
        Object.entries(p).forEach(([k, v]) => {
          if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
        });
        return fetch(url.toString(), {
          method: 'GET',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            'content-type': 'application/json'
          }
        }).then(r => r.json());
      };

      // Parallel API calls for better performance - using selected league
      const [
        todayFixturesResult,
        liveFixturesResult,
        brazilianLeaguesResult,
        preOddsResult,
        serieATeamsResult,
        topScorersResult,
        topYellowCardsResult,
        topRedCardsResult
      ] = await Promise.allSettled([
        callApi({ endpoint: 'fixtures', date: today, league: currentLeague, season: currentSeason }),
        callApi({ endpoint: 'fixtures', live: 'all', league: currentLeague, season: currentSeason }),
        callApi({ endpoint: 'leagues', country: 'Brazil' }),
        callApi({ endpoint: 'odds-pre', league: currentLeague, season: currentSeason }),
        callApi({ endpoint: 'teams', league: currentLeague, season: currentSeason }),
        callApi({ endpoint: 'topscorers', league: currentLeague, season: currentSeason }),
        callApi({ endpoint: 'topyellowcards', league: currentLeague, season: currentSeason }),
        callApi({ endpoint: 'topredcards', league: currentLeague, season: currentSeason }),
      ]);

      // Process results with error handling
      const processResult = (result: any, fallback: any[] = []) => {
        if (result.status === 'fulfilled') {
          const apiResponse = result.value;
          // Shape: { ok, data } from Edge Function
          if (apiResponse?.ok && Array.isArray(apiResponse.data)) {
            return validateSportsData(apiResponse.data);
          }
          // In case some call returned raw array
          if (Array.isArray(apiResponse)) {
            return validateSportsData(apiResponse);
          }
        }
        if (result.status === 'rejected') {
          console.warn('[LiveSportsData] API call rejected:', result.reason);
        } else {
          console.warn('[LiveSportsData] API call failed or returned invalid data:', {
            status: result.status,
            hasValue: !!result.value,
            hasData: Array.isArray(result.value?.data),
            error: result.value?.error
          });
        }
        return fallback;
      };

      const processedTodayFixtures = processResult(todayFixturesResult) as Fixture[];
      const processedLiveFixtures = processResult(liveFixturesResult) as Fixture[];
      const processedLeagues = processResult(brazilianLeaguesResult) as League[];
      const processedOdds = processResult(preOddsResult) as Odds[];
      const processedTeams = processResult(serieATeamsResult) as Team[];
      const topScorersRaw = processResult(topScorersResult) as any[];
      const topYellowCardsRaw = processResult(topYellowCardsResult) as any[];
      const topRedCardsRaw = processResult(topRedCardsResult) as any[];

      // Combine all fixtures (remove duplicates)
      const allFixtures = [...processedTodayFixtures];
      processedLiveFixtures.forEach(liveFixture => {
        if (!allFixtures.find(f => f.fixture.id === liveFixture.fixture.id)) {
          allFixtures.push(liveFixture);
        }
      });

      // Process top performers data
      const processedTopScorers = topScorersRaw.slice(0, 10).map((player: any) => ({
        name: player.player?.name || 'Unknown',
        team: player.statistics?.[0]?.team?.name || 'Unknown',
        stat: 'goals',
        value: player.statistics?.[0]?.goals?.total || 0,
        performance: Math.min(((player.statistics?.[0]?.goals?.total || 0) / 20) * 100, 100)
      }));

      const processedTopYellowCards = topYellowCardsRaw.slice(0, 10).map((player: any) => ({
        name: player.player?.name || 'Unknown',
        team: player.statistics?.[0]?.team?.name || 'Unknown',
        stat: 'yellow_cards',
        value: player.statistics?.[0]?.cards?.yellow || 0,
        performance: Math.min(((player.statistics?.[0]?.cards?.yellow || 0) / 10) * 100, 100)
      }));

      const processedTopRedCards = topRedCardsRaw.slice(0, 10).map((player: any) => ({
        name: player.player?.name || 'Unknown',
        team: player.statistics?.[0]?.team?.name || 'Unknown',
        stat: 'red_cards',
        value: player.statistics?.[0]?.cards?.red || 0,
        performance: Math.min(((player.statistics?.[0]?.cards?.red || 0) / 5) * 100, 100)
      }));

      console.log('[LiveSportsData] Setting processed data');
      setFixtures(allFixtures);
      setLeagues(processedLeagues);
      setTeams(processedTeams);
      setOdds(processedOdds);
      setTopScorers(processedTopScorers);
      setTopYellowCards(processedTopYellowCards);
      setTopRedCards(processedTopRedCards);
      setLastUpdate(new Date());
      setError(null);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados esportivos';
      console.error('[LiveSportsData] Error:', errorMessage);
      setError(`API indisponível: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [selectedLeague]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  }, [fetchAllData]);

  // Initial load and refresh when league changes
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Auto-refresh every 2 minutes for current league
  useEffect(() => {
    const interval = setInterval(() => {
      console.log(`[LiveSportsData] Auto-refresh triggered for league: ${selectedLeague}`);
      fetchAllData();
    }, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchAllData, selectedLeague]);

  return {
    fixtures,
    leagues,
    teams,
    odds,
    teamStats,
    topScorers,
    topYellowCards,
    topRedCards,
    lastUpdate,
    loading,
    error,
    refresh,
    refreshing
  };
}

/**
 * Hook specifically for widget data processing
 */
export function useWidgetData() {
  const sportsData = useLiveSportsData();
  const { updateData, selectedLeague } = useFilterStore();

  useEffect(() => {
    if (sportsData.fixtures.length > 0) {
      updateData(sportsData.fixtures, sportsData.leagues, sportsData.teams);
    }
  }, [sportsData.fixtures, sportsData.leagues, sportsData.teams, updateData]);
  
  // Process live games from fixtures - filtered by selected league
  const liveGames = sportsData.fixtures
    .filter(f => {
      const isLive = ['1H', '2H', 'HT', 'LIVE'].includes(f.fixture.status.short);
      const matchesLeague = !selectedLeague || f.league.id === selectedLeague;
      return isLive && matchesLeague;
    })
    .map(f => ({
      id: f.fixture.id,
      home: f.teams.home.name,
      away: f.teams.away.name,
      homeScore: f.goals.home,
      awayScore: f.goals.away,
      minute: f.fixture.status.elapsed || 0,
      status: f.fixture.status.short,
      odds: undefined // Would need odds processing
    }));

  const todayFixtures = sportsData.fixtures.filter(f => {
    const today = new Date().toISOString().split('T')[0];
    return f.fixture.date.startsWith(today);
  });

  const tomorrowFixtures = sportsData.fixtures.filter(f => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    return f.fixture.date.startsWith(tomorrowStr);
  });

  const hotOdds: HotOdd[] = []; // Would need odds processing

  return {
    liveGames,
    todayFixtures,
    tomorrowFixtures,
    hotOdds,
    topPerformers: sportsData.topScorers,
    topYellowCards: sportsData.topYellowCards,
    topRedCards: sportsData.topRedCards,
    loading: sportsData.loading,
    error: sportsData.error,
    lastUpdate: sportsData.lastUpdate,
    refresh: sportsData.refresh
  };
}

/**
 * Helper functions for formatted data
 */
export function getMatchTime(fixtureDate: string | Date): string {
  const date = new Date(fixtureDate);
  const now = new Date();
  
  const diffInMs = date.getTime() - now.getTime();
  const diffInHours = Math.round(diffInMs / (1000 * 60 * 60));
  
  if (diffInHours < 0) {
    const absDiffInHours = Math.abs(diffInHours);
    if (absDiffInHours < 1) {
      return 'Agora';
    } else if (absDiffInHours < 24) {
      return `${absDiffInHours}h atrás`;
    } else {
      return 'Encerrado';
    }
  } else if (diffInHours === 0) {
    return 'Agora';
  } else if (diffInHours < 24) {
    return `Em ${diffInHours}h`;
  } else {
    const diffInDays = Math.round(diffInHours / 24);
    return `Em ${diffInDays}d`;
  }
}

export function formatTeamName(name: string, maxLength: number = 12): string {
  if (!name) return 'N/A';
  
  if (name.length <= maxLength) {
    return name;
  }
  
  // Common team abbreviations
  const abbreviations: Record<string, string> = {
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
    'Atlético-MG': 'CAM'
  };
  
  return abbreviations[name] || name.substring(0, maxLength - 3) + '...';
}