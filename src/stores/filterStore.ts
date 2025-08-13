import { create } from 'zustand';
import { Fixture, League, Team, LiveGame } from '@/types/sports';

interface FilterState {
  // Active filters
  activeFilter: 'today' | 'live' | 'upcoming' | null;
  selectedLeague: number | null;
  selectedTeam: number | null;
  favoriteTeams: number[];
  
  // Data for filters
  fixtures: Fixture[];
  leagues: League[];
  teams: Team[];
  
  // Computed data
  todayCount: number;
  liveCount: number;
  upcomingCount: number;
  
  // Actions
  setActiveFilter: (filter: 'today' | 'live' | 'upcoming' | null) => void;
  setSelectedLeague: (leagueId: number | null) => void;
  setSelectedTeam: (teamId: number | null) => void;
  addFavoriteTeam: (teamId: number) => void;
  removeFavoriteTeam: (teamId: number) => void;
  toggleFavoriteTeam: (teamId: number) => void;
  updateData: (fixtures: Fixture[], leagues: League[], teams: Team[]) => void;
  getFilteredFixtures: () => Fixture[];
  clearAllFilters: () => void;
}

export const useFilterStore = create<FilterState>((set, get) => ({
  // Initial state
  activeFilter: null,
  selectedLeague: 71, // Brasileirão Série A default
  selectedTeam: null,
  favoriteTeams: [119, 127, 124], // Palmeiras, Flamengo, São Paulo
  
  fixtures: [],
  leagues: [],
  teams: [],
  
  todayCount: 0,
  liveCount: 0,
  upcomingCount: 0,
  
  // Actions
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  
  setSelectedLeague: (leagueId) => set({ 
    selectedLeague: leagueId,
    selectedTeam: null // Clear team filter when changing league
  }),
  
  setSelectedTeam: (teamId) => set({ selectedTeam: teamId }),
  
  addFavoriteTeam: (teamId) => set((state) => ({
    favoriteTeams: [...state.favoriteTeams, teamId]
  })),
  
  removeFavoriteTeam: (teamId) => set((state) => ({
    favoriteTeams: state.favoriteTeams.filter(id => id !== teamId)
  })),
  
  toggleFavoriteTeam: (teamId) => {
    const { favoriteTeams, addFavoriteTeam, removeFavoriteTeam } = get();
    if (favoriteTeams.includes(teamId)) {
      removeFavoriteTeam(teamId);
    } else {
      addFavoriteTeam(teamId);
    }
  },
  
  updateData: (fixtures, leagues, teams) => {
    const today = new Date().toISOString().split('T')[0];
    const todayCount = fixtures.filter(f => 
      f.fixture.date.startsWith(today)
    ).length;
    
    const liveCount = fixtures.filter(f => 
      ['1H', '2H', 'HT'].includes(f.fixture.status.short)
    ).length;
    
    const upcomingCount = fixtures.filter(f => 
      f.fixture.status.short === 'NS' && new Date(f.fixture.date) > new Date()
    ).length;
    
    set({ 
      fixtures, 
      leagues, 
      teams,
      todayCount,
      liveCount,
      upcomingCount
    });
  },
  
  getFilteredFixtures: () => {
    const { fixtures, activeFilter, selectedLeague, selectedTeam } = get();
    let filtered = [...fixtures];
    
    // Apply league filter
    if (selectedLeague) {
      filtered = filtered.filter(f => f.league.id === selectedLeague);
    }
    
    // Apply team filter
    if (selectedTeam) {
      filtered = filtered.filter(f => 
        f.teams.home.id === selectedTeam || f.teams.away.id === selectedTeam
      );
    }
    
    // Apply date/status filter
    if (activeFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(f => f.fixture.date.startsWith(today));
    } else if (activeFilter === 'live') {
      filtered = filtered.filter(f => 
        ['1H', '2H', 'HT'].includes(f.fixture.status.short)
      );
    } else if (activeFilter === 'upcoming') {
      filtered = filtered.filter(f => 
        f.fixture.status.short === 'NS' && new Date(f.fixture.date) > new Date()
      );
    }
    
    return filtered;
  },
  
  clearAllFilters: () => set({ 
    activeFilter: null, 
    selectedTeam: null 
  })
}));