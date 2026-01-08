import React, { useState, useEffect, useRef, useCallback } from 'react';
import EyeOfHorus from '../components/icons/EyeOfHorus';
import { GoogleGenAI, Modality } from '@google/genai';
import { UserProfile, Mission } from '../types';
import { storage, db, auth } from '../lib/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';


// Generate ID helper
const generateId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);

interface LiveGuideProps {
  onBack: () => void;
  onUpdateStats?: (xp: number, gold: number) => void;
  mission?: Mission | null;
  user?: UserProfile;
}

interface SessionStats {
  duration: number;
  topicsDiscussed: string[];
  photosAdvised: number;
  xpEarned?: number;
}

const LiveGuide: React.FC<LiveGuideProps> = ({ onBack, onUpdateStats, mission, user }) => {
  console.log("LiveGuide Component Mounted");
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Determine language (default to 'ar' if not specified)
  const lang = user?.language || 'ar';
  const isArabic = lang === 'ar';
  const [transcription, setTranscription] = useState<string[]>([]);
  const [sessionTime, setSessionTime] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    duration: 0,
    topicsDiscussed: [],
    photosAdvised: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Start camera on mount or when facingMode changes
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      cleanupSession();
    };
  }, [facingMode]);

  // Session timer
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  // Toast Timer
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} `;
  };

  const startCamera = async () => {
    try {
      stopCamera(); // Stop existing stream before switching
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("لم نتمكن من الوصول إلى الكاميرا. يرجى السماح بالوصول.");
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Ultra-Stable Speech Helper
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window) || !text) return;

    // First, clear any queue
    window.speechSynthesis.cancel();

    // Split text into chunks (by punctuation)
    const chunks = text.match(/[^.!?،؟]+[.!?،؟]*/g) || [text];
    let currentIndex = 0;

    const processQueue = () => {
      if (currentIndex >= chunks.length) {
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[currentIndex].trim());
      utterance.lang = /[\u0600-\u06FF]/.test(text) ? 'ar-EG' : 'en-US';
      utterance.volume = 1.0;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        currentIndex++;
        // Use a tiny delay to help the browser process the next chunk
        setTimeout(processQueue, 50);
      };

      utterance.onerror = (e) => {
        if (e.error !== 'canceled') {
          console.warn("Speech synthesis info:", e.error);
        }
        // If it's a real error, try the next chunk or stop
        if (e.error === 'network' || e.error === 'not-allowed') {
          setIsSpeaking(false);
        } else {
          currentIndex++;
          setTimeout(processQueue, 50);
        }
      };

      window.speechSynthesis.speak(utterance);
    };

    // Small timeout to ensure cancel() finished
    setTimeout(processQueue, 150);
  };

  // Pre-load voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      const handleVoicesChanged = () => window.speechSynthesis.getVoices();
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      return () => window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
    }
  }, []);

  const startSession = () => {
    // Unlocking the audio queue
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      // Prime with a very short, silent word to "awaken" the system on Mac/Safari
      const prime = new SpeechSynthesisUtterance(' ');
      prime.volume = 0;
      window.speechSynthesis.speak(prime);
    }

    setIsConnecting(true);
    setError(null);
    setTranscription([]);
    setSessionTime(0);

    // Call async part
    startFallbackSession();
  };

  const startFallbackSession = async () => {
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
      const ai = new GoogleGenAI({ apiKey });

      setIsActive(true);
      setIsConnecting(false);

      // Welcome message
      const welcomeMsg = isArabic
        ? 'مرحباً! أنا "فرعون"، مرشدك الشخصي. 🏛️\nجاهز لتحليل ما تراه.. التقط صورة أو اسألني!'
        : 'Hello! I am "Pharaoh", your personal guide. 🏛️\nReady to analyze what you see.. Snap a photo or ask me!';

      setTranscription([welcomeMsg]);

      // Speak welcome message (now called after user gesture priming)
      const welcomeText = isArabic ? 'مرحباً! أنا فرعون، مرشدك الشخصي.' : 'Hello! I am Pharaoh, your personal guide.';
      speakText(welcomeText);

      // Store AI instance for interactions
      sessionRef.current = { ai, isTextMode: true };

    } catch (err) {
      console.error('Fallback session error:', err);
      setError('فشل في بدء الجلسة. تأكد من مفتاح API.');
      setIsConnecting(false);
    }
  };

  const captureFrameBase64 = (): string | null => {
    if (!canvasRef.current || !videoRef.current) return null;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Return full data URL for Gemini generateContent
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  // Capture Photo and Save to Firebase
  const handleCapturePhoto = async () => {
    if (!auth.currentUser) {
      setToastMessage("يجب تسجيل الدخول لحفظ الصور");
      return;
    }

    setIsSaving(true);
    const imageBase64 = captureFrameBase64();
    if (!imageBase64) {
      setIsSaving(false);
      return;
    }

    try {
      // 1. Upload to Storage
      const storageRef = ref(storage, `users / ${auth.currentUser.uid} /gallery/${generateId()}.jpg`);
      await uploadString(storageRef, imageBase64, 'data_url');
      const downloadURL = await getDownloadURL(storageRef);

      // 2. Save metadata to Firestore
      await addDoc(collection(db, `users / ${auth.currentUser.uid}/gallery`), {
        url: downloadURL,
        timestamp: serverTimestamp(),
        missionId: mission?.id || null,
        location: mission?.location?.name || 'Unknown',
        type: 'user_capture'
      });

      setToastMessage("تم حفظ الصورة في المعرض! 📸");

      // Optionally analyze the photo automatically
      // sendPrompt("لقد التقطت هذه الصورة، ما رأيك فيها؟");

    } catch (err) {
      console.error("Error saving photo:", err);
      setToastMessage("فشل حفظ الصورة");
      setError("حدث خطأ أثناء حفظ الصورة");
    } finally {
      setIsSaving(false);
    }
  };

  // Send a text prompt with current image
  const sendPrompt = async (prompt: string) => {
    if (!sessionRef.current || !prompt.trim()) return;

    setIsSpeaking(true);
    // Add user's question to chat
    setTranscription(prev => [...prev.slice(-9), `👤 ${prompt}`]);
    setUserQuestion(''); // Clear input

    try {
      // Capture current image
      const imageBase64 = captureFrameBase64();

      const safetyPrompt = `
      You are "Pharaoh", an expert Egyptian tour guide.
      Analyze the attached image carefully.
      ${mission ? `User is currently at: ${mission.title}` : ''}
      
      User Question: ${prompt}
      User Language: ${isArabic ? 'Arabic' : 'English'} (Reply in this language)
      
      If the image shows a monument, explain it naturally and enthusiastically.
      If unclear, ask for clarification.
      Keep it brief and engaging.`;

      // Prepare content parts
      const parts: any[] = [{ text: safetyPrompt }];

      if (imageBase64) {
        // Remove header for API
        const base64Data = imageBase64.split(',')[1];
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Data
          }
        });
      }

      const response = await sessionRef.current.ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: parts }],
      });

      const text = response.text || (isArabic ? 'عذراً، لم أتمكن من رؤية ذلك بوضوح.' : 'Sorry, could not see that clearly.');

      // Add AI response
      setTranscription(prev => [...prev.slice(-9), `🏛️ ${text}`]);

      // Speak response
      speakText(text);

    } catch (err) {
      console.error('Prompt error:', err);
      setTranscription(prev => [...prev, '⚠️ حدث خطأ، حاول مرة أخرى.']);
      setIsSpeaking(false);
    }
  };

  const handleMicClick = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('الميكروفون غير مدعوم في هذا المتصفح');
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'ar-EG';
    recognition.start();

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      sendPrompt(transcript);
    };
  };

  // Enhanced Summary Logic with real AI
  const generateSessionSummary = async () => {
    setIsSummarizing(true);

    // Calculate Base Stats
    const durationMins = Math.ceil(sessionTime / 60);
    const messagesCount = transcription.filter(t => t.startsWith('👤')).length;
    const xpEarned = (durationMins * 10) + (messagesCount * 5);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
      const ai = new GoogleGenAI({ apiKey });

      const history = transcription.join('\n');
      const promptText = `بناءً على المحادثة التالية بين مرشد سياحي فني ومستخدم، لخص أهم 3 نقاط تمت مناقشتها في جمل قصيرة جداً ومبهرة (بحد أقصى 5 كلمات للجملة). 
      اجعلها تبدأ بأفعال مثل (اكتشفنا، عرفنا، استكشفنا). 
      المحادثة:
      ${history}`;

      const result = await ai.models.generateContent({
        model: "gemini-2.0-flash", // Use the supported 2.0 model
        contents: [{ role: "user", parts: [{ text: promptText }] }]
      });

      const aiSummary = result.text || "";

      // Clean up the points
      const topics = aiSummary
        .split('\n')
        .map(line => line.replace(/^[0-9.*•-]\s*/, '').trim())
        .filter(line => line.length > 5)
        .slice(0, 3);

      setSessionStats({
        duration: sessionTime,
        topicsDiscussed: topics.length > 0 ? topics : [isArabic ? 'استكشاف المعالم الأثرية' : 'Exploring monuments'],
        photosAdvised: Math.floor(messagesCount / 1.5),
        xpEarned,
      });
    } catch (err) {
      console.error("Summary AI error:", err);
      // Fallback stats if AI fails
      setSessionStats({
        duration: sessionTime,
        topicsDiscussed: [isArabic ? 'رحلة معرفية ممتعة' : 'Insightful journey'],
        photosAdvised: 1,
        xpEarned,
      });
    } finally {
      setIsSummarizing(false);

      // Update persistent stats in Firebase - ALWAYS call this regardless of AI summary success
      if (onUpdateStats && xpEarned > 0) {
        console.log(`Pushing rewards to Firebase: ${xpEarned} XP`);
        onUpdateStats(xpEarned, Math.floor(xpEarned / 10));
      }
    }
  };

  const cleanupSession = () => {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    setIsSpeaking(false);
  };

  const handleEndSession = async () => {
    cleanupSession();

    // Show summary if session was active
    if (isActive && sessionTime > 5) {
      setShowSummary(true);
      await generateSessionSummary();
    } else {
      onBack();
    }
  };

  const handleCloseSummary = () => {
    setShowSummary(false);
    onBack();
  };

  // Session Summary Modal with Visualization
  if (showSummary) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in p-6">

        {/* Success Visualization (Pulsing Brain / Network) */}
        <div className="relative mb-8">
          <div className="size-32 rounded-full bg-primary/20 animate-ping absolute inset-0" />
          <div className="size-32 rounded-full bg-gradient-to-tr from-primary to-amber-600 flex items-center justify-center shadow-[0_0_50px_rgba(244,175,37,0.6)] relative z-10">
            <span className="material-symbols-outlined text-5xl text-white">psychology</span>
          </div>
          {/* Orbiting particles */}
          <div className="absolute inset-0 animate-spin-slow">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 size-3 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50" />
            <div className="absolute bottom-0 right-1/4 translate-y-2 size-2 bg-green-400 rounded-full shadow-lg shadow-green-400/50" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white font-arabic mb-2">تم تحديث المعرفة!</h2>
        <p className="text-gray-400 font-arabic mb-8 text-center max-w-xs">
          لقد قمت برحلة معرفية رائعة. إليك ملخص ما تعلمته.
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center gap-2">
            <span className="text-2xl font-bold text-primary">+{sessionStats.xpEarned || 50}</span>
            <span className="text-xs text-gray-400 font-arabic">نقاط خبرة XP</span>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center gap-2">
            <span className="text-2xl font-bold text-white">{formatTime(sessionStats.duration)}</span>
            <span className="text-xs text-gray-400 font-arabic">مدة الجولة</span>
          </div>
        </div>

        {/* AI Written Summary */}
        <div className="w-full max-w-sm bg-white/5 rounded-2xl p-5 border border-white/10 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-transparent" />
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
            <span className="text-sm font-bold text-white font-arabic">ملخص الذكاء الاصطناعي</span>
          </div>
          <div className="space-y-2">
            {isSummarizing ? (
              <div className="flex flex-col gap-2 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-4 bg-white/10 rounded w-1/2" />
              </div>
            ) : sessionStats.topicsDiscussed.length > 0 ? (
              sessionStats.topicsDiscussed.map((topic, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-300 font-arabic animate-slide-up" style={{ animationDelay: `${i * 150}ms` }}>
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="leading-tight">{topic}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 font-arabic">لم يتم تسجيل مواضيع محددة، لكنك استكشفت المنطقة بنجاح.</p>
            )}
          </div>
        </div>

        <button
          onClick={handleCloseSummary}
          className="w-full max-w-sm py-4 bg-gradient-to-r from-primary to-amber-500 text-black font-bold rounded-2xl font-arabic shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span>متابعة الرحلة</span>
          <span className="material-symbols-outlined rtl:rotate-180">arrow_forward</span>
        </button>

      </div>
    );
  }

  // Suggestion Chips
  const suggestions = [
    'ما هذا المعلم؟ 🏛️',
    'احكِ قصة تاريخية 📜',
    'كيف التقط صورة رائعة؟ 📸',
    'من بنى هذا؟ 🏗️',
    'ما سر هذا المكان؟ 🗝️'
  ];

  return (
    <div className="relative h-screen bg-black overflow-hidden">
      {/* Video Feed */}
      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
      <canvas ref={canvasRef} className="hidden" />

      {/* Gradient Overlay - Bottom to Top Fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 pt-12 z-20">
        <div className="flex items-center justify-between">
          <button
            onClick={handleEndSession}
            className="size-11 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-red-500/20 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-white">close</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleCamera}
              className="size-11 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/10 transition-all active:scale-95"
              title="تغيير الكاميرا"
            >
              <span className="material-symbols-outlined text-white">flip_camera_ios</span>
            </button>

            <div className={`px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-md border ${isActive ? 'bg-green-500/80' : 'bg-gray-500/80'}`}>
              <div className={`size-2 rounded-full ${isActive ? 'bg-white animate-pulse' : 'bg-gray-300'}`} />
              <span className="text-white text-xs font-bold font-arabic">{isActive ? 'متصل' : 'غير متصل'}</span>
              {isActive && <span className="text-white/80 text-xs font-mono">{formatTime(sessionTime)}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area - Bottom with Fade Mask */}
      {/* Using mask-image to fade out the top of the chat text */}
      <div
        className="absolute bottom-40 left-4 right-4 max-h-[35vh] overflow-y-auto no-scrollbar space-y-3 z-10 flex flex-col pb-2"
        style={{ maskImage: 'linear-gradient(to bottom, transparent, black 20%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20%)' }}
      >
        {transcription.map((text, i) => (
          <div key={i} className={`p-3 rounded-2xl border backdrop-blur-md font-arabic text-sm animate-fade-in shadow-lg ${text.startsWith('👤')
            ? 'bg-primary/20 border-primary/30 text-white self-end mr-8 rounded-tr-none'
            : 'bg-black/60 border-white/10 text-white/95 mr-0 ml-8 rounded-tl-none'
            }`}>
            <p className="leading-relaxed whitespace-pre-wrap">{text}</p>
          </div>
        ))}
        {/* Invisible spacer to scroll to bottom */}
        <div className="h-2" />
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-green-500/90 text-white px-6 py-3 rounded-full font-arabic shadow-xl z-50 animate-fade-in flex items-center gap-2">
          <span className="material-symbols-outlined">check_circle</span>
          {toastMessage}
        </div>
      )}

      {/* Controls & Suggestions */}
      {isActive ? (
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 z-20 flex flex-col gap-3 bg-gradient-to-t from-black via-black/95 to-transparent">

          {/* Suggestions Scroll (Chips) */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
            {suggestions.map((prompt, i) => (
              <button
                key={i}
                onClick={() => sendPrompt(prompt)}
                disabled={isSpeaking}
                className="whitespace-nowrap px-4 py-2 bg-white/10 hover:bg-primary/20 backdrop-blur-xl rounded-full text-white text-xs font-arabic border border-white/10 active:scale-95 transition-all shadow-sm"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="flex gap-3 items-center">
            {/* Capture Photo Button */}
            <button
              onClick={handleCapturePhoto}
              disabled={isSaving}
              className="size-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center active:scale-95 transition-all shadow-lg group relative overflow-hidden"
            >
              {isSaving ? (
                <span className="material-symbols-outlined text-white animate-spin">progress_activity</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-white z-10">camera_alt</span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                </>
              )}
            </button>

            <input
              type="text"
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              placeholder="اسأل فرعون..."
              className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white text-sm font-arabic placeholder-gray-400 focus:outline-none focus:border-primary/50 focus:bg-white/15 transition-all"
              onKeyPress={(e) => e.key === 'Enter' && sendPrompt(userQuestion)}
            />

            {/* Mic / Send Button */}
            {userQuestion.trim() ? (
              <button
                onClick={() => sendPrompt(userQuestion)}
                className="size-12 rounded-full bg-primary flex items-center justify-center active:scale-95 transition-all shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined text-background-dark">send</span>
              </button>
            ) : (
              <button
                onClick={handleMicClick}
                className="size-12 rounded-full bg-primary flex items-center justify-center active:scale-95 transition-all shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined text-background-dark text-xl">mic</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Start Button */
        !isConnecting && !error && (
          <div className="absolute bottom-10 left-0 right-0 flex justify-center z-30">
            <button
              onClick={startSession}
              className="bg-primary text-background-dark font-bold px-8 py-4 rounded-full font-arabic shadow-xl shadow-primary/20 flex items-center gap-3 animate-bounce"
            >
              <span>بدء المحادثة</span>
              <EyeOfHorus size={24} color="black" />
            </button>
          </div>
        )
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute center inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="bg-surface-dark p-6 rounded-2xl border border-red-500/50 text-center">
            <p className="text-white font-arabic mb-4">{error}</p>
            <button onClick={() => setError(null)} className="px-6 py-2 bg-white/10 rounded-full text-white font-arabic">حسناً</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveGuide;
