import type { JSX } from 'react';

const starStyle = (s: (typeof STARS)[0]): React.CSSProperties => ({
  width: s.size,
  height: s.size,
  top: `${s.top}%`,
  left: `${s.left}%`,
  animation: `twinkle ${s.duration}s ${s.delay}s infinite ease-in-out`,
  opacity: 0.2,
});

function Star({ style }: { style: React.CSSProperties }) {
  return (
    <div
      style={{
        position: 'absolute',
        background: '#fff',
        borderRadius: '50%',
        ...style,
      }}
    />
  );
}

const STARS = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  size: Math.random() * 2 + 1,
  top: Math.random() * 100,
  left: Math.random() * 100,
  delay: Math.random() * 3,
  duration: 2 + Math.random() * 3,
}));

export default function PopUpContainer({
  children,
}: {
  children: JSX.Element;
}) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800&display=swap');
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.9; }
        }
        @keyframes pulse-green {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
      <div
        style={{
          minHeight: 520,
          width: '80vw',
          background: '#0d1117',
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '24px 20px 20px',
          fontFamily: "'Orbitron', monospace",
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Stars */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {STARS.map((s) => (
            <Star key={s.id} style={starStyle(s)} />
          ))}
        </div>
        {children}
      </div>
    </>
  );
}
