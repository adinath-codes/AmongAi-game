import { useState } from 'react';
import PopUpContainer from '../PopUpCont';

type Choice = 'stone' | 'paper' | 'scissor';
type Result = 'win' | 'lose' | 'draw' | null;

const CHOICES: Choice[] = ['stone', 'paper', 'scissor'];

const CREWMATE_COLORS: Record<Choice, string> = {
  stone: '#888780',
  paper: '#1f6feb',
  scissor: '#da3633',
};

const CHOICE_LABELS: Record<Choice, string> = {
  stone: 'Stone',
  paper: 'Paper',
  scissor: 'Scissor',
};

const CHOICE_BORDER_IDLE: Record<Choice, string> = {
  stone: '#3a3a3a',
  paper: '#1e3a5f',
  scissor: '#5c1a1a',
};

const CHOICE_BORDER_HOVER: Record<Choice, string> = {
  stone: '#888780',
  paper: '#388bfd',
  scissor: '#f85149',
};

function getResult(player: Choice, cpu: Choice): Result {
  if (player === cpu) return 'draw';
  if (
    (player === 'stone' && cpu === 'scissor') ||
    (player === 'paper' && cpu === 'stone') ||
    (player === 'scissor' && cpu === 'paper')
  )
    return 'win';
  return 'lose';
}

function StoneIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
      <ellipse cx="20" cy="22" rx="13" ry="11" fill={color} />
      <ellipse cx="20" cy="18" rx="10" ry="8" fill={color} opacity="0.7" />
      <ellipse cx="20" cy="18" rx="7" ry="5" fill={color} opacity="0.5" />
    </svg>
  );
}

function PaperIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
      <rect
        x="10"
        y="8"
        width="20"
        height="26"
        rx="3"
        fill={color}
        opacity="0.9"
      />
      <line
        x1="14"
        y1="14"
        x2="26"
        y2="14"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <line
        x1="14"
        y1="19"
        x2="26"
        y2="19"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <line
        x1="14"
        y1="24"
        x2="22"
        y2="24"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

function ScissorIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
      <circle cx="13" cy="14" r="5" stroke={color} strokeWidth="2.5" />
      <circle cx="13" cy="27" r="5" stroke={color} strokeWidth="2.5" />
      <line
        x1="17"
        y1="17"
        x2="32"
        y2="10"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="17"
        y1="24"
        x2="32"
        y2="31"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChoiceIcon({
  choice,
  size = 'sm',
}: {
  choice: Choice;
  size?: 'sm' | 'lg';
}) {
  const color = CREWMATE_COLORS[choice];
  const cls = size === 'lg' ? 'w-16 h-16' : 'w-8 h-8';
  return (
    <div className={cls}>
      {choice === 'stone' && <StoneIcon color={color} />}
      {choice === 'paper' && <PaperIcon color={color} />}
      {choice === 'scissor' && <ScissorIcon color={color} />}
    </div>
  );
}

function Crewmate({
  color,
  size = 'sm',
}: {
  color: string;
  size?: 'sm' | 'lg';
}) {
  const w = size === 'lg' ? 72 : 32;
  const h = size === 'lg' ? 82 : 36;
  const vw =
    size === 'lg'
      ? { top: 14, left: 9, width: 54, height: 24 }
      : { top: 6, left: 5, width: 22, height: 11 };
  const leg =
    size === 'lg'
      ? { w: 22, h: 18, b: -8, x: 6 }
      : { w: 10, h: 10, b: 0, x: 2 };

  return (
    <div className="relative shrink-0" style={{ width: w, height: h }}>
      <div
        className="absolute inset-0"
        style={{
          background: color,
          borderRadius: `${w / 2}px ${w / 2}px ${w / 4}px ${w / 4}px`,
        }}
      />
      <div
        className="absolute"
        style={{
          top: vw.top,
          left: vw.left,
          width: vw.width,
          height: vw.height,
          background: 'rgba(255,255,255,0.25)',
          borderRadius: `${vw.height}px ${vw.height}px 0 0`,
        }}
      />
      <div
        className="absolute rounded-sm"
        style={{
          bottom: leg.b,
          left: leg.x,
          width: leg.w,
          height: leg.h,
          background: color,
          filter: 'brightness(0.65)',
        }}
      />
      <div
        className="absolute rounded-sm"
        style={{
          bottom: leg.b,
          right: leg.x,
          width: leg.w,
          height: leg.h,
          background: color,
          filter: 'brightness(0.65)',
        }}
      />
    </div>
  );
}

