import React, { useState, useEffect } from 'react';
import EyeOfHorus from '../components/icons/EyeOfHorus';
import { Mission } from '../types';
import { auth, updateMissionStatus, updateTaskStatus, getTrip } from '../lib/firebase';

interface MissionDetailProps {
  mission: Mission | null;
  onCapture: () => void;
  onBack: () => void;
  onStartGuide?: () => void;
  onMissionUpdate?: (mission: Mission) => void;
}

const MissionDetail: React.FC<MissionDetailProps> = ({ mission, onCapture, onBack, onStartGuide, onMissionUpdate }) => {
  const [currentMission, setCurrentMission] = useState<Mission | null>(mission);
  const [tripId, setTripId] = useState<string>('active_trip');

  useEffect(() => {
    setCurrentMission(mission);
    // Load trip to get tripId
    if (auth.currentUser && mission) {
      getTrip(auth.currentUser.uid).then(trip => {
        if (trip) {
          setTripId(trip.id || 'active_trip');
        }
      }).catch(err => {
        console.error("Error loading trip:", err);
      });
    }
  }, [mission]);

  if (!currentMission) return null;

  const completedTasks = currentMission.tasks.filter(t => t.completed).length;
  const totalTasks = currentMission.tasks.length;
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const handleStartMission = async () => {
    if (!auth.currentUser || !currentMission) return;

    try {
      await updateMissionStatus(auth.currentUser.uid, tripId, currentMission.id, 'active');
      
      // Reload trip to get updated mission
      const trip = await getTrip(auth.currentUser.uid);
      if (trip) {
        const updatedMission = trip.missions.find(m => m.id === currentMission.id);
        if (updatedMission) {
          setCurrentMission(updatedMission);
          if (onMissionUpdate) {
            onMissionUpdate(updatedMission);
          }
        }
      }
    } catch (error) {
      console.error("Error starting mission:", error);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    if (!auth.currentUser || !currentMission) return;

    const task = currentMission.tasks.find(t => t.id === taskId);
    if (!task) return;

    const newCompletedStatus = !task.completed;

    try {
      await updateTaskStatus(auth.currentUser.uid, tripId, currentMission.id, taskId, newCompletedStatus);
      
      // Reload trip to get updated mission
      const trip = await getTrip(auth.currentUser.uid);
      if (trip) {
        const updatedMission = trip.missions.find(m => m.id === currentMission.id);
        if (updatedMission) {
          setCurrentMission(updatedMission);
          if (onMissionUpdate) {
            onMissionUpdate(updatedMission);
          }
        }
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0f0d0a]">
      {/* Hero Image */}
      <div className="relative h-[45vh] w-full shrink-0">
        <div className="absolute top-12 left-6 right-6 flex items-center justify-between z-20">
          <button onClick={onBack} className="size-10 rounded-full bg-black/20 backdrop-blur border border-white/10 flex items-center justify-center">
            <span className="material-symbols-outlined rtl:rotate-180">arrow_forward</span>
          </button>
          <button className="size-10 rounded-full bg-black/20 backdrop-blur border border-white/10 flex items-center justify-center">
            <span className="material-symbols-outlined">bookmark_border</span>
          </button>
        </div>
        <img src={currentMission.imageUrl} className="h-full w-full object-cover" alt={currentMission.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0d0a] via-transparent to-transparent"></div>

        {/* Status Badge */}
        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${currentMission.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
            currentMission.status === 'active' ? 'bg-primary/20 text-primary border border-primary/30' :
              'bg-gray-500/20 text-gray-400 border border-gray-500/30'
            }`}>
            {currentMission.status === 'completed' ? '✓ مكتملة' : currentMission.status === 'active' ? '● نشطة' : '🔒 مقفلة'}
          </div>
        </div>
      </div>

      <div className="relative -mt-8 flex-1 bg-[#0f0d0a] rounded-t-[2.5rem] border-t border-white/10 p-6 shadow-2xl overflow-y-auto no-scrollbar">
        <div className="w-12 h-1.5 bg-gray-700 rounded-full mx-auto mb-6 opacity-40"></div>

        <h1 className="text-3xl font-extrabold text-white font-arabic mb-2">{currentMission.title}</h1>
        <p className="text-sand-accent text-sm font-arabic flex items-center gap-1 mb-4">
          <span className="material-symbols-outlined text-sm">location_on</span>
          {currentMission.location.name}
        </p>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400 font-arabic">التقدم</span>
            <span className="text-sm text-primary font-bold">{completedTasks}/{totalTasks}</span>
          </div>
          <div className="h-2 bg-surface-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-yellow-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex gap-3 mb-8">
          <div className="bg-[#2d2616] px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">star</span>
            <span className="text-white text-sm font-bold font-arabic">{currentMission.difficulty}</span>
          </div>
          <div className="bg-primary/10 px-4 py-2 rounded-xl border border-primary/20 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">bolt</span>
            <span className="text-primary text-sm font-bold">+{currentMission.xpReward} XP</span>
          </div>
          <div className="bg-yellow-500/10 px-4 py-2 rounded-xl border border-yellow-500/20 flex items-center gap-2">
            <span className="text-yellow-400">💰</span>
            <span className="text-yellow-400 text-sm font-bold">+{currentMission.goldReward}</span>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white mb-3 font-arabic">عن المهمة</h2>
          <p className="text-gray-400 text-sm leading-relaxed font-arabic text-justify">
            {currentMission.description} استكشف المعالم الأثرية، التقط صورة احترافية تظهر عظمة التاريخ المصري واحصل على مكافآت ذهبية ونقاط خبرة لرفع مستواك.
          </p>
        </div>

        {/* Live Guide Button */}
        {onStartGuide && currentMission.status === 'active' && (
          <button
            onClick={onStartGuide}
            className="w-full mb-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 p-4 rounded-2xl flex items-center gap-4 active:scale-[0.98] transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <EyeOfHorus size={28} color="#60a5fa" />
            </div>
            <div className="flex-1 text-right">
              <h3 className="text-white font-bold font-arabic">المرشد المباشر</h3>
              <p className="text-gray-400 text-xs font-arabic">تحدث مع الذكاء الاصطناعي بالصوت والصورة</p>
            </div>
            <span className="material-symbols-outlined text-blue-400 rtl:rotate-180">arrow_forward</span>
          </button>
        )}

        {/* Tasks */}
        <div className="space-y-4 mb-24">
          <h2 className="text-lg font-bold text-white mb-3 font-arabic">المهام الفرعية</h2>
          {currentMission.tasks.map((task, index) => (
            <button
              key={task.id}
              onClick={() => currentMission.status === 'active' && handleToggleTask(task.id)}
              disabled={currentMission.status !== 'active'}
              className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all ${
                task.completed
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-white/5 border-white/5'
                } ${currentMission.status === 'active' ? 'active:scale-[0.98] cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${task.completed ? 'bg-green-500/20' : 'bg-surface-dark'
                  }`}>
                  {task.completed ? (
                    <span className="material-symbols-outlined text-green-400">check_circle</span>
                  ) : (
                    <span className="material-symbols-outlined text-primary">
                      {task.type === 'photo' ? 'photo_camera' :
                        task.type === 'quiz' ? 'quiz' :
                          task.type === 'ar' ? 'view_in_ar' : 'check_circle'}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className={`text-sm font-arabic block ${task.completed ? 'text-green-400 line-through' : 'text-white/80'}`}>
                    {task.label}
                  </span>
                  {task.requirement && (
                    <p className="text-xs text-gray-500 font-arabic mt-0.5">{task.requirement}</p>
                  )}
                </div>
              </div>
              <span className={`text-xs font-bold ${task.completed ? 'text-green-400' : 'text-primary'}`}>
                +{task.xp} XP
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Action */}
      {currentMission.status !== 'locked' && (
        <div className="fixed bottom-0 left-0 right-0 p-6 pb-10 bg-[#0f0d0a]/95 border-t border-white/5 flex gap-3 z-30 max-w-md mx-auto">
          {currentMission.status === 'active' ? (
            <button
              className="flex-1 h-14 bg-primary text-black font-bold rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-primary/20 active:scale-95 transition-all"
              onClick={onCapture}
            >
              <span className="material-symbols-outlined">camera_alt</span>
              <span className="text-lg font-arabic">التقط صورة</span>
            </button>
          ) : (
            <button
              className="flex-1 h-14 bg-primary text-black font-bold rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-primary/20 active:scale-95 transition-all"
              onClick={handleStartMission}
            >
              <span className="material-symbols-outlined">play_arrow</span>
              <span className="text-lg font-arabic">بدء المهمة</span>
            </button>
          )}
          <button className="size-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all">
            <span className="material-symbols-outlined">directions</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MissionDetail;
