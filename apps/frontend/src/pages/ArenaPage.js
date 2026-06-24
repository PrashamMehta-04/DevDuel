import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import CodeEditor from '../components/CodeEditor';
import MatchPanel from '../components/MatchPanel';
import { socket } from '../socket';
import { useArenaStore } from '../store/useArenaStore';
import { SOCKET_EVENTS } from '@devduel/shared';
import { Swords, Activity, Trophy, XCircle, ArrowRight, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
const ArenaPage = () => {
    const navigate = useNavigate();
    const [timeLeft, setTimeLeft] = useState('30:00');
    const { isConnected, setIsConnected, setIsOpponentTyping, setOpponentProgress, matchId, gameMode, matchOverResult, setMatchOverResult, userId, matchEndTime } = useArenaStore();
    useEffect(() => {
        if (gameMode !== 'battle' || !matchEndTime)
            return;
        const updateTimer = () => {
            const now = Date.now();
            const diff = Math.max(0, matchEndTime - now);
            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            if (diff === 0) {
                clearInterval(interval);
            }
        };
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [gameMode, matchEndTime]);
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
        function onOpponentProgress(payload) {
            if (payload.userId !== useArenaStore.getState().userId) {
                setOpponentProgress(payload.progress);
            }
        }
        function onTestResult(payload) {
            if (payload.userId === useArenaStore.getState().userId) {
                useArenaStore.getState().setTestResult(payload);
            }
        }
        function onMatchOver(payload) {
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
    return (_jsxs("div", { className: "h-screen w-screen relative overflow-hidden bg-[#0B0F19]", children: [_jsxs("div", { className: "absolute inset-0 z-0", children: [_jsx("div", { className: "absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] animate-float-slow" }), _jsx("div", { className: "absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/20 blur-[150px] animate-float-fast" }), _jsx("div", { className: "absolute top-[40%] left-[50%] w-[30%] h-[30%] rounded-full bg-purple-600/10 blur-[100px] animate-float-slow", style: { animationDelay: '-3s' } })] }), _jsxs("div", { className: "relative z-10 flex flex-col h-full", children: [_jsxs("header", { className: "h-16 glass-panel border-b-0 border-white/5 flex items-center justify-between px-8 flex-shrink-0 mb-4 mx-4 mt-4 rounded-2xl", children: [_jsxs(Link, { to: "/", className: "flex items-center gap-3 hover:opacity-80 transition-opacity", children: [_jsx("div", { className: "p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg border border-white/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]", children: _jsx(Swords, { size: 20, className: "text-blue-400" }) }), _jsxs("h1", { className: "text-2xl font-black tracking-tight text-white", children: ["DEV", _jsx("span", { className: "text-gradient", children: "DUEL" })] })] }), _jsx("div", { className: "flex items-center gap-4", children: gameMode === 'battle' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center gap-2 px-4 py-1.5 glass-panel rounded-full border border-white/10 shadow-inner bg-black/20", children: [_jsx(Clock, { size: 14, className: "text-blue-400" }), _jsx("span", { className: "text-sm font-bold tracking-wider text-white font-mono", children: timeLeft })] }), _jsxs("div", { className: "flex items-center gap-2 px-4 py-1.5 glass-panel rounded-full border border-white/10 shadow-inner", children: [_jsx(Activity, { size: 14, className: isConnected ? 'text-green-400 animate-pulse' : 'text-red-400' }), _jsx("span", { className: "text-xs font-semibold tracking-wider text-gray-300 uppercase", children: isConnected ? 'Live Match' : 'Reconnecting...' })] })] })) })] }), _jsxs("main", { className: "flex-1 flex overflow-hidden px-4 pb-4 gap-4", children: [_jsx("div", { className: "flex-1 min-w-[400px]", children: _jsx(MatchPanel, {}) }), _jsx("div", { className: "flex-[2.5] relative glass-panel rounded-2xl p-1 flex flex-col", children: _jsx(CodeEditor, {}) })] })] }), matchOverResult && (_jsx("div", { className: "absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm", children: _jsxs("div", { className: "glass-panel p-8 rounded-3xl max-w-md w-full flex flex-col items-center text-center animate-in fade-in zoom-in duration-300", children: [matchOverResult.winnerId === userId ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(234,179,8,0.4)]", children: _jsx(Trophy, { size: 40, className: "text-yellow-400" }) }), _jsx("h2", { className: "text-4xl font-black text-white tracking-tight mb-2", children: "VICTORY!" }), _jsx("p", { className: "text-gray-300 mb-6 font-medium", children: matchOverResult.reason }), _jsxs("div", { className: "bg-black/40 rounded-xl p-4 w-full flex justify-between items-center mb-8 border border-white/5", children: [_jsx("span", { className: "text-gray-400 font-bold", children: "Elo Rating" }), _jsxs("span", { className: "text-2xl font-black text-green-400", children: ["+", matchOverResult.winnerEloChange] })] })] })) : matchOverResult.winnerId === null ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-20 h-20 bg-gray-500/20 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(156,163,175,0.4)]", children: _jsx(Swords, { size: 40, className: "text-gray-400" }) }), _jsx("h2", { className: "text-4xl font-black text-white tracking-tight mb-2", children: "DRAW" }), _jsx("p", { className: "text-gray-300 mb-6 font-medium", children: matchOverResult.reason }), _jsxs("div", { className: "bg-black/40 rounded-xl p-4 w-full flex justify-between items-center mb-8 border border-white/5", children: [_jsx("span", { className: "text-gray-400 font-bold", children: "Elo Rating" }), _jsx("span", { className: "text-2xl font-black text-gray-400", children: "No Change" })] })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(239,68,68,0.4)]", children: _jsx(XCircle, { size: 40, className: "text-red-400" }) }), _jsx("h2", { className: "text-4xl font-black text-white tracking-tight mb-2", children: "DEFEAT" }), _jsx("p", { className: "text-gray-300 mb-6 font-medium", children: matchOverResult.reason }), _jsxs("div", { className: "bg-black/40 rounded-xl p-4 w-full flex justify-between items-center mb-8 border border-white/5", children: [_jsx("span", { className: "text-gray-400 font-bold", children: "Elo Rating" }), _jsx("span", { className: "text-2xl font-black text-red-400", children: matchOverResult.loserEloChange })] })] })), _jsxs("button", { onClick: () => {
                                const store = useArenaStore.getState();
                                if (matchOverResult.winnerId === store.userId) {
                                    store.setElo(store.elo + matchOverResult.winnerEloChange);
                                    store.setMatchesWon(store.matchesWon + 1);
                                }
                                else if (matchOverResult.loserId === store.userId) {
                                    store.setElo(store.elo + matchOverResult.loserEloChange);
                                }
                                if (matchOverResult.winnerId || matchOverResult.loserId) {
                                    store.setMatchesPlayed(store.matchesPlayed + 1);
                                }
                                setMatchOverResult(null);
                                navigate('/dashboard');
                            }, className: "w-full bg-white hover:bg-gray-100 text-black px-4 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2", children: ["Return to Dashboard ", _jsx(ArrowRight, { size: 18 })] })] }) }))] }));
};
export default ArenaPage;
//# sourceMappingURL=ArenaPage.js.map