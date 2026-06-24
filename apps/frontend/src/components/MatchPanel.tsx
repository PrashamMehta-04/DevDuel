import React from 'react';
import { useArenaStore } from '../store/useArenaStore';
import { Trophy, Clock, Terminal, Play, Send, BrainCircuit, Activity } from 'lucide-react';
import { socket } from '../socket';
import { SOCKET_EVENTS } from '@devduel/shared';

const MatchPanel: React.FC = () => {
  const { 
    problem, 
    opponentProgress, 
    isOpponentTyping, 
    code, 
    language, 
    matchId, 
    userId,
    supportedLanguages,
    setLanguage,
    gameMode
  } = useArenaStore();

  const handleRun = () => {
    socket.emit(SOCKET_EVENTS.SUBMIT_CODE, {
      matchId,
      userId,
      code,
      language,
      type: 'run'
    });
  };

  const handleSubmit = () => {
    socket.emit(SOCKET_EVENTS.SUBMIT_CODE, {
      matchId,
      userId,
      code,
      language,
      type: 'submit'
    });
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Problem Card */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[50px] -mr-10 -mt-10 transition-all duration-700 group-hover:bg-blue-500/20"></div>
        
        <div className="flex justify-between items-start z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/5 rounded-lg border border-white/10 shadow-inner">
              <Terminal size={18} className="text-blue-400" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-glow">{problem.title}</h2>
          </div>
          <div className="glass-panel px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2">
            <Clock size={14} className="text-gray-400" />
            <span className="text-sm font-mono font-medium text-gray-200">12:45</span>
          </div>
        </div>

        <p className="text-gray-300 text-sm leading-relaxed z-10 font-medium">
          {problem.description}
        </p>

        <div className="mt-2 z-10">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <BrainCircuit size={14} /> Example Case
          </p>
          <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/5 font-mono text-xs text-gray-300 shadow-inner">
            <span className="text-blue-400">Input:</span> nums = [2,7,11,15], target = 9<br/>
            <span className="text-green-400">Output:</span> [0,1]
          </div>
        </div>
      </div>

      {/* Opponent Tracker - Only visible in battle mode */}
      {gameMode === 'battle' ? (
        <div className="glass-panel rounded-2xl p-6 flex flex-col gap-6 relative overflow-hidden flex-1 group">
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full blur-[60px] -ml-10 -mb-10 transition-all duration-700 group-hover:bg-purple-500/20"></div>

          <div className="flex items-center gap-3 z-10">
            <div className="p-2 bg-white/5 rounded-lg border border-white/10 shadow-inner">
              <Trophy size={18} className="text-yellow-400" />
            </div>
            <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Battle Status</h3>
          </div>
          
          <div className="space-y-6 z-10">
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-sm font-semibold text-gray-300">Opponent <span className="text-gray-500 font-normal">(ProCoder123)</span></span>
                <span className="text-lg font-black text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">{opponentProgress}%</span>
              </div>
              <div className="w-full bg-black/50 rounded-full h-3 p-0.5 border border-white/5 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-yellow-600 to-yellow-400 h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                  style={{ width: `${opponentProgress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}></div>
                </div>
              </div>
            </div>

            <div className={`p-4 glass-panel rounded-xl flex items-center gap-3 transition-all duration-500 ${isOpponentTyping ? 'border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.15)]' : 'border-white/5'}`}>
              <Activity size={16} className={isOpponentTyping ? 'text-yellow-400 animate-pulse' : 'text-gray-600'} />
              <span className={`text-sm font-medium ${isOpponentTyping ? 'text-yellow-400' : 'text-gray-500'}`}>
                {isOpponentTyping ? 'Typing code...' : 'Idle'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1"></div>
      )}

      {/* Controls */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex gap-3">
          <button 
            onClick={handleRun}
            className="flex-1 bg-white/5 hover:bg-white/10 text-gray-200 px-4 py-3 rounded-xl font-bold transition-all duration-300 border border-white/10 hover:border-white/20 flex items-center justify-center gap-2 shadow-sm"
          >
            <Play size={16} /> Run Code
          </button>
          <button 
            onClick={handleSubmit}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-3 rounded-xl font-bold transition-all duration-300 shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] hover:-translate-y-0.5 flex items-center justify-center gap-2 border border-blue-400/30"
          >
            <Send size={16} /> Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchPanel;
