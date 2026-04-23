import Phaser from 'phaser';
import { useEffect, useRef, useState } from 'react';
import { configCafe } from './game/BasicScene';
import MeetingModal, {
  type PlayerData,
} from './components/meetings/MeetingModal';
import TaskManager from './components/tasks/TasksManager';
import GameOverModal from './components/reveals/GameOverModal';
import MainMenu from './components/Pages/MainMenu';
import StartMenu from './components/Pages/StartMenu';
import OSTinterstellar from '/audio/OSTinterstellar.mp3';
import RevealFSM from './components/reveals/RevealFSM';

declare global {
  interface Window {
    game?: Phaser.Game;
    triggerMeeting?: (data: PlayerData[]) => void;
    triggerTask?: (taskID: string) => void;
    toggleKeyboard?: (isEnabled: boolean) => void;
    resumePhaserGame?: () => void;
    completedPlayerTasks?: (taskID: string) => void;
    triggerGameOver?: (winner: 'crewmate' | 'impostor') => void;
    processEjection?: (ejectedId: string | null) => void;
    requestSusVote?: (dummyName: string, aliveIDS: string[]) => string;
    requestBotMemory?: (botName: string) => string;
    requestSetPlayerRole?: (playerRole: 'impostor' | 'crewmate') => void;
  }
}

function App() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isTaskOpen, setIsTaskOpen] = useState<boolean>(false);
  const [meetingData, setMeetingData] = useState<PlayerData[]>([]);
  const [taskID, setTaskID] = useState<string>('animal');
  const [winner, setWinner] = useState<'crewmate' | 'impostor' | null>(null);
  const [gameState, setGameState] = useState<
    'start' | 'menu' | 'role' | 'playing'
  >('start');
  const [playerRole, setPlayerRole] = useState<'impostor' | 'crewmate'>(
    'crewmate',
  );

  const audioBgRef = useRef(new Audio(OSTinterstellar));

  useEffect(() => {
    const audio = audioBgRef.current;
    if (!audio || gameState === 'role') return;

    if (gameState !== 'playing') {
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
    }
  }, [gameState]);

  useEffect(() => {
    // Only boot the game if we are transitioning into the game, and it hasn't booted yet
    if ((gameState === 'role' || gameState === 'playing') && !window.game) {
      const game = new Phaser.Game(configCafe);
      window.game = game;

      // Attach global bridge functions

      window.triggerMeeting = (data: PlayerData[]) => {
        setMeetingData(data);
        setIsOpen(true);
      };
      window.triggerTask = (taskID: string) => {
        setTaskID(taskID);
        setIsTaskOpen(true);
      };
      window.triggerGameOver = (winningTeam) => {
        setWinner(winningTeam);
      };
    }

    return () => {
      if ((gameState === 'start' || gameState === 'menu') && window.game) {
        window.game.destroy(true);
        window.game = undefined;
      }
    };
  }, [gameState]);

  useEffect(() => {
    // Wait until the engine actually exists before trying to pause/resume it
    if (!window.game) return;

    if (gameState === 'menu') {
      //  Freeze the game behind the cinematic curtain
      window.game.scene.pause('BasicScene');
    } else if (gameState === 'playing') {
      // Unfreeze the game!
      window.game.scene.resume('BasicScene');
    }
  }, [gameState]);

  const handleCloseMeeting = () => {
    setIsOpen(false);
  };

  const handleCloseTask = () => {
    setIsTaskOpen(false);
    const phaserGame = window.game;
    if (phaserGame) {
      const scene = phaserGame.scene.getScene('BasicScene');
      if (scene) {
        scene.scene.resume();
        scene.physics.resume();
      }
    }
  };

  const handleCloseReveal = () => {
    setGameState('playing');
  };

  return (
    <div className="relative h-screen w-screen bg-black">
      {gameState === 'start' && (
        <StartMenu onStart={() => setGameState('menu')} />
      )}

      {gameState === 'menu' && (
        <MainMenu onStart={() => setGameState('role')} />
      )}

      <div id="_GAME-CONTAINER" className="h-full w-full" />

      {gameState === 'role' && (
        <RevealFSM
          role={playerRole}
          setRole={setPlayerRole}
          onComplete={handleCloseReveal}
        />
      )}

      <MeetingModal
        key={isOpen ? 'meeting-active' : 'meeting-closed'}
        isOpen={isOpen}
        initialPlayers={meetingData}
        onClose={handleCloseMeeting}
      />

      <TaskManager
        key={isTaskOpen ? 'task-active' : 'task-closed'}
        isTaskOpen={isTaskOpen}
        taskID={taskID}
        onClose={handleCloseTask}
      />

      <GameOverModal winner={winner} />
    </div>
  );
}

export default App;
