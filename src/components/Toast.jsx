import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ message, variant = 'success', duration = 4000 }) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, variant, duration, exiting: false }]);

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
        );
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 300);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const success = useCallback((message) => addToast({ message, variant: 'success' }), [addToast]);
  const error = useCallback((message) => addToast({ message, variant: 'error' }), [addToast]);
  const warning = useCallback((message) => addToast({ message, variant: 'warning' }), [addToast]);
  const info = useCallback((message) => addToast({ message, variant: 'info' }), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

/* ── Toast Container ─────────────────────── */
function ToastContainer({ toasts, removeToast }) {
  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

/* ── Single Toast ────────────────────────── */
function ToastItem({ toast, onDismiss }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (toast.duration <= 0) return;
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / toast.duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [toast.duration]);

  const variantStyles = {
    success: {
      bg: 'bg-white dark:bg-slate-800 border-brand-500',
      icon: '✓',
      iconBg: 'bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400',
      bar: 'bg-brand-500',
    },
    error: {
      bg: 'bg-white dark:bg-slate-800 border-red-500',
      icon: '✕',
      iconBg: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
      bar: 'bg-red-500',
    },
    warning: {
      bg: 'bg-white dark:bg-slate-800 border-amber-500',
      icon: '!',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
      bar: 'bg-amber-500',
    },
    info: {
      bg: 'bg-white dark:bg-slate-800 border-sky-500',
      icon: 'i',
      iconBg: 'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400',
      bar: 'bg-sky-500',
    },
  };

  const v = variantStyles[toast.variant] || variantStyles.info;

  return (
    <div
      className={`pointer-events-auto rounded-xl border shadow-lg overflow-hidden ${v.bg} ${
        toast.exiting ? 'toast-exit' : 'toast-enter'
      }`}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${v.iconBg}`}>
          {v.icon}
        </div>
        <p className="text-sm text-slate-800 dark:text-slate-200 flex-1 leading-relaxed pt-0.5">
          {toast.message}
        </p>
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg leading-none flex-shrink-0 transition-colors"
        >
          ×
        </button>
      </div>
      {/* Progress bar */}
      {toast.duration > 0 && (
        <div className="h-0.5 w-full bg-slate-100 dark:bg-slate-700">
          <div
            className={`h-full transition-none ${v.bar}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
