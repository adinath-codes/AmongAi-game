import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import winSFX from '/audio/win.mp3';
import loseSFX from '/audio/lose.mp3';
interface TYPEgameOverProps {
  winner: 'crewmate' | 'impostor' | null;
}

export default function GameOverModal({ winner }: TYPEgameOverProps) {
  const winRef = useRef(new Audio(winSFX));
  const loseRef = useRef(new Audio(loseSFX));
  useEffect(() => {
    const crewWinaudio = winRef.current;
    const impWinaudio = loseRef.current;
    const audio =
      winner === 'crewmate'
        ? crewWinaudio
        : winner === 'impostor'
          ? impWinaudio
          : null;
    if (!audio) return;

    audio.loop = true;

    const attemptPlay = () => {
      audio
        .play()
        .then(() => {
          window.removeEventListener('click', attemptPlay);
          window.removeEventListener('keydown', attemptPlay);
        })
        .catch((err) => {
          console.log('Autoplay blocked, waiting for interaction...', err);
        });
    };

    audio.play().catch(() => {
      window.addEventListener('click', attemptPlay);
      window.addEventListener('keydown', attemptPlay);
    });

    return () => {
      audio.pause();
      window.removeEventListener('click', attemptPlay);
      window.removeEventListener('keydown', attemptPlay);
    };
  }, [winner]);
  const isCrewWin = winner === 'crewmate';
  const baseColor = isCrewWin ? 'blue' : 'red';
  const title = isCrewWin ? 'CREWMATE WIN' : 'IMPOSTOR WINS';
  const subtitle = isCrewWin
    ? 'All tasks Completed'
    : 'The crew was eliminated';

  if (!winner) return null;

  return (
    <AnimatePresence mode="wait">
      {winner && (
        <motion.div
          key="game-over-modal"
          className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-${baseColor}-950/50 backdrop-blur-sm transition-all `}
          initial={{ opacity: 0 }}
          // animate={{opacity:1}}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          animate={['visible', 'shake']}
          variants={{
            visible: { opacity: 1 },
            shake: {
              x: [0, -15, 15, -15, 15, 0],
              y: [0, 15, -15, 15, -15, 0],
              transition: { delay: 0.2, duration: 0.4, ease: 'easeInOut' },
            },
          }}
        >
          <div
            className={`absolute inset-0 opacity-40 ${isCrewWin ? 'bg-[radial-gradient(circle,rgba(0,0,255,0.8)_0%,rgba(0,0,0,1)_70%)]' : 'bg-[radial-gradient(circle,rgba(255,0,0,0.8)_0%,rgba(0,0,0,1)_70%)]'}`}
          />
          <motion.h1
            className={`relative z-20 text-8xl font-bold tracking-widest text-${baseColor}-400 drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]}`}
            initial={{ scale: 15, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              mass: 3,
              delay: 0.2,
            }}
          >
            {title}
          </motion.h1>
          <motion.p
            className="relative z-20 mt-4 text-3xl text-white tracking-wide"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1, ease: 'easeOut' }}
          >
            {subtitle}
          </motion.p>
          <motion.button
            onClick={() => {
              console.log('-------------RESTART-------------');
              window.location.reload();
            }}
            className="relative z-20 mt-16 px-10 py-5 bg-white/10 hover:bg-white/20 text-white font-bold text-xl rounded-lg border-2 border-white/30 transition-all"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 1, ease: 'easeOut' }}
          >
            PLAY AGAIN
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
