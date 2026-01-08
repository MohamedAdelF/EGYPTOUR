
import React, { useState } from 'react';
import { Quest } from '../types';

interface QuestListProps {
  onSelectQuest: (quest: Quest) => void;
}

const MOCK_QUESTS: Quest[] = [
  {
    id: '1',
    title: 'أسرار الأهرامات بالجيزة',
    description: 'اكتشف الممرات الداخلية للهرم الأكبر وابحث عن غرفة دفن الملك خوفو.',
    status: 'active',
    xpReward: 100,
    goldReward: 50,
    difficulty: 'متوسطة',
    locationName: 'هضبة الجيزة',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxxq-yfmIMGbJC5yNyXNIWxk_ss1bEGilVzU_Ho3_sg_CpzQyl3zK8rOhJrBc9178k7AsKBngSsMyp9KQwx8EZluoMinH_YwX9f0zoa8DIodlfIWr92_uDUOJo_MR9CgK_XOT5zGqD0UAFEeoAblAlM9uYupgGRSD3qbob0Fp7PvgBZ36wWMXkDPiVNC9KjTXatL3_Y2FFdwkcx57hiIT8eMFg2wAl_076BGWuu-J4m1k7Bdp5S1QyI_8WUnf5oZwfGhSZEKxa2cY'
  },
  {
    id: '2',
    title: 'معبد الكرنك بالأقصر',
    description: 'جولة استكشافية بين الأعمدة العملاقة وقراءة النصوص الهيروغليفية القديمة.',
    status: 'new',
    xpReward: 250,
    goldReward: 120,
    difficulty: 'صعبة',
    locationName: 'الأقصر',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdXY38vyZeREJZRnZ-QBY2vG7QMNeBx_QN9dXz_8J1dcBY8Rsahs-rNrIKYPw2jdS7nFUcHeRL1E1R-256rXr7LyacxaV1hBCe8Yak3KtPGUgYUIU7GH3TtDAvLG08CuQSk3guc4UIEGys58N5jo6nds3bqhiXrS1YrWLsEAKvZcpkLrpqcVhAozP_hBeiW7bc-cB8Oqn2oeE4qzXdGt_WsX-QB2wCWCfKZ5GSuPqfExafQiHFApk16yJMHRSHWDn-LAQELELD1dc'
  }
];

const QuestList: React.FC<QuestListProps> = ({ onSelectQuest }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'new' | 'completed'>('active');

  return (
    <div className="flex flex-col h-full bg-background-dark p-6 pt-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white font-arabic">قائمة المهام</h1>
        <p className="text-sand-accent text-sm font-arabic mt-1">اكتشف كنوز مصر واجمع المكافآت</p>
      </div>

      <div className="flex p-1 bg-surface-dark border border-white/5 rounded-2xl mb-6">
        {['active', 'new', 'completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all font-arabic ${
              activeTab === tab ? 'bg-primary text-background-dark shadow-lg' : 'text-sand-accent opacity-60'
            }`}
          >
            {tab === 'active' ? 'جارية' : tab === 'new' ? 'جديدة' : 'مكتملة'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {MOCK_QUESTS.filter(q => q.status === activeTab).map(quest => (
          <div 
            key={quest.id}
            onClick={() => onSelectQuest(quest)}
            className="group relative bg-surface-dark p-4 rounded-3xl border border-white/5 shadow-xl active:scale-95 transition-all"
          >
            <div className="flex gap-4">
              <div 
                className="w-24 h-24 shrink-0 rounded-2xl bg-cover border border-white/10"
                style={{ backgroundImage: `url('${quest.imageUrl}')` }}
              />
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white font-arabic line-clamp-1">{quest.title}</h3>
                  <p className="text-xs text-gray-400 font-arabic mt-1 line-clamp-2 leading-relaxed">{quest.description}</p>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold">{quest.difficulty}</span>
                  <div className="flex gap-3 text-sand-accent font-bold text-xs">
                    <span>{quest.xpReward} XP</span>
                    <span>{quest.goldReward} G</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {MOCK_QUESTS.filter(q => q.status === activeTab).length === 0 && (
          <div className="text-center py-20 opacity-30">
            <span className="material-symbols-outlined text-6xl block mb-2">assignment_late</span>
            <p className="font-arabic">لا يوجد مهام حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestList;
