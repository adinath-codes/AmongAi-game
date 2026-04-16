import { AnimatePresence, motion } from 'framer-motion';
import { Send } from 'lucide-react';
import type { TYPESMessage } from './MeetingModal';

interface VoteChatProps {
  messages: TYPESMessage[];
  chatInput: string;
  setChatInput: (value: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
}

export default function VoteChat({
  messages,
  chatInput,
  setChatInput,
  handleSendMessage,
}: VoteChatProps) {
  return (
    <>
      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        <AnimatePresence initial={false}>
          {/* 3. No more 'any'! msg is automatically typed as TYPESMessage */}
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ borderColor: msg.color }}
              className="flex flex-col rounded-lg bg-slate-800/40 border-l-4 p-2"
            >
              <span
                className="text-[10px] font-bold uppercase opacity-50"
                style={{ color: msg.color }}
              >
                {msg.sender}
              </span>
              <p className="text-sm font-medium tracking-tight text-slate-200">
                {msg.text}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <form
        onSubmit={handleSendMessage}
        className="mt-4 flex gap-2 border-t border-slate-700 pt-4"
      >
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          placeholder="Type a message..."
          className="flex-1 bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 transition-all placeholder:opacity-30"
        />
        <button
          type="submit"
          className="p-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors text-white shadow-lg shadow-red-900/20"
        >
          <Send size={18} />
        </button>
      </form>
    </>
  );
}
