import React, { useState, useEffect } from 'react';
import { UserStats, UserProfile } from '../types';
import { User } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

interface ProfileProps {
  stats: UserStats;
  user?: UserProfile;
  authUser?: User | null;
  onGoToStory: () => void;
  onGoToGallery: () => void;
  onLogout?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ stats, user, authUser, onGoToStory, onGoToGallery, onLogout }) => {
  const [gallery, setGallery] = useState<any[]>([]);
  const displayName = user?.name || authUser?.displayName || 'مستكشف';
  const photoURL = authUser?.photoURL || 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9GzTiGbzqHFFTw8IZ2XoqhwdAViIToZaNsm9bNXcMja1OZ9PlsZkbE7ClH0FjmMKSkn_h7Au--ZEEn92ziSoMV5NukwIgy3Z5g1itW2XZYjNDovDYdZ3qHjia29r_sl-Hpp1fgOcHRGdx-tUxTlg-7z7Us_q8Eu9qzMLD9fnqT6v7BUMrIOLdxtd5Q3mx5vC88MnRowh9wBVy7Y55fUZxCcXDkemItEWbPmCgUCTEv8FeAjio7N8MeINAcbns8zQEWCZIAlmZfss';

  // Fetch Gallery
  useEffect(() => {
    if (authUser?.uid) {
      const q = query(
        collection(db, `users/${authUser.uid}/gallery`),
        orderBy('timestamp', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        setGallery(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      return () => unsubscribe();
    }
  }, [authUser?.uid]);

  // Calculate level progress
  const xpForNextLevel = stats.level * 100;
  const xpProgress = (stats.xp % 100) / 100 * 100;

  // Badges data
  const badges = [
    { icon: 'landscape', label: 'ختم الأهرامات', earned: true },
    { icon: 'security', label: 'حامي القلعة', earned: true },
    { icon: 'sailing', label: 'مستكشف النيل', earned: true },
    { icon: 'visibility', label: 'عين حورس', earned: true },
    { icon: 'restaurant', label: 'ذواق المأكولات', earned: false },
    { icon: 'photo_camera', label: 'مصور محترف', earned: false },
  ];

  const earnedBadges = badges.filter(b => b.earned).length;

  // Selected Image State for Lightbox
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleDownloadImage = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `egyptour-capture-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed:', err);
      // Fallback for some mobile browsers: open in new tab
      window.open(url, '_blank');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0f0d0a]">
      {/* Lightbox Overlay */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4 animate-fade-in">
          {/* Close Button */}
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 size-12 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-all z-50"
          >
            <span className="material-symbols-outlined text-white text-2xl">close</span>
          </button>

          {/* Image */}
          <img
            src={selectedImage}
            alt="Full view"
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
          />

          {/* Actions Bar */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={() => handleDownloadImage(selectedImage)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-black rounded-full font-bold font-arabic active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined">download</span>
              <span>حفظ في الجهاز</span>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative pt-16 pb-8 px-6 flex flex-col items-center">
        {/* Settings Button */}
        <button className="absolute top-12 left-6 size-10 rounded-full bg-surface-dark border border-border-gold flex items-center justify-center">
          <span className="material-symbols-outlined text-white">settings</span>
        </button>

        {/* Profile Picture */}
        <div className="relative group">
          <div className="absolute -inset-2 bg-gradient-to-br from-primary to-orange-500 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
          <div
            className="relative size-28 rounded-full border-4 border-[#0f0d0a] bg-cover shadow-2xl"
            style={{ backgroundImage: `url('${photoURL}')` }}
          />
          <div className="absolute bottom-0 right-0 bg-primary text-black text-[10px] font-bold px-2 py-1 rounded-full border-2 border-[#0f0d0a]">
            Lvl {stats.level}
          </div>
        </div>

        {/* Name & Title */}
        <div className="mt-4 text-center">
          <h1 className="text-2xl font-bold font-arabic mb-2">{displayName}</h1>
          <div className="inline-flex items-center gap-2 bg-[#2d2616] px-3 py-1 rounded-full border border-white/10">
            <span className="material-symbols-outlined text-primary text-sm">workspace_premium</span>
            <span className="text-primary text-xs font-bold font-arabic">
              {stats.level >= 10 ? 'الفرعون الأعظم' :
                stats.level >= 5 ? 'الفرعون المكتشف' :
                  'مستكشف مبتدئ'}
            </span>
          </div>
        </div>

        {/* XP Progress */}
        <div className="w-full max-w-xs mt-4">
          <div className="flex items-center justify-between mb-1 text-xs">
            <span className="text-gray-400 font-arabic">المستوى {stats.level}</span>
            <span className="text-primary">{stats.xp} / {xpForNextLevel} XP</span>
          </div>
          <div className="h-2 bg-surface-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-yellow-400 rounded-full transition-all"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex gap-3 px-6 mb-8">
        {[
          { icon: 'stars', val: stats.xp, label: 'نقطة خبرة', color: 'text-primary' },
          { icon: 'explore', val: stats.unlockedSites, label: 'موقع مكتشف', color: 'text-green-400' },
          { icon: 'local_fire_department', val: stats.streak, label: 'أيام متتالية', color: 'text-orange-400' }
        ].map((s, i) => (
          <div key={i} className="flex-1 bg-white/5 p-4 rounded-2xl border border-white/5 text-center flex flex-col items-center gap-1">
            <span className={`material-symbols-outlined ${s.color} mb-1`}>{s.icon}</span>
            <p className="text-lg font-bold">{s.val}</p>
            <p className="text-[10px] text-gray-400 font-arabic">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="px-6 space-y-4 mb-8">
        <button
          onClick={onGoToStory}
          className="w-full bg-gradient-to-r from-primary/20 to-amber-500/20 border border-primary/30 p-4 rounded-2xl flex items-center justify-between group active:scale-95 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">auto_stories</span>
            <span className="text-sm font-bold font-arabic">قصة رحلتي</span>
          </div>
          <span className="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform rtl:rotate-180">arrow_forward</span>
        </button>

        <button
          onClick={onGoToGallery}
          className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between group active:scale-95 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-blue-400">photo_library</span>
            <span className="text-sm font-bold font-arabic">معرض الصور</span>
          </div>
          <span className="material-symbols-outlined text-gray-400 group-hover:translate-x-1 transition-transform rtl:rotate-180">arrow_forward</span>
        </button>

        <button className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between group active:scale-95 transition-all">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-purple-400">history</span>
            <span className="text-sm font-bold font-arabic">سجل الرحلات</span>
          </div>
          <span className="material-symbols-outlined text-gray-400 group-hover:translate-x-1 transition-transform rtl:rotate-180">arrow_forward</span>
        </button>
      </div>

      {/* Gallery Section */}
      {gallery.length > 0 && (
        <div className="px-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold font-arabic">معرض صوري</h3>
            <span className="text-xs text-primary font-bold">{gallery.length} صورة</span>
          </div>
          <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
            {gallery.map((photo, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(photo.url)}
                className="flex-shrink-0 relative group active:scale-95 transition-transform"
              >
                <img
                  src={photo.url}
                  alt="User capture"
                  className="w-32 h-32 object-cover rounded-2xl border border-white/10"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-white">fullscreen</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      <div className="px-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold font-arabic">الأوسمة المكتسبة</h3>
          <span className="text-xs text-primary font-bold">{earnedBadges} / {badges.length}</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {badges.map((b, i) => (
            <div
              key={i}
              className={`p-4 rounded-2xl flex flex-col items-center text-center gap-2 transition-all ${b.earned
                ? 'bg-white/5 border border-white/5'
                : 'bg-gray-900/50 border border-gray-800 opacity-50'
                }`}
            >
              <div className={`p-2 rounded-full ${b.earned
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'bg-gray-800 text-gray-600'
                }`}>
                <span className="material-symbols-outlined text-2xl">{b.icon}</span>
              </div>
              <span className={`text-[10px] font-bold font-arabic ${b.earned ? 'text-gray-200' : 'text-gray-600'}`}>
                {b.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Logout Button */}
      {onLogout && (
        <div className="px-6 pb-32">
          <button
            onClick={onLogout}
            className="w-full bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-center justify-center gap-2 text-red-400 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-bold font-arabic">تسجيل الخروج</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Profile;
