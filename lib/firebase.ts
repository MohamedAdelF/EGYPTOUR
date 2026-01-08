// Firebase Configuration for EGYPTOUR
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    User
} from 'firebase/auth';
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    Timestamp
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Trip } from '../types';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC9T8gFTxFwy7y_Lnewiu8LHJvJpCv6ytU",
    authDomain: "pharaohs-guide-3960b.firebaseapp.com",
    projectId: "pharaohs-guide-3960b",
    storageBucket: "pharaohs-guide-3960b.firebasestorage.app",
    messagingSenderId: "181479915856",
    appId: "1:181479915856:web:b60d7bc1b0f5c91dbbec55",
    measurementId: "G-FKQTS78BVL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// User Profile interface for Firestore
export interface FirestoreUserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    language: string;
    interests: string[];
    budget: 'budget' | 'moderate' | 'luxury';
    pace: 'relaxed' | 'moderate' | 'active';
    tripDuration: number;
    onboardingComplete: boolean;
    stats: {
        xp: number;
        level: number;
        gold: number;
        streak: number;
        unlockedSites: number;
        rank: number;
        totalMissions: number;
        photosCapture: number;
    };
    badges: string[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
    lastLoginAt: Timestamp;
}

// Default user profile - removes undefined fields for Firestore compatibility
export const createDefaultProfile = (user: User): Omit<FirestoreUserProfile, 'createdAt' | 'updatedAt' | 'lastLoginAt' | 'photoURL'> & { photoURL?: string } => {
    const profile: any = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'مستكشف',
        language: 'ar',
        interests: [],
        budget: 'moderate',
        pace: 'moderate',
        tripDuration: 3,
        onboardingComplete: false,
        stats: {
            xp: 0,
            level: 1,
            gold: 100,
            streak: 0,
            unlockedSites: 0,
            rank: 0,
            totalMissions: 0,
            photosCapture: 0
        },
        badges: ['newcomer']
    };

    // Only add photoURL if it exists (Firestore doesn't accept undefined)
    if (user.photoURL) {
        profile.photoURL = user.photoURL;
    }

    return profile;
};

// Auth functions
export const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user profile in Firestore
    const profile = createDefaultProfile(user);
    profile.displayName = displayName;

    await setDoc(doc(db, 'users', user.uid), {
        ...profile,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lastLoginAt: Timestamp.now()
    });

    return user;
};

export const signInWithEmail = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // Update last login
    await updateDoc(doc(db, 'users', userCredential.user.uid), {
        lastLoginAt: Timestamp.now()
    }).catch(() => { }); // Ignore if document doesn't exist

    return userCredential.user;
};

export const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (!userDoc.exists()) {
        // Create new profile for Google user
        const profile = createDefaultProfile(user);
        await setDoc(doc(db, 'users', user.uid), {
            ...profile,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            lastLoginAt: Timestamp.now()
        });
    } else {
        // Update last login
        await updateDoc(doc(db, 'users', user.uid), {
            lastLoginAt: Timestamp.now()
        });
    }

    return user;
};

export const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
};

export const logOut = async () => {
    await signOut(auth);
};

// Firestore functions
export const getUserProfile = async (uid: string): Promise<FirestoreUserProfile | null> => {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data() as FirestoreUserProfile;
    }
    return null;
};

export const updateUserProfile = async (uid: string, data: Partial<FirestoreUserProfile>) => {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
    });
};

// Update User Stats (XP, Gold, Level)
export const updateUserStats = async (uid: string, amountXp: number, amountGold: number = 0) => {
    const docRef = doc(db, 'users', uid);
    const userDoc = await getDoc(docRef);

    if (!userDoc.exists()) return null;

    const userData = userDoc.data() as FirestoreUserProfile;
    // Handle stats field which might be inside FirestoreUserProfile or defaults
    const currentStats = userData.stats || { xp: 0, level: 1, gold: 0, streak: 0, unlockedSites: 0, rank: 0 };

    const newXp = (currentStats.xp || 0) + amountXp;
    const newGold = (currentStats.gold || 0) + amountGold;

    // Level logic: 100 XP per level (matching Profile UI)
    const newLevel = Math.floor(newXp / 100) + 1;

    const updatedStats = {
        ...currentStats,
        xp: newXp,
        gold: newGold,
        level: newLevel
    };

    await updateDoc(docRef, {
        stats: updatedStats,
        updatedAt: Timestamp.now()
    });

    return updatedStats;
};

