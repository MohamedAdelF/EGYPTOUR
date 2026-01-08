
import React from 'react';
import { UserStats } from '../types';

const Bazaar: React.FC<{ stats: UserStats; onBack: () => void }> = ({ stats, onBack }) => {
  return (
    <div className="flex flex-col h-full bg-background-dark">
      <div className="sticky top-0 z-50 bg-background-dark/95 backdrop-blur-md border-b border-white/5 p-4 pt-12">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-white opacity-70"><span className="material-symbols-outlined rtl:rotate-180">arrow_forward</span></button>
          <h1 className="text-lg font-bold font-arabic">البازار</h1>
          <button className="text-white opacity-70"><span className="material-symbols-outlined">menu</span></button>
        </div>
        <div className="mt-4 flex justify-center">
          <div className="flex items-center gap-2 bg-surface-dark px-4 py-1 rounded-full border border-white/10">
            <span className="material-symbols-outlined text-primary text-sm">monetization_on</span>
            <span className="text-primary font-bold text-sm">XP {stats.gold}</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-5">
        <div className="flex items-center justify-between text-xs text-sand-accent">
          <p className="font-arabic">لديك <span className="text-primary font-bold">٣</span> قسائم سارية</p>
          <button className="flex items-center gap-1 font-arabic"><span className="material-symbols-outlined text-sm">sort</span> ترتيب</button>
        </div>

        {/* Voucher Item */}
        <div className="bg-surface-dark rounded-3xl border border-white/5 overflow-hidden shadow-xl">
          <div className="p-4 flex gap-4">
            <div className="h-20 w-20 rounded-2xl bg-cover border border-white/10" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAnN55CkqvnIyRtysb3Crr-8zQuZ8YPXZyTZMlGfppKdHF4M7dRfu6nV6KbnRhGvsR-747HXQUdpKmJwKWkoEKW1ZDLpTiaeFrGJOCX-LGzlj75Ljr9lWiJRnUyJddJ_xuZ7xCyJjMa17DWOAZPAYvvbjzGIRZ8T2dNfn4SjzxSRgfr2VEw2LvhHKJ57PwyogoH7YPc6cUrYdj3LKSLOeIiqdkNCI6h0gbHK56ywNu5ue2PAiJyTp3mXklGSltW3ktkwS7zqcy-XsI')" }} />
            <div className="flex-1 flex flex-col justify-center">
              <h3 className="text-white font-bold font-arabic leading-tight">مقهى الركوة</h3>
              <p className="text-primary font-bold text-xl mt-1 font-arabic">خصم ٥٠٪ على القهوة</p>
              <p className="text-sand-accent text-[10px] mt-2 font-arabic flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">event_busy</span> ينتهي في: ٣٠ نوفمبر ٢٠٢٤</p>
            </div>
          </div>
          <div className="bg-[#2d2515] p-4 flex items-center justify-between gap-4 border-t border-dashed border-white/10">
            <div className="flex-1">
              <p className="text-sand-accent text-[10px] font-arabic mb-1">رمز القسيمة:</p>
              <div className="bg-background-dark/50 p-2 rounded border border-white/5 text-center">
                <span className="text-white font-mono font-bold tracking-widest text-sm">COF-50-RKW</span>
              </div>
            </div>
            <div className="bg-white p-2 rounded-xl shrink-0">
               <span className="material-symbols-outlined text-black text-[56px] leading-none">qr_code_2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bazaar;
