import React, { useState, useEffect, lazy, Suspense, useMemo, useCallback } from 'react';
import { AppView, Mission, Trip, UserProfile } from './types';
import { auth, onAuthChange, updateUserStats, db, getTrip } from './lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { User } from 'firebase/auth';

// Pages
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import MapView from './pages/MapView';
import Journey from './pages/Journey';
import MissionDetail from './pages/MissionDetail';
import CameraCapture from './pages/CameraCapture';
import LiveGuide from './pages/LiveGuide';
import Bazaar from './pages/Bazaar';
import Profile from './pages/Profile';
import JourneyStory from './pages/JourneyStory';
import Gallery from './pages/Gallery';
import BottomNav from './components/BottomNav';

// Extended AppView with auth screens
enum AuthView {
  LOGIN = 'login',
  REGISTER = 'register'
}

type ViewType = AppView | AuthView;

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>(AppView.WELCOME);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<UserProfile>({
    name: 'مستكشف',
    language: 'ar',
    interests: [],
    budget: 'moderate',
    pace: 'moderate',
    stats: {
      xp: 0,
      level: 1,
      gold: 100,
      streak: 0,
      unlockedSites: 0,
      rank: 0
    }
  });
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

  // Auth state listener
  useEffect(() => {
    let profileUnsubscribe: (() => void) | null = null;
    let tripUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = onAuthChange(async (firebaseUser) => {
      setAuthUser(firebaseUser);

      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = null;
      }

      if (tripUnsubscribe) {
        tripUnsubscribe();
        tripUnsubscribe = null;
      }

      if (firebaseUser) {
        // Real-time profile listener
        const userRef = doc(db, 'users', firebaseUser.uid);
        profileUnsubscribe = onSnapshot(userRef, async (docSnap) => {
          setAuthLoading(false);

          if (docSnap.exists()) {
            const profile = docSnap.data();
            setUser({
              name: profile.displayName || 'مستكشف',
              language: profile.language || 'ar',
              interests: profile.interests || [],
              budget: profile.budget || 'moderate',
              pace: profile.pace || 'moderate',
              onboardingComplete: profile.onboardingComplete,
              stats: {
                xp: profile.stats?.xp || 0,
                level: profile.stats?.level || 1,
                gold: profile.stats?.gold || 0,
                streak: profile.stats?.streak || 0,
                unlockedSites: profile.stats?.unlockedSites || 0,
                rank: profile.stats?.rank || 0
              }
            });

            // Load trip from Firebase if onboarding is complete
            if (profile.onboardingComplete) {
              // Real-time trip listener
              const tripRef = doc(db, 'users', firebaseUser.uid, 'trips', 'active_trip');
              tripUnsubscribe = onSnapshot(tripRef, (tripSnap) => {
                if (tripSnap.exists()) {
                  const tripData = tripSnap.data() as Trip;
                  setActiveTrip(tripData);
                } else {
                  // Try to load trip if not found
                  getTrip(firebaseUser.uid).then(trip => {
                    if (trip) {
                      setActiveTrip(trip);
                    }
                  }).catch(err => {
                    console.error("Error loading trip:", err);
                  });
                }
              }, (err) => {
                console.error("Trip sync error:", err);
              });

              // If onboarding is complete, go to map if we're on an auth screen
              setCurrentView(prev => {
                if (prev === AppView.WELCOME || prev === AuthView.LOGIN || prev === AuthView.REGISTER) {
                  return AppView.MAP;
                }
                return prev;
              });
            } else {
              // If onboarding NOT complete, go to onboarding if on auth screen
              setCurrentView(prev => {
                if (prev === AppView.WELCOME || prev === AuthView.LOGIN || prev === AuthView.REGISTER) {
                  return AppView.ONBOARDING;
                }
                return prev;
              });
            }
          } else {
            // No profile doc - must be a new user, go to onboarding
            setCurrentView(prev => {
              if (prev === AppView.WELCOME || prev === AuthView.LOGIN || prev === AuthView.REGISTER) {
                return AppView.ONBOARDING;
              }
              return prev;
            });
          }
        }, (err) => {
          console.error("Profile sync error:", err);
          setAuthLoading(false);
        });
      } else {
        setUser({
          name: 'مستكشف',
          language: 'ar',
          interests: [],
          budget: 'moderate',
          pace: 'moderate',
          stats: { xp: 0, level: 1, gold: 100, streak: 0, unlockedSites: 0, rank: 0 }
        });
        setActiveTrip(null);
        setCurrentView(AppView.WELCOME);
        setAuthLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (profileUnsubscribe) profileUnsubscribe();
      if (tripUnsubscribe) tripUnsubscribe();
    };
  }, []); // Note: currentView is used but we only want to navigate on initial load/auth change logic

  const navigate = useCallback((view: ViewType, data?: any) => {
    if (view === AppView.MISSION_DETAIL && data) setSelectedMission(data);
    if (view === AppView.MAP && data?.trip) setActiveTrip(data.trip);
    setCurrentView(view);
  }, []);

  const handleUpdateStats = useCallback(async (xp: number, gold: number = 0) => {
    if (!authUser) return;

    try {
      const updatedStats = await updateUserStats(authUser.uid, xp, gold);
      if (updatedStats) {
        setUser(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            xp: updatedStats.xp,
            level: updatedStats.level,
            gold: updatedStats.gold
          }
        }));
      }
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }, [authUser]);

  const handleAuthSuccess = () => {
    // Auth state listener will handle navigation
  };

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const renderView = useMemo(() => {
    console.log("Rendering view:", currentView);

    if (!isOnline && currentView !== AppView.GUIDE && currentView !== AppView.GALLERY) {
      // Allow Guide and Gallery to work offline partially, but show warning elsewhere ??
      // Actually, Firebase Auth needs online.
    }

    switch (currentView) {
      // Auth Views
      case AppView.WELCOME:
        return (
          <Welcome
            onEnter={() => navigate(AuthView.REGISTER)}
            onLogin={() => navigate(AuthView.LOGIN)}
          />
        );

      case AuthView.LOGIN:
        return (
          <Login
            onSuccess={handleAuthSuccess}
            onGoToRegister={() => navigate(AuthView.REGISTER)}
          />
        );

      case AuthView.REGISTER:
        return (
          <Register
            onSuccess={handleAuthSuccess}
            onGoToLogin={() => navigate(AuthView.LOGIN)}
          />
        );

      // Main App Views
      case AppView.ONBOARDING:
        return (
          <Onboarding
            onComplete={(trip) => {
              setActiveTrip(trip);
              // Trip is already saved to Firebase in Onboarding component
              navigate(AppView.MAP, { trip });
            }}
            user={user}
            setUser={setUser}
          />
        );

      case AppView.MAP:
        return (
          <MapView
            stats={user.stats}
            onScan={() => navigate(AppView.CAMERA)}
            trip={activeTrip}
            onSelectMission={(m) => navigate(AppView.MISSION_DETAIL, m)}
          />
        );

      case AppView.JOURNEY:
        return (
          <Journey
            trip={activeTrip}
            onSelectMission={(m) => navigate(AppView.MISSION_DETAIL, m)}
          />
        );

      case AppView.MISSION_DETAIL:
        return (
          <MissionDetail
            mission={selectedMission}
            onBack={() => navigate(AppView.JOURNEY)}
            onCapture={() => navigate(AppView.CAMERA)}
            onStartGuide={() => navigate(AppView.GUIDE)}
            onMissionUpdate={(updatedMission) => {
              // Update mission in active trip
              if (activeTrip) {
                const updatedMissions = activeTrip.missions.map(m => 
                  m.id === updatedMission.id ? updatedMission : m
                );
                const completedMissions = updatedMissions.filter(m => m.status === 'completed').length;
                const progress = updatedMissions.length > 0 
                  ? Math.round((completedMissions / updatedMissions.length) * 100) 
                  : 0;
                setActiveTrip({ ...activeTrip, missions: updatedMissions, progress });
                setSelectedMission(updatedMission);
              }
            }}
          />
        );

      case AppView.CAMERA:
        return (
          <CameraCapture
            mission={selectedMission}
            onComplete={() => navigate(AppView.MISSION_DETAIL)}
            onUpdateStats={handleUpdateStats}
            tripId={activeTrip?.id || 'active_trip'}
            onTaskComplete={async () => {
              // Reload trip to get updated mission
              if (auth.currentUser && selectedMission) {
                try {
                  const trip = await getTrip(auth.currentUser.uid);
                  if (trip) {
                    const updatedMission = trip.missions.find(m => m.id === selectedMission.id);
                    if (updatedMission) {
                      setSelectedMission(updatedMission);
                      const updatedMissions = trip.missions;
                      const completedMissions = updatedMissions.filter(m => m.status === 'completed').length;
                      const progress = updatedMissions.length > 0 
                        ? Math.round((completedMissions / updatedMissions.length) * 100) 
                        : 0;
                      setActiveTrip({ ...trip, missions: updatedMissions, progress });
                    }
                  }
                } catch (error) {
                  console.error("Error reloading trip:", error);
                }
              }
            }}
          />
        );

      case AppView.GUIDE:
        return (
          <LiveGuide
            onBack={() => navigate(AppView.MAP)}
            onUpdateStats={handleUpdateStats}
            mission={selectedMission}
            user={user}
          />
        );

      case AppView.BAZAAR:
        return (
          <Bazaar
            stats={user.stats}
            onBack={() => navigate(AppView.MAP)}
          />
        );

      case AppView.PROFILE:
        return (
          <Profile
            stats={user.stats}
            user={user}
            authUser={authUser}
            onGoToStory={() => navigate(AppView.STORY)}
            onGoToGallery={() => navigate(AppView.GALLERY)}
            onLogout={() => {
              auth.signOut();
              navigate(AppView.WELCOME);
            }}
          />
        );

      case AppView.STORY:
        return (
          <JourneyStory
            trip={activeTrip}
            onBack={() => navigate(AppView.PROFILE)}
          />
        );

      case AppView.GALLERY:
        return (
          <Gallery
            authUser={authUser}
            onBack={() => navigate(AppView.PROFILE)}
          />
        );

      default:
        return <Welcome onEnter={() => navigate(AuthView.REGISTER)} />;
    }
  }, [currentView, authUser, user, activeTrip, selectedMission, handleUpdateStats, navigate]);

  // Loading Screen
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background-dark">
        <div className="w-20 h-20 rounded-2xl bg-surface-dark/80 border border-primary/30 flex items-center justify-center shadow-[0_0_40px_rgba(244,175,37,0.3)] mb-6 animate-pulse">
          <span className="material-symbols-outlined text-primary text-[40px]">explore</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary animate-spin">progress_activity</span>
          <span className="text-sand-accent font-arabic">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  const showNav = ![
    AppView.WELCOME,
    AppView.ONBOARDING,
    AppView.CAMERA,
    AppView.GUIDE,
    AuthView.LOGIN,
    AuthView.REGISTER
  ].includes(currentView as any);

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative bg-[#0f0d0a] text-white font-sans overflow-hidden shadow-2xl">
      {!isOnline && (
        <div className="bg-red-600 text-white text-[10px] text-center p-1 z-[100] font-bold font-arabic">
          ⚠️ لا يوجد اتصال بالإنترنت
        </div>
      )}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="text-primary animate-spin text-4xl">⏳</div>
          </div>
        }>
          {renderView}
        </Suspense>
      </div>
      {showNav && (
        <BottomNav
          activeView={currentView as AppView}
          onNavigate={(view) => navigate(view)}
        />
      )}
    </div>
  );
};

export default App;
