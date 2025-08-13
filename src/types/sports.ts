// Types for API-Sports data structures
export interface League {
  id: number;
  name: string;
  country: string;
  logo: string;
  season: number;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface Team {
  id: number;
  name: string;
  logo: string;
  country: string;
  founded?: number;
  venue?: {
    name: string;
    capacity?: number;
  };
}

export interface Fixture {
  id: number;
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
  };
  season: number;
  fixture: {
    id: number;
    date: string;
    timestamp: number;
    status: {
      long: string;
      short: string;
      elapsed?: number;
    };
    venue?: {
      name: string;
    };
  };
  teams: {
    home: Team;
    away: Team;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: {
      home: number | null;
      away: number | null;
    };
    fulltime: {
      home: number | null;
      away: number | null;
    };
  };
}

export interface Odds {
  fixture: {
    id: number;
  };
  bookmakers: Array<{
    id: number;
    name: string;
    bets: Array<{
      id: number;
      name: string;
      values: Array<{
        value: string;
        odd: string;
      }>;
    }>;
  }>;
}

export interface TeamStats {
  league: {
    id: number;
    name: string;
  };
  team: Team;
  fixtures: {
    played: {
      home: number;
      away: number;
      total: number;
    };
    wins: {
      home: number;
      away: number;
      total: number;
    };
    draws: {
      home: number;
      away: number;
      total: number;
    };
    loses: {
      home: number;
      away: number;
      total: number;
    };
  };
  goals: {
    for: {
      total: {
        home: number;
        away: number;
        total: number;
      };
      average: {
        home: string;
        away: string;
        total: string;
      };
    };
    against: {
      total: {
        home: number;
        away: number;
        total: number;
      };
      average: {
        home: string;
        away: string;
        total: string;
      };
    };
  };
  form: string;
}

export interface LiveSportsData {
  fixtures: Fixture[];
  leagues: League[];
  teams: Team[];
  odds: Odds[];
  teamStats: TeamStats[];
  topScorers: TopPerformer[];
  lastUpdate: Date;
  loading: boolean;
  error: string | null;
}

export interface ApiSportsResponse<T = any> {
  ok: boolean;
  data: T[];
  meta?: {
    cached: boolean;
    endpoint: string;
    results?: number;
    rateLimit?: {
      remaining: number;
      limit: number;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

// Widget specific types
export interface LiveGame {
  id: number;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  minute: number;
  status: string;
  odds?: {
    home: number;
    draw: number;
    away: number;
  };
}

export interface HotOdd {
  fixtureId: number;
  match: string;
  market: string;
  odds: number;
  change: number;
  trend: 'up' | 'down';
  bookmaker: string;
}

export interface TopPerformer {
  playerId?: number;
  name: string;
  team: string;
  stat: string;
  value: number;
  performance: number;
}