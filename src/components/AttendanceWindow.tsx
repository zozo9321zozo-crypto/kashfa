import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  ArrowUpDown,
  UserPlus,
  Check,
  X,
  LogOut,
  Calendar,
  Clock,
  AlertCircle,
  Camera,
  ImageIcon,
  Database,
  ShieldCheck
} from 'lucide-react';
import { ScoutMember, ScoutCategory, AttendanceStatus, DepartureStatus, DayAttendance } from '../types/scout';
import { CATEGORY_ORDER, getCategoryColor, getCurrentTimeArabic, getBoyInitials, compressScoutPhoto } from '../utils/scoutHelper';

interface AttendanceWindowProps {
  members: ScoutMember[];
  activeDate: string;
  records: Record<string, DayAttendance>;
  onUpdateAttendance: (memberId: string, status: AttendanceStatus, departureStatus?: DepartureStatus) => void;
  onUpdateTimes: (memberId: string, checkInTime?: string, departureTime?: string, note?: string) => void;
  onOpenAddMember: () => void;
  onOpenDatePicker: () => void;
  onBulkAttendance: (status: AttendanceStatus) => void;
  onBulkDeparture: (departureStatus: DepartureStatus) => void;
  onViewPhoto: (member: ScoutMember) => void;
  onAttachPhoto: (memberId: string, photoUrl: string) => void;
}

