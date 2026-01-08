import React from 'react';
import { AppView } from '../types';
import EyeOfHorus from './icons/EyeOfHorus';

interface BottomNavProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeView, onNavigate }) => {
  const NavItem = ({ view, icon, label }: { view: AppView; icon: string; label: string }) => {
    const isActive = activeView === view;
    return (
      <button
        onClick={() => onNavigate(view)}
        className={`flex flex-col items-center justify-center w-full h-full transition-all gap-1 ${isActive ? 'text-primary' : 'text-gray-500 hover:text-gray-300'}`}
      >
        <span className={`material-symbols-outlined text-2xl ${isActive ? 'fill-1' : ''}`}>{icon}</span>
        <span className="text-[10px] font-bold font-arabic uppercase tracking-tighter">{label}</span>
      </button>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#0f0d0a]/90 backdrop-blur-2xl border-t border-white/5 pb-8 pt-2 h-[80px]">
      <div className="relative flex justify-between items-center h-full px-4 max-w-md mx-auto">

        {/* Left Side */}
        <div className="flex flex-1 justify-around">
          <NavItem view={AppView.MAP} icon="map" label="خريطة" />
          <NavItem view={AppView.JOURNEY} icon="auto_stories" label="رحلتي" />
        </div>

        {/* Center Space for Floating Button */}
        <div className="w-16"></div>

        {/* Right Side */}
        <div className="flex flex-1 justify-around">
          <NavItem view={AppView.BAZAAR} icon="shopping_bag" label="البازار" />
          <NavItem view={AppView.PROFILE} icon="person" label="حسابي" />
        </div>

        {/* Floating Action Button (Absolute Positioning) */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 z-[101]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log("Guide button clicked");
              onNavigate(AppView.GUIDE);
            }}
            className="flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-primary to-amber-500 rounded-full shadow-[0_8px_30px_rgba(244,175,37,0.4)] text-black border-4 border-[#0f0d0a] transform transition-all active:scale-90 hover:scale-105 cursor-pointer p-3"
          >
            <EyeOfHorus size={32} color="black" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default BottomNav;
