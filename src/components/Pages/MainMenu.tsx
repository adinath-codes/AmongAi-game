import { Play } from 'lucide-react';
import hoverSFX from '/audio/uiHover.mp3';
import amongusBG from '/video/amongusBG.mp4';
import { useRef } from 'react';
interface MainMenuProps {
  onStart: () => void;
}
function CharDetails({
  hoverStart,
  hoverEnd,
  color,
}: {
  hoverStart: () => void;
  hoverEnd: () => void;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    red: 'bg-linear-to-br from-0% from-red-700 via-35% via-red-500 to-100% to-blue-700',
    blue: 'bg-blue-400',
    yellow: 'bg-yellow-400',
    pink: 'bg-pink-400',
    green: 'bg-green-400',
    black: 'bg-slate-700',
  };
  const nameMap: Record<string, string> = {
    red: 'YOU',
    pink: 'stablelm2',
    yellow: 'gemma3',
    blue: 'qwen2.5',
    black: 'llama3.2',
  };
  return (
    <div
      onMouseEnter={hoverStart}
      onMouseLeave={hoverEnd}
      className="group hover:scale-105 flex h-full w-full justify-left gap-10  items-center"
    >
      <div className={`w-16 h-16 ${colorMap[color]} rounded-lg`} />
      <p className=" text-slate-100 uppercase text-5xl w-40 tracking-tight drop-shadow-[0_0_25px_rgba(255,0,0,0.6)]">
        {nameMap[color]}
      </p>
    </div>
  );
}
function KeyDetails({
  hoverStart,
  hoverEnd,
  keys,
}: {
  hoverStart: () => void;
  hoverEnd: () => void;
  keys: string;
}) {
  const keysMap: Record<string, string> = {
    WASD: 'Movement',
    Q: 'kill',
    R: 'Report',
    SPACE: 'USE/VENT/SABOTAGE',
  };
  return (
    <div
      onMouseEnter={hoverStart}
      onMouseLeave={hoverEnd}
      className="group hover:scale-105 flex h-full w-full justify-left gap-10 "
    >
      <div className={`w-20 h-20  rounded-lg`}>
        <p className="text-center border-4 border-gray-700 border-double ">
          {keys}
        </p>
      </div>
      <p className=" text-slate-100 uppercase text-5xl w-40 tracking-tight drop-shadow-[0_0_25px_rgba(255,0,0,0.6)]">
        {keysMap[keys]}
      </p>
    </div>
  );
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
      <div className="MAIN_MENU z-10 h-full w-full justify-around relative flex flex-col items-center animate-in fade-in slide-in-from-bottom-10 duration-1000">
        <div className="MAIN_CONTAINER flex w-full justify-evenly">
          <div className="LEFT_CONTAINER flex flex-col justify-center items-center gap-3 px-10 py-4 text-4xl font-bold border-4 border-double text-white bg-white-600 rounded-xl active:scale-95 transition-all shadow-[0_0_20px_rgba(255,0,0,0.4)] hover:shadow-[0_0_35px_rgba(255,0,0,0.8)]">
            <p className="group-hover:text-green-500 text-7xl">
              Who plays the game?
            </p>
            <div className="DIVIDER w-full h-1 bg-linear-to-r from-transparent via-gray-600 to-transparent" />

            <CharDetails
              hoverStart={handleMouseEnter}
              hoverEnd={handleMouseExit}
              color={'red'}
            />
            <CharDetails
              hoverStart={handleMouseEnter}
              hoverEnd={handleMouseExit}
              color={'pink'}
            />
            <CharDetails
              hoverStart={handleMouseEnter}
              hoverEnd={handleMouseExit}
              color={'yellow'}
            />
            <CharDetails
              hoverStart={handleMouseEnter}
              hoverEnd={handleMouseExit}
              color={'blue'}
            />
            <CharDetails
              hoverStart={handleMouseEnter}
              hoverEnd={handleMouseExit}
              color={'black'}
            />
          </div>
          <div className="RIGHT_CONTAINER flex flex-col justify-center items-center gap-3 px-10 py-4 text-4xl font-bold border-4 border-double text-white bg-white-600 rounded-xl active:scale-95 transition-all shadow-[0_0_20px_rgba(0,0,255,0.4)] hover:shadow-[0_0_35px_rgba(0,0,255,0.8)]">
            <p className="group-hover:text-green-500 text-7xl">
              How to play the game?
            </p>
            <div className="DIVIDER w-full h-1 bg-linear-to-r from-transparent via-gray-600 to-transparent" />

            <KeyDetails
              hoverStart={handleMouseEnter}
              hoverEnd={handleMouseExit}
              keys={'WASD'}
            />
            <KeyDetails
              hoverStart={handleMouseEnter}
              hoverEnd={handleMouseExit}
              keys={'Q'}
            />
            <KeyDetails
              hoverStart={handleMouseEnter}
              hoverEnd={handleMouseExit}
              keys={'R'}
            />
            <KeyDetails
              hoverStart={handleMouseEnter}
              hoverEnd={handleMouseExit}
              keys={'SPACE'}
            />
          </div>
        </div>

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
          <p className="group-hover:text-green-500">START GAME</p>
        </button>
      </div>
    </div>
  );
}
