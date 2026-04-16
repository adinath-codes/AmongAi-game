interface TYPEGameOverProps {
  winner: 'crewmate' | 'impostor' | null;
}
export default function GameOverModal({ winner }: TYPEGameOverProps) {
  if (!winner) return null;

  const isCrewWin = winner === 'crewmate';
  const bgColor = isCrewWin ? 'bg-blue-900/90' : 'bg-red-900/90';
  const textColor = isCrewWin ? 'text-blue-400' : 'text-red-500';
  const title = isCrewWin ? 'CREWMATES WIN' : 'IMPOSTOR WINS';
  const subtitle = isCrewWin
    ? 'All tasks Completed'
    : 'The crew was eliminated';

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center ${bgColor} backdrop-blur-sm transition-all duration-500`}
    >
      <h1
        className={`text-7xl font-bold tracking-widest ${textColor} drop-shadow-[0_0_15px_rgba(0,0,0,0.8)] font-['Orbitron']`}
      >
        {title}
      </h1>
      <p className="mt-4 text-2xl text-white font-['Orbitron'] tracking-wide">
        {subtitle}
      </p>
      <button
        onClick={() => {
          console.log('-----------RESTARTING-----------');

          window.location.reload();
        }}
        className="mt-12 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg border-2 border-white/30 transition-all font-['Orbitron']"
      >
        PLAY AGAIN
      </button>
    </div>
  );
}
