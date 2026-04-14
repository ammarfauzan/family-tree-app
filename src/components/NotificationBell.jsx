import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../hooks/useAuth';

export function NotificationBell() {
  const { user } = useAuth();
  const { getUnreadCount } = useNotifications();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!user) return;
    // Fetch count on mount
    getUnreadCount().then(setCount).catch(console.error);

    // Poll every 30s for new notifications
    const interval = setInterval(() => {
      getUnreadCount().then(setCount).catch(console.error);
    }, 30_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <Link
      to="/notifications"
      id="notificationBellBtn"
      className="relative p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors"
      title="Notifications"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {count > 0 && (
        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-slate-900 dark:text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
}
