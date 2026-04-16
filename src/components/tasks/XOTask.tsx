import { useState } from 'react';
import PopUpContainer from '../PopUpCont';
interface Round {
  board: CellState[];
  hint: number;
  winLine: number[];
  prompt: string;
}
const rounds: Round[] = [
  {
    board: ['O', 'O', 'X', null, 'X', 'O', null, 'O', 'X'],
    hint: 6,
    winLine: [2, 4, 6],
    prompt: 'Find the winning move for X',
  },
  {
    board: ['O', 'X', 'O', null, 'X', 'O', 'X', null, 'X'],
    hint: 7,
    winLine: [1, 4, 7],
    prompt: 'One move wins — click it',
  },
  {
    board: ['X', 'O', 'O', 'X', 'O', null, null, 'X', 'O'],
    hint: 6,
    winLine: [0, 3, 6],
    prompt: 'X needs just one more',
  },
  {
    board: [null, 'O', 'X', 'O', 'X', 'O', 'O', null, 'X'],
    hint: 0,
    winLine: [0, 4, 8],
    prompt: 'Seal the deal for X',
  },
];

function XIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
      <line
        x1="8"
        y1="8"
        x2="32"
        y2="32"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <line
        x1="32"
        y1="8"
        x2="8"
        y2="32"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function OIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
      <circle cx="20" cy="20" r="12" stroke={color} strokeWidth="5" />
    </svg>
  );
}

