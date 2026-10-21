import React from 'react';
import { X, Camera, Phone, Shield } from 'lucide-react';
import { ScoutMember } from '../types/scout';
import { getCategoryColor } from '../utils/scoutHelper';

interface PhotoPreviewModalProps {
  member: ScoutMember | null;
  onClose: () => void;
  onEditPhoto?: (member: ScoutMember) => void;
}

export const PhotoPreviewModal: React.FC<PhotoPreviewModalProps> = ({
  member,
  onClose,
  onEditPhoto,
}) => {
  if (!member) return null;

  const categoryTheme = getCategoryColor(member.category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-xs shadow-2xl overflow-hidden border border-slate-100 text-center relative">
        {/* Header bar with scout primary color */}
        <div className="bg-[#00685e] p-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-100">
            <Shield className="w-3.5 h-3.5 text-emerald-300" />
            <span>بطاقة كشاف</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#00524a] hover:bg-[#003d37] flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center">
          {/* Large Photo Frame */}
          <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-[#00685e] shadow-lg mb-3.5 bg-slate-100 flex items-center justify-center">
            {member.photoUrl ? (
              <img
                src={member.photoUrl}
                alt={member.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400">
                <Camera className="w-10 h-10 text-slate-300 mb-1" />
                <span className="text-xs font-semibold">لا توجد صورة</span>
              </div>
            )}
          </div>

          {/* Member Details */}
          <h3 className="text-base font-black text-slate-900 mb-1">{member.name}</h3>
          
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {member.age} سنة
            </span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${categoryTheme.badge}`}>
              فئة {member.category}
            </span>
          </div>

          {member.phone && (
            <a
              href={`tel:${member.phone}`}
              className="text-xs text-[#00685e] font-bold flex items-center gap-1.5 mb-2 hover:underline dir-ltr"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{member.phone}</span>
            </a>
          )}

          {member.notes && (
            <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100 mb-3 w-full">
              {member.notes}
            </p>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-2 w-full pt-1">
            {onEditPhoto && (
              <button
                onClick={() => {
                  onClose();
                  onEditPhoto(member);
                }}
                className="flex-1 py-2 rounded-xl bg-[#00685e] hover:bg-[#00554d] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{member.photoUrl ? 'تعديل الصورة' : 'إرفاق صورة'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
