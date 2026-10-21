import { ScoutCategory, ScoutMember, AttendanceSession, DayAttendance } from '../types/scout';

export const CATEGORY_ORDER: Record<ScoutCategory, number> = {
  'براعم': 1,
  'أشبال': 2,
  'كشافة': 3,
};

/**
 * Determine category based on age:
 * 6, 7, 8 => براعم
 * 9, 10, 11 => أشبال
 * 12, 13, 14 => كشافة
 */
export function getCategoryFromAge(age: number): ScoutCategory {
  if (age <= 8) return 'براعم';
  if (age <= 11) return 'أشبال';
  return 'كشافة';
}

export function getCategoryColor(category: ScoutCategory): { bg: string; text: string; border: string; badge: string } {
  switch (category) {
    case 'براعم':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        badge: 'bg-emerald-600 text-white',
      };
    case 'أشبال':
      return {
        bg: 'bg-teal-50',
        text: 'text-teal-800',
        border: 'border-teal-200',
        badge: 'bg-[#00685e] text-white',
      };
    case 'كشافة':
      return {
        bg: 'bg-cyan-50',
        text: 'text-cyan-800',
        border: 'border-cyan-200',
        badge: 'bg-[#004d46] text-white',
      };
  }
}

/**
 * Compress an uploaded photo file using canvas to keep local storage lightweight (~20KB)
 */
export async function compressScoutPhoto(file: File, maxDim = 260, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Make square avatar with centered crop
        const minSide = Math.min(img.width, img.height);
        const startX = (img.width - minSide) / 2;
        const startY = (img.height - minSide) / 2;

        const targetSize = Math.min(minSide, maxDim);
        canvas.width = targetSize;
        canvas.height = targetSize;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, targetSize, targetSize);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('فشل تحميل الصورة'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('فشل قراءة ملف الصورة'));
    reader.readAsDataURL(file);
  });
}

