/* eslint-disable @typescript-eslint/no-explicit-any */
import { Check, Clock, SkipForward, User, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import CrewMateIcon from './CrewMateIcon';
import { motion, AnimatePresence } from 'framer-motion';
import VoteChat from './voteChat';

export interface PlayerData {
  id: string; // Unique name
  color: string;
  isDead: boolean;
  isMe: boolean;
  votes: number;
}
export interface TYPESMessage {
  sender: string;
  text: string;
  color: string;
  isMe: boolean;
}
interface TYPESMeetingModal {
  isOpen: boolean;
  onClose: () => void;
  initialPlayers: PlayerData[];
}
const colorCodes: Record<string, string> = {
  red: '#ff0000',
  blue: '#0000ff',
  pink: '#ff69b4',
  black: '#333333',
  yellow: '#ffff00',
};

export default function MeetingModal({
  isOpen,
  onClose,
  initialPlayers,
}: TYPESMeetingModal) {
  const [phase, setPhase] = useState<
    'Discussion' | 'Voting' | 'Reveal' | 'Results'
  >('Discussion');
  const [votersForPlayer, setVotersForPlayer] = useState<
    Record<string, string[]>
  >({});
  const [votersWhoSkipped, setVotersWhoSkipped] = useState<string[]>([]);
  const [players, setPlayers] = useState(initialPlayers);
  const [messages, setMessages] = useState<TYPESMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [confirmedVote, setConfirmedVote] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const [allVotes, setAllVotes] = useState<Record<string, string>>({});
  const [ejectedPlayer, setEjectedPlayer] = useState<string | null>(null);
  const [isBotTyping, setIsBotTyping] = useState<boolean>(false);
  const [currBotName, setCurrBotName] = useState<string>('');

  const [botOrder] = useState<string[]>(['pink', 'yellow', 'blue', 'black']);

  // 🧠 UPDATED: Replaced Qwen/Llama with 1B-2B class models
  const [botModels] = useState<Record<string, string>>({
    pink: 'stablelm2',
    yellow: 'deepseek-coder:1.3b', // Uses <think> tags (stripped in code below)
    blue: 'qwen2.5:1.5b',
    black: 'llama3.2:1b',
  });

  // 🎭 UPDATED: Real Gamer Personas
  // const [secretRole] = useState<Record<string, string>>({
  //   pink: 'You are the IMPOSTOR! (Never admit this). Act like a confused Crewmate. Deflect blame onto PINK or BLACK. Say things like "cap" or "I was doing tasks".',
  //   yellow:
  //     'You are a CREWMATE. You are highly paranoid and accuse people quickly with no proof. Use words like "sus" and "bro".',
  //   blue: 'You are a CREWMATE. You act like a detective. You ask for proof and locations. You are calm.',
  //   black:
  //     'You are a CREWMATE. You are impatient, use all lowercase, and just want people to vote. You heavily suspect YELLOW.',
  // });

  const timeLeftRef = useRef(timeLeft);
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- AI Voting Logic ---
  useEffect(() => {
    if (phase === 'Voting') {
      const aiTimer = setTimeout(() => {
        const aiVotes: Record<string, string> = {};
        const alivePlayers = players.filter((p) => !p.isDead);
        const aliveIds = alivePlayers.map((p) => p.id);

        alivePlayers.forEach((p) => {
          if (!p.isMe) {
            let decision = 'skip';
            if (typeof (window as any).requestSusVote === 'function') {
              decision = (window as any).requestSusVote(p.id, aliveIds);
            }
            aiVotes[p.id] = decision;
          }
        });

        setAllVotes((prev) => ({ ...prev, ...aiVotes }));
      }, 1500);

      return () => clearTimeout(aiTimer);
    }
  }, [phase, players]);

  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      setPlayers(initialPlayers);
      setMessages([]);
      setPhase('Discussion');
      setSelectedVote(null);
      setConfirmedVote(null);
      setAllVotes({});
      setEjectedPlayer(null);
    });
  }, [isOpen, initialPlayers]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  // --- The Tally Logic ---
  useEffect(() => {
    if (phase === 'Results') {
      const finalVotes = { ...allVotes };

      const tally: Record<string, number> = {};
      Object.values(finalVotes).forEach((target) => {
        if (target !== 'skip') tally[target] = (tally[target] || 0) + 1;
      });

      let highestVoteCount = 0;
      let candidates: string[] = [];
      Object.entries(tally).forEach(([target, count]) => {
        if (count > highestVoteCount) {
          highestVoteCount = count;
          candidates = [target];
        } else if (count === highestVoteCount) {
          candidates.push(target);
        }
      });

      let ejected: string | null = null;
      if (candidates.length === 1 && candidates[0] !== 'skip') {
        ejected = candidates[0];
      }

      setTimeout(() => {
        setEjectedPlayer(ejected);
      }, 0);

      const closeTimer = setTimeout(() => {
        if (typeof (window as any).resumePhaserGame === 'function') {
          (window as any).resumePhaserGame();
        }
        if (typeof (window as any).processEjection === 'function') {
          (window as any).processEjection(ejected);
        }
        onClose();
      }, 5000);

      return () => clearTimeout(closeTimer);
    }
  }, [phase, allVotes, confirmedVote, onClose, players]);

  useEffect(() => {
    if (!isOpen || phase === 'Results') return;

    const delay = timeLeft > 0 ? 1000 : 0;
    const timer = setTimeout(() => {
      if (timeLeft > 0) {
        setTimeLeft(timeLeft - 1);
      } else {
        if (phase === 'Discussion') {
          setPhase('Voting');
          setTimeLeft(15);
        } else if (phase === 'Voting') {
          const finalVotes = { ...allVotes };
          players.forEach((p) => {
            if (!p.isDead && !finalVotes[p.id]) {
              finalVotes[p.id] = 'skip';
            }
          });
          setAllVotes(finalVotes);

          const forPlayer: Record<string, string[]> = {};
          const skipped: string[] = [];

          Object.entries(finalVotes).forEach(([voter, target]) => {
            if (target === 'skip') {
              skipped.push(voter);
            } else {
              if (!forPlayer[target]) forPlayer[target] = [];
              forPlayer[target].push(voter);
            }
          });

          setVotersForPlayer(forPlayer);
          setVotersWhoSkipped(skipped);

          setPhase('Reveal');
          setTimeLeft(6);
        } else if (phase === 'Reveal') {
          setPhase('Results');
        }
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [isOpen, phase, timeLeft, allVotes, players]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    if (botTimerRef.current) {
      clearTimeout(botTimerRef.current);
    }

    const myData = players.find((p) => p.isMe);
    const text = chatInput.trim();
    const newMessage: TYPESMessage = {
      sender: 'chris',
      text: text,
      color: myData?.color || '#ff0000',
      isMe: true,
    };

    const updatedChats = [...messages, newMessage];
    setMessages(updatedChats);
    setChatInput('');

    const tagRegex = text.match(/@(yellow|green|pink|blue|black)\b/i);
    const aliveBots = players
      .filter((p) => !p.isDead && !p.isMe)
      .map((p) => p.id);

    const randomAliveBot =
      aliveBots.length > 0
        ? aliveBots[Math.floor(Math.random() * aliveBots.length)]
        : 'chris';

    if (tagRegex) {
      const taggedColor = tagRegex[1].toLowerCase();
      const targetPlayer = players.find((p) => p.id === taggedColor);

      if (targetPlayer && targetPlayer.isDead) {
        const sysMessage: TYPESMessage = {
          sender: 'system',
          text: `${taggedColor.toUpperCase()} is dead and cannot speak.`,
          color: '#888888',
          isMe: false,
        };
        const chatWithSys = [...updatedChats, sysMessage];
        setMessages(chatWithSys);

        botTimerRef.current = setTimeout(() => {
          triggerLLMResponse(chatWithSys, randomAliveBot, false);
        }, 1000);
      } else {
        botTimerRef.current = setTimeout(() => {
          triggerLLMResponse(updatedChats, taggedColor, true);
        }, 500);
      }
    } else {
      botTimerRef.current = setTimeout(() => {
        triggerLLMResponse(updatedChats, randomAliveBot, false);
      }, 500);
    }
  };

  //---------BACKEND LOGICS-----------

  // 📝 UPDATED: Format looks like a real chat log for the LLM
  const formatChatforLLM = (chatHistory: TYPESMessage[]): string => {
    if (chatHistory.length === 0) return 'No messages yet.';
    return chatHistory
      .map((msg) => `[${msg.sender.toUpperCase()}]: ${msg.text}`)
      .join('\n');
  };

  const triggerLLMResponse = async (
    currentMessages: TYPESMessage[],
    botName: string,
    isTagged: boolean,
  ) => {
    setIsBotTyping(true);
    setCurrBotName(`${botName} (${botModels[botName]})`);
    const targetModel = botModels[botName] || 'stablelm2';
    let trueRole = 'crewmate';
    if (typeof (window as any).requestBotRole === 'function') {
      trueRole = (window as any).requestBotRole(botName);
    }

    // Assign the LLM personality based on their true engine role
    const secretIdentity =
      trueRole === 'impostor'
        ? 'You are the IMPOSTOR! (Never admit this). Act like a confused Crewmate. Deflect blame onto others. Say things like "cap" or "I was doing tasks".'
        : 'You are a CREWMATE. You are highly paranoid and accuse people quickly. Use words like "sus" and "bro".';
    let memoryLog = 'no memory record';

    if (typeof (window as any).requestBotMemory === 'function') {
      memoryLog = (window as any).requestBotMemory(botName);
    }

    // 🧠 UPDATED: The "Gamer" Prompt Architecture
    const botContext = `You are ${botName.toUpperCase()}, a player in Among Us.
ROLE: ${secretIdentity}

YOUR MEMORY (what you've observed): ${memoryLog}

OUTPUT RULES — VIOLATING ANY RULE = FAILURE:
1. Output ONLY your spoken words. No actions, no narration, no asterisks, no stage directions.
2. ONE sentence. Hard max 10 words. No exceptions.
3. Never start with your own name or color.
4. Never say things like "I see that..." or "Looking at the chat..." — just react naturally.
5. Speak TO others, not about yourself in third person.
6. Use Among Us slang: sus, cap, vent, faking tasks, impostor, bro.
7. Never ask yourself questions. You already know what you saw.
8. If accused, defend yourself. If suspicious of someone, call them out by name.

BAD EXAMPLES (never do this):
- "(reading history) Chris says pink is sus"
- "Did I see anything suspicious?"
- "PINK: I was doing tasks"
- "As BLUE, I think..."

GOOD EXAMPLES:
- "pink was literally standing over the body bro"
- "cap, i was doing oxygen the whole time"
- "yellow sus, saw him near nav with no task"`;

    const rawChatScript = formatChatforLLM(currentMessages);

    const fullPrompt = `${botContext}

CHAT SO FAR:
${rawChatScript}

${botName.toUpperCase()} says:`;
    console.warn(fullPrompt);

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: targetModel,
          prompt: fullPrompt,
          stream: false,
          options: {
            temperature: 0.8, // Slightly higher for more creative lying
            num_predict: 150, // INCREASED: Give DeepSeek enough tokens to finish <thinking>
            // NEW: Force the LLM to stop generating if it tries to write the next line of the script
            stop: ['\n', '[', 'CHRIS:', 'YELLOW:', 'PINK:', 'BLUE:', 'BLACK:'],
          },
        }),
      });

      if (!response.ok) throw new Error(`HTTPS ERROR:${response.status}`);
      const data = await response.json();

      // 🧼 UPDATED: The Sanitizer (Strips out weird LLM formatting)
      let reply = data.response.trim();

      // 1. Strip <think> tags (Crucial for DeepSeek-R1)
      reply = reply.replace(/<think>[\s\S]*?(<\/think>|$)/gi, '').trim();

      // Fallback: If stripping the thought left the reply completely empty, give it a default gamer response
      if (!reply) {
        reply = 'what are u talking about bro';
      }

      // 2. Remove "Color:" or "[Color]:" prefix if the bot hallucinated it
      const prefixRegex = new RegExp(`^\\[?${botName}\\]?:?\\s*`, 'i');
      reply = reply.replace(prefixRegex, '').trim();

      // 3. Remove surrounding quotes
      reply = reply.replace(/^["'](.*)["']$/, '$1').trim();

      setMessages((prev) => {
        const messageColor = colorCodes[botName];
        const updatedChat = [
          ...prev,
          { sender: botName, text: reply, color: messageColor, isMe: false },
        ];

        if (timeLeftRef.current > 0) {
          if (!isTagged) {
            let nextBotName = '';
            let checkIndex = botOrder.indexOf(botName);
            let attempts = 0;

            while (attempts < botOrder.length) {
              checkIndex = (checkIndex + 1) % botOrder.length;
              const candidateName = botOrder[checkIndex];
              const candidatePlayer = players.find(
                (p) => p.id === candidateName,
              );

              if (candidatePlayer && !candidatePlayer.isDead) {
                nextBotName = candidateName;
                break;
              }
              attempts++;
            }

            if (nextBotName) {
              botTimerRef.current = setTimeout(
                () => triggerLLMResponse(updatedChat, nextBotName, false),
                2500, // Slightly longer gap so humans can read it
              );
            }
          }
        }

        return updatedChat;
      });
    } catch (err) {
      console.error('OLLAMA FAILED:', err);
    } finally {
      setIsBotTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm py-20">
      <div className="flex h-full w-[60vw] flex-col rounded-xl border border-slate-700 bg-slate-900/50 text-slate-200 shadow-2xl">
        <div className="flex items-center justify-center border-b w-full border-slate-700 p-4 rounded-t-xl">
          <h2 className="text-2xl font-bold uppercase tracking-widest text-red-500">
            Emergency Meeting
          </h2>
          <div
            className={`flex items-center gap-2 rounded-md px-3 py-1 transition-colors duration-300 ${timeLeft <= 10 && timeLeft > 0 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-slate-700 text-slate-200'}`}
          >
            <Clock size={20} />
            <span className="w-full text-center">
              Time left for {phase}: {timeLeft}
            </span>
          </div>
        </div>
        <h3 className="mb-4 text-slate-400 font-semibold flex items-center gap-2">
          <User size={18} /> Chat Room{' '}
          {isBotTyping && (
            <span className="animate-pulse text-emerald-400 ml-2">
              {currBotName} is typing...
            </span>
          )}
        </h3>
        <VoteChat
          messages={messages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          handleSendMessage={handleSendMessage}
        />
      </div>

      {/* Crew Roster / Results Screen */}
      <div className="flex flex-1 h-full overflow-hidden px-4 gap-6">
        <div className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 p-4 relative">
          {phase === 'Results' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
              <h2 className="text-4xl font-bold tracking-widest text-white font-['Orbitron'] mb-4">
                VOTING COMPLETE
              </h2>
              <p
                className={`text-3xl font-bold tracking-wider ${ejectedPlayer ? 'text-red-500' : 'text-slate-400'}`}
              >
                {ejectedPlayer
                  ? `${ejectedPlayer.toUpperCase()} was ejected.`
                  : 'No one was ejected. (Skipped / Tie)'}
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-between">
                <h3 className="mb-4 text-slate-400 font-semibold flex items-center gap-2">
                  <User size={18} /> Crew Roster{' '}
                  {phase === 'Discussion'
                    ? '(Wait till discussion ends to start voting)'
                    : '(You can vote now)'}
                </h3>
                <button
                  disabled={phase !== 'Voting'}
                  onClick={() => {
                    setSelectedVote('skip');
                    setConfirmedVote('skip');
                    const myData = players.find((player) => player.isMe);
                    if (myData)
                      setAllVotes((prev) => ({ ...prev, [myData.id]: 'skip' }));
                  }}
                  className={`flex flex-row justify-center items-center gap-0.5 shadow-2xl border-2 rounded-xl w-20 h-10 text-slate-300 transition-colors ${phase === 'Voting' ? 'bg-blue-500/70 border-black hover:bg-blue-600/40 active:scale-95' : 'bg-slate-700 border-slate-600 opacity-50 cursor-not-allowed'}`}
                >
                  SKIP <SkipForward size={15} />
                </button>
                {phase === 'Reveal' && votersWhoSkipped.length > 0 && (
                  <div className="flex items-center gap-1 ml-4 bg-slate-800/80 px-3 py-1 rounded border border-slate-700">
                    <span className="text-xs text-slate-400 mr-2 font-bold uppercase">
                      Skipped:
                    </span>
                    {votersWhoSkipped.map((voterId) => (
                      <div
                        key={voterId}
                        className="w-5 h-5 rounded border border-slate-900 shadow-md"
                        style={{ backgroundColor: colorCodes[voterId] }}
                        title={`${voterId} skipped`}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 overflow-y-auto p-2 pb-16">
                {players?.map((p: PlayerData) => {
                  const isSelected = selectedVote === p.id;
                  const canVote = phase === 'Voting' && !p.isDead;
                  const hasVoted = Object.keys(allVotes).includes(p.id);

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedVote(p.id)}
                      className={`relative flex items-center gap-3 ${!canVote ? 'cursor-not-allowed' : 'cursor-pointer'} rounded-lg border p-3 transition-all ${p.isDead ? 'border-red-900/50 bg-red-950/20 opacity-50 cursor-not-allowed' : 'border-slate-700 bg-slate-800'} ${isSelected ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-900/20' : ''} ${canVote && !isSelected ? 'hover:border-slate-500 hover:bg-slate-700' : ''}`}
                    >
                      <CrewMateIcon
                        color={p.color}
                        size={52}
                        isDead={p.isDead}
                      />
                      <div className="flex flex-col text-left">
                        <span
                          className={`font-bold ${p.isDead ? 'text-red-500 line-through' : 'text-slate-200'}`}
                        >
                          {p.id.toUpperCase()}{' '}
                          {p.isMe ? '(YOU)' : `(${botModels[p.id]})`}
                        </span>
                      </div>

                      {hasVoted && phase === 'Voting' && !isSelected && (
                        <span className="absolute right-4 text-xs font-bold bg-slate-600 px-2 py-1 rounded text-slate-300">
                          VOTED
                        </span>
                      )}
                      {phase === 'Reveal' && votersForPlayer[p.id] && (
                        <div className="absolute right-4 flex gap-1">
                          {votersForPlayer[p.id].map((voterId) => (
                            <div
                              key={voterId}
                              className="w-6 h-6 rounded border border-slate-900 shadow-md"
                              style={{ backgroundColor: colorCodes[voterId] }}
                              title={`${voterId} voted for ${p.id}`}
                            />
                          ))}
                        </div>
                      )}

                      <AnimatePresence>
                        {selectedVote === p.id && (
                          <motion.div
                            initial={{ scale: 0.5, opacity: 0, x: 20 }}
                            animate={{ scale: 0.8, opacity: 1, x: 0 }}
                            exit={{ scale: 0.8, opacity: 0, x: 10 }}
                            transition={{
                              type: 'spring',
                              stiffness: 300,
                              damping: 20,
                            }}
                            className="VOTINGBUTTONS absolute right-2 flex h-3/4 w-28 items-center justify-around"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmedVote(p.id);
                                const myData = players.find(
                                  (player) => player.isMe,
                                );
                                if (myData)
                                  setAllVotes((prev) => ({
                                    ...prev,
                                    [myData.id]: p.id,
                                  }));
                              }}
                              className="CONFIRM flex justify-center items-center h-12 w-12 rounded-sm bg-emerald-500 hover:bg-emerald-600 transition-colors active:scale-95"
                            >
                              <Check
                                size={40}
                                className="text-slate-200 opacity-90"
                              />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVote(null);
                              }}
                              className="CONFIRM flex justify-center items-center h-12 w-12 rounded-sm bg-rose-500 hover:bg-rose-600 transition-colors active:scale-95"
                            >
                              <X size={40} className="text-slate-200" />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
