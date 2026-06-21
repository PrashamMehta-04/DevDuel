import React, { useEffect } from 'react';
import CodeEditor from '../components/CodeEditor';
import MatchPanel from '../components/MatchPanel';
import { socket } from '../socket';
import { useArenaStore } from '../store/useArenaStore';
import { SOCKET_EVENTS } from '@devduel/shared';
import { Swords, Activity, Trophy, XCircle, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const ArenaPage: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, setIsConnected, setIsOpponentTyping, setOpponentProgress, matchId, gameMode, matchOverResult, setMatchOverResult, userId } = useArenaStore();

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      socket.emit(SOCKET_EVENTS.JOIN_MATCH, matchId);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onOpponentTyping() {
      setIsOpponentTyping(true);
      setTimeout(() => setIsOpponentTyping(false), 2000);
    }

    function onOpponentProgress(payload: { userId: string, progress: number }) {
      if (payload.userId !== useArenaStore.getState().userId) {
        setOpponentProgress(payload.progress);
      }
    }

    function onTestResult(payload: any) {
      if (payload.userId === useArenaStore.getState().userId) {
        useArenaStore.getState().setTestResult(payload);
      }
    }

    function onMatchOver(payload: any) {
      useArenaStore.getState().setMatchOverResult(payload);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on(SOCKET_EVENTS.OPPONENT_TYPING, onOpponentTyping);
    socket.on(SOCKET_EVENTS.OPPONENT_PROGRESS, onOpponentProgress);
    socket.on(SOCKET_EVENTS.TEST_RESULT, onTestResult);
    socket.on(SOCKET_EVENTS.MATCH_OVER, onMatchOver);

    // CRITICAL FIX: If socket is already connected when this component mounts, we must trigger onConnect manually
    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off(SOCKET_EVENTS.OPPONENT_TYPING, onOpponentTyping);
      socket.off(SOCKET_EVENTS.OPPONENT_PROGRESS, onOpponentProgress);
      socket.off(SOCKET_EVENTS.TEST_RESULT, onTestResult);
      socket.off(SOCKET_EVENTS.MATCH_OVER, onMatchOver);
    };
  }, [matchId, setIsConnected, setIsOpponentTyping, setOpponentProgress]);

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-[#0B0F19]">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] animate-float-slow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/20 blur-[150px] animate-float-fast"></div>
        <div className="absolute top-[40%] left-[50%] w-[30%] h-[30%] rounded-full bg-purple-600/10 blur-[100px] animate-float-slow" style={{ animationDelay: '-3s' }}></div>
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <header className="h-16 glass-panel border-b-0 border-white/5 flex items-center justify-between px-8 flex-shrink-0 mb-4 mx-4 mt-4 rounded-2xl">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg border border-white/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <Swords size={20} className="text-blue-400" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">DEV<span className="text-gradient">DUEL</span></h1>
          </Link>
          <div className="flex items-center gap-4">
            {gameMode === 'battle' && (
              <div className="flex items-center gap-2 px-4 py-1.5 glass-panel rounded-full border border-white/10 shadow-inner">
                <Activity size={14} className={isConnected ? 'text-green-400 animate-pulse' : 'text-red-400'} />
                <span className="text-xs font-semibold tracking-wider text-gray-300 uppercase">
                  {isConnected ? 'Live Match' : 'Reconnecting...'}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Main Layout */}
        <main className="flex-1 flex overflow-hidden px-4 pb-4 gap-4">
          <div className="flex-1 min-w-[400px]">
            <MatchPanel />
          </div>
          <div className="flex-[2.5] relative glass-panel rounded-2xl p-1 flex flex-col">
            <CodeEditor />
          </div>
        </main>
      </div>

      {/* Match Over Modal */}
      {matchOverResult && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-panel p-8 rounded-3xl max-w-md w-full flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
            {matchOverResult.winnerId === userId ? (
              <>
                <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(234,179,8,0.4)]">
                  <Trophy size={40} className="text-yellow-400" />
                </div>
                <h2 className="text-4xl font-black text-white tracking-tight mb-2">VICTORY!</h2>
                <p className="text-gray-300 mb-6 font-medium">{matchOverResult.reason}</p>
                <div className="bg-black/40 rounded-xl p-4 w-full flex justify-between items-center mb-8 border border-white/5">
                  <span className="text-gray-400 font-bold">Elo Rating</span>
                  <span className="text-2xl font-black text-green-400">+{matchOverResult.winnerEloChange}</span>
                </div>
              </>
            ) : matchOverResult.winnerId === null ? (
              <>
                <div className="w-20 h-20 bg-gray-500/20 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(156,163,175,0.4)]">
                  <Swords size={40} className="text-gray-400" />
                </div>
                <h2 className="text-4xl font-black text-white tracking-tight mb-2">DRAW</h2>
                <p className="text-gray-300 mb-6 font-medium">{matchOverResult.reason}</p>
                <div className="bg-black/40 rounded-xl p-4 w-full flex justify-between items-center mb-8 border border-white/5">
                  <span className="text-gray-400 font-bold">Elo Rating</span>
                  <span className="text-2xl font-black text-gray-400">No Change</span>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                  <XCircle size={40} className="text-red-400" />
                </div>
                <h2 className="text-4xl font-black text-white tracking-tight mb-2">DEFEAT</h2>
                <p className="text-gray-300 mb-6 font-medium">{matchOverResult.reason}</p>
                <div className="bg-black/40 rounded-xl p-4 w-full flex justify-between items-center mb-8 border border-white/5">
                  <span className="text-gray-400 font-bold">Elo Rating</span>
                  <span className="text-2xl font-black text-red-400">{matchOverResult.loserEloChange}</span>
                </div>
              </>
            )}

            <button
              onClick={() => {
                setMatchOverResult(null);
                navigate('/dashboard');
              }}
              className="w-full bg-white hover:bg-gray-100 text-black px-4 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
            >
              Return to Dashboard <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArenaPage;
