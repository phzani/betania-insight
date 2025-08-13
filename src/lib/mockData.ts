// Mock data for BetanIA while API integration is being set up
import { format, addDays, subDays } from 'date-fns';

export const mockLeagues = [
  {
    id: 71,
    name: "Serie A",
    country: "Brazil",
    logo: "https://media.api-sports.io/football/leagues/71.png",
    season: 2025,
    start_date: "2025-03-29",
    end_date: "2025-12-21",
    is_current: true
  },
  {
    id: 13,
    name: "CONMEBOL Libertadores",
    country: "World",
    logo: "https://media.api-sports.io/football/leagues/13.png",
    season: 2025,
    start_date: "2025-02-05",
    end_date: "2025-08-22",
    is_current: true
  }
];

export const mockTeams = [
  {
    id: 119,
    name: "Palmeiras",
    logo: "https://media.api-sports.io/football/teams/119.png",
    country: "Brazil",
    venue_name: "Allianz Parque"
  },
  {
    id: 127,
    name: "Flamengo",
    logo: "https://media.api-sports.io/football/teams/127.png",
    country: "Brazil",
    venue_name: "Maracanã"
  },
  {
    id: 126,
    name: "Santos",
    logo: "https://media.api-sports.io/football/teams/126.png",
    country: "Brazil",
    venue_name: "Vila Belmiro"
  },
  {
    id: 124,
    name: "São Paulo",
    logo: "https://media.api-sports.io/football/teams/124.png",
    country: "Brazil",
    venue_name: "Morumbi"
  }
];

export const mockFixtures = [
  {
    id: 1001,
    league_id: 71,
    season: 2025,
    fixture_date: addDays(new Date(), 2),
    home_team_id: 119,
    away_team_id: 126,
    status: 'scheduled',
    venue_name: "Allianz Parque",
    home_goals: null,
    away_goals: null,
    elapsed: null
  },
  {
    id: 1002,
    league_id: 71,
    season: 2025,
    fixture_date: new Date(),
    home_team_id: 127,
    away_team_id: 124,
    status: 'live',
    venue_name: "Maracanã",
    home_goals: 2,
    away_goals: 1,
    elapsed: 67
  },
  {
    id: 1003,
    league_id: 71,
    season: 2025,
    fixture_date: subDays(new Date(), 1),
    home_team_id: 124,
    away_team_id: 119,
    status: 'finished',
    venue_name: "Morumbi",
    home_goals: 1,
    away_goals: 3,
    elapsed: 90
  }
];

export const mockOdds = [
  {
    fixture_id: 1001,
    bookmaker: "Bet365",
    odds_type: "1X2",
    home_odds: 1.85,
    draw_odds: 3.40,
    away_odds: 4.20,
    is_live: false
  },
  {
    fixture_id: 1002,
    bookmaker: "Bet365",
    odds_type: "1X2",
    home_odds: 1.45,
    draw_odds: 4.20,
    away_odds: 6.80,
    is_live: true
  }
];

export const mockTeamStats = [
  {
    team_id: 119,
    league_id: 71,
    season: 2025,
    games_played: 15,
    wins: 10,
    draws: 3,
    losses: 2,
    goals_for: 28,
    goals_against: 12,
    yellow_cards: 25,
    red_cards: 2,
    form: "WWDWL"
  },
  {
    team_id: 127,
    league_id: 71,
    season: 2025,
    games_played: 15,
    wins: 9,
    draws: 4,
    losses: 2,
    goals_for: 30,
    goals_against: 15,
    yellow_cards: 28,
    red_cards: 1,
    form: "WLWWW"
  }
];

export const getBetanIAMockResponse = (query: string): string => {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('palmeiras')) {
    return `🏆 **Palmeiras - Próximos Jogos**\n\n• ${format(addDays(new Date(), 2), 'dd/MM - HH:mm')} – Santos (casa)\n   📊 Média: 2.1 gols pró | 0.9 contra | Form: WWDWL\n   💰 Odds: 1: 1.85 | X: 3.40 | 2: 4.20\n\nAlviverde tá numa boa, hein! 73% de aproveitamento em casa 🔥`;
  }
  
  if (lowerQuery.includes('jogos hoje') || lowerQuery.includes('hoje')) {
    return `⚽ **Jogos de Hoje - Brasileirão**\n\n🔴 **AO VIVO**: Flamengo 2x1 São Paulo (67')\n   📊 Fla dominando: 68% posse, 12 finalizações\n   💰 Odds: 1: 1.45 | X: 4.20 | 2: 6.80\n\nFlamengo tá encaixado! Odds do São Paulo tavam esquisitas no pré-jogo 👀`;
  }
  
  if (lowerQuery.includes('libertadores')) {
    return `🏆 **CONMEBOL Libertadores 2025**\n\nFase de grupos iniciando em fevereiro!\n\n🇧🇷 **Times brasileiros classificados:**\n• Palmeiras - Cabeça de chave\n• Flamengo - Pote 1\n• São Paulo - Pote 2\n\n📅 Sorteio: Janeiro 2025\n⚽ Início: 05/02/2025\n\nVai ser brabo! 🔥`;
  }
  
  const responses = [
    'Beleza! Deixa eu dar uma olhada nos dados aqui... 📊\n\nQue informação específica você tá procurando? Times, jogos, odds?',
    'Opa! 👋 Posso te ajudar com:\n• Próximos jogos dos times\n• Estatísticas e forma atual\n• Odds informativas (só referência!)\n• Libertadores e competições',
    'E aí! Tô aqui pra destrinchar os dados do futebol brasileiro 🇧🇷\n\nPergunta aí que vou te dar os números fresquinhos!',
    'Salve! 🤜🤛 Especialista em dados esportivos a seu dispor.\n\nQuer saber de algum time específico ou competição?'
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
};