
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Message } from '../types';

const ExpertChat: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', parts: [{ text: "أهلاً بك يا مستكشف! أنا مرشدك الذكي. كيف يمكنني مساعدتك في رحلتك التاريخية اليوم؟" }] }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = { role: 'user', parts: [{ text: input }] };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [...messages, userMessage].map(m => ({ role: m.role, parts: m.parts })),
        config: {
          systemInstruction: "You are an Egyptian historical expert guide named 'المرشد الذكي'. Always reply in professional but welcoming Arabic. Be helpful with historical facts, photography spots, and travel tips in Egypt. Use emojis sometimes to keep it engaging.",
        }
      });

      setMessages(prev => [...prev, { role: 'model', parts: [{ text: response.text || "عذراً، لم أستطع فهم ذلك." }] }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: "حدث خطأ في الاتصال، حاول مجدداً لاحقاً." }] }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-dark relative">
      {/* Header */}
      <div className="bg-surface-dark/95 backdrop-blur-md border-b border-white/5 pt-12 pb-4 px-6 flex items-center gap-4 z-20">
        <button onClick={onBack} className="text-white opacity-70"><span className="material-symbols-outlined rtl:rotate-180">arrow_forward</span></button>
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-primary flex items-center justify-center text-background-dark border-2 border-white/20">
            <span className="material-symbols-outlined">smart_toy</span>
          </div>
          <div>
            <h3 className="text-sm font-bold font-arabic">المرشد الذكي</h3>
            <p className="text-[10px] text-green-500 font-bold">متاح الآن</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar pb-32">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl font-arabic text-sm leading-relaxed shadow-lg ${
              m.role === 'user' ? 'bg-primary text-background-dark rounded-bl-none' : 'bg-surface-dark text-white border border-white/5 rounded-br-none'
            }`}>
              {m.parts[0].text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-surface-dark p-4 rounded-2xl rounded-br-none flex gap-1">
              <div className="w-1.5 h-1.5 bg-sand-accent/60 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-sand-accent/60 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-sand-accent/60 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="absolute bottom-0 left-0 right-0 bg-surface-dark p-4 pb-8 flex items-center gap-2 border-t border-white/10">
        <div className="flex-1 bg-gray-800 rounded-full flex items-center px-4 py-1 border border-white/10 focus-within:border-primary/50 transition-all">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="اكتب رسالتك..." 
            className="flex-1 bg-transparent border-none text-white focus:ring-0 py-2 font-arabic text-sm"
          />
          <button className="text-gray-400 px-2"><span className="material-symbols-outlined">mic</span></button>
        </div>
        <button 
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className="size-11 rounded-full bg-primary flex items-center justify-center text-background-dark shadow-lg active:scale-90 transition-all disabled:opacity-50"
        >
          <span className="material-symbols-outlined rtl:rotate-180">send</span>
        </button>
      </div>
    </div>
  );
};

export default ExpertChat;
