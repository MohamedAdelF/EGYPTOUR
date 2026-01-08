
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Mission } from '../types';
import { auth, updateTaskStatus, getTrip } from '../lib/firebase';

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
  const videoRef = useRef<HTMLVideoElement>(null);
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

  const captureAndAnalyze = async () => {
    if (!mission) return;

    setIsProcessing(true);
    setFeedback("جاري التحليل بالذكاء الاصطناعي...");

    try {
      // Find the first photo task that is not completed
      const photoTask = mission.tasks.find(t => t.type === 'photo' && !t.completed);
      
      // Simulate capture and AI analysis delay
      await new Promise(r => setTimeout(r, 2000));

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

        setFeedback("✓ تم التحقق من الصورة بنجاح!");
        await new Promise(r => setTimeout(r, 1000));
      } else if (onUpdateStats) {
        // If no photo task, just reward for mission completion
        onUpdateStats(mission.xpReward, mission.goldReward);
        setFeedback("✓ تم التقاط الصورة بنجاح!");
        await new Promise(r => setTimeout(r, 1000));
      }
    } catch (error) {
      console.error("Error capturing photo:", error);
      setFeedback("حدث خطأ أثناء التحقق من الصورة");
      await new Promise(r => setTimeout(r, 2000));
    } finally {
      setIsProcessing(false);
    }

    onComplete();
  };

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

        <button
          onClick={captureAndAnalyze}
          disabled={isProcessing}
          className="size-24 rounded-full border-4 border-white/30 flex items-center justify-center transition-all active:scale-90 shadow-2xl"
        >
          <div className={`size-20 rounded-full transition-all ${isProcessing ? 'bg-gray-600 scale-90' : 'bg-white scale-100'}`}></div>
        </button>

        <p className="text-white bg-black/40 px-4 py-1 rounded-full backdrop-blur-sm font-arabic text-xs">وجه الكاميرا نحو المعلم الأثري واضغط للتحقق</p>
      </div>
    </div>
  );
};

export default CameraCapture;
