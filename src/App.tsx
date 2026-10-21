/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Header
} from './components/Header';
import { AttendanceWindow } from './components/AttendanceWindow';
import { MembersWindow } from './components/MembersWindow';
import { PatrolsWindow } from './components/PatrolsWindow';
import { AddMemberModal } from './components/AddMemberModal';
import { DatePickerModal } from './components/DatePickerModal';
import { PrintReportModal } from './components/PrintReportModal';
import { PhotoPreviewModal } from './components/PhotoPreviewModal';
import {
  ScoutMember,
  ScoutPatrol,
  AttendanceSession,
  AttendanceStatus,
  DepartureStatus,
  DayAttendance
} from './types/scout';
import {
  loadMembersFromStorage,
  saveMembersToStorage,
  loadSessionsFromStorage,
  saveSessionsToStorage,
  loadActiveDate,
  saveActiveDate,
  getTodayDateString,
  getCurrentTimeArabic,
  INITIAL_MEMBERS
} from './utils/scoutHelper';
import { CheckCircle2, Users, Calendar, PlusCircle, Smartphone, Sparkles, RotateCcw, Shield } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'members' | 'patrols'>('attendance');
  const [members, setMembers] = useState<ScoutMember[]>(loadMembersFromStorage);
  const [sessions, setSessions] = useState<Record<string, AttendanceSession>>(loadSessionsFromStorage);
  const [activeDate, setActiveDate] = useState<string>(loadActiveDate);

  // Modals state
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<ScoutMember | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);
  const [selectedMemberForPhoto, setSelectedMemberForPhoto] = useState<ScoutMember | null>(null);
  const [isMobileFrame, setIsMobileFrame] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    saveMembersToStorage(members);
  }, [members]);

  useEffect(() => {
    saveSessionsToStorage(sessions);
  }, [sessions]);

  useEffect(() => {
    saveActiveDate(activeDate);
  }, [activeDate]);

  // Ensure current active date has an initialized session
  useEffect(() => {
    if (!sessions[activeDate]) {
      const newSession: AttendanceSession = {
        date: activeDate,
        title: 'نشاط كشفي',
        records: {},
      };
      setSessions((prev) => ({
        ...prev,
        [activeDate]: newSession,
      }));
    }
  }, [activeDate, sessions]);

  // Current session & records
  const currentSession = sessions[activeDate];
  const currentRecords = currentSession?.records || {};

  // Compute daily stats for Header
  const dailyStats = useMemo(() => {
    const recordsList = Object.values(currentRecords);
    const present = recordsList.filter((r) => r.status === 'present').length;
    const departed = recordsList.filter((r) => r.departureStatus === 'departed').length;
    const absent = recordsList.filter((r) => r.status === 'absent').length;
    return {
      total: members.length,
      present,
      departed,
      absent,
    };
  }, [currentRecords, members.length]);

  // Handler: Add or Edit Member (Synchronizes to both Window 1 and Window 2)
  const handleSaveMember = (memberData: Omit<ScoutMember, 'id'>, editId?: string) => {
    if (editId) {
      // Edit existing member
      setMembers((prev) =>
        prev.map((m) => (m.id === editId ? { ...m, ...memberData } : m))
      );
    } else {
      // Add new member
      const newId = `m_${Date.now()}`;
      const newMember: ScoutMember = {
        id: newId,
        ...memberData,
        joinedDate: getTodayDateString(),
      };
      setMembers((prev) => [...prev, newMember]);

      // Initialize record for active session
      setSessions((prev) => {
        const session = prev[activeDate] || { date: activeDate, records: {} };
        return {
          ...prev,
          [activeDate]: {
            ...session,
            records: {
              ...session.records,
              [newId]: {
                memberId: newId,
                status: 'present',
                departureStatus: 'present_not_departed',
                checkInTime: getCurrentTimeArabic(),
              },
            },
          },
        };
      });
    }
  };

  // Handler: Delete Member
  const handleDeleteMember = (memberId: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    // Clean up records from active sessions
    setSessions((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((d) => {
        if (updated[d].records && updated[d].records[memberId]) {
          const newRecs = { ...updated[d].records };
          delete newRecs[memberId];
          updated[d] = { ...updated[d], records: newRecs };
        }
      });
      return updated;
    });
  };

  // Handler: Attach/update photo directly for a boy
  const handleAttachPhoto = (memberId: string, photoUrl: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, photoUrl } : m))
    );
  };

  // Handler: Update Attendance status (حاضر / غائب / معذور)
  const handleUpdateAttendance = (
    memberId: string,
    status: AttendanceStatus,
    departureStatus?: DepartureStatus
  ) => {
    setSessions((prev) => {
      const session = prev[activeDate] || { date: activeDate, records: {} };
      const existing = session.records[memberId] || {
        memberId,
        status: 'absent',
        departureStatus: 'none',
      };

      const newRecord: DayAttendance = {
        ...existing,
        status,
        departureStatus: departureStatus !== undefined ? departureStatus : existing.departureStatus,
      };

      return {
        ...prev,
        [activeDate]: {
          ...session,
          records: {
            ...session.records,
            [memberId]: newRecord,
          },
        },
      };
    });
  };

  // Handler: Update check-in or departure times and notes
  const handleUpdateTimes = (
    memberId: string,
    checkInTime?: string,
    departureTime?: string,
    note?: string
  ) => {
    setSessions((prev) => {
      const session = prev[activeDate] || { date: activeDate, records: {} };
      const existing = session.records[memberId] || {
        memberId,
        status: 'present',
        departureStatus: 'present_not_departed',
      };

      return {
        ...prev,
        [activeDate]: {
          ...session,
          records: {
            ...session.records,
            [memberId]: {
              ...existing,
              checkInTime: checkInTime !== undefined ? checkInTime : existing.checkInTime,
              departureTime: departureTime !== undefined ? departureTime : existing.departureTime,
              note: note !== undefined ? note : existing.note,
            },
          },
        },
      };
    });
  };

  // Bulk Attendance
  const handleBulkAttendance = (status: AttendanceStatus) => {
    setSessions((prev) => {
      const session = prev[activeDate] || { date: activeDate, records: {} };
      const updatedRecords: Record<string, DayAttendance> = { ...session.records };

      members.forEach((m) => {
        const prevRec = updatedRecords[m.id];
        updatedRecords[m.id] = {
          memberId: m.id,
          status,
          departureStatus: status === 'present' ? 'present_not_departed' : 'none',
          checkInTime: status === 'present' ? (prevRec?.checkInTime || getCurrentTimeArabic()) : undefined,
          departureTime: status === 'present' ? prevRec?.departureTime : undefined,
          note: prevRec?.note,
        };
      });

      return {
        ...prev,
        [activeDate]: {
          ...session,
          records: updatedRecords,
        },
      };
    });
  };

  // Bulk Departure
  const handleBulkDeparture = (departureStatus: DepartureStatus) => {
    setSessions((prev) => {
      const session = prev[activeDate] || { date: activeDate, records: {} };
      const updatedRecords: Record<string, DayAttendance> = { ...session.records };

      members.forEach((m) => {
        const prevRec = updatedRecords[m.id];
        if (prevRec && prevRec.status === 'present') {
          updatedRecords[m.id] = {
            ...prevRec,
            departureStatus,
            departureTime: departureStatus === 'departed' ? getCurrentTimeArabic() : undefined,
          };
        }
      });

      return {
        ...prev,
        [activeDate]: {
          ...session,
          records: updatedRecords,
        },
      };
    });
  };

  // Handler: Update patrols for current active session
  const handleUpdatePatrols = (newPatrols: ScoutPatrol[]) => {
    setSessions((prev) => {
      const session = prev[activeDate] || { date: activeDate, records: {} };
      return {
        ...prev,
        [activeDate]: {
          ...session,
          patrols: newPatrols,
        },
      };
    });
  };

  // Handler: Add New Manual Date Session
  const handleAddDate = (newDate: string, title?: string) => {
    setSessions((prev) => {
      if (prev[newDate]) return prev;
      return {
        ...prev,
        [newDate]: {
          date: newDate,
          title: title || 'نشاط كشفي',
          records: {},
        },
      };
    });
    setActiveDate(newDate);
  };

  // Handler: Delete Session
  const handleDeleteSession = (dateToDelete: string) => {
    setSessions((prev) => {
      const updated = { ...prev };
      delete updated[dateToDelete];
      return updated;
    });
    const remaining = Object.keys(sessions).filter((d) => d !== dateToDelete);
    if (remaining.length > 0) {
      setActiveDate(remaining[0]);
    } else {
      const today = getTodayDateString();
      handleAddDate(today);
    }
  };

  // Handler: Import full backup
  const handleImportBackup = (data: { members: ScoutMember[]; sessions: Record<string, AttendanceSession> }) => {
    setMembers(data.members);
    setSessions(data.sessions);
    const dates = Object.keys(data.sessions);
    if (dates.length > 0) {
      setActiveDate(dates[0]);
    }
  };

  // Reset to initial sample data
  const handleResetSampleData = () => {
    if (confirm('هل ترغب في إعادة ضبط البيانات إلى النماذج الافتراضية لكشافة العباس؟')) {
      localStorage.clear();
      setMembers(INITIAL_MEMBERS);
      const today = getTodayDateString();
      const initialMap = loadSessionsFromStorage();
      setSessions(initialMap);
      setActiveDate(today);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start py-0 md:py-6 px-0 md:px-4">
      {/* Container (Supports authentic mobile chassis frame or wide layout) */}
      <div
        className={`w-full transition-all duration-300 ${
          isMobileFrame
            ? 'max-w-md bg-white min-h-[92vh] rounded-[36px] shadow-2xl border-[10px] border-slate-900 overflow-hidden relative my-2'
            : 'max-w-5xl bg-slate-50 min-h-screen md:min-h-0 md:rounded-3xl shadow-sm border border-slate-200 overflow-hidden'
        }`}
      >
        {/* Mobile speaker notch when in mobile frame mode */}
        {isMobileFrame && (
          <div className="bg-slate-900 text-white pt-2.5 pb-1 flex justify-center items-center">
            <div className="w-20 h-4 bg-slate-800 rounded-full flex items-center justify-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-slate-700"></div>
              <div className="w-8 h-1.5 rounded-full bg-slate-700"></div>
            </div>
          </div>
        )}

        {/* Scout App Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeDate={activeDate}
          onOpenDatePicker={() => setIsDatePickerOpen(true)}
          onOpenAddMember={() => {
            setMemberToEdit(null);
            setIsAddMemberOpen(true);
          }}
          onOpenPrintReport={() => setIsPrintReportOpen(true)}
          stats={dailyStats}
          storedDaysCount={Object.keys(sessions).length}
          isMobileFrame={isMobileFrame}
          setIsMobileFrame={setIsMobileFrame}
        />

        {/* Main Content Area */}
        <main className="p-3 sm:p-5">
          {activeTab === 'attendance' ? (
            /* Window 1: نافذة الحضور والانصراف */
            <AttendanceWindow
              members={members}
              activeDate={activeDate}
              records={currentRecords}
              onUpdateAttendance={handleUpdateAttendance}
              onUpdateTimes={handleUpdateTimes}
              onOpenAddMember={() => {
                setMemberToEdit(null);
                setIsAddMemberOpen(true);
              }}
              onOpenDatePicker={() => setIsDatePickerOpen(true)}
              onBulkAttendance={handleBulkAttendance}
              onBulkDeparture={handleBulkDeparture}
              onViewPhoto={(member) => setSelectedMemberForPhoto(member)}
              onAttachPhoto={handleAttachPhoto}
            />
          ) : activeTab === 'members' ? (
            /* Window 2: نافذة سجل الأعضاء والفئات */
            <MembersWindow
              members={members}
              sessions={sessions}
              onOpenAddMember={() => {
                setMemberToEdit(null);
                setIsAddMemberOpen(true);
              }}
              onEditMember={(member) => {
                setMemberToEdit(member);
                setIsAddMemberOpen(true);
              }}
              onDeleteMember={handleDeleteMember}
              onViewPhoto={(member) => setSelectedMemberForPhoto(member)}
              onAttachPhoto={handleAttachPhoto}
            />
          ) : (
            /* Window 3: نافذة تشكيل الطلائع والمجاميع للحاضرين */
            <PatrolsWindow
              members={members}
              activeDate={activeDate}
              records={currentRecords}
              patrols={currentSession?.patrols || []}
              onUpdatePatrols={handleUpdatePatrols}
              onViewPhoto={(member) => setSelectedMemberForPhoto(member)}
            />
          )}
        </main>

        {/* Mobile Sticky Bottom Navigation Bar (3 Tabs + Quick Add) */}
        <nav className="fixed md:sticky bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-between shadow-lg">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1 rounded-xl transition-all ${
              activeTab === 'attendance'
                ? 'text-[#00685e] font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2
              className={`w-5 h-5 ${activeTab === 'attendance' ? 'text-[#00685e]' : 'text-slate-400'}`}
            />
            <span className="text-[10px]">1. الحضور</span>
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1 rounded-xl transition-all ${
              activeTab === 'members'
                ? 'text-[#00685e] font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users
              className={`w-5 h-5 ${activeTab === 'members' ? 'text-[#00685e]' : 'text-slate-400'}`}
            />
            <span className="text-[10px]">2. الأعضاء</span>
          </button>

          {/* Quick Floating Add Button in Center */}
          <button
            onClick={() => {
              setMemberToEdit(null);
              setIsAddMemberOpen(true);
            }}
            className="w-10 h-10 -mt-4 mx-1 rounded-full bg-[#00685e] text-white flex items-center justify-center shadow-lg shadow-emerald-900/30 hover:bg-[#00554d] active:scale-90 transition-all border-2 border-white shrink-0"
            title="إضافة كشاف جديد"
          >
            <PlusCircle className="w-5 h-5" />
          </button>

          <button
            onClick={() => setActiveTab('patrols')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1 rounded-xl transition-all ${
              activeTab === 'patrols'
                ? 'text-[#00685e] font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield
              className={`w-5 h-5 ${activeTab === 'patrols' ? 'text-[#00685e]' : 'text-slate-400'}`}
            />
            <span className="text-[10px]">3. الطلائع (5/مجموعة)</span>
          </button>
        </nav>

        {/* Desktop Footer with reset and info */}
        <footer className="hidden sm:flex items-center justify-between px-5 py-3 bg-slate-100 text-[11px] text-slate-500 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <img
              src="/assets/aistudio/_____________e13acb2d.jpg"
              alt="كشافة العباس"
              className="w-4 h-4 rounded-full object-cover"
            />
            <span>كشافة العباس (ع) · نظام إدارة الحضور والانصراف والفئات</span>
          </div>
          <button
            onClick={handleResetSampleData}
            className="text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
            title="استعادة البيانات الافتراضية"
          >
            <RotateCcw className="w-3 h-3" />
            <span>إعادة تعيين البيانات النموذجية</span>
          </button>
        </footer>
      </div>

      {/* Modals */}
      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => {
          setIsAddMemberOpen(false);
          setMemberToEdit(null);
        }}
        onSave={handleSaveMember}
        memberToEdit={memberToEdit}
      />

      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        activeDate={activeDate}
        onSelectDate={(date) => setActiveDate(date)}
        sessions={sessions}
        members={members}
        onAddDate={handleAddDate}
        onDeleteSession={handleDeleteSession}
        onImportBackup={handleImportBackup}
      />

      <PrintReportModal
        isOpen={isPrintReportOpen}
        onClose={() => setIsPrintReportOpen(false)}
        activeDate={activeDate}
        session={currentSession}
        members={members}
      />

      {/* Photo Preview & Scout Card Modal */}
      <PhotoPreviewModal
        member={selectedMemberForPhoto}
        onClose={() => setSelectedMemberForPhoto(null)}
        onEditPhoto={(member) => {
          setSelectedMemberForPhoto(null);
          setMemberToEdit(member);
          setIsAddMemberOpen(true);
        }}
      />
    </div>
  );
}
