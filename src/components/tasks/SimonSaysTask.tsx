import { useState, useEffect, useRef } from 'react';
import PopUpContainer from '../PopUpCont';

interface Round {
  id: number;
  location: string;
  sequence: number[];
  label: string;
}

const ROUNDS: Round[] = [
  {
    id: 1,
    location: 'Reactor Room',
    sequence: [1, 3, 2, 4],
    label: 'Match the reactor code',
  },
  {
    id: 2,
    location: 'Engine Bay',
    sequence: [2, 4, 1, 3, 2],
    label: 'Repeat the engine sequence',
  },
];

const BTN_COLORS = [
  { idle: '#1f3a5f', active: '#388bfd', border: '#1e3a8a', label: '#388bfd' },
  { idle: '#3a1a1a', active: '#f85149', border: '#7f1d1d', label: '#f85149' },
  { idle: '#2a2a0a', active: '#d29922', border: '#5a4a00', label: '#d29922' },
  { idle: '#0f2a1a', active: '#3fb950', border: '#1a5a2a', label: '#3fb950' },
];

const BTN_LABELS = ['1', '2', '3', '4'];

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

type Phase = 'watching' | 'input' | 'success' | 'fail' | 'gameover';

export default function SimonSaysTask({
  onClose,
  taskID,
}: {
  onClose: () => void;
  taskID: string;
}) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('watching');
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const [playerSeq, setPlayerSeq] = useState<number[]>([]);
  const [won, setWon] = useState(0);
  const [lost, setLost] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [flashWrong, setFlashWrong] = useState(false);

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const round = ROUNDS[roundIndex];
  const totalRounds = ROUNDS.length;

  function clearTimeouts() {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }

  function addTimeout(fn: () => void, ms: number) {
    const t = setTimeout(fn, ms);
    timeoutsRef.current.push(t);
    return t;
  }

  // Wrapped in useCallback if we wanted to avoid warnings, but for simplicity
  // keeping it as a standard function works here since round Index drives the effect.
  function playSequence() {
    clearTimeouts(); // <-- THE MAGIC FIX. Always wipe old timeouts first!
    setPhase('watching');
    setPlayerSeq([]);
    setHighlighted(null);
    setFlashWrong(false);

    const seq = ROUNDS[roundIndex].sequence;
    let delay = 600;

    seq.forEach((btn) => {
      addTimeout(() => setHighlighted(btn), delay);
      addTimeout(() => setHighlighted(null), delay + 400);
      delay += 700;
    });

    addTimeout(() => {
      setPhase('input');
      setHighlighted(null);
    }, delay + 200);
  }

  // Single cleanly-managed Effect
  useEffect(() => {
    if (!gameOver) {
      playSequence();
    }
    return () => clearTimeouts(); // Cleanup when unmounting
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIndex, gameOver]);

  function handlePress(btn: number) {
    if (phase !== 'input') return;

    const next = [...playerSeq, btn];
    setPlayerSeq(next);
    setHighlighted(btn);
    addTimeout(() => setHighlighted(null), 250);

    const expected = round.sequence[next.length - 1];

    if (btn !== expected) {
      setFlashWrong(true);
      setPhase('fail');
      const newLost = lost + 1;
      setLost(newLost);
      addTimeout(() => {
        setFlashWrong(false);
        advance();
      }, 1200);
      return;
    }

    if (next.length === round.sequence.length) {
      setPhase('success');
      const newWon = won + 1;
      setWon(newWon);
      addTimeout(() => {
        advance();
      }, 1200);
    }
  }

  function advance() {
    const next = roundIndex + 1;
    if (next >= totalRounds) {
      setGameOver(true);
      if (typeof window.completedPlayerTasks === 'function') {
        window.completedPlayerTasks(taskID);
      }
      onClose();
    } else {
      setRoundIndex(next);
    }
  }

  function restart() {
    clearTimeouts();
    setRoundIndex(0);
    setPhase('watching');
    setHighlighted(null);
    setPlayerSeq([]);
    setWon(0);
    setLost(0);
    setGameOver(false);
    setFlashWrong(false);
    // Let the useEffect handle triggering playSequence when roundIndex resets to 0
  }

  const endColor = won >= 2 ? '#3fb950' : won === 1 ? '#d29922' : '#f85149';
  const verdict =
    won >= 2
      ? 'Crewmate Victory!'
      : won === 1
        ? 'Kinda Sus...'
        : 'Impostor Wins!';

  const progressPct = Math.round((roundIndex / totalRounds) * 100);

  const statusText =
    phase === 'watching'
      ? 'Watch the sequence...'
      : phase === 'input'
        ? `Repeat it! (${playerSeq.length}/${round.sequence.length})`
        : phase === 'success'
          ? 'Correct! Well done.'
          : phase === 'fail'
            ? 'Wrong! Impostor sabotaged.'
            : '';

  const statusColor =
    phase === 'success'
      ? '#3fb950'
      : phase === 'fail'
        ? '#f85149'
        : phase === 'input'
          ? '#d29922'
          : '#5eead4';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800&display=swap');
        @keyframes twinkle { 0%,100%{opacity:.2;} 50%{opacity:.9;} }
        @keyframes bounce-in { 0%{transform:scale(0);}60%{transform:scale(1.2);}100%{transform:scale(1);} }
        @keyframes wrong-flash { 0%,100%{opacity:1;}50%{opacity:0.2;} }
        @keyframes success-glow { 0%,100%{opacity:1;}50%{opacity:0.5;} }
        .au-font { font-family: 'Orbitron', monospace; }
        .bounce-in { animation: bounce-in .3s ease forwards; }
        .wrong-flash { animation: wrong-flash .3s ease 2; }
        .success-glow { animation: success-glow .4s ease 2; }
      `}</style>

      <PopUpContainer>
        {gameOver ? (
          <div className="z-10 flex flex-col items-center gap-5 w-full">
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
                className="au-font text-[11px] mt-1"
                style={{ color: '#8b949e' }}
              >
                {won} of {totalRounds} rounds won
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full">
              {ROUNDS.map((r, i) => {
                const w = i < won;
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-2xl px-4 py-3"
                    style={{
                      background: '#161b22',
                      border: `1px solid ${w ? '#3fb95033' : '#f8514933'}`,
                    }}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span
                        className="au-font text-[11px]"
                        style={{ color: '#e6edf3' }}
                      >
                        {r.location}
                      </span>
                      <span
                        className="au-font text-[9px]"
                        style={{ color: '#484f58' }}
                      >
                        {r.sequence.length} button sequence
                      </span>
                    </div>
                    <span
                      className="au-font text-[10px]"
                      style={{ color: w ? '#3fb950' : '#f85149' }}
                    >
                      {w ? '✓ DONE' : '✗ FAIL'}
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
          <div className="z-10 flex flex-col gap-4 w-full">
            {/* Top bar */}
            <div className="flex items-center justify-between">
              <span
                className="au-font text-[9px] uppercase tracking-[3px]"
                style={{ color: '#5eead4' }}
              >
                Round {roundIndex + 1} / {totalRounds}
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
                  Won — {won}
                </span>
                <span
                  className="au-font rounded-full px-3 py-0.5 text-[9px] uppercase tracking-widest"
                  style={{
                    background: '#3a1a1a',
                    color: '#f85149',
                    border: '1px solid #7f1d1d',
                  }}
                >
                  Lost — {lost}
                </span>
              </div>
            </div>

            {/* Heading */}
            <div className="text-center py-1">
              <div
                className="au-font text-[22px] font-extrabold tracking-widest"
                style={{ color: '#e6edf3' }}
              >
                {round.location}
              </div>
              <div
                className="au-font text-[10px] mt-1 uppercase tracking-widest"
                style={{ color: '#484f58' }}
              >
                {round.label}
              </div>
            </div>

            {/* Status */}
            <div
              className={`au-font text-center text-[11px] uppercase tracking-widest py-2 rounded-xl ${
                phase === 'success'
                  ? 'success-glow'
                  : phase === 'fail'
                    ? 'wrong-flash'
                    : ''
              }`}
              style={{
                color: statusColor,
                background: '#161b22',
                border: `1px solid ${statusColor}33`,
              }}
            >
              {statusText}
            </div>

            {/* Sequence dots */}
            <div className="flex justify-center gap-2">
              {round.sequence.map((btn, i) => {
                const filled = i < playerSeq.length;
                const correct = filled && playerSeq[i] === btn;
                const wrong = filled && playerSeq[i] !== btn;
                return (
                  <div
                    key={i}
                    className="rounded-full transition-all duration-200"
                    style={{
                      width: 10,
                      height: 10,
                      background: wrong
                        ? '#f85149'
                        : correct
                          ? '#3fb950'
                          : filled
                            ? '#d29922'
                            : '#21262d',
                      border: `1px solid ${wrong ? '#f85149' : correct ? '#3fb950' : '#30363d'}`,
                    }}
                  />
                );
              })}
            </div>

            {/* Simon buttons — 2x2 grid */}
            <div
              className={`grid grid-cols-2 gap-3 w-full ${flashWrong ? 'wrong-flash' : ''}`}
            >
              {BTN_LABELS.map((label, i) => {
                const btnNum = i + 1;
                const col = BTN_COLORS[i];
                const isLit = highlighted === btnNum;
                const isActive = phase === 'input';

                return (
                  <button
                    key={btnNum}
                    onClick={() => handlePress(btnNum)}
                    disabled={!isActive}
                    className="relative flex flex-col items-center justify-center rounded-2xl transition-all duration-150"
                    style={{
                      height: 90,
                      background: isLit ? col.active : col.idle,
                      border: `2px solid ${isLit ? col.active : col.border}`,
                      cursor: isActive ? 'pointer' : 'default',
                      transform: isLit ? 'scale(1.06)' : 'scale(1)',
                      boxShadow: isLit ? `0 0 18px ${col.active}55` : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span
                      className="au-font text-[28px] font-extrabold"
                      style={{
                        color: isLit ? '#fff' : col.label,
                        transition: 'color 0.15s',
                      }}
                    >
                      {label}
                    </span>
                    {isLit && (
                      <div
                        className="absolute inset-0 rounded-2xl"
                        style={{ background: 'rgba(255,255,255,0.08)' }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Replay hint */}
            {phase === 'input' && (
              <button
                onClick={playSequence}
                className="au-font text-center text-[9px] uppercase tracking-widest py-2 rounded-xl cursor-pointer hover:opacity-75 transition-opacity"
                style={{
                  color: '#484f58',
                  background: '#161b22',
                  border: '1px solid #21262d',
                }}
              >
                Watch again ↺
              </button>
            )}
            {phase === 'watching' && (
              <div
                className="au-font text-center text-[9px] uppercase tracking-widest py-2 rounded-xl"
                style={{
                  color: '#484f58',
                  background: '#161b22',
                  border: '1px solid #21262d',
                }}
              >
                Memorise the order...
              </div>
            )}

            {/* Progress bar */}
            <div className="flex items-center gap-2.5 mt-1">
              <span
                className="au-font text-[9px] uppercase tracking-widest shrink-0"
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
                  style={{ width: `${progressPct}%`, background: '#3fb950' }}
                />
              </div>
              <span
                className="au-font text-[11px] shrink-0"
                style={{ color: '#3fb950' }}
              >
                {roundIndex} / {totalRounds}
              </span>
            </div>
          </div>
        )}
      </PopUpContainer>
    </>
  );
}
