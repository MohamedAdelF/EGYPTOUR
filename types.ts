
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

// Hidden Secret interface for discovering hidden locations
export interface HiddenSecret {
  id: string;
  missionId: string;
  title: string;
  description: string;
  location: { lat: number; lng: number; name: string };
  radius: number; // in meters
  xpReward: number;
  goldReward: number;
  hint: string;
  imageUrl?: string;
  discoveredCount?: number; // track how many users found it
  rarityPercentage?: number; // "Only 2% of tourists find this!"
}

// AI Personality enum for Live Guide
export enum AIPersonality {
  CLEOPATRA = 'cleopatra',
  AHMED = 'ahmed',
  ZAHI = 'zahi',
  FRIENDLY = 'friendly'
}

// AR Overlay type for Time Travel feature
export interface AROverlay {
  id: string;
  missionId: string;
  historicalImage: string;
  description: string;
  year: string;
}

// Photo Analysis interface for Compare Your Shot feature
export interface PhotoAnalysis {
  composition: number; // 0-100
  percentile: number; // top X%
  feedback: string;
  suggestions: string[];
  rating: 'excellent' | 'good' | 'average' | 'needs-improvement';
}