function CrewmateBig({ color }: { color: string }) {
  return (
    <div className="relative mt-2" style={{ width: 72, height: 80 }}>
      <div
        className="absolute inset-0 rounded-t-[36px] rounded-b-[18px]"
        style={{ background: color }}
      />
      <div
        className="absolute rounded-t-[10px]"
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

type CellState = 'X' | 'O' | null;
type FeedbackType = 'win' | 'lose' | 'hint' | null;

export default function TicTacToe({
  onClose,
  taskID,
}: {
  onClose: () => void;
  taskID: string;
}) {
  const [current, setCurrent] = useState(0);
  const [scoreX, setScoreX] = useState(0);
  const [scoreO, setScoreO] = useState(0);
  const [roundOver, setRoundOver] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState<{
    text: string;
    type: FeedbackType;
  }>({ text: '', type: null });
  const [boardOverride, setBoardOverride] = useState<CellState[]>([]);
  const [revealedWrong, setRevealedWrong] = useState(false);
  const [winningCells, setWinningCells] = useState<number[]>([]);
  const [wrongCell, setWrongCell] = useState<number | null>(null);

  const round = rounds[current];
  const board: CellState[] =
    boardOverride.length > 0 ? boardOverride : [...round.board];

  function pick(idx: number) {
    if (roundOver || board[idx] !== null) return;

    const newBoard = [...board] as CellState[];

    if (idx === round.hint) {
      newBoard[idx] = 'X';
      setBoardOverride(newBoard);
      setScoreX((s) => s + 1);
      setWinningCells(round.winLine);
      setFeedback({ text: '✓ Booyah ! X wins!', type: 'win' });
      setRoundOver(true);
      setShowNext(true);
    } else {
      newBoard[idx] = 'O';
      setBoardOverride(newBoard);
      setScoreO((s) => s + 1);
      setWrongCell(idx);
      setFeedback({ text: '✗ Wrong tile — O scores!', type: 'lose' });

      setTimeout(() => {
        const revealBoard = [...newBoard] as CellState[];
        revealBoard[round.hint] = 'X';
        setBoardOverride(revealBoard);
        setRevealedWrong(true);
        setWinningCells(round.winLine);
        setFeedback({ text: 'That was the winning cell', type: 'hint' });
        setRoundOver(true);
        setShowNext(true);
      }, 900);
    }
  }

  function nextRound() {
    const next = current + 1;
    if (next >= rounds.length) {
      setDone(true);
      setTimeout(() => {
        if (typeof window.completedPlayerTasks === 'function') {
          window.completedPlayerTasks(taskID);
        }
        onClose();
      }, 2000);
    } else {
      setCurrent(next);
      setBoardOverride([]);
      setRoundOver(false);
      setShowNext(false);
      setFeedback({ text: '', type: null });
      setWinningCells([]);
      setWrongCell(null);
      setRevealedWrong(false);
    }
  }

  function restart() {
    setCurrent(0);
    setScoreX(0);
    setScoreO(0);
    setRoundOver(false);
    setShowNext(false);
    setDone(false);
    setFeedback({ text: '', type: null });
    setBoardOverride([]);
    setWinningCells([]);
    setWrongCell(null);
    setRevealedWrong(false);
  }

  const completed = scoreX + scoreO;
  const progressPct = Math.round((completed / rounds.length) * 100);
  const endColor =
    scoreX >= 3 ? '#3fb950' : scoreX >= 2 ? '#d29922' : '#f85149';
  const verdict =
    scoreX >= 3
      ? 'Crewmate Victory!'
      : scoreX >= 2
        ? 'Kinda Sus...'
        : 'Impostor Wins!';

  return (
    <>
      <style>{`
        @keyframes pop { 0%{transform:scale(0);} 60%{transform:scale(1.15);} 100%{transform:scale(1);} }
        @keyframes win-flash { 0%,100%{opacity:1;} 50%{opacity:.35;} }
        .au-font { font-family: 'Orbitron', monospace; }
        .cell-pop { animation: pop .2s ease; }
        .win-flash { animation: win-flash .5s ease 3; }
      `}</style>

      <PopUpContainer>
        {done ? (
          /* ── End Screen ── */
          <div className="z-10 mt-12 flex flex-col items-center gap-4">
            <span
              className="au-font text-[9px] uppercase tracking-[4px]"
              style={{ color: '#5eead4' }}
            >
              mission complete
            </span>
            <div
              className="au-font text-center text-[26px] font-extrabold tracking-widest"
              style={{ color: endColor }}
            >
              {verdict}
            </div>
            <div
              className="text-[12px] tracking-wide"
              style={{ color: '#8b949e' }}
            >
              X found {scoreX} winning moves out of {rounds.length}
            </div>
            <CrewmateBig color={endColor} />
            <button
              onClick={restart}
              className="au-font mt-4 cursor-pointer rounded-xl px-6 py-2.5 text-[9px] uppercase tracking-widest transition-colors"
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
            {/* ── Top Bar ── */}
            <div className="z-10 mb-2.5 flex w-full items-center justify-between">
              <span
                className="au-font text-[9px] uppercase tracking-[3px]"
                style={{ color: '#5eead4' }}
              >
                Round {current + 1} / 4
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
                  X — {scoreX}
                </span>
                <span
                  className="au-font rounded-full px-3 py-0.5 text-[9px] uppercase tracking-widest"
                  style={{
                    background: '#3a1a1a',
                    color: '#f85149',
                    border: '1px solid #7f1d1d',
                  }}
                >
                  O — {scoreO}
                </span>
              </div>
            </div>

            {/* ── Prompt ── */}
            <div
              className="au-font z-10 mb-4 rounded-xl px-5 py-2 text-center text-[10px] uppercase tracking-[1.5px]"
              style={{
                background: '#161b22',
                border: '1px solid #21262d',
                color: '#c9d1d9',
              }}
            >
              {round.prompt}
            </div>

            {/* ── Board ── */}
            <div className="z-10 grid w-full max-w-75 grid-cols-3 gap-2">
              {board.map((val, i) => {
                const isWin = winningCells.includes(i);
                const isRevealedHint =
                  revealedWrong && i === round.hint && val === 'X';
                const isWrong = wrongCell === i;

                let borderColor = '#21262d';
                let bgColor = '#161b22';

                // if (isHint) {
                //   borderColor = '#3fb950';
                //   bgColor = '#0f2a1a';
                // }
                if (isWin && val === 'X') {
                  borderColor = '#388bfd';
                  bgColor = '#0c1f3a';
                }
                if (isWin && val === 'O') {
                  borderColor = '#f85149';
                  bgColor = '#2a0f0f';
                }
                if (isRevealedHint) {
                  borderColor = '#3fb950';
                  bgColor = '#0f2a1a';
                }
                if (isWrong) {
                  borderColor = '#f85149';
                  bgColor = '#2a0f0f';
                }

                const canClick = !val && !roundOver;

                return (
                  <div
                    key={i}
                    onClick={() => canClick && pick(i)}
                    className={`relative flex aspect-square items-center justify-center rounded-xl transition-colors
                      ${canClick ? 'cursor-pointer' : 'cursor-default'}
                      ${isWin ? 'win-flash' : ''}
                    `}
                    style={{
                      background: bgColor,
                      border: `1px solid ${borderColor}`,
                    }}
                  >
                    {/* {isHint && (
                      <span
                        className="au-font absolute right-1.5 top-1 text-[7px] uppercase tracking-wide"
                        style={{ color: '#3fb950' }}
                      >
                        win?
                      </span>
                    )} */}
                    {val && (
                      <div className="cell-pop h-[60%] w-[60%]">
                        {val === 'X' ? (
                          <XIcon
                            color={isRevealedHint ? '#3fb950' : '#388bfd'}
                          />
                        ) : (
                          <OIcon color="#f85149" />
                        )}
                      </div>
                    )}
                    {!val && canClick && (
                      <div className="h-[60%] w-[60%] opacity-0 transition-opacity hover:opacity-30">
                        <XIcon color="#388bfd" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Feedback ── */}
            <div
              className="au-font z-10 mt-3 min-h-4 text-center text-[10px] uppercase tracking-widest"
              style={{
                color:
                  feedback.type === 'win'
                    ? '#3fb950'
                    : feedback.type === 'lose'
                      ? '#f85149'
                      : feedback.type === 'hint'
                        ? '#d29922'
                        : 'transparent',
              }}
            >
              {feedback.text || '.'}
            </div>

            {/* ── Next Button ── */}
            {showNext && (
              <button
                onClick={nextRound}
                className="au-font z-10 mt-3 cursor-pointer rounded-xl px-6 py-2 text-[9px] uppercase tracking-widest transition-colors hover:opacity-80"
                style={{
                  background: '#0c1f3a',
                  border: '1px solid #388bfd',
                  color: '#388bfd',
                }}
              >
                {current + 1 >= rounds.length
                  ? 'See Results →'
                  : 'Next Round →'}
              </button>
            )}

            {/* ── Progress Bar ── */}
            <div className="z-10 mt-4 flex w-full items-center gap-2.5">
              <span
                className="au-font shrink-0 text-[9px] uppercase tracking-widest"
                style={{ color: '#484f58' }}
              >
                Progress
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
                {completed} / {rounds.length}
              </span>
            </div>
          </>
        )}
      </PopUpContainer>
    </>
  );
}
