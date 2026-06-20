export interface Creator {
  id: string;
  channelId: string;
  name: string;
  handle: string;
  avatar: string;
  thumbnailUrl: string;
  subscribers: number;
  subGrowth: number; // percentage growth last 30d
  niche: string;
  velocity: string;
  editStyle: string;
  videoCount: number;
  avgViews: number;
  email: string;
  crmStatus: 'lead' | 'pitched' | 'negotiating' | 'signed' | 'none';
  opportunityScore: number;
  lastContacted: string; // date string or "Never"
  editingPainPoints: string[];
  suggestedPitch: string;
  latestVideos: {
    id: string;
    title: string;
    views: string;
    duration: string;
    published: string;
    url?: string;
    retentionRisk?: string;
  }[];
  primaryNiche?: string;
  nicheConfidence?: number;
  contentType?: string;
  regionScore?: number;
  fitScore?: number;
  lastUploadDays?: number;
  uploadsLast30Days?: number;
}

export interface Sprint {
  id: string;
  name: string;
  date: string;
  filters: {
    niche: string;
    subscribers: string;
    velocity: string;
    editStyle: string;
    contentType: string;
  };
  region: string;
  creatorsFoundCount: number;
  status: 'completed' | 'processing';
}

export interface EditorSettings {
  name: string;
  email: string;
  avatar: string;
  portfolio: string;
  hourlyRate: number;
  retainerRate: number;
  pitchTemplate: string;
}

// Initial Mock Creators Data
const INITIAL_CREATORS: Creator[] = [];

// Initial Mock Sprints
const INITIAL_SPRINTS: Sprint[] = [];

// Initial Settings
const DEFAULT_SETTINGS: EditorSettings = {
  name: "Alex Reed",
  email: "alex@reededit.io",
  avatar: "AR",
  portfolio: "",
  hourlyRate: 0,
  retainerRate: 0,
  pitchTemplate: "Hey {CreatorName}!\n\nI really enjoyed your recent video '{VideoTitle}'. I've been following {ChannelHandle} and absolutely love your content.\n\nI noticed a small optimization that could boost retention by 15-20% in your first 30 seconds. I've put together a quick mockup edit of that section to show you what I mean.\n\nLet me know if you'd like to chat about upgrading your future edits!\n\nBest,\nAlex"
};

// Client Side Storage helper
const isClient = typeof window !== 'undefined';

export const mockStore = {
  getCreators: (): Creator[] => {
    if (!isClient) return INITIAL_CREATORS;
    const data = localStorage.getItem('scoutly_creators');
    if (!data) {
      localStorage.setItem('scoutly_creators', JSON.stringify(INITIAL_CREATORS));
      return INITIAL_CREATORS;
    }
    return JSON.parse(data);
  },

  saveCreators: (creators: Creator[]): void => {
    if (!isClient) return;
    localStorage.setItem('scoutly_creators', JSON.stringify(creators));
  },

  getCreatorById: (id: string): Creator | undefined => {
    const creators = mockStore.getCreators();
    return creators.find(c => c.id === id);
  },

  updateCreatorCrmStatus: (id: string, status: Creator['crmStatus'], lastContacted?: string): Creator[] => {
    const creators = mockStore.getCreators();
    const updated = creators.map(c => {
      if (c.id === id) {
        return {
          ...c,
          crmStatus: status,
          lastContacted: lastContacted !== undefined ? lastContacted : c.lastContacted
        };
      }
      return c;
    });
    mockStore.saveCreators(updated);
    return updated;
  },

  getSprints: (): Sprint[] => {
    if (!isClient) return INITIAL_SPRINTS;
    const data = localStorage.getItem('scoutly_sprints');
    if (!data) {
      localStorage.setItem('scoutly_sprints', JSON.stringify(INITIAL_SPRINTS));
      return INITIAL_SPRINTS;
    }
    return JSON.parse(data);
  },

  saveSprints: (sprints: Sprint[]): void => {
    if (!isClient) return;
    localStorage.setItem('scoutly_sprints', JSON.stringify(sprints));
  },

  deleteSprint: (id: string): void => {
    if (!isClient) return;
    const sprints = mockStore.getSprints();
    const updated = sprints.filter(s => s.id !== id);
    mockStore.saveSprints(updated);
  },

  createSprint: (name: string, filters: Sprint['filters'], region?: string): Sprint => {
    const sprints = mockStore.getSprints();
    
    // Simulate finding matching creators from our DB based on filters
    const creators = mockStore.getCreators();
    const matching = creators.filter(c => {
      let match = true;
      if (filters.niche !== 'All' && c.niche !== filters.niche) match = false;
      if (filters.editStyle !== 'All' && c.editStyle !== filters.editStyle) match = false;
      
      // Sim subscriber matching
      if (filters.subscribers !== 'All') {
        const subs = c.subscribers;
        if (filters.subscribers === '10k-50k' && (subs < 10000 || subs > 50000)) match = false;
        if (filters.subscribers === '50k-250k' && (subs < 50000 || subs > 250000)) match = false;
        if (filters.subscribers === '250k-1M' && (subs < 250000 || subs > 1000000)) match = false;
      }

      // Sim velocity matching
      if (filters.velocity !== 'All' && c.velocity !== filters.velocity) match = false;

      // Sim content type matching
      if (filters.contentType && filters.contentType !== 'Any' && c.contentType !== filters.contentType) match = false;
      
      return match;
    });

    const uniqueMatching = Array.from(
      new Map(matching.map(c => [c.channelId, c])).values()
    );

    const newSprint: Sprint = {
      id: `sp-${Date.now()}`,
      name: name || `${filters.niche} Sprint`,
      date: new Date().toISOString().split('T')[0],
      filters,
      region: region || "Global",
      creatorsFoundCount: uniqueMatching.length || Math.floor(Math.random() * 3) + 1, // Fallback random if 0
      status: 'completed'
    };

    const updated = [newSprint, ...sprints];
    mockStore.saveSprints(updated);
    return newSprint;
  },

  getSettings: (): EditorSettings => {
    if (!isClient) return DEFAULT_SETTINGS;
    const data = localStorage.getItem('scoutly_settings');
    if (!data) {
      localStorage.setItem('scoutly_settings', JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return JSON.parse(data);
  },

  saveSettings: (settings: EditorSettings): void => {
    if (!isClient) return;
    localStorage.setItem('scoutly_settings', JSON.stringify(settings));
  }
};
