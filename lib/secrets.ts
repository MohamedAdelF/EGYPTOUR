// Hidden Secrets Database for EGYPTOUR
// Contains GPS-based hidden secrets at historical locations

import { HiddenSecret } from '../types';

export const HIDDEN_SECRETS: HiddenSecret[] = [
  {
    id: 'secret_pyramids_inscription',
    missionId: 'mission_pyramids',
    title: 'النقش المخفي في الجدار',
    description: 'اكتشفت نقشاً هيروغليفياً مخفياً على الجدار الشرقي للأهرامات! هذا النقش يعود لأكثر من 4000 عام.',
    location: { lat: 29.9795, lng: 31.1342, name: 'الجدار الشرقي للأهرامات' },
    radius: 50, // 50 meters
    xpReward: 50,
    goldReward: 25,
    hint: 'امشي 20 متر شمالاً من الأهرامات وابحث عن نقش على الجدار',
    rarityPercentage: 2,
    discoveredCount: 0
  },
  {
    id: 'secret_sphinx_whisper',
    missionId: 'mission_pyramids',
    title: 'همسة أبو الهول',
    description: 'هل تعلم؟ إذا وقفت في المكان الصحيح بجانب أبو الهول، يمكنك سماع صدى صوتك بطريقة خاصة!',
    location: { lat: 29.9753, lng: 31.1376, name: 'بجانب أبو الهول' },
    radius: 30,
    xpReward: 50,
    goldReward: 20,
    hint: 'اقترب من أبو الهول من الجهة اليسرى وابحث عن البقعة المثالية',
    rarityPercentage: 5,
    discoveredCount: 0
  },
  {
    id: 'secret_khan_coffee',
    missionId: 'mission_khan',
    title: 'مقهى الفيشاوي السري',
    description: 'وجدت الطاولة التاريخية التي جلس عليها ناجيب محفوظ وكتب عليها رواياته الشهيرة!',
    location: { lat: 30.0475, lng: 31.2623, name: 'مقهى الفيشاوي' },
    radius: 10,
    xpReward: 50,
    goldReward: 15,
    hint: 'دخل إلى مقهى الفيشاوي وابحث عن الطاولة في الزاوية',
    rarityPercentage: 10,
    discoveredCount: 0
  },
  {
    id: 'secret_museum_hidden_chamber',
    missionId: 'mission_museum',
    title: 'الغرفة المخفية',
    description: 'اكتشفت ممراً سرياً يؤدي إلى غرفة عرض غير معروفة تضم قطع أثرية نادرة!',
    location: { lat: 29.9955, lng: 31.1185, name: 'المتحف المصري الكبير' },
    radius: 15,
    xpReward: 75,
    goldReward: 30,
    hint: 'في الطابق الثاني، ابحث عن الباب المخفي خلف تمثال رمسيس',
    rarityPercentage: 1,
    discoveredCount: 0
  },
  {
    id: 'secret_luxor_temple_inscription',
    missionId: 'mission_luxor',
    title: 'النقش الملكي المفقود',
    description: 'عثرت على نقش ملكي نادر على أحد الأعمدة في معبد الأقصر يعود لعصر رمسيس الثاني!',
    location: { lat: 25.6994, lng: 32.6392, name: 'معبد الأقصر' },
    radius: 20,
    xpReward: 60,
    goldReward: 25,
    hint: 'في الفناء الرئيسي، ابحث عن العمود الثالث من اليسار',
    rarityPercentage: 3,
    discoveredCount: 0
  }
];

/**
 * Calculate distance between two GPS coordinates in meters
 * Using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if user is within range of a hidden secret
 */
export function isNearSecret(
  userLat: number,
  userLng: number,
  secret: HiddenSecret
): boolean {
  const distance = calculateDistance(
    userLat,
    userLng,
    secret.location.lat,
    secret.location.lng
  );
  return distance <= secret.radius;
}

/**
 * Get secrets for a specific mission
 */
export function getSecretsForMission(missionId: string): HiddenSecret[] {
  return HIDDEN_SECRETS.filter(secret => secret.missionId === missionId);
}

/**
 * Get all secrets near a location
 */
export function getSecretsNearLocation(
  lat: number,
  lng: number
): HiddenSecret[] {
  return HIDDEN_SECRETS.filter(secret => isNearSecret(lat, lng, secret));
}

