// Mock data para desenvolvimento e demonstração
import { Fixture, Team, League, Odds } from '@/types/sports';

export const mockTeams: Team[] = [
  {
    id: 119,
    name: "Palmeiras",
    logo: "https://media.api-sports.io/football/teams/119.png",
    country: "Brazil",
    venue: {
      name: "Allianz Parque",
      capacity: 43713
    }
  },
  {
    id: 127,
    name: "Flamengo",
    logo: "https://media.api-sports.io/football/teams/127.png", 
    country: "Brazil",
    venue: {
      name: "Maracanã",
      capacity: 78838
    }
  },
  {
    id: 124,
    name: "São Paulo",
    logo: "https://media.api-sports.io/football/teams/124.png",
    country: "Brazil",
    venue: {
      name: "Morumbi",
      capacity: 67052
    }
  },
  {
    id: 126,
    name: "Santos",
    logo: "https://media.api-sports.io/football/teams/126.png",
    country: "Brazil",
    venue: {
      name: "Vila Belmiro", 
      capacity: 16068
    }
  },
  {
    id: 123,
    name: "Corinthians",
    logo: "https://media.api-sports.io/football/teams/123.png",
    country: "Brazil",
    venue: {
      name: "Neo Química Arena",
      capacity: 49205
    }
  }
];

export const mockLeagues: League[] = [
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
    id: 72,
    name: "Serie B", 
    country: "Brazil",
    logo: "https://media.api-sports.io/football/leagues/72.png",
    season: 2025,
    start_date: "2025-04-04",
    end_date: "2025-11-22",
    is_current: true
  },
  {
    id: 73,
    name: "Copa do Brasil",
    country: "Brazil", 
    logo: "https://media.api-sports.io/football/leagues/73.png",
    season: 2025,
    start_date: "2025-02-18",
    end_date: "2025-08-08",
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

export const generateMockFixtures = (count: number = 10): Fixture[] => {
  const fixtures: Fixture[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const homeTeam = mockTeams[Math.floor(Math.random() * mockTeams.length)];
    let awayTeam = mockTeams[Math.floor(Math.random() * mockTeams.length)];
    
    // Ensure home and away teams are different
    while (awayTeam.id === homeTeam.id) {
      awayTeam = mockTeams[Math.floor(Math.random() * mockTeams.length)];
    }
    
    const league = mockLeagues[Math.floor(Math.random() * mockLeagues.length)];
    
    // Generate different match times
    const baseTime = new Date(now);
    baseTime.setHours(now.getHours() + (i * 2) - 10); // Spread across past and future
    
    // Random status
    const statuses = ['NS', '1H', '2H', 'HT', 'FT'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    let homeGoals = null;
    let awayGoals = null;
    let elapsed = null;
    
    if (status !== 'NS') {
      homeGoals = Math.floor(Math.random() * 4);
      awayGoals = Math.floor(Math.random() * 4);
    }
    
    if (['1H', '2H', 'HT'].includes(status)) {
      elapsed = Math.floor(Math.random() * 90) + 1;
    } else if (status === 'FT') {
      elapsed = 90;
    }
    
    fixtures.push({
      id: 1000 + i,
      league: {
        id: league.id,
        name: league.name,
        country: league.country,
        logo: league.logo
      },
      season: 2025,
      fixture: {
        id: 1000 + i,
        date: baseTime.toISOString(),
        timestamp: baseTime.getTime() / 1000,
        status: {
          long: status === 'NS' ? 'Not Started' : 
                 status === '1H' ? 'First Half' :
                 status === '2H' ? 'Second Half' :
                 status === 'HT' ? 'Halftime' : 'Match Finished',
          short: status,
          elapsed
        },
        venue: {
          name: homeTeam.venue?.name || "Estádio"
        }
      },
      teams: {
        home: homeTeam,
        away: awayTeam
      },
      goals: {
        home: homeGoals,
        away: awayGoals
      },
      score: {
        halftime: {
          home: status === 'FT' ? Math.floor((homeGoals || 0) * 0.6) : null,
          away: status === 'FT' ? Math.floor((awayGoals || 0) * 0.6) : null
        },
        fulltime: {
          home: status === 'FT' ? homeGoals : null,
          away: status === 'FT' ? awayGoals : null
        }
      }
    });
  }
  
  return fixtures;
};

export const generateMockOdds = (fixtures: Fixture[]): Odds[] => {
  return fixtures.slice(0, 5).map(fixture => ({
    fixture: {
      id: fixture.fixture.id
    },
    bookmakers: [
      {
        id: 1,
        name: "Bet365",
        bets: [
          {
            id: 1,
            name: "Match Winner",
            values: [
              { value: "Home", odd: (1.5 + Math.random() * 3).toFixed(2) },
              { value: "Draw", odd: (2.8 + Math.random() * 1.5).toFixed(2) },
              { value: "Away", odd: (1.5 + Math.random() * 3).toFixed(2) }
            ]
          }
        ]
      }
    ]
  }));
};

// Mock fallback when API is not available
export const getMockSportsData = () => {
  const fixtures = generateMockFixtures(20);
  const odds = generateMockOdds(fixtures);
  
  return {
    fixtures,
    leagues: mockLeagues,
    teams: mockTeams,
    odds,
    teamStats: [],
    lastUpdate: new Date(),
    loading: false,
    error: null
  };
};