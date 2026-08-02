import { memo } from 'react';
import { useNavigate } from 'react-router-dom';

export const MemberCard = memo(function MemberCard({ member, treeId }) {
  const navigate = useNavigate();
  const deceased = member.is_deceased;
  const avatarSeed = encodeURIComponent(member.full_name);
  const dicebearUrl = `https://api.dicebear.com/8.x/lorelei/svg?seed=${avatarSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

  return (
    <button
      onClick={() => navigate(`/trees/${treeId}/members/${member.id}`)}
      className={[
        'card card-hover flex items-center gap-4 w-full text-left transition-all group',
        deceased
          ? 'opacity-70 hover:opacity-90 hover:border-slate-400 dark:hover:border-slate-600'
          : 'hover:border-brand-500 dark:hover:border-brand-600',
      ].join(' ')}
    >
      {/* Avatar */}
      <img
        src={member.profile_photo || dicebearUrl}
        alt={member.full_name}
        className={`w-12 h-12 rounded-full object-cover ring-2 flex-shrink-0 bg-slate-100 dark:bg-slate-700 ${
          deceased
            ? 'ring-slate-300 dark:ring-slate-600 grayscale opacity-70'
            : 'ring-brand-200 dark:ring-brand-800 group-hover:ring-brand-400 dark:group-hover:ring-brand-600'
        } transition-all`}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`font-semibold text-sm truncate transition-colors ${
            deceased
              ? 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'
              : 'text-slate-900 dark:text-slate-100 group-hover:text-brand-700 dark:group-hover:text-brand-300'
          }`}>
            {member.full_name}
          </p>
          {deceased && (
            <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 border border-slate-300 dark:border-slate-700 text-[10px] flex-shrink-0">
              🕊️ Almarhum
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {member.birth_date ? `Lahir ${member.birth_date}` : 'Tanggal lahir belum diisi'}
          {deceased && member.death_date && (
            <span className="ml-1">· Wafat {member.death_date}</span>
          )}
        </p>
      </div>

      <svg className={`w-4 h-4 flex-shrink-0 transition-all group-hover:translate-x-0.5 ${
        deceased ? 'text-slate-400 dark:text-slate-600' : 'text-slate-400 dark:text-slate-600 group-hover:text-brand-500 dark:group-hover:text-brand-400'
      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
});