export const AttendanceWindow: React.FC<AttendanceWindowProps> = ({
  members,
  activeDate,
  records,
  onUpdateAttendance,
  onUpdateTimes,
  onOpenAddMember,
  onOpenDatePicker,
  onBulkAttendance,
  onBulkDeparture,
  onViewPhoto,
  onAttachPhoto,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ScoutCategory | 'الكل'>('الكل');
  // Sort mode: 'category' (براعم -> أشبال -> كشافة) or 'name' (أ-ي)
  const [sortField, setSortField] = useState<'category' | 'name'>('category');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Quick photo upload ref
  const quickPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const [targetMemberIdForPhoto, setTargetMemberIdForPhoto] = useState<string | null>(null);

  // Sorting and Filtering
  const filteredAndSortedMembers = useMemo(() => {
    let list = [...members];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((m) => m.name.toLowerCase().includes(q));
    }

    // Filter by category
    if (categoryFilter !== 'الكل') {
      list = list.filter((m) => m.category === categoryFilter);
    }

    // Sort either by Category (براعم -> أشبال -> كشافة) or Name (أبجدياً)
    list.sort((a, b) => {
      if (sortField === 'category') {
        const orderA = CATEGORY_ORDER[a.category] || 99;
        const orderB = CATEGORY_ORDER[b.category] || 99;
        if (orderA !== orderB) {
          return sortDirection === 'asc' ? orderA - orderB : orderB - orderA;
        }
        // Sub-sort by name
        return a.name.localeCompare(b.name, 'ar');
      } else {
        // Sort by Name
        const comp = a.name.localeCompare(b.name, 'ar');
        return sortDirection === 'asc' ? comp : -comp;
      }
    });

    return list;
  }, [members, searchQuery, categoryFilter, sortField, sortDirection]);

  // Handle Attendance toggle
  const handleToggleAttendance = (memberId: string, newStatus: AttendanceStatus) => {
    const currentRecord = records[memberId];
    if (newStatus === 'present') {
      onUpdateAttendance(memberId, 'present', currentRecord?.departureStatus || 'present_not_departed');
      if (!currentRecord?.checkInTime) {
        onUpdateTimes(memberId, getCurrentTimeArabic(), currentRecord?.departureTime, currentRecord?.note);
      }
    } else {
      // If absent or excused, set departure to 'none'
      onUpdateAttendance(memberId, newStatus, 'none');
    }
  };

  // Handle Departure toggle
  const handleToggleDeparture = (memberId: string) => {
    const currentRecord = records[memberId];
    const isDeparted = currentRecord?.departureStatus === 'departed';

    if (isDeparted) {
      // Revert to present and not departed
      onUpdateAttendance(memberId, 'present', 'present_not_departed');
      onUpdateTimes(memberId, currentRecord?.checkInTime, undefined, currentRecord?.note);
    } else {
      // Mark as departed with departure time
      onUpdateAttendance(memberId, 'present', 'departed');
      onUpdateTimes(
        memberId,
        currentRecord?.checkInTime || getCurrentTimeArabic(),
        getCurrentTimeArabic(),
        currentRecord?.note
      );
    }
  };

  const handleQuickPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetMemberIdForPhoto) return;

    try {
      const compressed = await compressScoutPhoto(file);
      onAttachPhoto(targetMemberIdForPhoto, compressed);
    } catch (err) {
      console.error('Error attaching photo:', err);
    } finally {
      setTargetMemberIdForPhoto(null);
      if (quickPhotoInputRef.current) {
        quickPhotoInputRef.current.value = '';
      }
    }
  };

  const triggerAttachPhoto = (memberId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTargetMemberIdForPhoto(memberId);
    quickPhotoInputRef.current?.click();
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Hidden file input for fast in-place photo attachment */}
      <input
        type="file"
        ref={quickPhotoInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleQuickPhotoChange}
      />

      {/* Top Banner & Date Selector */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#00685e] flex items-center justify-center border border-emerald-100 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">تاريخ الحضور والانصراف (يدوي):</span>
                <span className="px-2 py-0.5 rounded-md bg-[#00685e] text-white font-mono font-bold text-xs">
                  {activeDate}
                </span>
              </div>
              <p className="text-xs text-slate-700 font-semibold mt-0.5">
                جدول الحضور والانصراف مع صور الكشافين والتصنيف العمري
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenDatePicker}
              className="flex-1 sm:flex-none px-3 py-2 rounded-xl border border-[#00685e] text-[#00685e] hover:bg-emerald-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>تغيير أو إضافة تاريخ</span>
            </button>
            <button
              onClick={onOpenAddMember}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-[#00685e] hover:bg-[#00554d] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة كشاف</span>
            </button>
          </div>
        </div>

        {/* Quick Bulk Actions */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium text-[11px]">إجراءات سريعة لليوم:</span>
            <button
              onClick={() => onBulkAttendance('present')}
              className="px-2.5 py-1 rounded-lg bg-emerald-100/70 hover:bg-emerald-200 text-emerald-800 font-semibold text-[11px] transition-colors"
            >
              تحضير الجميع
            </button>
            <button
              onClick={() => onBulkDeparture('departed')}
              className="px-2.5 py-1 rounded-lg bg-teal-100/70 hover:bg-teal-200 text-teal-800 font-semibold text-[11px] transition-colors"
            >
              انصراف الجميع
            </button>
            <button
              onClick={() => onBulkAttendance('absent')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-[11px] transition-colors"
            >
              تصفير السجل
            </button>
          </div>
          <span className="text-[11px] text-slate-400">
            يظهر {filteredAndSortedMembers.length} من {members.length} كشاف
          </span>
        </div>
      </div>

      {/* Auto-save & Daily Storage Guarantee Card */}
      <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-2xs">
        <div className="flex items-center gap-2 text-emerald-950 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          <span className="font-bold">التخزين اليومي مفعل:</span>
          <span className="text-slate-700">
            يتم تخزين حضور وانصراف وأوقات كل يوم تلقائياً دون فقدان أي بيانات سابقة.
          </span>
        </div>
        <button
          onClick={onOpenDatePicker}
          className="text-[#00685e] font-bold text-[11px] flex items-center gap-1 hover:underline shrink-0"
        >
          <Database className="w-3.5 h-3.5" />
          <span>فتح سجل وتواريخ الأيام السابقة</span>
        </button>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-200/80 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم عن كشاف..."
            className="w-full pr-10 pl-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-[#00685e] focus:ring-2 focus:ring-[#00685e]/15 outline-none font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Categories Bar & Sorting Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-500 shrink-0 ml-1">تصفية:</span>
            {(['الكل', 'براعم', 'أشبال', 'كشافة'] as const).map((cat) => {
              const isSelected = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-[#00685e] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'الكل'
                    ? 'الكل'
                    : cat === 'براعم'
                    ? 'البراعم (6-8)'
                    : cat === 'أشبال'
                    ? 'الأشبال (9-11)'
                    : 'الكشافة (12-14)'}
                </button>
              );
            })}
          </div>

          {/* Sort By Name or By Category (as requested: براعم -> أشبال -> كشافة) */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0 self-end sm:self-auto">
            <span className="text-[11px] font-bold text-slate-500 px-1.5 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-slate-400" />
              الفرز:
            </span>
            <button
              onClick={() => {
                if (sortField === 'category') {
                  setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortField('category');
                  setSortDirection('asc');
                }
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                sortField === 'category'
                  ? 'bg-white text-[#00685e] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="فرز حسب الفئة: البراعم ثم الأشبال ثم الكشافة"
            >
              حسب الفئة {sortField === 'category' ? (sortDirection === 'asc' ? '↓' : '↑') : ''}
            </button>
            <button
              onClick={() => {
                if (sortField === 'name') {
                  setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortField('name');
                  setSortDirection('asc');
                }
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                sortField === 'name'
                  ? 'bg-white text-[#00685e] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="فرز أبجدي حسب الاسم"
            >
              حسب الاسم {sortField === 'name' ? (sortDirection === 'asc' ? 'أ-ي' : 'ي-أ') : ''}
            </button>
          </div>
        </div>
      </div>

      {/* Attendance & Departure Table / Card View */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        {/* Table Header (Responsive) */}
        <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">
          <div className="col-span-5 flex items-center gap-1.5">
            <span>الاسم وصورة الفتى</span>
          </div>
          <div className="col-span-4 text-center">
            <span>تسجيل الحضور والانصراف</span>
          </div>
          <div className="col-span-3 text-left pl-2">
            <span>الفئة الكشفية</span>
          </div>
        </div>

        {/* Member Rows */}
        <div className="divide-y divide-slate-100">
          {filteredAndSortedMembers.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold">لم يتم العثور على كشافين مطابقين</p>
              <button
                onClick={onOpenAddMember}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00685e] text-white text-xs font-bold"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>إضافة كشاف جديد الآن</span>
              </button>
            </div>
          ) : (
            filteredAndSortedMembers.map((member, index) => {
              const record = records[member.id] || {
                memberId: member.id,
                status: 'absent',
                departureStatus: 'none',
              };
              const isPresent = record.status === 'present';
              const isExcused = record.status === 'excused';
              const isAbsent = record.status === 'absent';
              const isDeparted = record.departureStatus === 'departed';
              const categoryTheme = getCategoryColor(member.category);

              return (
                <div
                  key={member.id}
                  className={`p-3.5 sm:px-4 sm:py-3 transition-colors ${
                    isPresent
                      ? 'bg-emerald-50/25 hover:bg-emerald-50/40'
                      : isExcused
                      ? 'bg-amber-50/20 hover:bg-amber-50/30'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    {/* Field 1: الاسم وصورة الفتى (Name & Photo) */}
                    <div className="sm:col-span-5 flex items-center justify-between sm:justify-start gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Index Badge */}
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>

                        {/* Photo Attachment / Avatar Circle */}
                        <div
                          className="relative group shrink-0"
                          onClick={() => onViewPhoto(member)}
                          title={member.photoUrl ? 'اضغط لعرض صورة الفتى' : 'اضغط لإرفاق صورة'}
                        >
                          <div
                            className={`w-11 h-11 rounded-full overflow-hidden border-2 cursor-pointer flex items-center justify-center shadow-xs transition-transform active:scale-95 ${
                              member.photoUrl
                                ? 'border-[#00685e]'
                                : 'border-dashed border-slate-300 bg-slate-100 hover:border-[#00685e]'
                            }`}
                          >
                            {member.photoUrl ? (
                              <img
                                src={member.photoUrl}
                                alt={member.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-slate-500">
                                <span className="text-[11px] font-bold text-[#00685e]">
                                  {getBoyInitials(member.name)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Quick camera icon button over avatar */}
                          <button
                            type="button"
                            onClick={(e) => triggerAttachPhoto(member.id, e)}
                            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#00685e] text-white flex items-center justify-center shadow-xs hover:bg-[#004f47] transition-all border border-white"
                            title="إرفاق صورة جديدة للفتى"
                          >
                            <Camera className="w-2.5 h-2.5" />
                          </button>
                        </div>

                        {/* Name and Age Info */}
                        <div className="min-w-0">
                          <h4
                            onClick={() => onViewPhoto(member)}
                            className="font-bold text-sm text-slate-900 truncate hover:text-[#00685e] cursor-pointer"
                          >
                            {member.name}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                            <span>{member.age} سنة</span>
                            {record.checkInTime && (
                              <>
                                <span>·</span>
                                <span className="text-emerald-700 flex items-center gap-0.5">
                                  <Clock className="w-3 h-3" />
                                  {record.checkInTime}
                                </span>
                              </>
                            )}
                            {record.departureTime && (
                              <>
                                <span>·</span>
                                <span className="text-teal-800 flex items-center gap-0.5">
                                  <LogOut className="w-3 h-3" />
                                  {record.departureTime}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* On mobile: Category badge beside name */}
                      <div className="sm:hidden">
                        <span
                          className={`text-[11px] px-2.5 py-1 rounded-lg font-bold ${categoryTheme.badge}`}
                        >
                          {member.category}
                        </span>
                      </div>
                    </div>

                    {/* Field 2: الحضور والانصراف (Attendance & Departure) */}
                    <div className="sm:col-span-4 flex flex-wrap items-center justify-center gap-1.5">
                      {/* Attendance Buttons: حاضر / غائب / معذور */}
                      <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200">
                        {/* حاضر */}
                        <button
                          onClick={() => handleToggleAttendance(member.id, 'present')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                            isPresent
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-emerald-700'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>حاضر</span>
                        </button>

                        {/* غائب */}
                        <button
                          onClick={() => handleToggleAttendance(member.id, 'absent')}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                            isAbsent
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-rose-700'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>غائب</span>
                        </button>

                        {/* معذور */}
                        <button
                          onClick={() => handleToggleAttendance(member.id, 'excused')}
                          className={`px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                            isExcused
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-amber-700'
                          }`}
                        >
                          <span>معذور</span>
                        </button>
                      </div>

                      {/* Departure Toggle: انصرف / لم ينصرف */}
                      {isPresent && (
                        <button
                          onClick={() => handleToggleDeparture(member.id)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all ${
                            isDeparted
                              ? 'bg-[#004d46] text-white border-[#004d46] shadow-xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                          title={isDeparted ? 'تم تسجيل انصرافه' : 'اضغط لتسجيل انصراف الكشاف'}
                        >
                          <LogOut className="w-3.5 h-3.5 text-current" />
                          <span>{isDeparted ? 'انصرف' : 'تسجيل انصراف'}</span>
                        </button>
                      )}
                    </div>

                    {/* Field 3: الفئة المخصصة (براعم / أشبال / كشافة) */}
                    <div className="hidden sm:flex sm:col-span-3 items-center justify-end pl-2">
                      <div
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${categoryTheme.bg} ${categoryTheme.border} ${categoryTheme.text}`}
                      >
                        <span className="w-2 h-2 rounded-full bg-current"></span>
                        <span>فئة {member.category}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes / Reasons */}
                  {record.note && (
                    <div className="mt-2 mr-8 text-[11px] text-amber-900 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 inline-flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>ملاحظة: {record.note}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