interface RoundRecord {
  player: Choice;
  cpu: Choice;
  result: Result;
}

export default function SPS({
  onClose,
  taskID,
}: {
  onClose: () => void;
  taskID: string;
}) {
  const [round, setRound] = useState(1);
  const [playerScore, setPlayerScore] = useState(0);
  const [cpuScore, setCpuScore] = useState(0);
  const [history, setHistory] = useState<RoundRecord[]>([]);
  const [picked, setPicked] = useState<Choice | null>(null);
  const [cpuPick, setCpuPick] = useState<Choice | null>(null);
  const [result, setResult] = useState<Result>(null);
  const [roundOver, setRoundOver] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [hoveredChoice, setHoveredChoice] = useState<Choice | null>(null);
  const [animating, setAnimating] = useState(false);

  const totalRounds = 4;

  function play(choice: Choice) {
    if (roundOver || animating) return;
    setAnimating(true);
    setPicked(choice);

    setTimeout(() => {
      const cpu = CHOICES[Math.floor(Math.random() * 3)];
      setCpuPick(cpu);
      const res = getResult(choice, cpu);
      setResult(res);
      setRoundOver(true);
      setAnimating(false);

      const newPlayerScore = playerScore + (res === 'win' ? 1 : 0);
      const newCpuScore = cpuScore + (res === 'lose' ? 1 : 0);
      setPlayerScore(newPlayerScore);
      setCpuScore(newCpuScore);
      setHistory((h) => [...h, { player: choice, cpu, result: res }]);

      if (round >= totalRounds) {
        setGameOver(true);
        setTimeout(() => {
          if (typeof window.completedPlayerTasks === 'function') {
            window.completedPlayerTasks(taskID);
          }
          onClose();
        }, 2000);
      }
    }, 600);
  }

  function nextRound() {
    if (round >= totalRounds) {
      setGameOver(true);
      setTimeout(() => {
        if (typeof window.completedPlayerTasks === 'function') {
          window.completedPlayerTasks(taskID);
        }
        onClose();
      }, 2000);
    }
    if (playerScore !== cpuScore) {
      setRound((r) => r + 1);
    }
    setPicked(null);
    setCpuPick(null);
    setResult(null);
    setRoundOver(false);
  }

  function restart() {
    setRound(1);
    setPlayerScore(0);
    setCpuScore(0);
    setHistory([]);
    setPicked(null);
    setCpuPick(null);
    setResult(null);
    setRoundOver(false);
    setGameOver(false);
    setAnimating(false);
  }

  const progressPct = Math.round(((round - 1) / totalRounds) * 100);
  const playerWon = playerScore >= 2;
  const endColor = playerWon ? '#3fb950' : '#f85149';
  const verdict =
    playerScore === cpuScore
      ? "It's a Draw!"
      : playerWon
        ? 'Crewmate Victory!'
        : 'Impostor Wins!';

  const feedbackText =
    result === 'win'
      ? '✓ You ejected the impostor!'
      : result === 'lose'
        ? '✗ Impostor got you...'
        : result === 'draw'
          ? '— Emergency meeting! Draw!'
          : '';

  const feedbackColor =
    result === 'win' ? '#3fb950' : result === 'lose' ? '#f85149' : '#d29922';

  return (
    <>
      <style>{`
        @keyframes pop { 0%{transform:scale(0);} 60%{transform:scale(1.18);} 100%{transform:scale(1);} }
        @keyframes floatUp { 0%{transform:translateY(8px);opacity:0;} 100%{transform:translateY(0);opacity:1;} }
        .au-font { font-family: 'Orbitron', monospace; }
        .cell-pop { animation: pop .25s ease forwards; }
        .float-up { animation: floatUp .3s ease forwards; }
      `}</style>

      <PopUpContainer>
        {gameOver ? (
          /* End Screen */
          <div className="z-10 mt-10 flex flex-col items-center gap-4">
            <span
              className="au-font text-[9px] uppercase tracking-[4px]"
              style={{ color: '#5eead4' }}
            >
              mission complete
            </span>
            <div
              className="au-font text-center text-[24px] font-extrabold tracking-widest"
              style={{ color: endColor }}
            >
              {verdict}
            </div>
            <div
              className="text-[11px] tracking-wide"
              style={{ color: '#8b949e' }}
            >
              You {playerScore} — {cpuScore} CPU
            </div>

            {/* History */}
            <div className="z-10 mt-2 flex flex-col gap-2 w-full max-w-xs">
              {history.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl px-4 py-2"
                  style={{ background: '#161b22', border: '1px solid #21262d' }}
                >
                  <div className="flex items-center gap-2">
                    <ChoiceIcon choice={h.player} />
                    <span
                      className="au-font text-[8px] uppercase tracking-widest"
                      style={{ color: '#c9d1d9' }}
                    >
                      {CHOICE_LABELS[h.player]}
                    </span>
                  </div>
                  <span
                    className="au-font text-[9px] uppercase tracking-widest"
                    style={{
                      color:
                        h.result === 'win'
                          ? '#3fb950'
                          : h.result === 'lose'
                            ? '#f85149'
                            : '#d29922',
                    }}
                  >
                    {h.result === 'win'
                      ? 'WIN'
                      : h.result === 'lose'
                        ? 'LOSE'
                        : 'DRAW'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className="au-font text-[8px] uppercase tracking-widest"
                      style={{ color: '#c9d1d9' }}
                    >
                      {CHOICE_LABELS[h.cpu]}
                    </span>
                    <ChoiceIcon choice={h.cpu} />
                  </div>
                </div>
              ))}
            </div>

            <div className="relative mt-2" style={{ width: 72, height: 80 }}>
              <div
                className="absolute inset-0 rounded-t-[36px] rounded-b-[18px]"
                style={{ background: endColor }}
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
                  background: endColor,
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
                  background: endColor,
                  filter: 'brightness(0.65)',
                }}
              />
            </div>

            <button
              onClick={restart}
              className="au-font mt-3 cursor-pointer rounded-xl px-6 py-2.5 text-[9px] uppercase tracking-widest transition-opacity hover:opacity-75"
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
          <>
            {/* Top Bar */}
            <div className="z-10 mb-2.5 flex w-full items-center justify-between">
              <span
                className="au-font text-[9px] uppercase tracking-[3px]"
                style={{ color: '#5eead4' }}
              >
                Round {round} / {totalRounds}
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
                  You — {playerScore}
                </span>
                <span
                  className="au-font rounded-full px-3 py-0.5 text-[9px] uppercase tracking-widest"
                  style={{
                    background: '#3a1a1a',
                    color: '#f85149',
                    border: '1px solid #7f1d1d',
                  }}
                >
                  CPU — {cpuScore}
                </span>
              </div>
            </div>

            {/* Prompt */}
            <div
              className="au-font z-10 mb-5 rounded-xl px-5 py-2 text-center text-[10px] uppercase tracking-[1.5px]"
              style={{
                background: '#161b22',
                border: '1px solid #21262d',
                color: '#c9d1d9',
              }}
            >
              {roundOver
                ? 'Round over — next up!'
                : 'Choose your weapon, crewmate'}
            </div>

            {/* Battle Area */}
            <div className="z-10 flex w-full max-w-xs items-center justify-between mb-6 px-2">
              {/* Player */}
              <div className="flex flex-col items-center gap-2">
                <span
                  className="au-font text-[8px] uppercase tracking-widest"
                  style={{ color: '#5eead4' }}
                >
                  You
                </span>
                <div
                  className="flex items-center justify-center rounded-2xl"
                  style={{
                    width: 88,
                    height: 88,
                    background: '#161b22',
                    border: `1px solid ${picked ? CREWMATE_COLORS[picked] + '66' : '#21262d'}`,
                    transition: 'border-color .3s',
                  }}
                >
                  {picked ? (
                    <div className="cell-pop w-14 h-14">
                      <ChoiceIcon choice={picked} size="lg" />
                    </div>
                  ) : (
                    <span
                      className="au-font text-[18px]"
                      style={{ color: '#21262d' }}
                    >
                      ?
                    </span>
                  )}
                </div>
                <Crewmate color="#388bfd" />
              </div>

              {/* VS */}
              <div className="flex flex-col items-center gap-1">
                <span
                  className="au-font text-[11px] font-extrabold tracking-widest"
                  style={{ color: '#484f58' }}
                >
                  VS
                </span>
                {result && (
                  <span
                    className="au-font float-up text-[8px] uppercase tracking-widest"
                    style={{
                      color:
                        result === 'win'
                          ? '#3fb950'
                          : result === 'lose'
                            ? '#f85149'
                            : '#d29922',
                    }}
                  >
                    {result === 'win'
                      ? 'WIN'
                      : result === 'lose'
                        ? 'LOSE'
                        : 'DRAW'}
                  </span>
                )}
              </div>

              {/* CPU */}
              <div className="flex flex-col items-center gap-2">
                <span
                  className="au-font text-[8px] uppercase tracking-widest"
                  style={{ color: '#f85149' }}
                >
                  CPU
                </span>
                <div
                  className="flex items-center justify-center rounded-2xl"
                  style={{
                    width: 88,
                    height: 88,
                    background: '#161b22',
                    border: `1px solid ${cpuPick ? CREWMATE_COLORS[cpuPick] + '66' : '#21262d'}`,
                    transition: 'border-color .3s',
                  }}
                >
                  {animating ? (
                    <span
                      className="au-font text-[18px]"
                      style={{
                        color: '#484f58',
                        animation: 'twinkle .4s infinite',
                      }}
                    >
                      ...
                    </span>
                  ) : cpuPick ? (
                    <div className="cell-pop w-14 h-14">
                      <ChoiceIcon choice={cpuPick} size="lg" />
                    </div>
                  ) : (
                    <span
                      className="au-font text-[18px]"
                      style={{ color: '#21262d' }}
                    >
                      ?
                    </span>
                  )}
                </div>
                <Crewmate color="#da3633" />
              </div>
            </div>

            {/* Feedback */}
            <div
              className="au-font z-10 mb-4 min-h-4 text-center text-[10px] uppercase tracking-widest"
              style={{ color: result ? feedbackColor : 'transparent' }}
            >
              {feedbackText || '.'}
            </div>

            {/* Choice Buttons */}
            {!roundOver ? (
              <div className="z-10 flex gap-3 w-full max-w-xs justify-center">
                {CHOICES.map((c) => {
                  const hovered = hoveredChoice === c;
                  return (
                    <button
                      key={c}
                      onClick={() => play(c)}
                      onMouseEnter={() => setHoveredChoice(c)}
                      onMouseLeave={() => setHoveredChoice(null)}
                      disabled={animating}
                      className="au-font flex flex-col items-center gap-2 rounded-2xl px-3 py-3 transition-all duration-150 cursor-pointer"
                      style={{
                        background: hovered ? '#1c2128' : '#161b22',
                        border: `1px solid ${hovered ? CHOICE_BORDER_HOVER[c] : CHOICE_BORDER_IDLE[c]}`,
                        transform: hovered ? 'scale(1.05)' : 'scale(1)',
                        flex: 1,
                      }}
                    >
                      <div className="w-10 h-10">
                        <ChoiceIcon choice={c} />
                      </div>
                      <span
                        className="au-font text-[8px] uppercase tracking-widest"
                        style={{
                          color: hovered ? CHOICE_BORDER_HOVER[c] : '#8b949e',
                        }}
                      >
                        {CHOICE_LABELS[c]}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <button
                onClick={nextRound}
                className="au-font z-10 cursor-pointer rounded-xl px-6 py-2.5 text-[9px] uppercase tracking-widest transition-opacity hover:opacity-75"
                style={{
                  background: '#0c1f3a',
                  border: '1px solid #388bfd',
                  color: '#388bfd',
                }}
              >
                {round >= totalRounds
                  ? 'See Results →'
                  : playerScore !== cpuScore
                    ? 'Next Round →'
                    : 'Try again ⟳'}
              </button>
            )}

            {/* Progress Bar */}
            <div className="z-10 mt-5 flex w-full items-center gap-2.5">
              <span
                className="au-font shrink-0 text-[9px] uppercase tracking-widest"
                style={{ color: '#484f58' }}
              >
                Tasks
              </span>
              <div
                className="h-1 flex-1 overflow-hidden rounded-full"
                style={{ background: '#21262d' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%`, background: '#3fb950' }}
                />
              </div>
              <span
                className="au-font shrink-0 text-[11px]"
                style={{ color: '#3fb950' }}
              >
                {round - 1} / {totalRounds}
              </span>
            </div>
          </>
        )}
      </PopUpContainer>
    </>
  );
}
