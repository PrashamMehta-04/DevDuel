import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Swords, History, ArrowLeft, Trophy, XCircle } from 'lucide-react';
import { useArenaStore } from '../store/useArenaStore';
const HistoryPage = () => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentUserId = useArenaStore((state) => state.userId);
    useEffect(() => {
        if (!currentUserId)
            return;
        fetch(`http://localhost:3001/api/users/${currentUserId}/matches`)
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
    return (_jsxs("div", { className: "min-h-screen w-full relative flex flex-col bg-[#0B0F19] text-white p-8", children: [_jsxs("div", { className: "absolute inset-0 z-0 overflow-hidden pointer-events-none", children: [_jsx("div", { className: "absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[150px] animate-float-slow" }), _jsx("div", { className: "absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[150px] animate-float-fast" })] }), _jsxs("header", { className: "relative z-10 flex items-center justify-between mb-12 max-w-4xl mx-auto w-full", children: [_jsxs(Link, { to: "/dashboard", className: "flex items-center gap-2 text-gray-400 hover:text-white transition-colors glass-panel px-4 py-2 rounded-xl", children: [_jsx(ArrowLeft, { size: 18 }), " Back to Dashboard"] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg border border-white/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]", children: _jsx(History, { size: 24, className: "text-blue-400" }) }), _jsxs("h1", { className: "text-3xl font-black tracking-tight text-white", children: ["Match ", _jsx("span", { className: "text-gradient", children: "History" })] })] }), _jsx("div", { className: "w-24" }), " "] }), _jsx("main", { className: "relative z-10 flex-1 max-w-4xl w-full mx-auto", children: _jsx("div", { className: "glass-panel rounded-3xl p-8 border border-white/10", children: loading ? (_jsx("div", { className: "text-center py-20 text-gray-400 font-bold animate-pulse", children: "Loading Match History..." })) : matches.length === 0 ? (_jsx("div", { className: "text-center py-20 text-gray-400 font-bold", children: "No matches played yet. Enter the Arena to get started!" })) : (_jsx("div", { className: "space-y-4", children: matches.map((match) => {
                            const opponent = match.players.find(p => p.id !== currentUserId);
                            const isWinner = match.winnerId === currentUserId;
                            const isDraw = match.winnerId === null;
                            const date = new Date(match.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                            return (_jsxs("div", { className: "glass-panel px-6 py-5 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-white/[0.04] transition-colors", children: [_jsxs("div", { className: "flex items-center gap-6", children: [_jsx("div", { className: `w-14 h-14 rounded-full flex items-center justify-center border shadow-lg ${isWinner ? 'bg-green-500/20 border-green-500/30 text-green-400 shadow-green-500/20' :
                                                    isDraw ? 'bg-gray-500/20 border-gray-500/30 text-gray-400' :
                                                        'bg-red-500/20 border-red-500/30 text-red-400 shadow-red-500/20'}`, children: isWinner ? _jsx(Trophy, { size: 24 }) : isDraw ? _jsx(Swords, { size: 24 }) : _jsx(XCircle, { size: 24 }) }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: `text-sm font-bold uppercase tracking-widest ${isWinner ? 'text-green-400' : isDraw ? 'text-gray-400' : 'text-red-400'}`, children: isWinner ? 'Victory' : isDraw ? 'Draw' : 'Defeat' }), _jsx("span", { className: "text-gray-500 text-xs", children: "\u2022" }), _jsx("span", { className: "text-gray-400 text-sm font-medium", children: date })] }), _jsxs("h3", { className: "text-xl font-bold text-white flex items-center gap-2", children: ["vs ", opponent?.username || 'AI Bot'] })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("span", { className: "text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1", children: "Elo Change" }), _jsx("span", { className: `text-xl font-black ${isWinner ? 'text-green-400' : isDraw ? 'text-gray-400' : 'text-red-400'}`, children: isWinner ? '+25' : isDraw ? '0' : '-25' })] })] }, match.id));
                        }) })) }) })] }));
};
export default HistoryPage;
//# sourceMappingURL=HistoryPage.js.map