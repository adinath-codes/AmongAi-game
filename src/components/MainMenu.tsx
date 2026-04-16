import { Play } from 'lucide-react';

interface MainMenuProps {
  onStart: () => void;
}

export default function MainMenu({ onStart }: MainMenuProps) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white overflow-hidden">
      {/* Optional: Add a subtle animated background pattern or blurred map here */}
      <div className="absolute inset-0 bg-slate-900 opacity-50 blur-sm"></div>

      <div className="z-10 flex flex-col items-center animate-in fade-in slide-in-from-bottom-10 duration-1000">
        <h1 className="text-7xl font-black tracking-[0.2em] text-red-600 drop-shadow-[0_0_25px_rgba(255,0,0,0.6)] mb-2 font-['Orbitron']">
          AMONG AI
        </h1>
        <p className="mb-12 text-slate-400 tracking-widest uppercase text-sm">
          Battle field of popular AI models
        </p>

        <button
          onClick={onStart}
          className="group flex items-center gap-3 px-10 py-4 text-2xl font-bold text-white bg-red-600 rounded-full hover:bg-red-500 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,0,0,0.4)] hover:shadow-[0_0_35px_rgba(255,0,0,0.8)]"
        >
          <Play
            fill="currentColor"
            size={24}
            className="transition-transform group-hover:translate-x-1"
          />
          START GAME
        </button>
      </div>
    </div>
  );
}