export function getBoyInitials(name: string): string {
  if (!name) return 'ك';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]} ${parts[1][0]}`;
  }
  return parts[0].slice(0, 2);
}

export const DEFAULT_PATROL_NAMES: Record<ScoutCategory, string[]> = {
  'براعم': ['سداسي النجوم', 'سداسي الأمل', 'سداسي الربيع', 'سداسي الفراشات', 'سداسي البراءة'],
  'أشبال': ['طليعة الصقور', 'طليعة الأسود', 'طليعة الوفاء', 'طليعة الإقدام', 'طليعة النمور'],
  'كشافة': ['طليعة الفرسان', 'طليعة الرواد', 'طليعة الشهامة', 'طليعة الشجاعة', 'طليعة أبي الفضل (ع)'],
};

export function autoGeneratePatrols(
  members: ScoutMember[],
  presentMemberIds: string[],
  groupSize = 5
): import('../types/scout').ScoutPatrol[] {
  const presentMembers = members.filter((m) => presentMemberIds.includes(m.id));
  const patrols: import('../types/scout').ScoutPatrol[] = [];

  const categories: ScoutCategory[] = ['براعم', 'أشبال', 'كشافة'];

  categories.forEach((cat) => {
    const catMembers = presentMembers.filter((m) => m.category === cat);
    if (catMembers.length === 0) return;

    const namesList = DEFAULT_PATROL_NAMES[cat];
    let patrolIndex = 0;

    for (let i = 0; i < catMembers.length; i += groupSize) {
      const chunk = catMembers.slice(i, i + groupSize);
      const defaultName =
        namesList[patrolIndex % namesList.length] +
        (patrolIndex >= namesList.length ? ` (${Math.floor(patrolIndex / namesList.length) + 1})` : '');

      patrols.push({
        id: `patrol_${cat}_${Date.now()}_${patrolIndex}`,
        name: defaultName,
        category: cat,
        memberIds: chunk.map((m) => m.id), // The first element is the patrol leader
      });
      patrolIndex++;
    }
  });

  return patrols;
}



export const INITIAL_MEMBERS: ScoutMember[] = [
  // فئة البراعم (6-8)
  { id: 'm1', name: 'علي حسن الساعدي', age: 7, category: 'براعم', phone: '07701234561', joinedDate: '2026-01-10' },
  { id: 'm2', name: 'حسين جواد الكاظمي', age: 6, category: 'براعم', phone: '07701234562', joinedDate: '2026-01-15' },
  { id: 'm3', name: 'محمد رضا الموسوي', age: 8, category: 'براعم', phone: '07701234563', joinedDate: '2026-02-01' },
  { id: 'm4', name: 'جعفر صادق العباسي', age: 7, category: 'براعم', phone: '07701234564', joinedDate: '2026-02-12' },

  // فئة الأشبال (9-11)
  { id: 'm5', name: 'عباس فاضل التميمي', age: 10, category: 'أشبال', phone: '07702345671', joinedDate: '2025-11-20' },
  { id: 'm6', name: 'مهدي باقر الحلي', age: 9, category: 'أشبال', phone: '07702345672', joinedDate: '2025-12-05' },
  { id: 'm7', name: 'موسى كريم الخفاجي', age: 11, category: 'أشبال', phone: '07702345673', joinedDate: '2025-10-18' },
  { id: 'm8', name: 'أمير منتظر الزيدي', age: 10, category: 'أشبال', phone: '07702345674', joinedDate: '2026-01-08' },

  // فئة الكشافة (12-14)
  { id: 'm9', name: 'مرتضى هادي الشمري', age: 13, category: 'كشافة', phone: '07703456781', joinedDate: '2025-09-01' },
  { id: 'm10', name: 'سجاد قاسم النجفي', age: 12, category: 'كشافة', phone: '07703456782', joinedDate: '2025-08-15' },
  { id: 'm11', name: 'زيد حيدر العامري', age: 14, category: 'كشافة', phone: '07703456783', joinedDate: '2025-07-22' },
  { id: 'm12', name: 'أحمد ماجد الأسدي', age: 13, category: 'كشافة', phone: '07703456784', joinedDate: '2025-09-10' },
];

export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatArabicDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('ar-IQ', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function getCurrentTimeArabic(): string {
  const now = new Date();
  return now.toLocaleTimeString('ar-IQ', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

const STORAGE_KEY_MEMBERS = 'kashafa_alabbas_members_v1';
const STORAGE_KEY_SESSIONS = 'kashafa_alabbas_sessions_v1';
const STORAGE_KEY_ACTIVE_DATE = 'kashafa_alabbas_active_date_v1';

export function loadMembersFromStorage(): ScoutMember[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MEMBERS);
    if (!raw) {
      saveMembersToStorage(INITIAL_MEMBERS);
      return INITIAL_MEMBERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_MEMBERS;
  } catch {
    return INITIAL_MEMBERS;
  }
}

export function saveMembersToStorage(members: ScoutMember[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(members));
  } catch (err) {
    console.error('Failed to save members to localStorage', err);
  }
}

export function loadSessionsFromStorage(): Record<string, AttendanceSession> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (!raw) {
      const today = getTodayDateString();
      const initialSession: AttendanceSession = {
        date: today,
        title: 'النشاط الكشفي الأسبوعي',
        records: {
          m1: { memberId: 'm1', status: 'present', departureStatus: 'departed', checkInTime: '04:15 م', departureTime: '06:30 م' },
          m2: { memberId: 'm2', status: 'present', departureStatus: 'present_not_departed', checkInTime: '04:20 م' },
          m3: { memberId: 'm3', status: 'absent', departureStatus: 'none', note: 'ظرف عائلي' },
          m4: { memberId: 'm4', status: 'present', departureStatus: 'present_not_departed', checkInTime: '04:30 م' },
          m5: { memberId: 'm5', status: 'present', departureStatus: 'departed', checkInTime: '04:10 م', departureTime: '06:30 م' },
          m6: { memberId: 'm6', status: 'present', departureStatus: 'present_not_departed', checkInTime: '04:25 م' },
          m7: { memberId: 'm7', status: 'excused', departureStatus: 'none', note: 'امتحانات مدرسية' },
          m8: { memberId: 'm8', status: 'present', departureStatus: 'present_not_departed', checkInTime: '04:18 م' },
          m9: { memberId: 'm9', status: 'present', departureStatus: 'departed', checkInTime: '04:00 م', departureTime: '06:35 م' },
          m10: { memberId: 'm10', status: 'present', departureStatus: 'present_not_departed', checkInTime: '04:05 م' },
          m11: { memberId: 'm11', status: 'present', departureStatus: 'departed', checkInTime: '04:12 م', departureTime: '06:30 م' },
          m12: { memberId: 'm12', status: 'absent', departureStatus: 'none' },
        },
        patrols: [
          {
            id: 'init_p1',
            name: 'سداسي النجوم (براعم)',
            category: 'براعم',
            memberIds: ['m1', 'm2', 'm4'], // m1 is leader
          },
          {
            id: 'init_p2',
            name: 'طليعة الصقور (أشبال)',
            category: 'أشبال',
            memberIds: ['m5', 'm6', 'm8'], // m5 is leader
          },
          {
            id: 'init_p3',
            name: 'طليعة الفرسان (كشافة)',
            category: 'كشافة',
            memberIds: ['m9', 'm10', 'm11'], // m9 is leader
          },
        ],
      };
      const initialMap = { [today]: initialSession };
      saveSessionsToStorage(initialMap);
      return initialMap;
    }
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveSessionsToStorage(sessions: Record<string, AttendanceSession>): void {
  try {
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
  } catch (err) {
    console.error('Failed to save sessions to localStorage', err);
  }
}

export function loadActiveDate(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_DATE);
    return saved || getTodayDateString();
  } catch {
    return getTodayDateString();
  }
}

export function saveActiveDate(date: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_DATE, date);
  } catch (err) {
    console.error('Failed to save active date', err);
  }
}
