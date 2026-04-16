import { useState, useEffect, useRef } from 'react';
import PopUpContainer from '../PopUpCont';

interface UploadTask {
  id: number;
  filename: string;
  location: string;
  size: string;
  duration: number;
  sabotageAt: number;
}

const TASKS: UploadTask[] = [
  {
    id: 1,
    filename: 'reactor_logs.dat',
    location: 'Reactor Room',
    size: '4.2 MB',
    duration: 6000,
    sabotageAt: 60,
  },
  {
    id: 2,
    filename: 'engine_dump.log',
    location: 'Engine Bay',
    size: '5.5 MB',
    duration: 6500,
    sabotageAt: 55,
  },
];

type Phase = 'idle' | 'uploading' | 'sabotaged' | 'resumed' | 'complete';

function CrewmateBig({ color }: { color: string }) {
  return (
    <div className="relative mt-2" style={{ width: 72, height: 80 }}>
      <div
        className="absolute inset-0"
        style={{ background: color, borderRadius: '36px 36px 18px 18px' }}
      />
      <div
        className="absolute"
        style={{
          top: 14,
          left: 9,
          width: 54,
          height: 24,
          background: 'rgba(255,255,255,0.25)',
          borderRadius: '10px 10px 0 0',
        }}
      />
      <div
        className="absolute rounded-sm"
        style={{
          bottom: -8,
          left: 6,
          width: 22,
          height: 18,
          background: color,
          filter: 'brightness(0.65)',
        }}
      />
      <div
        className="absolute rounded-sm"
        style={{
          bottom: -8,
          right: 6,
          width: 22,
          height: 18,
          background: color,
          filter: 'brightness(0.65)',
        }}
      />
    </div>
  );
}

