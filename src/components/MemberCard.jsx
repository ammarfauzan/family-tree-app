import { memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const MemberCard = memo(function MemberCard({ member, treeId }) {
  const navigate = useNavigate();
  const initials = member.full_name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const deceased = member.is_deceased;

  return (
    <button
      onClick={() => navigate(`/trees/${treeId}/members/${member.id}`)}
      className={[
        'card flex items-center gap-4 w-full text-left transition-all group',
        deceased
          ? 'opacity-60 hover:opacity-80 border-slate-700 hover:border-slate-600 hover:bg-slate-800/30'
          : 'hover:border-brand-600 hover:bg-slate-800/50',
      ].join(' ')}
    >
      {/* Avatar */}
      {member.profile_photo ? (
        <img
          src={member.profile_photo}
          alt={member.full_name}
          className={`w-12 h-12 rounded-full object-cover ring-2 flex-shrink-0 ${
            deceased ? 'ring-slate-600 grayscale' : 'ring-slate-700'
          }`}
        />
      ) : (
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
            deceased ? 'bg-slate-600' : 'bg-brand-700'
          }`}
        >
          {initials}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`font-semibold text-sm truncate transition-colors ${
            deceased
              ? 'text-slate-400 group-hover:text-slate-300'
              : 'text-slate-100 group-hover:text-brand-300'
          }`}>
            {member.full_name}
          </p>
          {deceased && (
            <span className="badge bg-slate-800 text-slate-500 border border-slate-700 text-[10px] flex-shrink-0">
              † Deceased
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          {member.birth_date ? `b. ${member.birth_date}` : 'No birth date'}
          {deceased && member.death_date && (
            <span className="ml-1">· d. {member.death_date}</span>
          )}
        </p>
      </div>

      <svg className={`w-4 h-4 flex-shrink-0 transition-colors ${
        deceased ? 'text-slate-600' : 'text-slate-600 group-hover:text-brand-400'
      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
});
