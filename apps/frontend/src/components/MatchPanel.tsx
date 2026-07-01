import React, { useState, useEffect } from 'react';
import { useArenaStore } from '../store/useArenaStore';
import { Trophy, Clock, Terminal, Play, Send, BrainCircuit, Activity, Loader2, History, CheckCircle, XCircle, Copy } from 'lucide-react';
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
    gameMode,
    isExecuting,
    setIsExecuting,
    setTestResult,
    loadSubmission
  } = useArenaStore();

  const [activeTab, setActiveTab] = useState<'problem' | 'submissions'>('problem');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'submissions' && problem?.id && userId && !isExecuting) {
      setIsLoadingSubmissions(true);
      fetch(`/api/problems/${problem.id}/submissions?userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          setSubmissions(Array.isArray(data) ? data : []);
          setIsLoadingSubmissions(false);
        })
        .catch(err => {
          console.error(err);
          setIsLoadingSubmissions(false);
        });
    }
  }, [activeTab, problem?.id, userId, isExecuting]);

  const handleRun = () => {
    setTestResult(null);
    setIsExecuting(true);
    socket.emit(SOCKET_EVENTS.SUBMIT_CODE, {
      matchId,
      userId,
      code,
      language,
      type: 'run'
    });
  };

  const handleSubmit = () => {
    setTestResult(null);
    setIsExecuting(true);
    socket.emit(SOCKET_EVENTS.SUBMIT_CODE, {
      matchId,
      userId,
      code,
      language,
      type: 'submit'
    });
    // Switch to submissions tab after submit
    setActiveTab('submissions');
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Problem Card */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden group flex-1">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[50px] -mr-10 -mt-10 transition-all duration-700 group-hover:bg-blue-500/20"></div>
        
        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-2 z-10">
          <button 
            onClick={() => setActiveTab('problem')}
            className={`px-4 py-2 font-bold text-sm tracking-wide transition-colors ${activeTab === 'problem' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Description
          </button>
          <button 
            onClick={() => setActiveTab('submissions')}
            className={`px-4 py-2 font-bold text-sm tracking-wide transition-colors flex items-center gap-2 ${activeTab === 'submissions' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <History size={14} /> Submissions
          </button>
        </div>

        {activeTab === 'problem' ? (
          <div className="overflow-y-auto custom-scrollbar pr-2 flex-1 space-y-4">
            <div className="flex justify-between items-start z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-lg border border-white/10 shadow-inner">
                  <Terminal size={18} className="text-blue-400" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-glow">{problem.title}</h2>
              </div>
            </div>

            <p className="text-gray-300 text-sm leading-relaxed z-10 font-medium whitespace-pre-wrap">
              {problem.description}
            </p>

            {problem.constraints && (
              <div className="mt-2 z-10">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Activity size={14} /> Constraints
                </p>
                <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/5 font-mono text-xs text-gray-300 shadow-inner whitespace-pre-wrap">
                  {problem.constraints}
                </div>
              </div>
            )}

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
        ) : (
          <div className="overflow-y-auto custom-scrollbar pr-2 flex-1 space-y-3 z-10">
            {isLoadingSubmissions ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 size={24} className="animate-spin text-blue-400" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center p-8 text-gray-400 font-medium text-sm">
                No submissions yet for this problem.
              </div>
            ) : (
              submissions.map(sub => (
                <div 
                  key={sub.id} 
                  onClick={() => setExpandedSubmissionId(expandedSubmissionId === sub.id ? null : sub.id)}
                  className={`p-4 rounded-xl border bg-black/40 flex flex-col gap-2 cursor-pointer transition-all hover:bg-black/60 ${sub.status === 'Accepted' ? 'border-green-500/20 hover:border-green-500/40' : 'border-red-500/20 hover:border-red-500/40'}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {sub.status === 'Accepted' ? <CheckCircle size={16} className="text-green-400" /> : <XCircle size={16} className="text-red-400" />}
                      <span className={`font-bold ${sub.status === 'Accepted' ? 'text-green-400' : 'text-red-400'}`}>{sub.status}</span>
                    </div>
                    <span className="text-xs text-gray-500 font-mono">{new Date(sub.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex gap-4 mt-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <span className="uppercase font-bold tracking-wider text-[10px]">Lang:</span>
                      <span className="font-mono text-gray-300">{sub.language}</span>
                    </div>
                    <div className="flex-1 text-right text-xs text-gray-500">
                      {expandedSubmissionId === sub.id ? 'Click to collapse' : 'Click to view code'}
                    </div>
                  </div>
                  
                  {expandedSubmissionId === sub.id && (
                    <div className="mt-3 pt-3 border-t border-white/5 flex flex-col gap-2">
                      <div className="flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            loadSubmission(sub.language, sub.code);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors border border-blue-500/20"
                        >
                          <Copy size={12} /> Copy to Editor
                        </button>
                      </div>
                      <pre className="p-3 rounded-lg bg-[#0d1117] overflow-x-auto text-xs font-mono text-gray-300 border border-white/10">
                        <code>{sub.code}</code>
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Opponent Tracker - Only visible in battle mode */}
      {gameMode === 'battle' && (
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
      )}

      {/* Controls */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex gap-3">
          <button 
            disabled={isExecuting}
            onClick={handleRun}
            className="flex-1 bg-white/5 hover:bg-white/10 text-gray-200 px-4 py-3 rounded-xl font-bold transition-all duration-300 border border-white/10 hover:border-white/20 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExecuting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />} 
            {isExecuting ? 'Running...' : 'Run Code'}
          </button>
          <button 
            disabled={isExecuting}
            onClick={handleSubmit}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-3 rounded-xl font-bold transition-all duration-300 shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] hover:-translate-y-0.5 flex items-center justify-center gap-2 border border-blue-400/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExecuting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} 
            {isExecuting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchPanel;
