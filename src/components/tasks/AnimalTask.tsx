import { useState } from 'react';
import PopUpContainer from '../PopUpCont';

const rounds = [
  {
    art: ' /\\_/\\  \n( o.o ) \n > ^ <',
    answer: 'Cat',
    options: [
      { label: 'Cat', color: 'blue', correct: true },
      { label: 'Owl', color: 'red', correct: false },
      { label: 'Man', color: 'yellow', correct: false },
      { label: 'Fish', color: 'purple', correct: false },
    ],
  },
  {
    art: '   ><(((°>\n  /      \\\n ~~~~~~~~~',
    answer: 'Fish',
    options: [
      { label: 'Snake', color: 'red', correct: false },
      { label: 'Fish', color: 'blue', correct: true },
      { label: 'Bird', color: 'yellow', correct: false },
      { label: 'Frog', color: 'purple', correct: false },
    ],
  },
  {
    art: '  ,___,\n  [O,O]\n  /)  (\\\n-""---""--',
    answer: 'Owl',
    options: [
      { label: 'Cat', color: 'yellow', correct: false },
      { label: 'Bat', color: 'red', correct: false },
      { label: 'Owl', color: 'blue', correct: true },
      { label: 'Eagle', color: 'purple', correct: false },
    ],
  },
  {
    art: '  O/\n /|\n / \\',
    answer: 'Man',
    options: [
      { label: 'Robot', color: 'purple', correct: false },
      { label: 'Man', color: 'red', correct: true },
      { label: 'Tree', color: 'yellow', correct: false },
      { label: 'Ghost', color: 'blue', correct: false },
    ],
  },
];

const CREWMATE_COLORS: Record<string, string> = {
  blue: '#1f6feb',
  red: '#da3633',
  yellow: '#bb8009',
  purple: '#8957e5',
};

const BORDER_IDLE: Record<string, string> = {
  blue: '#1e3a5f',
  red: '#5c1a1a',
  yellow: '#4a3700',
  purple: '#3a1f6b',
};

const BORDER_HOVER: Record<string, string> = {
  blue: '#388bfd',
  red: '#f85149',
  yellow: '#d29922',
  purple: '#a371f7',
};

function Crewmate({ color }: { color: string }) {
  const bg = CREWMATE_COLORS[color] || '#888';
  return (
    <div style={{ position: 'relative', width: 32, height: 36, flexShrink: 0 }}>
      {/* Body */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bg,
          borderRadius: '16px 16px 8px 8px',
        }}
      />
      {/* Visor */}
      <div
        style={{
          position: 'absolute',
          top: 6,
          left: 5,
          width: 22,
          height: 11,
          background: 'rgba(255,255,255,0.25)',
          borderRadius: '8px 8px 0 0',
        }}
      />
      {/* Left leg */}
      <div
        style={{
          position: 'absolute',
          bottom: -6,
          left: 2,
          width: 10,
          height: 10,
          borderRadius: 2,
          background: bg,
          filter: 'brightness(0.7)',
        }}
      />
      {/* Right leg */}
      <div
        style={{
          position: 'absolute',
          bottom: -6,
          right: 2,
          width: 10,
          height: 10,
          borderRadius: 2,
          background: bg,
          filter: 'brightness(0.7)',
        }}
      />
    </div>
  );
}
function randInt(start: number, end: number) {
  return Math.floor(Math.random() * (end - start)) + start;
}