export const completeOnboarding = async (uid: string, preferences: {
    language: string;
    interests: string[];
    budget: 'budget' | 'moderate' | 'luxury';
    pace: 'relaxed' | 'moderate' | 'active';
    tripDuration: number;
}) => {
    await updateUserProfile(uid, {
        ...preferences,
        onboardingComplete: true
    });
};

// Trip functions
export const saveTrip = async (uid: string, trip: Trip) => {
    const tripRef = doc(db, 'users', uid, 'trips', trip.id || 'active_trip');
    await setDoc(tripRef, {
        ...trip,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    }, { merge: true });
};

export const getTrip = async (uid: string, tripId: string = 'active_trip'): Promise<Trip | null> => {
    const tripRef = doc(db, 'users', uid, 'trips', tripId);
    const tripSnap = await getDoc(tripRef);
    
    if (tripSnap.exists()) {
        return tripSnap.data() as Trip;
    }
    return null;
};

export const updateTrip = async (uid: string, tripId: string, updates: Partial<Trip>) => {
    const tripRef = doc(db, 'users', uid, 'trips', tripId);
    await updateDoc(tripRef, {
        ...updates,
        updatedAt: Timestamp.now()
    });
};

export const updateMissionStatus = async (uid: string, tripId: string, missionId: string, status: 'locked' | 'active' | 'completed') => {
    const tripRef = doc(db, 'users', uid, 'trips', tripId);
    const tripDoc = await getDoc(tripRef);
    
    if (!tripDoc.exists()) return;
    
    const trip = tripDoc.data() as Trip;
    const missions = trip.missions.map(m => 
        m.id === missionId ? { ...m, status } : m
    );
    
    // Calculate progress
    const completedMissions = missions.filter(m => m.status === 'completed').length;
    const totalMissions = missions.length;
    const progress = totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0;
    
    // Unlock next mission if current one is completed
    if (status === 'completed') {
        const currentMissionIndex = missions.findIndex(m => m.id === missionId);
        if (currentMissionIndex >= 0 && currentMissionIndex < missions.length - 1) {
            const nextMission = missions[currentMissionIndex + 1];
            if (nextMission.status === 'locked') {
                missions[currentMissionIndex + 1] = { ...nextMission, status: 'active' };
            }
        }
    }
    
    await updateDoc(tripRef, {
        missions,
        progress,
        updatedAt: Timestamp.now()
    });
};

export const updateTaskStatus = async (uid: string, tripId: string, missionId: string, taskId: string, completed: boolean) => {
    const tripRef = doc(db, 'users', uid, 'trips', tripId);
    const tripDoc = await getDoc(tripRef);
    
    if (!tripDoc.exists()) return;
    
    const trip = tripDoc.data() as Trip;
    const missions = trip.missions.map(mission => {
        if (mission.id === missionId) {
            const tasks = mission.tasks.map(task =>
                task.id === taskId ? { ...task, completed } : task
            );
            
            // Check if all tasks are completed
            const allTasksCompleted = tasks.every(t => t.completed);
            const newStatus = allTasksCompleted ? 'completed' : mission.status;
            
            return { ...mission, tasks, status: newStatus };
        }
        return mission;
    });
    
    // Calculate progress
    const completedMissions = missions.filter(m => m.status === 'completed').length;
    const totalMissions = missions.length;
    const progress = totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0;
    
    // Unlock next mission if current one is completed
    const completedMission = missions.find(m => m.id === missionId && m.status === 'completed');
    if (completedMission) {
        const currentMissionIndex = missions.findIndex(m => m.id === missionId);
        if (currentMissionIndex >= 0 && currentMissionIndex < missions.length - 1) {
            const nextMission = missions[currentMissionIndex + 1];
            if (nextMission.status === 'locked') {
                missions[currentMissionIndex + 1] = { ...nextMission, status: 'active' };
            }
        }
    }
    
    await updateDoc(tripRef, {
        missions,
        progress,
        updatedAt: Timestamp.now()
    });
};

// Auth state observer
export const onAuthChange = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};

export default app;
