import React, { useEffect, useState } from 'react';
import { X, User, Bot, Clock } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useArenaStore } from '../store/useArenaStore';

interface ReplayModalProps {
  matchId: string;
  onClose: () => void;
  opponentUsername: string;
}

interface Submission {
  id: string;
  userId: string;
  code: string;
  language: string;
  status: string;
}

export const ReplayModal: React.FC<ReplayModalProps> = ({ matchId, onClose, opponentUsername }) => {
  const currentUserId = useArenaStore((state) => state.userId);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/matches/${matchId}/submissions`)
      .then(res => res.json())
      .then(data => {
        setSubmissions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch match submissions:', err);
        setLoading(false);
      });
  }, [matchId]);

  const mySubmission = submissions.find(s => s.userId === currentUserId);
  const oppSubmission = submissions.find(s => s.userId !== currentUserId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-[#0B0F19] w-full max-w-6xl h-[85vh] rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-white/[0.02]">
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
            <Clock size={20} className="text-blue-400" />
            Match Replay
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <span className="font-bold tracking-wider uppercase text-sm">Loading Submissions...</span>
            </div>
          ) : (
            <div className="w-full h-full flex divide-x divide-white/10">
              
              {/* Player 1 (You) */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                      <User size={16} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">You</h3>
                      <span className="text-xs text-gray-500 font-mono">Language: {mySubmission?.language || 'N/A'}</span>
                    </div>
                  </div>
                  {mySubmission && (
                    <span className={`text-xs font-bold px-2 py-1 rounded ${mySubmission.status === 'Accepted' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {mySubmission.status}
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-auto bg-[#1e1e1e] relative">
                  {mySubmission ? (
                    <Editor
                      height="100%"
                      defaultLanguage={mySubmission.language === 'python' ? 'python' : 'javascript'}
                      value={mySubmission.code}
                      theme="vs-dark"
                      options={{ readOnly: true, minimap: { enabled: false } }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm font-medium">
                      No submissions made during this match.
                    </div>
                  )}
                </div>
              </div>

              {/* Player 2 (Opponent) */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                      {opponentUsername === 'AI Bot' ? <Bot size={16} /> : <User size={16} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{opponentUsername}</h3>
                      <span className="text-xs text-gray-500 font-mono">Language: {oppSubmission?.language || 'N/A'}</span>
                    </div>
                  </div>
                  {oppSubmission && (
                    <span className={`text-xs font-bold px-2 py-1 rounded ${oppSubmission.status === 'Accepted' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {oppSubmission.status}
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-auto bg-[#1e1e1e] relative">
                  {oppSubmission ? (
                    <Editor
                      height="100%"
                      defaultLanguage={oppSubmission.language === 'python' ? 'python' : 'javascript'}
                      value={oppSubmission.code}
                      theme="vs-dark"
                      options={{ readOnly: true, minimap: { enabled: false } }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm font-medium">
                      No submissions made during this match.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
