import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Trip, UserProfile } from '../types';
import { db, auth, saveTrip, completeOnboarding } from '../lib/firebase';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface OnboardingProps {
    onComplete: (trip: Trip) => void;
    user: UserProfile;
    setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

interface OnboardingQuestion {
    id: string;
    question: string;
    type: 'single' | 'multiple' | 'text';
    options?: { value: string; label: string; icon: string }[];
    field: keyof UserProfile | 'tripDuration';
}

const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
    {
        id: 'language',
        question: 'مرحباً! أنا مرشدك الشخصي 🏛️\nبأي لغة تفضل أن نتحدث؟',
        type: 'single',
        field: 'language',
        options: [
            { value: 'ar', label: 'العربية', icon: '🇪🇬' },
            { value: 'en', label: 'English', icon: '🇬🇧' },
            { value: 'fr', label: 'Français', icon: '🇫🇷' },
            { value: 'es', label: 'Español', icon: '🇪🇸' },
            { value: 'de', label: 'Deutsch', icon: '🇩🇪' },
            { value: 'it', label: 'Italiano', icon: '🇮🇹' },
        ]
    },
    {
        id: 'duration',
        question: 'رائع! كم يوماً ستقضي في رحلتك المصرية؟',
        type: 'single',
        field: 'tripDuration',
        options: [
            { value: '1', label: 'يوم واحد', icon: '⚡' },
            { value: '3', label: '٣ أيام', icon: '🌟' },
            { value: '5', label: '٥ أيام', icon: '✨' },
            { value: '7', label: 'أسبوع', icon: '🏆' },
        ]
    },
    {
        id: 'interests',
        question: 'ما الذي يثير اهتمامك أكثر؟\nاختر كل ما ينطبق 👇',
        type: 'multiple',
        field: 'interests',
        options: [
            { value: 'history', label: 'التاريخ والآثار', icon: '🏛️' },
            { value: 'food', label: 'الطعام المحلي', icon: '🍽️' },
            { value: 'culture', label: 'الثقافة والفنون', icon: '🎭' },
            { value: 'adventure', label: 'المغامرة', icon: '🐪' },
            { value: 'shopping', label: 'التسوق', icon: '🛍️' },
            { value: 'photography', label: 'التصوير', icon: '📸' },
            { value: 'nature', label: 'الطبيعة', icon: '🌴' },
            { value: 'nightlife', label: 'الحياة الليلية', icon: '🌙' },
        ]
    },
    {
        id: 'budget',
        question: 'ما هي ميزانيتك للرحلة؟',
        type: 'single',
        field: 'budget',
        options: [
            { value: 'budget', label: 'اقتصادية', icon: '💰' },
            { value: 'moderate', label: 'متوسطة', icon: '💎' },
            { value: 'luxury', label: 'فاخرة', icon: '👑' },
        ]
    },
    {
        id: 'pace',
        question: 'كيف تفضل وتيرة رحلتك؟',
        type: 'single',
        field: 'pace',
        options: [
            { value: 'relaxed', label: 'مريحة وهادئة', icon: '🧘' },
            { value: 'moderate', label: 'متوازنة', icon: '⚖️' },
            { value: 'active', label: 'نشيطة ومليئة', icon: '🏃' },
        ]
    }
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, user, setUser }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({
        language: 'ar',
        tripDuration: '3',
        interests: [],
        budget: 'moderate',
        pace: 'moderate'
    });
    const [aiResponse, setAiResponse] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const chatRef = useRef<HTMLDivElement>(null);

    const currentQuestion = ONBOARDING_QUESTIONS[currentStep];
    const isLastQuestion = currentStep === ONBOARDING_QUESTIONS.length - 1;
    const progress = ((currentStep + 1) / ONBOARDING_QUESTIONS.length) * 100;

    // Animate AI response typing
    useEffect(() => {
        if (currentQuestion) {
            setIsTyping(true);
            setAiResponse('');

            const text = currentQuestion.question;
            let index = 0;

            const timer = setInterval(() => {
                if (index < text.length) {
                    setAiResponse(text.substring(0, index + 1));
                    index++;
                } else {
                    setIsTyping(false);
                    clearInterval(timer);
                }
            }, 30);

            return () => clearInterval(timer);
        }
    }, [currentStep]);

    // Scroll to bottom when new content
    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [aiResponse, currentStep]);

    const handleSelect = (value: string) => {
        if (currentQuestion.type === 'multiple') {
            const current = answers[currentQuestion.field] || [];
            if (current.includes(value)) {
                setAnswers({ ...answers, [currentQuestion.field]: current.filter((v: string) => v !== value) });
            } else {
                setAnswers({ ...answers, [currentQuestion.field]: [...current, value] });
            }
        } else {
            setAnswers({ ...answers, [currentQuestion.field]: value });
        }
    };

    const isSelected = (value: string) => {
        if (currentQuestion.type === 'multiple') {
            return (answers[currentQuestion.field] || []).includes(value);
        }
        return answers[currentQuestion.field] === value;
    };

    const canProceed = () => {
        if (currentQuestion.type === 'multiple') {
            return (answers[currentQuestion.field] || []).length > 0;
        }
        return !!answers[currentQuestion.field];
    };

    const handleNext = async () => {
        if (isLastQuestion) {
            await generateTrip();
        } else {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = async () => {
        // Use default answers and generate trip
        await generateTrip();
    };

    const generateTrip = async () => {
        setIsGenerating(true);
        setGenerationProgress(0);

        // Update user profile with answers
        setUser(prev => ({
            ...prev,
            language: answers.language,
            interests: answers.interests,
            budget: answers.budget,
            pace: answers.pace
        }));

        // Simulate progress
        const progressInterval = setInterval(() => {
            setGenerationProgress(prev => {
                if (prev >= 90) {
                    clearInterval(progressInterval);
                    return prev;
                }
                return prev + Math.random() * 15;
            });
        }, 500);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

            const prompt = `أنت مخطط رحلات خبير في مصر. بناءً على التفضيلات التالية، أنشئ خطة رحلة مفصلة:

التفضيلات:
- مدة الرحلة: ${answers.tripDuration} أيام
- الاهتمامات: ${answers.interests.join(', ')}
- الميزانية: ${answers.budget === 'budget' ? 'اقتصادية' : answers.budget === 'moderate' ? 'متوسطة' : 'فاخرة'}
- وتيرة الرحلة: ${answers.pace === 'relaxed' ? 'مريحة' : answers.pace === 'moderate' ? 'متوازنة' : 'نشيطة'}

أنشئ خطة رحلة بصيغة JSON التالية:
{
  "id": "trip_1",
  "title": "عنوان الرحلة بالعربية",
  "days": عدد الأيام,
  "progress": 0,
  "missions": [
    {
      "id": "mission_1",
      "day": 1,
      "title": "اسم المهمة",
      "description": "وصف المهمة",
      "status": "active" أو "locked",
      "xpReward": رقم بين 50 و 150,
      "goldReward": رقم بين 10 و 50,
      "difficulty": "Easy" أو "Medium" أو "Hard",
      "imageUrl": "https://images.unsplash.com/photo-1539650116455-df8e690975bc?w=400&q=80",
      "location": {
        "lat": خط العرض,
        "lng": خط الطول,
        "name": "اسم الموقع"
      },
      "tasks": [
        {
          "id": "task_1",
          "type": "photo" أو "quiz" أو "ar" أو "check",
          "label": "وصف المهمة الفرعية",
          "xp": رقم بين 10 و 50,
          "completed": false,
          "requirement": "متطلبات المهمة إن وجدت"
        }
      ]
    }
  ]
}

اجعل المهمة الأولى فقط "active" والباقي "locked".
أضف 3-5 مهام لكل يوم.
استخدم مواقع حقيقية في مصر مع إحداثيات صحيحة.
رد بـ JSON فقط بدون أي نص إضافي.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: prompt
            });

            const text = response.text || '';

            // Extract JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            // Parse AI Response
            if (!jsonMatch) {
                throw new Error('Failed to parse trip: No JSON found in AI response.');
            }
            const trip = JSON.parse(jsonMatch[0]) as Trip;

            // Set remaining progress to 100
            setGenerationProgress(100);
            clearInterval(progressInterval);

            // Update user profile locally and in Firestore
            const updatedProfile = {
                ...user,
                language: answers.language,
                interests: answers.interests,
                budget: answers.budget,
                pace: answers.pace,
                onboardingComplete: true
            };
            setUser(updatedProfile);

            if (auth.currentUser) {
                try {
                    // Update user profile
                    const userRef = doc(db, 'users', auth.currentUser.uid);
                    await setDoc(userRef, {
                        ...updatedProfile,
                        updatedAt: serverTimestamp()
                    }, { merge: true });

                    // Complete onboarding
                    await completeOnboarding(auth.currentUser.uid, {
                        language: answers.language,
                        interests: answers.interests,
                        budget: answers.budget as 'budget' | 'moderate' | 'luxury',
                        pace: answers.pace as 'relaxed' | 'moderate' | 'active',
                        tripDuration: parseInt(answers.tripDuration) || 3
                    });

                    // Save trip to Firebase
                    await saveTrip(auth.currentUser.uid, trip);
                } catch (error) {
                    console.error("Error saving trip:", error);
                }
            }

            setTimeout(() => {
                onComplete(trip);
            }, 500);

        } catch (error) {
            console.error('Error generating trip:', error);

            // Fallback to default trip
            const defaultTrip: Trip = {
                id: 'default_trip',
                title: 'مغامرة القاهرة التاريخية',
                days: parseInt(answers.tripDuration) || 3,
                progress: 0,
                missions: [
                    {
                        id: 'mission_pyramids',
                        day: 1,
                        title: 'أهرامات الجيزة',
                        description: 'استكشف عجائب الدنيا القديمة واكتشف أسرار الفراعنة',
                        status: 'active',
                        xpReward: 100,
                        goldReward: 30,
                        difficulty: 'Medium',
                        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxxq-yfmIMGbJC5yNyXNIWxk_ss1bEGilVzU_Ho3_sg_CpzQyl3zK8rOhJrBc9178k7AsKBngSsMyp9KQwx8EZluoMinH_YwX9f0zoa8DIodlfIWr92_uDUOJo_MR9CgK_XOT5zGqD0UAFEeoAblAlM9uYupgGRSD3qbob0Fp7PvgBZ36wWMXkDPiVNC9KjTXatL3_Y2FFdwkcx57hiIT8eMFg2wAl_076BGWuu-J4m1k7Bdp5S1QyI_8WUnf5oZwfGhSZEKxa2cY',
                        location: { lat: 29.9792, lng: 31.1342, name: 'هضبة الجيزة' },
                        tasks: [
                            { id: 't1', type: 'photo', label: 'التقط صورة للأهرامات الثلاثة', xp: 30, completed: false, requirement: 'يجب أن تظهر الأهرامات الثلاثة في الصورة' },
                            { id: 't2', type: 'ar', label: 'اجمع الرموز الهيروغليفية', xp: 25, completed: false },
                            { id: 't3', type: 'quiz', label: 'اختبار عن تاريخ الأهرامات', xp: 20, completed: false },
                            { id: 't4', type: 'check', label: 'زر أبو الهول', xp: 25, completed: false },
                        ]
                    },
                    {
                        id: 'mission_khan',
                        day: 1,
                        title: 'خان الخليلي',
                        description: 'تجول في أقدم أسواق الشرق وتذوق القهوة المصرية',
                        status: 'locked',
                        xpReward: 80,
                        goldReward: 25,
                        difficulty: 'Easy',
                        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7d6HmqxqCSg0VptC0gemCAXhrvgOr7NfMmvZLAEOSWc9-6zUlzSiTIDMHpHBks1zdtGlLnQSZBwD1kS30gdN42WGpBtzwP1nGy06yNdhu5uol0RZhlJYigtxusISRHmCIfqMXMUMK68LN9PnIGI0nuhhwaU1fv1yHHOwidSEDaSo3KUvIXoE1KEfN9gaLIDsgbABzGBU_fy6tiSeRU2-DbdcQV--VOBwE0lLGGgQYNDnwvSPG9PgSkZPTCrUHnJG-7NrbO4Z9xh4',
                        location: { lat: 30.0477, lng: 31.2625, name: 'خان الخليلي' },
                        tasks: [
                            { id: 't5', type: 'photo', label: 'صور بوابة الغوري', xp: 20, completed: false },
                            { id: 't6', type: 'check', label: 'اشرب قهوة في مقهى الفيشاوي', xp: 30, completed: false },
                            { id: 't7', type: 'quiz', label: 'اختبار عن تاريخ السوق', xp: 30, completed: false },
                        ]
                    },
                    {
                        id: 'mission_museum',
                        day: 2,
                        title: 'المتحف المصري الكبير',
                        description: 'اكتشف كنوز توت عنخ آمون وآلاف القطع الأثرية',
                        status: 'locked',
                        xpReward: 120,
                        goldReward: 40,
                        difficulty: 'Medium',
                        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-k6Gv1TNl7JRAZfnzDUBwkNrMgjm4SjJbTRUKUjIYyc8cRjJQTygdgHJ_La9-4W57m2b3fh9ujqMeJvKuWeU-qo0Aem-Nl0P6ZfbaJs76C90bVFGoLLAXSWgEEASKMlhMdLBEEGejkDsbiCLx3Ti74uRTwoZ0ZgTdMKGfDbpZ2wYh1lOIKRbQGyTYb4lqFBNYpEzzNfyjvR2OZFJTweSX64RLpXfuz_FkypSZIUTwag6i_Nlji5g-jl3utCU_BFdPEN7sS0PT2wM',
                        location: { lat: 29.9958, lng: 31.1181, name: 'المتحف المصري الكبير' },
                        tasks: [
                            { id: 't8', type: 'photo', label: 'قناع توت عنخ آمون', xp: 40, completed: false },
                            { id: 't9', type: 'ar', label: 'اجمع رموز الآلهة المصرية', xp: 35, completed: false },
                            { id: 't10', type: 'quiz', label: 'اختبار الآثار المصرية', xp: 25, completed: false },
                            { id: 't11', type: 'check', label: 'شاهد المومياوات الملكية', xp: 20, completed: false },
                        ]
                    }
                ]
            };

            setGenerationProgress(100);
            
            // Save default trip to Firebase
            if (auth.currentUser) {
                try {
                    await saveTrip(auth.currentUser.uid, defaultTrip);
                    await completeOnboarding(auth.currentUser.uid, {
                        language: answers.language,
                        interests: answers.interests,
                        budget: answers.budget as 'budget' | 'moderate' | 'luxury',
                        pace: answers.pace as 'relaxed' | 'moderate' | 'active',
                        tripDuration: parseInt(answers.tripDuration) || 3
                    });
                } catch (error) {
                    console.error("Error saving default trip:", error);
                }
            }
            
            setTimeout(() => {
                clearInterval(progressInterval);
                onComplete(defaultTrip);
            }, 500);
        }
    };

    // Generation Loading Screen
    if (isGenerating) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background-dark p-8">
                {/* Animated Background */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-primary/5 rounded-full blur-3xl animate-pulse delay-500" />
                </div>

                {/* Hieroglyphic Animation */}
                <div className="relative mb-8">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border-4 border-primary/40 shadow-[0_0_60px_rgba(244,175,37,0.4)]">
                        <span className="text-6xl animate-bounce">🏛️</span>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center animate-ping">
                        <span className="material-symbols-outlined text-background-dark text-sm">auto_awesome</span>
                    </div>
                </div>

                {/* Loading Text */}
                <h2 className="text-white text-2xl font-bold font-arabic mb-3 text-center">
                    جاري إنشاء رحلتك المخصصة
                </h2>
                <p className="text-sand-accent text-center font-arabic mb-8 max-w-[280px]">
                    الذكاء الاصطناعي يصمم لك مغامرة فرعونية لا تُنسى...
                </p>

                {/* Progress Bar */}
                <div className="w-full max-w-xs mb-4">
                    <div className="h-2 bg-surface-dark rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-yellow-400 rounded-full transition-all duration-500"
                            style={{ width: `${generationProgress}%` }}
                        />
                    </div>
                </div>
                <p className="text-primary font-bold font-arabic">{Math.round(generationProgress)}%</p>

                {/* Loading Steps */}
                <div className="mt-8 space-y-3 text-sm">
                    {[
                        { text: 'تحليل تفضيلاتك...', done: generationProgress > 20 },
                        { text: 'اختيار أفضل المواقع...', done: generationProgress > 40 },
                        { text: 'ترتيب المهام والتحديات...', done: generationProgress > 60 },
                        { text: 'حساب المكافآت...', done: generationProgress > 80 },
                        { text: 'إنهاء الخطة...', done: generationProgress > 95 },
                    ].map((step, i) => (
                        <div key={i} className={`flex items-center gap-2 font-arabic transition-all ${step.done ? 'text-green-400' : 'text-gray-500'}`}>
                            <span className="material-symbols-outlined text-sm">
                                {step.done ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            {step.text}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background-dark">
            {/* Header with Progress */}
            <div className="sticky top-0 z-20 bg-background-dark/95 backdrop-blur-md border-b border-border-gold/30 px-6 pt-12 pb-4">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 0}
                        className="size-10 rounded-full bg-surface-dark border border-border-gold flex items-center justify-center disabled:opacity-30"
                    >
                        <span className="material-symbols-outlined text-white rtl:rotate-180">arrow_back</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="text-sand-accent text-sm font-arabic">{currentStep + 1}/{ONBOARDING_QUESTIONS.length}</span>
                    </div>

                    <button
                        onClick={handleSkip}
                        className="text-sand-accent text-sm font-arabic hover:text-primary transition"
                    >
                        تخطي
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 bg-surface-dark rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-yellow-400 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Chat Area */}
            <div ref={chatRef} className="flex-1 overflow-y-auto no-scrollbar px-6 py-6">
                {/* AI Message Bubble */}
                <div className="flex gap-3 mb-8">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/40 to-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/30">
                        <span className="text-2xl">🏛️</span>
                    </div>
                    <div className="flex-1 bg-surface-dark rounded-2xl rounded-tr-sm p-4 border border-border-gold/30 shadow-lg">
                        <p className="text-white font-arabic whitespace-pre-line leading-relaxed">
                            {aiResponse}
                            {isTyping && <span className="inline-block w-1.5 h-5 bg-primary ml-1 animate-pulse" />}
                        </p>
                    </div>
                </div>

                {/* Options Grid */}
                {!isTyping && currentQuestion && (
                    <div className={`grid gap-3 ${currentQuestion.options && currentQuestion.options.length > 4
                        ? 'grid-cols-2'
                        : 'grid-cols-1'
                        }`}>
                        {currentQuestion.options?.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleSelect(option.value)}
                                className={`p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${isSelected(option.value)
                                    ? 'bg-primary/20 border-primary shadow-[0_0_20px_rgba(244,175,37,0.2)]'
                                    : 'bg-surface-dark/50 border-border-gold hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{option.icon}</span>
                                    <span className={`font-arabic font-bold ${isSelected(option.value) ? 'text-primary' : 'text-white'
                                        }`}>
                                        {option.label}
                                    </span>
                                    {isSelected(option.value) && (
                                        <span className="material-symbols-outlined text-primary mr-auto">check_circle</span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Action */}
            <div className="sticky bottom-0 bg-gradient-to-t from-background-dark via-background-dark to-transparent px-6 py-6 pt-12">
                <button
                    onClick={handleNext}
                    disabled={!canProceed() || isTyping}
                    className="w-full h-14 bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary active:scale-[0.98] rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_25px_rgba(244,175,37,0.4)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <span className="text-background-dark text-lg font-bold font-arabic">
                        {isLastQuestion ? 'إنشاء الرحلة' : 'التالي'}
                    </span>
                    <span className="material-symbols-outlined text-background-dark rtl:rotate-180">
                        {isLastQuestion ? 'rocket_launch' : 'arrow_forward'}
                    </span>
                </button>
            </div>
        </div>
    );
};

export default Onboarding;