export default function AnimalQuiz({
  onClose,
  taskID,
}: {
  onClose: () => void;
  taskID: string;
}) {
  const [current, setCurrent] = useState(randInt(0, rounds.length));
  const [level, setLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{
    text: string;
    correct: boolean;
  } | null>(null);
  const [done, setDone] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState<number | null>(null);

  const round = rounds[current];

  function pick(optIdx: number) {
    if (answered) return;
    setAnswered(true);
    setSelected(optIdx);
    const opt = round.options[optIdx];
    if (opt.correct) {
      setScore((s) => s + 1);
      setFeedback({ text: '✓ CORRECT!', correct: true });
    } else {
      setFeedback({ text: '✗ WRONG', correct: false });
    }
    setTimeout(() => {
      if (level + 1 < rounds.length) {
        setCurrent(randInt(0, rounds.length));
        setLevel((l) => l + 1);
        setAnswered(false);
        setSelected(null);
        setFeedback(null);
      } else {
        setDone(true);
        if (typeof window.completedPlayerTasks === 'function') {
          window.completedPlayerTasks(taskID);
        }
        onClose();
      }
    }, 1400);
  }

  function restart() {
    setCurrent(randInt(0, rounds.length));
    setLevel(0);
    setScore(0);
    setAnswered(false);
    setSelected(null);
    setFeedback(null);
    setDone(false);
  }

  const pct = (score / rounds.length) * 100;

  const endColor = score >= 4 ? '#3fb950' : score >= 2 ? '#d29922' : '#f85149';
  const endMsg =
    score >= 4 ? 'MISSION COMPLETED' : score >= 2 ? 'SUS...' : 'too sus...';

  return (
    <PopUpContainer>
      {done ? (
        /* End Screen */
        <div
          style={{
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            marginTop: 60,
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: 4,
              color: '#5eead4',
              textTransform: 'uppercase',
            }}
          >
            game Over
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: endColor,
              letterSpacing: 2,
              textAlign: 'center',
            }}
          >
            {endMsg}
          </div>
          <div style={{ fontSize: 13, color: '#8b949e', letterSpacing: 1 }}>
            {score} of {rounds.length} correct
          </div>
          {/* Big crewmate */}
          <div
            style={{
              width: 80,
              height: 90,
              background: endColor,
              borderRadius: '40px 40px 20px 20px',
              position: 'relative',
              marginTop: 10,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 15,
                left: 11,
                width: 58,
                height: 27,
                background: 'rgba(255,255,255,0.25)',
                borderRadius: '12px 12px 0 0',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: -10,
                left: 8,
                width: 24,
                height: 22,
                borderRadius: 4,
                background: endColor,
                filter: 'brightness(0.65)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: -10,
                right: 8,
                width: 24,
                height: 22,
                borderRadius: 4,
                background: endColor,
                filter: 'brightness(0.65)',
              }}
            />
          </div>
          <button
            onClick={restart}
            style={{
              marginTop: 16,
              background: '#161b22',
              border: '1px solid #30363d',
              borderRadius: 10,
              padding: '10px 24px',
              color: '#e6edf3',
              fontFamily: "'Orbitron', monospace",
              fontSize: 10,
              letterSpacing: 2,
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Play Again
          </button>
        </div>
      ) : (
        <>
          <div
            style={{
              fontSize: 10,
              letterSpacing: 3,
              color: '#5eead4',
              textTransform: 'uppercase',
              marginBottom: 6,
              zIndex: 1,
            }}
          >
            Identify the crewmate
          </div>

          <div
            style={{
              background: '#161b22',
              border: '1px solid #30363d',
              borderRadius: 12,
              padding: '10px 20px',
              fontSize: 11,
              color: '#c9d1d9',
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: 20,
              zIndex: 1,
              textAlign: 'center',
            }}
          >
            What animal is this?
          </div>

          {/* Art card */}
          <div
            style={{
              background: '#161b22',
              border: '1px solid #21262d',
              borderRadius: 16,
              padding: '18px 28px',
              marginBottom: 22,
              zIndex: 1,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -10,
                right: -10,
                background: '#e53935',
                color: '#fff',
                fontSize: 8,
                fontFamily: "'Orbitron', monospace",
                letterSpacing: 1,
                padding: '3px 8px',
                borderRadius: 20,
                textTransform: 'uppercase',
              }}
            >
              Task
            </div>
            <pre
              style={{
                fontFamily: 'monospace',
                fontSize: 22,
                lineHeight: 1.35,
                color: '#e6edf3',
                whiteSpace: 'pre',
                textAlign: 'center',
              }}
            >
              {round.art}
            </pre>
          </div>

          {/* Options */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              width: '100%',
              zIndex: 1,
            }}
          >
            {round.options.map((opt, i) => {
              const isSelected = selected === i;
              const isCorrect = opt.correct;
              const hovered = hoveredBtn === i;
              const borderColor = answered
                ? isSelected
                  ? isCorrect
                    ? '#3fb950'
                    : '#f85149'
                  : isCorrect
                    ? '#3fb950'
                    : BORDER_IDLE[opt.color]
                : hovered
                  ? BORDER_HOVER[opt.color]
                  : BORDER_IDLE[opt.color];

              const bgColor = answered
                ? isSelected
                  ? isCorrect
                    ? '#0f2a1a'
                    : '#2a0f0f'
                  : isCorrect
                    ? '#0f2a1a'
                    : '#161b22'
                : hovered
                  ? '#1c2128'
                  : '#161b22';

              const anim =
                answered && isSelected
                  ? isCorrect
                    ? 'pulse-green 0.4s ease'
                    : 'shake 0.35s ease'
                  : undefined;

              return (
                <button
                  key={i}
                  onClick={() => pick(i)}
                  onMouseEnter={() => setHoveredBtn(i)}
                  onMouseLeave={() => setHoveredBtn(null)}
                  style={{
                    background: bgColor,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 12,
                    padding: '14px 10px',
                    cursor: answered ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'border-color 0.15s, background 0.15s',
                    animation: anim,
                    transform:
                      hovered && !answered ? 'scale(1.03)' : 'scale(1)',
                  }}
                >
                  <Crewmate color={opt.color} />
                  <span
                    style={{
                      fontSize: 13,
                      color: '#e6edf3',
                      letterSpacing: 1.5,
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      fontFamily: "'Orbitron', monospace",
                    }}
                  >
                    {opt.label}
                  </span>
                  <span
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 8,
                      fontSize: 9,
                      color: '#484f58',
                      letterSpacing: 1,
                      fontFamily: "'Orbitron', monospace",
                    }}
                  >
                    {['A', 'B', 'C', 'D'][i]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          <div
            style={{
              marginTop: 12,
              fontSize: 10,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              zIndex: 1,
              minHeight: 16,
              textAlign: 'center',
              color: feedback
                ? feedback.correct
                  ? '#3fb950'
                  : '#f85149'
                : 'transparent',
            }}
          >
            {feedback?.text ?? '.'}
          </div>

          {/* Score bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              zIndex: 1,
              marginTop: 16,
              width: '100%',
            }}
          >
            <span
              style={{
                fontSize: 9,
                color: '#484f58',
                letterSpacing: 2,
                textTransform: 'uppercase',
                flexShrink: 0,
                fontFamily: "'Orbitron', monospace",
              }}
            >
              Tasks
            </span>
            <div
              style={{
                flex: 1,
                height: 4,
                background: '#21262d',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  background: '#3fb950',
                  borderRadius: 2,
                  width: `${pct}%`,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
            <span
              style={{
                fontSize: 11,
                color: '#3fb950',
                flexShrink: 0,
                fontFamily: "'Orbitron', monospace",
              }}
            >
              {score} / {rounds.length}
            </span>
          </div>
        </>
      )}
    </PopUpContainer>
  );
}
