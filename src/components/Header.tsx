import React from 'react';
import { Calendar, Users, CheckCircle2, FileDown, PlusCircle, Smartphone, Monitor, Shield } from 'lucide-react';
import { formatArabicDate } from '../utils/scoutHelper';

interface HeaderProps {
  activeTab: 'attendance' | 'members' | 'patrols';
  setActiveTab: (tab: 'attendance' | 'members' | 'patrols') => void;
  activeDate: string;
  onOpenDatePicker: () => void;
  onOpenAddMember: () => void;
  onOpenPrintReport: () => void;
  stats: {
    total: number;
    present: number;
    departed: number;
    absent: number;
  };
  storedDaysCount?: number;
  lastSavedTime?: string;
  isMobileFrame: boolean;
  setIsMobileFrame: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeDate,
  onOpenDatePicker,
  onOpenAddMember,
  onOpenPrintReport,
  stats,
  storedDaysCount = 1,
  lastSavedTime,
  isMobileFrame,
  setIsMobileFrame,
}) => {
  return (
    <header className="bg-[#00685e] text-white shadow-lg sticky top-0 z-30">
      {/* Top Brand Bar */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-[#00554d]">
        <div className="flex items-center gap-3">
          <img
            src="/assets/aistudio/_____________e13acb2d.jpg"
            alt="شعار كشافة العباس (ع)"
            className="w-11 h-11 rounded-full object-cover border-2 border-emerald-200/60 shadow-sm bg-white"
          />
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight leading-tight flex items-center gap-1.5">
              <span>حضور وانصراف كشافة العباس</span>
              <span className="text-emerald-200 text-xs font-normal">(ع)</span>
            </h1>
            <p className="text-emerald-100/90 text-xs flex items-center gap-1">
              <span>البراعم (6-8)</span>
              <span>·</span>
              <span>الأشبال (9-11)</span>
              <span>·</span>
              <span>الكشافة (12-14)</span>
            </p>
          </div>
        </div>

        {/* View Mode Toggle & Print & Storage Badge */}
        <div className="flex items-center gap-1.5">
          {/* Storage Badge */}
          <button
            onClick={onOpenDatePicker}
            title="كل يوم يتم حفظه تلقائياً. اضغط لفتح أرشيف الأيام السابقة"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#004f46] hover:bg-[#00433d] text-emerald-100 text-[11px] font-bold border border-emerald-500/30 transition-all active:scale-95"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>مخزن تلقائياً ({storedDaysCount} أيام)</span>
          </button>

          <button
            onClick={() => setIsMobileFrame(!isMobileFrame)}
            title={isMobileFrame ? 'التبديل إلى العرض العريض' : 'التبديل إلى مظهر الموبايل'}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#00524a] hover:bg-[#00433d] text-xs text-emerald-100 transition-colors"
          >
            {isMobileFrame ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
            <span>{isMobileFrame ? 'عرض كامل' : 'إطار موبايل'}</span>
          </button>

          <button
            onClick={onOpenPrintReport}
            title="طباعة وتصدير الكشف"
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <FileDown className="w-4 h-4" />
            <span className="hidden sm:inline">تقرير / طباعة</span>
          </button>
        </div>
      </div>

      {/* Date Bar & Quick Counter (Interactive Date Selector) */}
      <div className="px-4 py-2.5 bg-[#00574f] flex flex-wrap items-center justify-between gap-2 text-xs">
        <button
          onClick={onOpenDatePicker}
          className="flex items-center gap-2 bg-[#004740] hover:bg-[#003c36] text-emerald-100 px-3 py-1.5 rounded-lg transition-all border border-emerald-600/30 font-medium active:scale-95"
        >
          <Calendar className="w-3.5 h-3.5 text-emerald-300" />
          <span>تاريخ النشاط:</span>
          <span className="font-bold text-white bg-emerald-800/80 px-2 py-0.5 rounded text-[11px] dir-ltr">
            {activeDate}
          </span>
          <span className="text-[11px] text-emerald-200 hidden xs:inline">
            ({formatArabicDate(activeDate)})
          </span>
          <span className="text-emerald-300 text-[10px] underline mr-1">تغيير / أرشيف الأيام</span>
        </button>

        <div className="flex items-center gap-2 text-[11px] text-emerald-100 font-medium">
          <span className="flex items-center gap-1 bg-[#004740] px-2 py-1 rounded">
            <span>الكل:</span>
            <strong className="text-white">{stats.total}</strong>
          </span>
          <span className="flex items-center gap-1 bg-emerald-900/60 text-emerald-200 px-2 py-1 rounded">
            <span>حاضر:</span>
            <strong className="text-emerald-300">{stats.present}</strong>
          </span>
          <span className="flex items-center gap-1 bg-teal-900/60 text-teal-200 px-2 py-1 rounded">
            <span>انصرف:</span>
            <strong className="text-teal-300">{stats.departed}</strong>
          </span>
          <span className="flex items-center gap-1 bg-rose-950/40 text-rose-200 px-2 py-1 rounded">
            <span>غائب:</span>
            <strong className="text-rose-300">{stats.absent}</strong>
          </span>
        </div>
      </div>

      {/* Linked Windows Tab Bar (Now with 3 tabs) */}
      <div className="flex bg-[#004d46] p-1 border-t border-[#00403a] overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-bold rounded-md transition-all ${
            activeTab === 'attendance'
              ? 'bg-white text-[#00685e] shadow-md'
              : 'text-emerald-100 hover:text-white hover:bg-emerald-800/40'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>النافذة 1: الحضور والانصراف</span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-bold rounded-md transition-all ${
            activeTab === 'members'
              ? 'bg-white text-[#00685e] shadow-md'
              : 'text-emerald-100 hover:text-white hover:bg-emerald-800/40'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>النافذة 2: سجل الأعضاء</span>
        </button>

        <button
          onClick={() => setActiveTab('patrols')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-bold rounded-md transition-all ${
            activeTab === 'patrols'
              ? 'bg-white text-[#00685e] shadow-md'
              : 'text-emerald-100 hover:text-white hover:bg-emerald-800/40'
          }`}
        >
          <Shield className="w-4 h-4 shrink-0" />
          <span>النافذة 3: تشكيل الطلائع (المجاميع)</span>
        </button>
      </div>
    </header>
  );
};

