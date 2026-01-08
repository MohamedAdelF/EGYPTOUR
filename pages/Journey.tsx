
import React, { useState } from 'react';
import { Trip, Mission } from '../types';

interface JourneyProps {
  trip: Trip | null;
  onSelectMission: (mission: Mission) => void;
}

const Journey: React.FC<JourneyProps> = ({ trip, onSelectMission }) => {
  const [selectedDay, setSelectedDay] = useState(1);

  if (!trip) return (
    <div className="flex flex-col items-center justify-center h-full text-center p-10 opacity-40">
      <span className="material-symbols-outlined text-6xl mb-4">explore_off</span>
      <p className="font-arabic">لا توجد رحلة نشطة حالياً. ابدأ بالتخطيط!</p>
    </div>
  );

  const days = Array.from({ length: trip.days }, (_, i) => i + 1);
  const dailyMissions = trip.missions.filter(m => m.day === selectedDay);

  return (
    <div className="p-6 pt-16 min-h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white font-arabic mb-2">{trip.title}</h1>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${trip.progress}%` }}></div>
          </div>
          <span className="text-xs font-bold text-primary">{trip.progress}%</span>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar mb-8 pb-2">
        {days.map(d => (
          <button
            key={d}
            onClick={() => setSelectedDay(d)}
            className={`shrink-0 h-14 w-24 rounded-2xl flex flex-col items-center justify-center transition-all border ${
              selectedDay === d ? 'bg-primary text-black border-primary' : 'bg-white/5 text-white border-white/10 opacity-60'
            }`}
          >
            <span className="text-[10px] font-bold opacity-70">DAY</span>
            <span className="text-xl font-black">{d}</span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {dailyMissions.map((mission) => (
          <div 
            key={mission.id}
            onClick={() => onSelectMission(mission)}
            className="group relative bg-[#1c1a16] rounded-3xl border border-white/5 overflow-hidden shadow-xl active:scale-95 transition-all"
          >
            <div className="flex gap-4 p-4">
              <div 
                className="w-24 h-24 shrink-0 rounded-2xl bg-cover bg-center border border-white/10"
                style={{ backgroundImage: `url('${mission.imageUrl}')` }}
              />
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <h3 className="text-lg font-bold text-white font-arabic line-clamp-1">{mission.title}</h3>
                  <div className="flex items-center gap-1 text-[10px] text-gray-500 font-arabic mt-1">
                    <span className="material-symbols-outlined text-xs">location_on</span>
                    {mission.location.name}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">{mission.difficulty}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-primary text-sm">stars</span>
                      <span className="text-xs font-bold">{mission.xpReward}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {mission.status === 'locked' && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                <span className="material-symbols-outlined text-white/50 text-3xl">lock</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Journey;
