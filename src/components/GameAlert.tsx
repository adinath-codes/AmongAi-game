import { useEffect, useState } from 'react';

export type AlertType = 'info' | 'warning' | 'error' | 'success';

interface GameAlertProps {
  message: string;
  type?: AlertType;
  duration?: number; // How long it stays on screen in ms
  onClose: () => void;
}

const COLORS: Record<
  AlertType,
  { bg: string; border: string; text: string; icon: string }
> = {
  info: { bg: '#161b22', border: '#388bfd', text: '#e6edf3', icon: 'ℹ️' },
  warning: { bg: '#2a2a0a', border: '#d29922', text: '#e6edf3', icon: '⚠️' },
  error: { bg: '#3a1a1a', border: '#f85149', text: '#ff4444', icon: '🚨' },
  success: { bg: '#0f2a1a', border: '#3fb950', text: '#3fb950', icon: '✓' },
};

export default function GameAlert({
  message,
  type = 'info',
  duration = 4000,
  onClose,
}: GameAlertProps) {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // 1. Start the fade-out animation slightly before it actually unmounts
    const fadeTimer = setTimeout(() => setIsFading(true), duration - 300);

    // 2. Tell the parent to completely remove it from the DOM
    const removeTimer = setTimeout(() => onClose(), duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [duration, onClose]);

  const theme = COLORS[type];

  return (
    <>
      <style>{`
        @keyframes slide-up-fade {
          0% { transform: translate(-50%, 20px); opacity: 0; }
          100% { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes slide-down-fade {
          0% { transform: translate(-50%, 0); opacity: 1; }
          100% { transform: translate(-50%, 20px); opacity: 0; }
        }
        .animate-alert-in { animation: slide-up-fade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-alert-out { animation: slide-down-fade 0.3s ease-in forwards; }
        .mono { font-family: 'Share Tech Mono', monospace; }
      `}</style>
      <div
        className={`fixed bottom-12 left-1/2 z-[999] pointer-events-none ${
          isFading ? 'animate-alert-out' : 'animate-alert-in'
        }`}
      >
        <div
          className="flex items-center gap-3 px-5 py-3 rounded-xl backdrop-blur-sm"
          style={{
            background: `${theme.bg}ee`, // Added 'ee' for slight transparency
            border: `1px solid ${theme.border}`,
            boxShadow: `0 8px 32px ${theme.border}33`,
          }}
        >
          <span className="text-lg">{theme.icon}</span>
          <span
            className="mono text-[13px] uppercase tracking-widest"
            style={{ color: theme.text }}
          >
            {message}
          </span>
        </div>
      </div>
    </>
  );
}
