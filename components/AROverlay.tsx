import React, { useState, useEffect } from 'react';
import { AROverlay as AROverlayType, Mission } from '../types';

interface AROverlayProps {
  mission: Mission | null;
  isActive: boolean;
  onClose: () => void;
  onCapture: (imageUrl: string) => void;
}

const AROverlay: React.FC<AROverlayProps> = ({ mission, isActive, onClose, onCapture }) => {
  const [overlayData, setOverlayData] = useState<AROverlayType | null>(null);
  const [showInfo, setShowInfo] = useState(true);

  // Historical overlay data for different missions
  useEffect(() => {
    if (!mission) return;

    // Map mission IDs to historical overlays
    const overlays: Record<string, AROverlayType> = {
      'mission_pyramids': {
        id: 'overlay_pyramids',
        missionId: mission.id,
        historicalImage: 'https://images.unsplash.com/photo-1539650116455-df8e690975bc?w=800&q=80',
        description: 'الأهرامات كما كانت قبل 4500 عام - مكسوة بالحجر الجيري الأبيض اللامع',
        year: '2500 ق.م'
      },
      'mission_khan': {
        id: 'overlay_khan',
        missionId: mission.id,
        historicalImage: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80',
        description: 'خان الخليلي في العصر المملوكي - مركز تجاري نابض بالحياة',
        year: '1400 م'
      },
      'mission_museum': {
        id: 'overlay_museum',
        missionId: mission.id,
        historicalImage: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80',
        description: 'المتحف المصري في افتتاحه الأول - كنوز توت عنخ آمون',
        year: '1922 م'
      }
    };

    setOverlayData(overlays[mission.id] || null);
  }, [mission]);

  if (!isActive || !overlayData) return null;

  const handleCapture = () => {
    if (overlayData.historicalImage) {
      onCapture(overlayData.historicalImage);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-fade-in">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-12 left-6 z-50 size-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center active:scale-95 transition-all"
      >
        <span className="material-symbols-outlined text-white">close</span>
      </button>

      {/* Info Toggle */}
      <button
        onClick={() => setShowInfo(!showInfo)}
        className="absolute top-12 right-6 z-50 size-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center active:scale-95 transition-all"
      >
        <span className="material-symbols-outlined text-white">{showInfo ? 'info' : 'info_outline'}</span>
      </button>

      {/* Historical Overlay Image */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative max-w-4xl w-full h-full flex items-center justify-center p-8">
          <div className="relative w-full h-full max-h-[80vh] rounded-3xl overflow-hidden border-4 border-primary/50 shadow-2xl">
            <img
              src={overlayData.historicalImage}
              alt="Historical view"
              className="w-full h-full object-cover opacity-80"
            />
            
            {/* Overlay Effects */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40"></div>
            
            {/* Animated particles */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-primary/30 rounded-full animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 2}s`
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      {showInfo && (
        <div className="absolute bottom-24 left-0 right-0 z-50 px-6 animate-slide-up">
          <div className="bg-gradient-to-r from-primary/90 to-amber-600/90 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-2xl max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-2xl">history</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-xl font-arabic">السفر عبر الزمن</h3>
                <p className="text-white/80 text-sm font-arabic">العام {overlayData.year}</p>
              </div>
            </div>
            <p className="text-white text-sm font-arabic leading-relaxed mb-4">
              {overlayData.description}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCapture}
                className="flex-1 bg-white text-black font-bold py-3 rounded-xl font-arabic active:scale-95 transition-all shadow-lg"
              >
                <span className="material-symbols-outlined inline-block mr-2">camera_alt</span>
                حفظ هذه الصورة
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-white/20 backdrop-blur-md text-white font-bold rounded-xl font-arabic border border-white/30 active:scale-95 transition-all"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Year Indicator */}
      <div className="absolute top-24 left-0 right-0 z-50 flex justify-center">
        <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/20">
          <p className="text-white font-bold text-lg font-arabic">{overlayData.year}</p>
        </div>
      </div>
    </div>
  );
};

export default AROverlay;

