
export enum AppView {
  WELCOME = 'welcome',
  ONBOARDING = 'onboarding',
  MAP = 'map',
  JOURNEY = 'journey',
  MISSION_DETAIL = 'mission_detail',
  CAMERA = 'camera',
  GUIDE = 'guide',
  BAZAAR = 'bazaar',
  PROFILE = 'profile',
  STORY = 'story',
  GALLERY = 'gallery'
}

export interface Task {
  id: string;
  type: 'photo' | 'quiz' | 'ar' | 'check';
  label: string;
  xp: number;
  completed: boolean;
  requirement?: string;
}

export interface Mission {
  id: string;
  day: number;
  title: string;
  description: string;
  status: 'locked' | 'active' | 'completed';
  xpReward: number;
  goldReward: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  imageUrl: string;
  location: { lat: number; lng: number; name: string };
  tasks: Task[];
}

export interface Trip {
  id: string;
  title: string;
  days: number;
  missions: Mission[];
  progress: number;
}

// UserStats interface used by Profile, Bazaar, and MapView pages
export interface UserStats {
  xp: number;
  level: number;
  gold: number;
  streak: number;
  unlockedSites: number;
  rank: number;
}

export interface UserProfile {
  name: string;
  language: string;
  interests: string[];
  budget: string;
  pace: string;
  stats: UserStats;
  onboardingComplete?: boolean;
}

// Quest interface used by QuestList and QuestDetail pages
export interface Quest {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'new' | 'completed';
  xpReward: number;
  goldReward: number;
  difficulty: string;
  locationName: string;
  imageUrl: string;
}

export interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}
