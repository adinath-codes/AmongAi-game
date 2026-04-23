import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import reveal from '/audio/reveal.mp3';
function ActOne() {
  return (
    <motion.div
      initial={{ scale: 0.1, opacity: 0 }}
      animate={{ scale: 3, opacity: 0.6 }}
      exit={{ scale: 1, opacity: 0 }}
      transition={{ duration: 1, ease: 'easeInOut' }}
      className="absolute flex items-center justify-center"
    >
      <h1 className="text-5xl text-white">YOU ARE THE</h1>
    </motion.div>
  );
}
function ActTwo({ role }: { role: string }) {
  console.log('ROLE:', role);

  const isImp: boolean = role.toUpperCase() === 'IMPOSTOR';
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-black"
      initial={{ opacity: 0 }}
      // animate={{ opacity: 1, animationDuration: 4 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2, ease: 'easeInOut' }}
      animate={['visible', 'shake']}
      variants={{
        visible: { opacity: 1 },
        shake: {
          x: [0, -10, 10, -10, 10, 0],
          y: [0, 10, -10, 10, -10, 0],
          transition: { delay: 0.2, duration: 0.4 },
        },
      }}
    >
      <div
        className={`absolute inset-0 opacity-40 ${isImp ? 'bg-[radial-gradient(circle,rgba(255,0,0,0.8)_0%,rgba(0,0,0,1)_70%)]' : 'bg-[radial-gradient(circle,rgba(0,0,255,0.8)_0%,rgba(0,0,0,1)_70%)]'}`}
      />
      <motion.h1
        className={`relative z-20 text-9xl font-bold tracking-widest uppercase ${isImp ? 'text-red-600 drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]' : 'text-cyan-600 drop-shadow-[0_0_20px_rgba(0,255,255,0.8)]'}`}
        initial={{ scale: 15, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 1500,
          damping: 25,
          mass: 2,
          duration: 5,
        }}
      >
        {role}
      </motion.h1>
    </motion.div>
  );
}
export default function RevealFSM({
  role,
  setRole,
  onComplete,
}: {
  role: string;
  setRole: React.Dispatch<React.SetStateAction<'impostor' | 'crewmate'>>;
  onComplete: () => void;
}) {
  const [act, setAct] = useState<number>(1);
  const [randNo, setRandNo] = useState<number>(0);
  const audioRef = useRef(new Audio(reveal));
  useEffect(() => {
    const audio = audioRef.current;
    if (act < 3) {
      const attemptPlay = () => {
        audio
          .play()
          .then(() => {
            window.removeEventListener('click', attemptPlay);
            window.removeEventListener('keydown', attemptPlay);
          })
          .catch((err) => {
            console.log('AutoPlay Blocked', err);
          });
      };
      audio.play().then(() => {
        window.addEventListener('click', attemptPlay);
        window.addEventListener('keydown', attemptPlay);
      });
      return () => {
        audio.pause();
        window.removeEventListener('click', attemptPlay);
        window.removeEventListener('keydown', attemptPlay);
      };
    }
  }, [act]);

  useEffect(() => {
    setTimeout(() => {
      setRandNo(Math.random());
    });
  }, []);

  useEffect(() => {
    const closeTimer = setTimeout(() => {
      const PLAYER_IMPOSTOR_CHANCE = 1; // Probs of imp
      let playerRole: 'impostor' | 'crewmate' = 'crewmate';
      console.error('YOU ARE THE:', randNo, typeof window.requestSetPlayerRole);
      if (typeof window.requestSetPlayerRole === 'function') {
        if (randNo < PLAYER_IMPOSTOR_CHANCE) {
          playerRole = 'impostor';
        } else {
          playerRole = 'crewmate';
        }
        console.error('YOU ARE THE:', playerRole);
        window.requestSetPlayerRole(playerRole);
        setRole(playerRole);
      }
    }, 1000);
    return () => clearTimeout(closeTimer);
  }, [randNo, setRole]);

  useEffect(() => {
    const act2Timer = setTimeout(() => {
      setAct(2);
    }, 500);
    const act3Timer = setTimeout(() => {
      setAct(3);
    }, 5000);
    const endTImer = setTimeout(() => {
      setAct(4);
      onComplete();
    }, 3000);
    return () => {
      clearTimeout(act2Timer);
      clearTimeout(act3Timer);
      clearTimeout(endTImer);
    };
  }, [onComplete]);
  if (act === 4) return null;
  return (
    <div className="fixed inset-0 z-50 pointer-events-auto flex items-center justify-center overflow-hidden">
      <motion.div
        className="absolute -z-10 inset-0 bg-black"
        animate={{ opacity: act === 3 ? 0 : 1 }}
        transition={{ duration: 1, ease: 'easeInOut' }}
      />
      <AnimatePresence>
        {act === 1 && <ActOne key="act1" />}
        {act === 2 && <ActTwo key="act2" role={role} />}
      </AnimatePresence>
      {/* <motion.div
        animate={{ opacity: act === 3 ? 0 : 1 }}
        transition={{ duration: 1, ease: 'easeInOut' }}
        className="absolute top-0 left-0 w-full h-24 bg-black z-50 shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
      />

      <motion.div
        animate={{ opacity: act === 3 ? 0 : 1 }}
        transition={{ duration: 1, ease: 'easeInOut' }}
        className="absolute bottom-0 left-0 w-full h-24 bg-black z-50 shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
      /> */}
    </div>
  );
}
