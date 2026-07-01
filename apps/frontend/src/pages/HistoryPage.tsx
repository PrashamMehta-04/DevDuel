import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, History, ArrowLeft, Trophy, XCircle } from 'lucide-react';
import { useArenaStore } from '../store/useArenaStore';
import { ReplayModal } from '../components/ReplayModal';

interface MatchRecord {
  id: string;
  problemId: string;
  winnerId: string | null;
  createdAt: string;
  players: { id: string; username: string }[];
}

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<{ id: string, opponentName: string } | null>(null);
  const currentUserId = useArenaStore((state) => state.userId);

  useEffect(() => {
    if (!currentUserId) return;
    
    fetch(`/api/users/${currentUserId}/matches`)
      .then(res => res.json())
      .then(data => {
        setMatches(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch history:', err);
        setLoading(false);
      });
  }, [currentUserId]);

  return (
    <div className="min-h-screen w-full relative flex flex-col bg-[#0B0F19] text-white p-8">
      {/* Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[150px] animate-float-slow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[150px] animate-float-fast"></div>
      </div>

      <header className="relative z-10 flex items-center justify-between mb-12 max-w-4xl mx-auto w-full">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors glass-panel px-4 py-2 rounded-xl">
          <ArrowLeft size={18} /> Back
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg border border-white/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <History size={24} className="text-blue-400" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">Match <span className="text-gradient">History</span></h1>
        </div>
        <div className="w-24"></div> {/* Spacer to center title */}
      </header>

      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto">
        <div className="glass-panel rounded-3xl p-8 border border-white/10">
          {loading ? (
            <div className="text-center py-20 text-gray-400 font-bold animate-pulse">Loading Match History...</div>
          ) : matches.length === 0 ? (
            <div className="text-center py-20 text-gray-400 font-bold">No matches played yet. Enter the Arena to get started!</div>
          ) : (
            <div className="space-y-4">
              {matches.map((match) => {
                const opponent = match.players.find(p => p.id !== currentUserId);
                const isWinner = match.winnerId === currentUserId;
                const isDraw = match.winnerId === null;
                const date = new Date(match.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                
                return (
                  <div 
                    key={match.id} 
                    onClick={() => setSelectedMatch({ id: match.id, opponentName: opponent?.username || 'AI Bot' })}
                    className="glass-panel px-6 py-5 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-white/10 transition-all cursor-pointer group hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center border shadow-lg ${
                        isWinner ? 'bg-green-500/20 border-green-500/30 text-green-400 shadow-green-500/20' : 
                        isDraw ? 'bg-gray-500/20 border-gray-500/30 text-gray-400' : 
                        'bg-red-500/20 border-red-500/30 text-red-400 shadow-red-500/20'
                      }`}>
                        {isWinner ? <Trophy size={24} /> : isDraw ? <Swords size={24} /> : <XCircle size={24} />}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-bold uppercase tracking-widest ${
                            isWinner ? 'text-green-400' : isDraw ? 'text-gray-400' : 'text-red-400'
                          }`}>
                            {isWinner ? 'Victory' : isDraw ? 'Draw' : 'Defeat'}
                          </span>
                          <span className="text-gray-500 text-xs">•</span>
                          <span className="text-gray-400 text-sm font-medium">{date}</span>
                        </div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          vs {opponent?.username || 'AI Bot'}
                        </h3>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Elo Change</span>
                      <span className={`text-xl font-black ${
                        isWinner ? 'text-green-400' : isDraw ? 'text-gray-400' : 'text-red-400'
                      }`}>
                        {isWinner ? '+25' : isDraw ? '0' : '-25'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {selectedMatch && (
        <ReplayModal 
          matchId={selectedMatch.id} 
          opponentUsername={selectedMatch.opponentName} 
          onClose={() => setSelectedMatch(null)} 
        />
      )}
    </div>
  );
};

export default HistoryPage;
