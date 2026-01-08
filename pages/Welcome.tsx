import React from 'react';

interface WelcomeProps {
  onEnter: () => void;
  onLogin?: () => void;
}

const Welcome: React.FC<WelcomeProps> = ({ onEnter, onLogin }) => {
  return (
    <div className="relative flex flex-col h-full bg-background-dark min-h-screen">
      {/* Hero Image */}
      <div className="relative w-full h-[60vh] flex-shrink-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC-k6Gv1TNl7JRAZfnzDUBwkNrMgjm4SjJbTRUKUjIYyc8cRjJQTygdgHJ_La9-4W57m2b3fh9ujqMeJvKuWeU-qo0Aem-Nl0P6ZfbaJs76C90bVFGoLLAXSWgEEASKMlhMdLBEEGejkDsbiCLx3Ti74uRTwoZ0ZgTdMKGfDbpZ2wYh1lOIKRbQGyTYb4lqFBNYpEzzNfyjvR2OZFJTweSX64RLpXfuz_FkypSZIUTwag6i_Nlji5g-jl3utCU_BFdPEN7sS0PT2wM')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-background-dark/40 to-background-dark"></div>

        {/* Animated Hieroglyphics */}
        <div className="absolute top-20 left-6 text-primary/20 text-5xl animate-pulse">𓂀</div>
        <div className="absolute top-32 right-8 text-primary/15 text-4xl animate-pulse delay-300">𓃭</div>
        <div className="absolute top-48 left-12 text-primary/10 text-6xl animate-pulse delay-500">𓆣</div>

        {/* Logo */}
        <div className="absolute top-16 left-0 right-0 flex justify-center z-10">
          <div className="w-20 h-20 rounded-2xl bg-surface-dark/80 backdrop-blur-md border border-primary/30 flex items-center justify-center shadow-[0_0_40px_rgba(244,175,37,0.3)]">
            <span className="material-symbols-outlined text-primary text-[40px]">explore</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 pb-12 -mt-24 flex-grow w-full">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-white text-4xl font-extrabold leading-tight mb-4 drop-shadow-xl font-arabic">
            ابدأ مغامرتك التاريخية
          </h1>
          <p className="text-sand-accent text-lg font-medium leading-relaxed max-w-[280px] mx-auto font-arabic">
            استكشف التاريخ، واجمع الجوائز في العالم الحقيقي
          </p>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { icon: '🏛️', label: 'آثار حقيقية' },
            { icon: '🤖', label: 'مرشد ذكي' },
            { icon: '📸', label: 'تحديات تصوير' },
            { icon: '🏆', label: 'مكافآت' },
          ].map((feature, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-dark/60 border border-border-gold/50 rounded-full text-sm"
            >
              <span>{feature.icon}</span>
              <span className="text-sand-accent font-arabic">{feature.label}</span>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="w-full space-y-4">
          <button
            onClick={onEnter}
            className="group w-full h-16 bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary active:scale-95 rounded-2xl flex items-center justify-center transition-all shadow-[0_4px_25px_rgba(244,175,37,0.4)]"
          >
            <span className="text-background-dark text-xl font-bold font-arabic">إنشاء حساب جديد</span>
            <span className="material-symbols-outlined text-background-dark mr-2 transition-transform group-hover:translate-x-1 rtl:rotate-180">arrow_right_alt</span>
          </button>

          <button
            onClick={onLogin || onEnter}
            className="w-full h-16 bg-surface-dark/50 hover:bg-surface-dark border border-border-gold rounded-2xl flex items-center justify-center transition-all"
          >
            <span className="text-white text-xl font-bold font-arabic">تسجيل الدخول</span>
          </button>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8 mt-8 mb-4">
          <div className="text-center">
            <p className="text-primary text-2xl font-bold">50+</p>
            <p className="text-sand-accent text-xs font-arabic">موقع أثري</p>
          </div>
          <div className="text-center">
            <p className="text-primary text-2xl font-bold">100+</p>
            <p className="text-sand-accent text-xs font-arabic">مهمة</p>
          </div>
          <div className="text-center">
            <p className="text-primary text-2xl font-bold">10K+</p>
            <p className="text-sand-accent text-xs font-arabic">مستكشف</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 text-center text-gray-500 text-xs font-arabic">
          <p>بالمتابعة، أنت توافق على <span className="text-primary">الشروط</span> و<span className="text-primary">الخصوصية</span></p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
