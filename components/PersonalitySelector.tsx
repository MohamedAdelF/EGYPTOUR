import React from 'react';
import { AIPersonality } from '../types';

interface PersonalitySelectorProps {
  selectedPersonality: AIPersonality;
  onSelect: (personality: AIPersonality) => void;
  language?: string;
}

const PersonalitySelector: React.FC<PersonalitySelectorProps> = ({ 
  selectedPersonality, 
  onSelect,
  language = 'ar' 
}) => {
  const isArabic = language === 'ar';

  const personalities = [
    {
      id: AIPersonality.CLEOPATRA,
      name: isArabic ? 'كليوباترا' : 'Cleopatra',
      description: isArabic 
        ? 'راوية تاريخية شغوفة تتحدث ببلاغة عن الفراعنة والملوك'
        : 'Passionate historical storyteller who speaks eloquently about pharaohs and kings',
      icon: '👑',
      color: 'from-purple-600 to-pink-600'
    },
    {
      id: AIPersonality.AHMED,
      name: isArabic ? 'أحمد المرشد' : 'Ahmed the Guide',
      description: isArabic
        ? 'مرشد محلي ودود يشاركك المعرفة المحلية والنصائح'
        : 'Friendly local guide who shares local knowledge and tips',
      icon: '🗺️',
      color: 'from-blue-600 to-cyan-600'
    },
    {
      id: AIPersonality.ZAHI,
      name: isArabic ? 'د. زاهي حواس' : 'Dr. Zahi Hawass',
      description: isArabic
        ? 'عالم آثار خبير يشاركك الاكتشافات العلمية الحديثة'
        : 'Expert archaeologist who shares the latest scientific discoveries',
      icon: '🔬',
      color: 'from-amber-600 to-orange-600'
    },
    {
      id: AIPersonality.FRIENDLY,
      name: isArabic ? 'الرفيق الودود' : 'Friendly Explorer',
      description: isArabic
        ? 'رفيق ودود ومشجع يجعل الاستكشاف ممتعاً'
        : 'Friendly and encouraging companion who makes exploration fun',
      icon: '😊',
      color: 'from-green-600 to-emerald-600'
    }
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-white font-arabic mb-4">
        {isArabic ? 'اختر شخصية المرشد الذكي' : 'Choose AI Guide Personality'}
      </h3>
      <div className="grid grid-cols-1 gap-3">
        {personalities.map((personality) => (
          <button
            key={personality.id}
            onClick={() => onSelect(personality.id)}
            className={`p-4 rounded-2xl border-2 transition-all text-right active:scale-[0.98] ${
              selectedPersonality === personality.id
                ? `bg-gradient-to-r ${personality.color} border-white/30 shadow-lg`
                : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`text-3xl ${selectedPersonality === personality.id ? 'scale-110' : ''} transition-transform`}>
                {personality.icon}
              </div>
              <div className="flex-1">
                <h4 className={`text-base font-bold font-arabic mb-1 ${
                  selectedPersonality === personality.id ? 'text-white' : 'text-white'
                }`}>
                  {personality.name}
                </h4>
                <p className={`text-xs font-arabic leading-relaxed ${
                  selectedPersonality === personality.id ? 'text-white/90' : 'text-gray-400'
                }`}>
                  {personality.description}
                </p>
              </div>
              {selectedPersonality === personality.id && (
                <span className="material-symbols-outlined text-white">check_circle</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PersonalitySelector;