function FileIcon({
  color,
  size = 'md',
}: {
  color: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dim = size === 'lg' ? 64 : size === 'md' ? 40 : 24;
  return (
    <svg width={dim} height={dim} viewBox="0 0 40 40" fill="none">
      <rect
        x="6"
        y="2"
        width="22"
        height="30"
        rx="3"
        fill={color}
        opacity="0.15"
        stroke={color}
        strokeWidth="1.8"
      />
      <path d="M22 2 L28 8 L22 8 Z" fill={color} opacity="0.5" />
      <line
        x1="10"
        y1="14"
        x2="22"
        y2="14"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <line
        x1="10"
        y1="19"
        x2="22"
        y2="19"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <line
        x1="10"
        y1="24"
        x2="17"
        y2="24"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

function WarningIcon({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
      <path
        d="M16 4 L29 27 L3 27 Z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        fill={color}
        opacity="0.15"
      />
      <line
        x1="16"
        y1="13"
        x2="16"
        y2="20"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="16" cy="23.5" r="1.5" fill={color} />
    </svg>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
      <circle
        cx="16"
        cy="16"
        r="12"
        stroke={color}
        strokeWidth="2"
        fill={color}
        opacity="0.1"
      />
      <path
        d="M10 16 L14 20 L22 12"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AmongUsUpload({
  onClose,
  taskID,
}: {
  onClose: () => void;
  taskID: string;
}) {
  const [taskIndex, setTaskIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [tasksWon, setTasksWon] = useState(0);
  const [tasksLost, setTasksLost] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);

  const progressRef = useRef(0);
  const phaseRef = useRef<Phase>('idle');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sabotageRef = useRef(false);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const task = TASKS[taskIndex];
  const totalTasks = TASKS.length;

  function startUpload() {
    if (phase !== 'idle') return;
    setPhase('uploading');
    setProgress(0);
    progressRef.current = 0;
    sabotageRef.current = false;

    const tick = 80;
    const increment = (tick / task.duration) * 100;

    intervalRef.current = setInterval(() => {
      const cur = progressRef.current;
      const ph = phaseRef.current;
      if (ph === 'sabotaged') return;

      const next = Math.min(cur + increment, 100);
      progressRef.current = next;
      setProgress(next);

      if (
        !sabotageRef.current &&
        next >= task.sabotageAt &&
        next < task.sabotageAt + increment * 2
      ) {
        sabotageRef.current = true;
        phaseRef.current = 'sabotaged';
        setPhase('sabotaged');
        setGlitchActive(true);
        setTimeout(() => setGlitchActive(false), 300);
      }

      if (next >= 100 && phaseRef.current !== 'sabotaged') {
        clearInterval(intervalRef.current!);
        phaseRef.current = 'complete';
        setPhase('complete');
        setTasksWon((w) => w + 1);
        setTimeout(() => advanceTask(), 1400);
      }
    }, tick);
  }

  function fixSabotage() {
    if (phaseRef.current !== 'sabotaged') return;
    phaseRef.current = 'resumed';
    setPhase('resumed');
    setGlitchActive(false);
    setTimeout(() => {
      if (phaseRef.current === 'resumed') {
        phaseRef.current = 'uploading';
        setPhase('uploading');
      }
    }, 300);
  }

  function advanceTask() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const next = taskIndex + 1;
    if (next >= totalTasks) {
      setGameOver(true);
      setTimeout(() => {
        if (typeof window.completedPlayerTasks === 'function') {
          window.completedPlayerTasks(taskID);
        }
        onClose();
      }, 2000);
    } else {
      setTaskIndex(next);
      setPhase('idle');
      phaseRef.current = 'idle';
      setProgress(0);
      progressRef.current = 0;
      sabotageRef.current = false;
    }
  }

  function restart() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTaskIndex(0);
    setPhase('idle');
    phaseRef.current = 'idle';
    setProgress(0);
    progressRef.current = 0;
    setTasksWon(0);
    setTasksLost(0);
    setGameOver(false);
    sabotageRef.current = false;
    setGlitchActive(false);
  }

  const displayProgress = Math.round(progress);
  const endColor =
    tasksWon >= 2 ? '#3fb950' : tasksWon === 1 ? '#d29922' : '#f85149';
  const verdict =
    tasksWon >= 2
      ? 'Upload Complete!'
      : tasksWon === 1
        ? 'Kinda Sus...'
        : 'Impostor Corrupted Files!';

  const barColor =
    phase === 'sabotaged'
      ? '#f85149'
      : phase === 'complete'
        ? '#3fb950'
        : displayProgress > 66
          ? '#3fb950'
          : displayProgress > 33
            ? '#d29922'
            : '#388bfd';

  const statusText =
    phase === 'idle'
      ? 'Ready to upload'
      : phase === 'uploading' || phase === 'resumed'
        ? `Uploading... ${displayProgress}%`
        : phase === 'sabotaged'
          ? 'SABOTAGE DETECTED!'
          : phase === 'complete'
            ? 'Upload complete!'
            : '';

  const statusColor =
    phase === 'sabotaged'
      ? '#f85149'
      : phase === 'complete'
        ? '#3fb950'
        : '#5eead4';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
        @keyframes twinkle { 0%,100%{opacity:.2;} 50%{opacity:.9;} }
        @keyframes floatUp {
          0% { transform: translateY(0); opacity: 0.8; }
          100% { transform: translateY(-70px); opacity: 0; }
        }
        @keyframes pulse-bar { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        @keyframes glitch {
          0%{transform:translate(0);}20%{transform:translate(-3px,2px);}
          40%{transform:translate(3px,-2px);}60%{transform:translate(-2px,3px);}
          80%{transform:translate(2px,-1px);}100%{transform:translate(0);}
        }
        @keyframes sab-flash { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
        @keyframes bounce-in { 0%{transform:scale(0);}60%{transform:scale(1.2);}100%{transform:scale(1);} }
        .au-font { font-family: 'Orbitron', monospace; }
        .mono { font-family: 'Share Tech Mono', monospace; }
        .glitch { animation: glitch .15s ease infinite; }
        .sab-flash { animation: sab-flash .4s ease infinite; }
        .bounce-in { animation: bounce-in .3s ease forwards; }
        .pulse-bar { animation: pulse-bar .6s ease infinite; }
      `}</style>

      <PopUpContainer>
        {gameOver ? (
          <div className="z-10 flex flex-col items-center gap-5 w-full">
            {/* Title */}
            <div className="text-center">
              <div
                className="au-font text-[9px] uppercase tracking-[4px] mb-2"
                style={{ color: '#5eead4' }}
              >
                mission complete
              </div>
              <div
                className="au-font text-[26px] font-extrabold tracking-widest"
                style={{ color: endColor }}
              >
                {verdict}
              </div>
              <div
                className="mono text-[11px] mt-1"
                style={{ color: '#8b949e' }}
              >
                {tasksWon} of {totalTasks} files uploaded
              </div>
            </div>

            {/* File recap cards */}
            <div className="flex flex-col gap-3 w-full">
              {TASKS.map((t, i) => {
                const won = i < tasksWon;
                const iconColor = won ? '#3fb950' : '#f85149';
                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-4 rounded-2xl px-4 py-3"
                    style={{
                      background: '#161b22',
                      border: `1px solid ${iconColor}33`,
                    }}
                  >
                    <FileIcon color={iconColor} size="md" />
                    <div className="flex flex-col flex-1 gap-0.5">
                      <span
                        className="mono text-[12px]"
                        style={{ color: '#e6edf3' }}
                      >
                        {t.filename}
                      </span>
                      <span
                        className="mono text-[10px]"
                        style={{ color: '#484f58' }}
                      >
                        {t.location} · {t.size}
                      </span>
                    </div>
                    {won ? (
                      <CheckIcon color="#3fb950" />
                    ) : (
                      <WarningIcon color="#f85149" />
                    )}
                    <span
                      className="mono text-[10px]"
                      style={{ color: iconColor }}
                    >
                      {won ? '[OK]' : '[ERR]'}
                    </span>
                  </div>
                );
              })}
            </div>

            <CrewmateBig color={endColor} />

            <button
              onClick={restart}
              className="au-font cursor-pointer rounded-xl px-6 py-2.5 text-[9px] uppercase tracking-widest hover:opacity-75"
              style={{
                background: '#161b22',
                border: '1px solid #30363d',
                color: '#e6edf3',
              }}
            >
              Play Again
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 w-full">
            {/* Top bar */}
            <div className="flex items-center justify-between">
              <span
                className="au-font text-[9px] uppercase tracking-[3px]"
                style={{ color: '#5eead4' }}
              >
                File {taskIndex + 1} / {totalTasks}
              </span>
              <div className="flex gap-2">
                <span
                  className="au-font rounded-full px-3 py-0.5 text-[9px] uppercase tracking-widest"
                  style={{
                    background: '#1f3a5f',
                    color: '#388bfd',
                    border: '1px solid #1e3a8a',
                  }}
                >
                  Done — {tasksWon}
                </span>
                <span
                  className="au-font rounded-full px-3 py-0.5 text-[9px] uppercase tracking-widest"
                  style={{
                    background: '#3a1a1a',
                    color: '#f85149',
                    border: '1px solid #7f1d1d',
                  }}
                >
                  Failed — {tasksLost}
                </span>
              </div>
            </div>

            {/* Big task heading */}
            <div className="text-center py-2">
              <div
                className="au-font text-[22px] font-extrabold tracking-widest mb-1"
                style={{ color: '#e6edf3' }}
              >
                {task.location}
              </div>
              <div className="mono text-[11px]" style={{ color: '#484f58' }}>
                Upload required · {task.size}
              </div>
            </div>

            {/* File card */}
            <div
              className={`rounded-2xl overflow-hidden ${glitchActive ? 'glitch' : ''}`}
              style={{
                background: '#161b22',
                border: `1px solid ${phase === 'sabotaged' ? '#f85149' : '#21262d'}`,
                transition: 'border-color .3s',
              }}
            >
              {/* File header */}
              <div
                className="flex items-center gap-4 px-5 py-4"
                style={{ borderBottom: '1px solid #21262d' }}
              >
                <div
                  className="rounded-2xl flex items-center justify-center"
                  style={{
                    width: 56,
                    height: 56,
                    background: '#0d1117',
                    border: `1px solid ${barColor}44`,
                    flexShrink: 0,
                  }}
                >
                  <FileIcon
                    color={
                      phase === 'sabotaged'
                        ? '#f85149'
                        : phase === 'complete'
                          ? '#3fb950'
                          : '#388bfd'
                    }
                    size="md"
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <span
                    className="mono text-[15px]"
                    style={{ color: '#e6edf3' }}
                  >
                    {task.filename}
                  </span>
                  <span
                    className="mono text-[11px]"
                    style={{ color: '#484f58' }}
                  >
                    {task.size} · {task.location}
                  </span>
                </div>
                <div style={{ flexShrink: 0 }}>
                  {phase === 'sabotaged' ? (
                    <div className="sab-flash">
                      <WarningIcon color="#f85149" />
                    </div>
                  ) : phase === 'complete' ? (
                    <div className="bounce-in">
                      <CheckIcon color="#3fb950" />
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Progress section */}
              <div className="px-5 py-4 flex flex-col gap-3">
                {/* Status + percent */}
                <div className="flex items-center justify-between">
                  <span
                    className={`mono text-[11px] uppercase tracking-widest ${phase === 'sabotaged' ? 'sab-flash' : ''}`}
                    style={{ color: statusColor }}
                  >
                    {statusText}
                  </span>
                  <span
                    className="au-font text-[13px] font-bold"
                    style={{ color: barColor }}
                  >
                    {displayProgress}%
                  </span>
                </div>

                {/* Progress bar — explicit height and bg so it's always visible */}
                <div
                  style={{
                    width: '100%',
                    height: 14,
                    background: '#0d1117',
                    borderRadius: 999,
                    border: '1px solid #21262d',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <div
                    className={phase === 'sabotaged' ? 'pulse-bar' : ''}
                    style={{
                      height: '100%',
                      width: `${displayProgress}%`,
                      background: barColor,
                      borderRadius: 999,
                      transition:
                        phase === 'sabotaged'
                          ? 'none'
                          : 'width 0.1s linear, background 0.3s',
                      minWidth: displayProgress > 0 ? 8 : 0,
                    }}
                  />
                </div>

                {/* Segment dots */}
                <div className="flex gap-1.5 justify-between">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: 4,
                        borderRadius: 999,
                        background:
                          i < Math.floor(displayProgress / 10)
                            ? barColor
                            : '#21262d',
                        transition: 'background 0.2s',
                      }}
                    />
                  ))}
                </div>

                {/* Log line */}
                <div className="mono text-[10px]" style={{ color: '#484f58' }}>
                  {phase === 'idle' && '> awaiting command...'}
                  {(phase === 'uploading' || phase === 'resumed') && (
                    <>
                      {'> streaming '}
                      <span style={{ color: '#388bfd' }}>{task.filename}</span>
                      {' — active'}
                    </>
                  )}
                  {phase === 'sabotaged' && (
                    <span className="sab-flash" style={{ color: '#f85149' }}>
                      {'> ERR: packet loss — impostor jammed the signal'}
                    </span>
                  )}
                  {phase === 'complete' && (
                    <span style={{ color: '#3fb950' }}>
                      {'> checksum verified · upload success'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action button */}
            <div className="flex justify-center mt-1">
              {phase === 'idle' && (
                <button
                  onClick={startUpload}
                  className="au-font cursor-pointer rounded-xl px-10 py-3.5 text-[11px] uppercase tracking-widest transition-all hover:opacity-90 active:scale-95"
                  style={{
                    background: '#0c1f3a',
                    border: '1px solid #388bfd',
                    color: '#388bfd',
                  }}
                >
                  Upload Files
                </button>
              )}
              {phase === 'sabotaged' && (
                <button
                  onClick={fixSabotage}
                  className="au-font sab-flash cursor-pointer rounded-xl px-10 py-3.5 text-[11px] uppercase tracking-widest active:scale-95"
                  style={{
                    background: '#2a0f0f',
                    border: '1px solid #f85149',
                    color: '#f85149',
                  }}
                >
                  Fix Signal
                </button>
              )}
              {(phase === 'uploading' || phase === 'resumed') && (
                <div
                  className="au-font rounded-xl px-10 py-3.5 text-[11px] uppercase tracking-widest"
                  style={{
                    background: '#161b22',
                    border: '1px solid #21262d',
                    color: '#484f58',
                    cursor: 'not-allowed',
                  }}
                >
                  Uploading...
                </div>
              )}
              {phase === 'complete' && (
                <div
                  className="au-font bounce-in rounded-xl px-10 py-3.5 text-[11px] uppercase tracking-widest"
                  style={{
                    background: '#0f2a1a',
                    border: '1px solid #3fb950',
                    color: '#3fb950',
                  }}
                >
                  Uploaded!
                </div>
              )}
            </div>

            {/* Tip */}
            <div
              className="mono text-center text-[9px]"
              style={{ color: '#484f58' }}
            >
              {phase === 'idle' && 'Click Upload Files to start the transfer'}
              {(phase === 'uploading' || phase === 'resumed') &&
                'Hold tight... impostor may strike anytime'}
              {phase === 'sabotaged' &&
                'Quick! Click Fix Signal before the upload fails!'}
              {phase === 'complete' && 'Moving to next file...'}
            </div>

            {/* Overall progress */}
            <div className="flex items-center gap-2.5 mt-1">
              <span
                className="au-font text-[9px] uppercase tracking-widest"
                style={{ color: '#484f58' }}
              >
                Tasks
              </span>
              <div
                className="h-1 flex-1 rounded-full overflow-hidden"
                style={{ background: '#21262d' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round((taskIndex / totalTasks) * 100)}%`,
                    background: '#3fb950',
                  }}
                />
              </div>
              <span
                className="au-font text-[11px]"
                style={{ color: '#3fb950' }}
              >
                {taskIndex} / {totalTasks}
              </span>
            </div>
          </div>
        )}
      </PopUpContainer>
    </>
  );
}
