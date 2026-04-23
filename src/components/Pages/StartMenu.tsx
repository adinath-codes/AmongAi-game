import { Play } from 'lucide-react';
import hoverSFX from '/audio/uiHover.mp3';
import amongusBG from '/video/amongusBG.mp4';
import { useRef } from 'react';
interface MainMenuProps {
  onStart: () => void;
}

export default function MainMenu({ onStart }: MainMenuProps) {
  const audioRef = useRef(new Audio(hoverSFX));

  const handleMouseEnter = () => {
    audioRef.current.currentTime = 0;
    audioRef.current.play();
  };
  const handleMouseExit = () => {
    audioRef.current.pause();
  };
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white overflow-hidden">
      {/* Optional: Add a subtle animated background pattern or blurred map here */}
      {/* <div className="absolute inset-0 bg-slate-900 opacity-50 blur-sm"></div> */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="VIDEO_BG absolute -z-10 left-0 top-0 w-full h-full object-cover "
      >
        <source src={amongusBG} type="video/mp4" />
      </video>
      <div className="MAIN_MENU z-10 relative flex flex-col items-center animate-in fade-in slide-in-from-bottom-10 duration-1000">
        <h1 className="text-9xl font-black tracking-tighter text-white drop-shadow-[0_0_25px_rgba(255,0,0,0.6)] mb-2 ">
          AMONG AI
        </h1>
        <p className="mb-12 text-slate-400 uppercase text-5xl tracking-tight">
          Battle field of popular AI models
        </p>

        <button
          onClick={onStart}
          onMouseDown={handleMouseEnter}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseExit}
          className="group flex items-center gap-3 px-10 py-4 text-4xl font-bold border-4 border-double text-white bg-white-600 rounded-xl hover:border-green-500 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,255,0,0.4)] hover:shadow-[0_0_35px_rgba(0,255,0,0.8)]"
        >
          <Play
            fill="currentColor"
            size={24}
            className="transition-transform group-hover:text-green-500 group-hover:translate-x-1"
          />
          <p className="group-hover:text-green-500">Enter Menu</p>
        </button>
      </div>
    </div>
  );
}
