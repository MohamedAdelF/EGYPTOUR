import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { UserStats, Trip, Mission, HiddenSecret } from '../types';
import { HIDDEN_SECRETS, getSecretsNearLocation, isNearSecret } from '../lib/secrets';
import { auth, checkSecretDiscovered } from '../lib/firebase';

interface MapViewProps {
  onScan: () => void;
  stats: UserStats;
  trip?: Trip | null;
  onSelectMission?: (mission: Mission) => void;
}

const DEFAULT_CENTER = { lat: 29.976480, lng: 31.131302 }; // Giza Pyramids View

const MapView: React.FC<MapViewProps> = ({ onScan, stats, trip, onSelectMission }) => {
  const [viewMode, setViewMode] = useState<'today' | 'all'>('today');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(
    trip?.missions?.find(m => m.status === 'active') || trip?.missions?.[0] || null
  );
  const [nearbySecrets, setNearbySecrets] = useState<HiddenSecret[]>([]);
  const [discoveredSecrets, setDiscoveredSecrets] = useState<Set<string>>(new Set());

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

  // Get User Location and check for secrets
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);

          // Check for nearby secrets
          const secrets = getSecretsNearLocation(location.lat, location.lng);
          setNearbySecrets(secrets);

          // Load discovered secrets
          if (auth.currentUser) {
            secrets.forEach(async (secret) => {
              const isDiscovered = await checkSecretDiscovered(auth.currentUser!.uid, secret.id);
              if (isDiscovered) {
                setDiscoveredSecrets(prev => new Set([...prev, secret.id]));
              }
            });
          }
        },
        (error) => console.log('Error getting location', error),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Filter missions based on view mode
  const todayMissions = trip?.missions?.filter(m => m.day === 1) || [];
  const allMissions = trip?.missions || [];
  const displayMissions = viewMode === 'today' ? todayMissions : allMissions;

  // Log for debugging
  useEffect(() => {
    console.log('Active Trip:', trip);
    console.log('Display Missions:', displayMissions);
  }, [trip, displayMissions]);

  const handleMissionClick = (mission: Mission) => {
    setSelectedMission(mission);
  };

  const handleStartMission = () => {
    if (selectedMission && onSelectMission) {
      onSelectMission(selectedMission);
    }
  };

  // Get mission marker color based on status
  const getPinColor = (status: string) => {
    switch (status) {
      case 'completed': return { background: '#22c55e', glyph: '#fff', borderColor: '#15803d' };
      case 'active': return { background: '#f4af25', glyph: '#000', borderColor: '#b45309' };
      default: return { background: '#6b7280', glyph: '#fff', borderColor: '#374151' };
    }
  };

  if (!apiKey) {
    return <div className="flex items-center justify-center h-full text-white">API Key Missing</div>;
  }

  return (
    <div className="relative h-full w-full bg-[#1a160c] overflow-hidden">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={userLocation || selectedMission?.location || DEFAULT_CENTER}
          defaultZoom={14}
          mapId={mapId}
          disableDefaultUI={true}
          style={{ width: '100%', height: '100%' }}
          gestureHandling={'greedy'}
          tilt={45}
          heading={0}
        >
          {/* User Location Marker */}
          {userLocation && (
            <AdvancedMarker position={userLocation} title="You are here">
              <div className="relative">
                <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping"></div>
              </div>
            </AdvancedMarker>
          )}

          {/* Mission Markers */}
          {displayMissions.map((mission) => (
            <AdvancedMarker
              key={mission.id}
              position={mission.location}
              onClick={() => handleMissionClick(mission)}
              title={mission.title}
            >
              <Pin
                background={getPinColor(mission.status).background}
                borderColor={getPinColor(mission.status).borderColor}
                glyphColor={getPinColor(mission.status).glyph}
              />
            </AdvancedMarker>
          ))}

          {/* Hidden Secrets Markers */}
          {HIDDEN_SECRETS.filter(secret => {
            // Show secrets for missions in view
            return displayMissions.some(m => m.id === secret.missionId);
          }).map((secret) => {
            const isDiscovered = discoveredSecrets.has(secret.id);
            const isNearby = userLocation && isNearSecret(userLocation.lat, userLocation.lng, secret);
            
            return (
              <AdvancedMarker
                key={secret.id}
                position={secret.location}
                title={secret.title}
              >
                <div className={`relative ${isDiscovered ? 'opacity-60' : isNearby ? 'animate-pulse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                    isDiscovered 
                      ? 'bg-green-500/80 border-green-400' 
                      : isNearby
                        ? 'bg-purple-500/90 border-purple-400 shadow-lg shadow-purple-400/50'
                        : 'bg-purple-500/50 border-purple-300'
                  }`}>
                    {isDiscovered ? (
                      <span className="material-symbols-outlined text-white text-sm">check</span>
                    ) : (
                      <span className="material-symbols-outlined text-white text-sm">visibility_off</span>
                    )}
                  </div>
                  {isNearby && !isDiscovered && (
                    <div className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-yellow-400 animate-ping"></div>
                  )}
                </div>
              </AdvancedMarker>
            );
          })}
        </Map>
      </APIProvider>

      {/* Hidden Secrets Notification */}
      {nearbySecrets.length > 0 && nearbySecrets.some(s => !discoveredSecrets.has(s.id)) && (
        <div className="absolute top-24 left-0 right-0 px-6 z-30 pointer-events-none">
          <div className="bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-xl pointer-events-auto animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-white">auto_awesome</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm font-arabic">🔍 سر مخفي قريب!</p>
                <p className="text-white/80 text-xs font-arabic">
                  {nearbySecrets.filter(s => !discoveredSecrets.has(s.id)).length} سر قريب منك
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 p-6 pt-12 z-30 pointer-events-none">
        <div className="flex items-center justify-between bg-surface-dark/90 backdrop-blur-md border border-white/5 p-3 rounded-2xl shadow-xl pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
              <span className="text-xl">👑</span>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-arabic">مستواك الحالي</p>
              <p className="text-sm font-bold font-arabic text-primary">المستوى {stats.level}</p>
            </div>
          </div>
          <div className="h-8 w-[1px] bg-white/10 mx-2"></div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] text-gray-400 font-arabic">رصيد الذهب</p>
              <p className="text-sm font-bold font-mono text-yellow-400">{stats.gold}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
              <span className="material-symbols-outlined text-yellow-500">monetization_on</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mission details card (Bottom Sheet) */}
      {selectedMission && (
        <div className="absolute bottom-24 left-4 right-4 z-30 animate-slide-up">
          <div className="bg-surface-dark border border-white/10 p-5 rounded-3xl shadow-2xl backdrop-blur-xl">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold mb-2 ${selectedMission.difficulty === 'Hard' ? 'bg-red-500/20 text-red-400' :
                  selectedMission.difficulty === 'Medium' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                  {selectedMission.difficulty}
                </span>
                <h3 className="text-xl font-bold font-arabic text-white mb-1">{selectedMission.title}</h3>
                <p className="text-xs text-gray-400 font-arabic line-clamp-2">{selectedMission.description}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1 text-primary text-xs font-bold bg-primary/10 px-2 py-1 rounded-lg">
                  <span>+{selectedMission.xpReward} XP</span>
                  <span className="material-symbols-outlined text-[14px]">star</span>
                </div>
                <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold bg-yellow-400/10 px-2 py-1 rounded-lg">
                  <span>+{selectedMission.goldReward}</span>
                  <span className="material-symbols-outlined text-[14px]">monetization_on</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleStartMission}
              className={`w-full py-4 rounded-2xl font-bold font-arabic flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${selectedMission.status === 'locked'
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-primary text-background-dark hover:bg-amber-400'
                }`}
              disabled={selectedMission.status === 'locked'}
            >
              {selectedMission.status === 'completed' ? (
                <>
                  <span className="material-symbols-outlined">check_circle</span>
                  <span>تمت المهمة</span>
                </>
              ) : selectedMission.status === 'locked' ? (
                <>
                  <span className="material-symbols-outlined">lock</span>
                  <span>المهمة مقفلة</span>
                </>
              ) : (
                <>
                  <span>بدء المغامرة</span>
                  <span className="material-symbols-outlined rtl:rotate-180">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* AR Scan Button (Floating) */}
      {!selectedMission && (
        <div className="absolute bottom-28 right-6 z-30">
          <button
            onClick={onScan}
            className="flex items-center gap-3 pr-4 pl-6 h-14 rounded-full bg-primary text-background-dark font-bold shadow-[0_4px_15px_rgba(244,175,37,0.5)] active:scale-95 transition-all"
          >
            <span className="text-lg font-arabic">مسح المنطقة</span>
            <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
          </button>
        </div>
      )}
    </div>
  );
};


export default MapView;
