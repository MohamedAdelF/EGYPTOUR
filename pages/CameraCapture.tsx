
import React, { useState, useRef, useEffect } from 'react';
import { Mission, PhotoAnalysis } from '../types';
import { auth, updateTaskStatus, getTrip } from '../lib/firebase';
import { analyzePhotoComparison, verifyPhotoMission } from '../lib/gemini';
import AROverlay from '../components/AROverlay';

interface CameraProps {
  mission: Mission | null;
  onComplete: () => void;
  onUpdateStats?: (xp: number, gold: number) => void;
  onTaskComplete?: (taskId: string) => void;
  tripId?: string;
}

const CameraCapture: React.FC<CameraProps> = ({ mission, onComplete, onUpdateStats, onTaskComplete, tripId = 'active_trip' }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [photoAnalysis, setPhotoAnalysis] = useState<PhotoAnalysis | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showARTimeTravel, setShowARTimeTravel] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setFeedback("فشل في تشغيل الكاميرا");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const captureAndAnalyze = async () => {
    if (!mission) return;

    setIsProcessing(true);
    setFeedback("جاري التقاط الصورة...");

    try {
      // Capture image from video
      const imageBase64 = captureFrame();
      if (!imageBase64) {
        setFeedback("فشل في التقاط الصورة");
        setIsProcessing(false);
        return;
      }

      setCapturedImage(imageBase64);
      setFeedback("جاري التحليل بالذكاء الاصطناعي...");

      // Find the first photo task that is not completed
      const photoTask = mission.tasks.find(t => t.type === 'photo' && !t.completed);

      // Verify photo matches mission requirements
      if (photoTask && photoTask.requirement) {
        const verification = await verifyPhotoMission(
          imageBase64,
          mission.title,
          photoTask.requirement
        );

        if (!verification.verified) {
          setFeedback(verification.feedback || "الصورة لا تطابق المتطلبات");
          setIsProcessing(false);
          return;
        }
      }

      // Analyze photo comparison
      setFeedback("جاري مقارنة الصورة مع 10,000 صورة أخرى...");
      const analysis = await analyzePhotoComparison(imageBase64, mission.title);
      setPhotoAnalysis(analysis);

      // If there's a photo task, mark it as completed
      if (photoTask && auth.currentUser) {
        await updateTaskStatus(auth.currentUser.uid, tripId, mission.id, photoTask.id, true);
        
        // Notify parent component
        if (onTaskComplete) {
          onTaskComplete(photoTask.id);
        }

        // Reward user for completing task
        if (onUpdateStats) {
          onUpdateStats(photoTask.xp, 0);
        }
      } else if (onUpdateStats) {
        // If no photo task, just reward for mission completion
        onUpdateStats(mission.xpReward, mission.goldReward);
      }

      // Show analysis results
      setShowAnalysis(true);
      setFeedback(null);

    } catch (error) {
      console.error("Error capturing photo:", error);
      setFeedback("حدث خطأ أثناء التحقق من الصورة");
      await new Promise(r => setTimeout(r, 2000));
      setIsProcessing(false);
    }
  };

  const handleCloseAnalysis = () => {
    setShowAnalysis(false);
    setPhotoAnalysis(null);
    setCapturedImage(null);
    onComplete();
  };

  // Photo Analysis Modal
  if (showAnalysis && photoAnalysis) {
    const getRatingColor = (rating: string) => {
      switch (rating) {
        case 'excellent': return 'from-green-600 to-emerald-600';
        case 'good': return 'from-blue-600 to-cyan-600';
        case 'average': return 'from-yellow-600 to-orange-600';
        default: return 'from-gray-600 to-gray-700';
      }
    };

    const getRatingText = (rating: string) => {
      switch (rating) {
        case 'excellent': return 'ممتاز';
        case 'good': return 'جيد';
        case 'average': return 'متوسط';
        default: return 'يحتاج تحسين';
      }
    };

    return (
      <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 animate-fade-in">
        {capturedImage && (
          <img
            src={capturedImage}
            alt="Captured"
            className="max-w-full max-h-[40vh] object-contain rounded-lg mb-6"
          />
        )}

        <div className={`bg-gradient-to-r ${getRatingColor(photoAnalysis.rating)} p-6 rounded-3xl border-2 border-white/20 shadow-2xl max-w-md w-full`}>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white font-arabic mb-2">تحليل الصورة</h2>
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl">🏆</span>
              <div>
                <p className="text-white text-3xl font-bold">Top {100 - photoAnalysis.percentile}%</p>
                <p className="text-white/80 text-sm font-arabic">من بين 10,000 صورة</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-arabic">التقييم العام</span>
              <span className="text-white font-bold">{getRatingText(photoAnalysis.rating)}</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${photoAnalysis.composition}%` }}
              />
            </div>
          </div>

          <div className="bg-white/10 rounded-2xl p-4 mb-4">
            <p className="text-white text-sm font-arabic mb-2">{photoAnalysis.feedback}</p>
            {photoAnalysis.suggestions.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-white/80 text-xs font-arabic mb-1">💡 نصائح للتحسين:</p>
                {photoAnalysis.suggestions.map((suggestion, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-white/90 font-arabic">
                    <span className="mt-0.5">•</span>
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleCloseAnalysis}
            className="w-full bg-white text-black font-bold py-4 rounded-2xl font-arabic active:scale-95 transition-all shadow-lg"
          >
            متابعة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen bg-black overflow-hidden">
      {/* Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Overlay for Mission Visual Reference */}
      <div className="absolute inset-0 pointer-events-none border-[24px] border-black/20">
        <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 aspect-square border-2 border-dashed border-primary/40 rounded-3xl" />
      </div>

      <div className="absolute top-12 left-6 right-6 flex items-center justify-between z-20">
        <button
          onClick={onComplete}
          className="size-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-white">close</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleCamera}
            className="size-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all active:scale-95"
            title="تغير الكاميرا"
          >
            <span className="material-symbols-outlined text-white">flip_camera_ios</span>
          </button>

          <div className="bg-black/60 px-4 py-2 rounded-full border border-white/10 text-[10px] font-bold tracking-widest uppercase text-white backdrop-blur-md">
            MISSION: {mission?.title}
          </div>
        </div>
      </div>

      <div className="absolute bottom-20 left-0 right-0 flex flex-col items-center gap-8 z-20">
        {feedback && (
          <div className="bg-primary/90 text-black px-6 py-2 rounded-full font-arabic text-sm font-bold animate-bounce shadow-xl">
            {feedback}
          </div>
        )}

        {/* AR Time Travel Button */}
        {mission && (mission.id === 'mission_pyramids' || mission.id === 'mission_khan' || mission.id === 'mission_museum') && (
          <button
            onClick={() => setShowARTimeTravel(true)}
            disabled={isProcessing}
            className="bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-md px-6 py-3 rounded-full text-white font-bold font-arabic border border-white/20 active:scale-95 transition-all shadow-lg flex items-center gap-2"
          >
            <span className="material-symbols-outlined">history</span>
            <span>السفر عبر الزمن</span>
          </button>
        )}

        <button
          onClick={captureAndAnalyze}
          disabled={isProcessing}
          className="size-24 rounded-full border-4 border-white/30 flex items-center justify-center transition-all active:scale-90 shadow-2xl"
        >
          <div className={`size-20 rounded-full transition-all ${isProcessing ? 'bg-gray-600 scale-90' : 'bg-white scale-100'}`}></div>
        </button>

        <p className="text-white bg-black/40 px-4 py-1 rounded-full backdrop-blur-sm font-arabic text-xs">وجه الكاميرا نحو المعلم الأثري واضغط للتحقق</p>
      </div>

      {/* AR Time Travel Overlay */}
      <AROverlay
        mission={mission}
        isActive={showARTimeTravel}
        onClose={() => setShowARTimeTravel(false)}
        onCapture={(imageUrl) => {
          setCapturedImage(imageUrl);
          setShowARTimeTravel(false);
          // Optionally save the historical image
        }}
      />
    </div>
  );
};

export default CameraCapture;
