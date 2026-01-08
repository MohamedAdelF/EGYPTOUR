// Constants for EGYPTOUR application

export const APP_NAME = 'EGYPTOUR';
export const APP_VERSION = '1.0.0';

// API Configuration
export const GEMINI_MODELS = {
  TRIP_PLANNING: 'gemini-2.0-flash',
  PHOTO_ANALYSIS: 'gemini-2.0-flash',
  LIVE_GUIDE: 'gemini-2.0-flash',
  STORY_GENERATION: 'gemini-3-flash-preview',
  CHAT: 'gemini-3-flash-preview'
} as const;

// XP and Rewards
export const XP_REWARDS = {
  MISSION_COMPLETE: 100,
  TASK_COMPLETE: 30,
  HIDDEN_SECRET: 50,
  PHOTO_CAPTURE: 25,
  DAILY_STREAK: 10,
  PER_MINUTE_GUIDE: 10
} as const;

export const GOLD_REWARDS = {
  MISSION_COMPLETE: 30,
  HIDDEN_SECRET: 25,
  TASK_COMPLETE: 10,
  PHOTO_CAPTURE: 5
} as const;

// Gameplay Constants
export const XP_PER_LEVEL = 100;
export const MAX_LEVEL = 100;
export const MAX_STREAK_DAYS = 365;

// UI Constants
export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500
} as const;

export const DEBOUNCE_DELAY = {
  SEARCH: 300,
  INPUT: 500,
  SCROLL: 100
} as const;

// Camera Constants
export const CAMERA_CONFIG = {
  WIDTH: 1280,
  HEIGHT: 720,
  QUALITY: 0.8,
  FORMAT: 'image/jpeg' as const
} as const;

// GPS Constants
export const GPS_CONFIG = {
  ACCURACY: 'high' as const,
  TIMEOUT: 10000,
  MAX_AGE: 5000,
  SECRET_RADIUS: 50 // meters
} as const;

// Retry Configuration
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  DELAY: 1000,
  BACKOFF_MULTIPLIER: 2
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'egyptour_user_prefs',
  TRIP_CACHE: 'egyptour_trip_cache',
  OFFLINE_DATA: 'egyptour_offline_data'
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK: 'فشل الاتصال بالإنترنت. يرجى المحاولة لاحقاً.',
  CAMERA_PERMISSION: 'يرجى السماح بالوصول إلى الكاميرا.',
  LOCATION_PERMISSION: 'يرجى السماح بالوصول إلى الموقع.',
  API_ERROR: 'حدث خطأ في الاتصال بالخدمة. يرجى المحاولة لاحقاً.',
  GENERIC: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
  AUTH_REQUIRED: 'يجب تسجيل الدخول للاستمرار.',
  INVALID_INPUT: 'البيانات المدخلة غير صحيحة.'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  PHOTO_SAVED: 'تم حفظ الصورة بنجاح! 📸',
  MISSION_COMPLETE: 'تهانينا! أكملت المهمة بنجاح! 🎉',
  SECRET_FOUND: 'اكتشفت سراً مخفياً! 🎊',
  PROFILE_UPDATED: 'تم تحديث الملف الشخصي بنجاح!'
} as const;

