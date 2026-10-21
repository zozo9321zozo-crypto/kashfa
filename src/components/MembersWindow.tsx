import React, { useState, useMemo, useRef } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Edit2,
  Trash2,
  ShieldCheck,
  ArrowUpDown,
  X,
  Camera,
  ImageIcon
} from 'lucide-react';
import { ScoutMember, ScoutCategory, AttendanceSession } from '../types/scout';
import { CATEGORY_ORDER, getCategoryColor, getBoyInitials, compressScoutPhoto } from '../utils/scoutHelper';

interface MembersWindowProps {
  members: ScoutMember[];
  sessions: Record<string, AttendanceSession>;
  onOpenAddMember: () => void;
  onEditMember: (member: ScoutMember) => void;
  onDeleteMember: (id: string) => void;
  onViewPhoto: (member: ScoutMember) => void;
  onAttachPhoto: (memberId: string, photoUrl: string) => void;
}

export const MembersWindow: React.FC<MembersWindowProps> = ({
  members,
  sessions,
  onOpenAddMember,
  onEditMember,
  onDeleteMember,
  onViewPhoto,
  onAttachPhoto,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ScoutCategory | 'الكل'>('الكل');
  const [sortField, setSortField] = useState<'category' | 'name' | 'age'>('category');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Quick photo upload ref
  const quickPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const [targetMemberIdForPhoto, setTargetMemberIdForPhoto] = useState<string | null>(null);

  // Calculate statistics across all registered dates
  const totalSessionsCount = Object.keys(sessions).length;

  const memberStats = useMemo(() => {
    const statsMap: Record<string, { presentCount: number; attendedPercentage: number }> = {};
    members.forEach((m) => {
      let presentCount = 0;
      Object.values(sessions).forEach((sess) => {
        if (sess.records && sess.records[m.id]?.status === 'present') {
          presentCount++;
        }
      });
      const attendedPercentage =
        totalSessionsCount > 0 ? Math.round((presentCount / totalSessionsCount) * 100) : 0;
      statsMap[m.id] = { presentCount, attendedPercentage };
    });
    return statsMap;
  }, [members, sessions, totalSessionsCount]);

  // Breakdown by category
  const categoryCounts = useMemo(() => {
    return {
      براعم: members.filter((m) => m.category === 'براعم').length,
      أشبال: members.filter((m) => m.category === 'أشبال').length,
      كشافة: members.filter((m) => m.category === 'كشافة').length,
    };
  }, [members]);

  // Filtered & sorted members
  const filteredMembers = useMemo(() => {
    let list = [...members];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((m) => m.name.toLowerCase().includes(q) || (m.phone && m.phone.includes(q)));
    }

    if (categoryFilter !== 'الكل') {
      list = list.filter((m) => m.category === categoryFilter);
    }

    list.sort((a, b) => {
      if (sortField === 'category') {
        const orderA = CATEGORY_ORDER[a.category] || 99;
        const orderB = CATEGORY_ORDER[b.category] || 99;
        if (orderA !== orderB) {
          return sortDirection === 'asc' ? orderA - orderB : orderB - orderA;
        }
        return a.age - b.age;
      } else if (sortField === 'age') {
        return sortDirection === 'asc' ? a.age - b.age : b.age - a.age;
      } else {
        const comp = a.name.localeCompare(b.name, 'ar');
        return sortDirection === 'asc' ? comp : -comp;
      }
    });

    return list;
  }, [members, searchQuery, categoryFilter, sortField, sortDirection]);

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

      {/* Category Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* البراعم (6-8) */}
        <div
          onClick={() => setCategoryFilter(categoryFilter === 'براعم' ? 'الكل' : 'براعم')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            categoryFilter === 'براعم'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-500/30'
              : 'bg-white hover:border-emerald-300 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                categoryFilter === 'براعم' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              فئة البراعم
            </span>
            <span
              className={`text-[11px] font-semibold ${
                categoryFilter === 'براعم' ? 'text-emerald-100' : 'text-slate-400'
              }`}
            >
              الأعمار: 6، 7، 8 سنوات
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <strong className="text-2xl font-black">{categoryCounts.براعم}</strong>
            <span
              className={`text-xs font-medium ${
                categoryFilter === 'براعم' ? 'text-emerald-100' : 'text-slate-500'
              }`}
            >
              كشاف مسجل
            </span>
          </div>
        </div>

        {/* الأشبال (9-11) */}
        <div
          onClick={() => setCategoryFilter(categoryFilter === 'أشبال' ? 'الكل' : 'أشبال')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            categoryFilter === 'أشبال'
              ? 'bg-[#00685e] text-white border-teal-800 shadow-md ring-2 ring-teal-500/30'
              : 'bg-white hover:border-teal-300 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                categoryFilter === 'أشبال' ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800'
              }`}
            >
              فئة الأشبال
            </span>
            <span
              className={`text-[11px] font-semibold ${
                categoryFilter === 'أشبال' ? 'text-teal-100' : 'text-slate-400'
              }`}
            >
              الأعمار: 9، 10، 11 سنة
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <strong className="text-2xl font-black">{categoryCounts.أشبال}</strong>
            <span
              className={`text-xs font-medium ${
                categoryFilter === 'أشبال' ? 'text-teal-100' : 'text-slate-500'
              }`}
            >
              كشاف مسجل
            </span>
          </div>
        </div>

        {/* الكشافة (12-14) */}
        <div
          onClick={() => setCategoryFilter(categoryFilter === 'كشافة' ? 'الكل' : 'كشافة')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            categoryFilter === 'كشافة'
              ? 'bg-[#004d46] text-white border-cyan-900 shadow-md ring-2 ring-cyan-500/30'
              : 'bg-white hover:border-cyan-300 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                categoryFilter === 'كشافة' ? 'bg-white/20 text-white' : 'bg-cyan-100 text-cyan-800'
              }`}
            >
              فئة الكشافة
            </span>
            <span
              className={`text-[11px] font-semibold ${
                categoryFilter === 'كشافة' ? 'text-cyan-100' : 'text-slate-400'
              }`}
            >
              الأعمار: 12، 13، 14 سنة
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <strong className="text-2xl font-black">{categoryCounts.كشافة}</strong>
            <span
              className={`text-xs font-medium ${
                categoryFilter === 'كشافة' ? 'text-cyan-100' : 'text-slate-500'
              }`}
            >
              كشاف مسجل
            </span>
          </div>
        </div>
      </div>

      {/* Sync Status Banner */}
      <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-emerald-900">
          <ShieldCheck className="w-5 h-5 text-[#00685e] shrink-0" />
          <div>
            <span className="font-bold">سجل الكشافين متزامن فورياً:</span>{' '}
            <span className="text-slate-700">
              يمكنك إرفاق صورة كل فتى مباشرة، وتظهر الصورة تلقائياً في نافذة الحضور والانصراف وفي سجل الكشافين.
            </span>
          </div>
        </div>
        <button
          onClick={onOpenAddMember}
          className="px-3.5 py-1.5 rounded-xl bg-[#00685e] hover:bg-[#00554d] text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>إضافة كشاف جديد</span>
        </button>
      </div>

      {/* Filter and Search Box */}
      <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-200/80 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم أو رقم الهاتف..."
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

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-500 shrink-0 ml-1">الفئات:</span>
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
                  {cat === 'الكل' ? 'الكل' : cat}
                </button>
              );
            })}
          </div>

          {/* Sort */}
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
                sortField === 'category' ? 'bg-white text-[#00685e] shadow-xs' : 'text-slate-600'
              }`}
            >
              الفئة {sortField === 'category' ? (sortDirection === 'asc' ? '↓' : '↑') : ''}
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
                sortField === 'name' ? 'bg-white text-[#00685e] shadow-xs' : 'text-slate-600'
              }`}
            >
              الاسم {sortField === 'name' ? (sortDirection === 'asc' ? 'أ-ي' : 'ي-أ') : ''}
            </button>
            <button
              onClick={() => {
                if (sortField === 'age') {
                  setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortField('age');
                  setSortDirection('asc');
                }
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                sortField === 'age' ? 'bg-white text-[#00685e] shadow-xs' : 'text-slate-600'
              }`}
            >
              العمر {sortField === 'age' ? (sortDirection === 'asc' ? 'الأصغر' : 'الأكبر') : ''}
            </button>
          </div>
        </div>
      </div>

      {/* Members Directory List */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        {/* Table Header */}
        <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">
          <div className="col-span-5">اسم وصورة الفتى</div>
          <div className="col-span-2 text-center">العمر والتصنيف</div>
          <div className="col-span-2 text-center">الفئة المعتمدة</div>
          <div className="col-span-1 text-center">الحضور</div>
          <div className="col-span-2 text-left pl-2">إجراءات</div>
        </div>

        {/* Member Items */}
        <div className="divide-y divide-slate-100">
          {filteredMembers.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold">لم يتم العثور على كشافين</p>
            </div>
          ) : (
            filteredMembers.map((member, index) => {
              const categoryTheme = getCategoryColor(member.category);
              const stats = memberStats[member.id] || { presentCount: 0, attendedPercentage: 0 };

              return (
                <div
                  key={member.id}
                  className="p-3.5 sm:px-4 sm:py-3 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    {/* Name & Photo */}
                    <div className="sm:col-span-5 flex items-center justify-between sm:justify-start gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Index */}
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>

                        {/* Photo avatar */}
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

                          {/* Quick camera button */}
                          <button
                            type="button"
                            onClick={(e) => triggerAttachPhoto(member.id, e)}
                            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#00685e] text-white flex items-center justify-center shadow-xs hover:bg-[#004f47] transition-all border border-white"
                            title="إرفاق أو تغيير صورة الفتى"
                          >
                            <Camera className="w-2.5 h-2.5" />
                          </button>
                        </div>

                        {/* Name & details */}
                        <div className="min-w-0">
                          <h4
                            onClick={() => onViewPhoto(member)}
                            className="font-bold text-sm text-slate-900 truncate hover:text-[#00685e] cursor-pointer"
                          >
                            {member.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-0.5">
                            {member.phone && (
                              <a
                                href={`tel:${member.phone}`}
                                className="flex items-center gap-1 hover:text-[#00685e] dir-ltr text-right"
                              >
                                <Phone className="w-3 h-3" />
                                {member.phone}
                              </a>
                            )}
                            {member.notes && <span>· {member.notes}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Mobile badges */}
                      <div className="sm:hidden flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {member.age} سنة
                        </span>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-lg font-bold ${categoryTheme.badge}`}
                        >
                          {member.category}
                        </span>
                      </div>
                    </div>

                    {/* Age info */}
                    <div className="hidden sm:flex sm:col-span-2 items-center justify-center">
                      <div className="text-center">
                        <span className="text-sm font-bold text-slate-800">
                          {member.age} سنة
                        </span>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {member.age <= 8
                            ? '6-8 سنوات'
                            : member.age <= 11
                            ? '9-11 سنة'
                            : '12-14 سنة'}
                        </p>
                      </div>
                    </div>

                    {/* Category */}
                    <div className="hidden sm:flex sm:col-span-2 items-center justify-center">
                      <div
                        className={`px-3 py-1 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${categoryTheme.bg} ${categoryTheme.border} ${categoryTheme.text}`}
                      >
                        <span className="w-2 h-2 rounded-full bg-current"></span>
                        <span>فئة {member.category}</span>
                      </div>
                    </div>

                    {/* Attendance stats */}
                    <div className="sm:col-span-1 flex items-center justify-between sm:justify-center gap-1">
                      <div className="text-center">
                        <span className="text-xs font-bold text-emerald-800">
                          {stats.presentCount}/{totalSessionsCount}
                        </span>
                        <div className="text-[10px] font-semibold text-slate-500">
                          {stats.attendedPercentage}%
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="sm:col-span-2 flex items-center justify-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <button
                        onClick={() => onViewPhoto(member)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-[#00685e] hover:bg-emerald-50 transition-colors"
                        title="عرض بطاقة وصورة الفتى"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEditMember(member)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-[#00685e] hover:bg-emerald-50 transition-colors"
                        title="تعديل بيانات الكشاف"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف الكشاف "${member.name}" من السجلات؟`)) {
                            onDeleteMember(member.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="حذف الكشاف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
