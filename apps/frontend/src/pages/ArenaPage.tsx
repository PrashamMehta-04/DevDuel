import React, { useEffect } from 'react';
import CodeEditor from '../components/CodeEditor';
import MatchPanel from '../components/MatchPanel';
import { socket } from '../socket';
import { useArenaStore } from '../store/useArenaStore';
import { SOCKET_EVENTS } from '@devduel/shared';
import { Swords, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

const ArenaPage: React.FC = () => {
  const { isConnected, setIsConnected, setIsOpponentTyping, setOpponentProgress, matchId } = useArenaStore();

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

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on(SOCKET_EVENTS.OPPONENT_TYPING, onOpponentTyping);
    socket.on(SOCKET_EVENTS.OPPONENT_PROGRESS, onOpponentProgress);
    socket.on(SOCKET_EVENTS.TEST_RESULT, onTestResult);

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
            <div className="flex items-center gap-2 px-4 py-1.5 glass-panel rounded-full border border-white/10 shadow-inner">
              <Activity size={14} className={isConnected ? 'text-green-400 animate-pulse' : 'text-red-400'} />
              <span className="text-xs font-semibold tracking-wider text-gray-300 uppercase">
                {isConnected ? 'Live Match' : 'Reconnecting...'}
              </span>
            </div>
          </div>
        </header>

        {/* Main Layout */}
        <main className="flex-1 flex overflow-hidden px-4 pb-4 gap-4">
          <div className="flex-[2.5] relative glass-panel rounded-2xl p-1 flex flex-col">
            <CodeEditor />
          </div>
          <div className="flex-1 min-w-[400px]">
            <MatchPanel />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ArenaPage;
