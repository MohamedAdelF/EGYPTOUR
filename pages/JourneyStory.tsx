
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Trip } from '../types';

interface JourneyStoryProps {
  trip: Trip | null;
  onBack: () => void;
}

const JourneyStory: React.FC<JourneyStoryProps> = ({ trip, onBack }) => {
  const [story, setStory] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (trip) {
      generateStory();
    }
  }, [trip]);

  const generateStory = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a creative travel narrative about a trip to Egypt called "${trip?.title}". 
        The trip lasted ${trip?.days} days and included missions like ${trip?.missions.map(m => m.title).join(', ')}. 
        Make it emotional and engaging, suitable for a social media post. Use Arabic.`,
        config: {
          systemInstruction: "You are a travel storyteller. Your tone is adventurous, respectful of culture, and highly engaging."
        }
      });
      setStory(response.text || "لم نتمكن من صياغة القصة حالياً.");
    } catch (error) {
      console.error(error);
      setStory("حدث خطأ أثناء صياغة قصتك التاريخية.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0f0d0a] p-6 pt-16">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <span className="material-symbols-outlined rtl:rotate-180">arrow_forward</span>
        </button>
        <h1 className="text-xl font-bold font-arabic">قصة رحلتي</h1>
        <button onClick={generateStory} className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <span className="material-symbols-outlined">refresh</span>
        </button>
      </div>

      <div className="flex-1 bg-white/5 rounded-[2rem] border border-white/10 p-6 overflow-y-auto no-scrollbar relative shadow-2xl">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-primary font-arabic animate-pulse">جاري صياغة ذكرياتك...</p>
          </div>
        ) : (
          <div className="prose prose-invert max-w-none">
            <div className="flex justify-center mb-6">
              <span className="material-symbols-outlined text-primary text-6xl">auto_stories</span>
            </div>
            <p className="text-white/90 font-arabic leading-loose text-lg text-justify whitespace-pre-wrap">
              {story}
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 space-y-4 pb-12">
        <p className="text-center text-xs text-gray-500 font-arabic">شارك مغامرتك مع العالم</p>
        <div className="flex justify-center gap-4">
          <button className="size-14 rounded-2xl bg-[#E1306C] flex items-center justify-center shadow-lg"><span className="material-symbols-outlined text-white text-3xl">photo_camera</span></button>
          <button className="size-14 rounded-2xl bg-[#1DA1F2] flex items-center justify-center shadow-lg"><span className="material-symbols-outlined text-white text-3xl">share</span></button>
          <button className="size-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg text-black"><span className="material-symbols-outlined text-3xl">content_copy</span></button>
        </div>
      </div>
    </div>
  );
};

export default JourneyStory;
