import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ArrowLeft } from 'lucide-react';
import { useArenaStore } from '../store/useArenaStore';
const LeaderboardPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentUserId = useArenaStore((state) => state.userId);
    useEffect(() => {
        fetch('http://localhost:3001/api/leaderboard')
            .then(res => res.json())
            .then(data => {
            setUsers(data);
            setLoading(false);
        })
            .catch(err => {
            console.error('Failed to fetch leaderboard:', err);
            setLoading(false);
        });
    }, []);
    return (_jsxs("div", { className: "min-h-screen w-full relative flex flex-col bg-[#0B0F19] text-white p-8", children: [_jsxs("div", { className: "absolute inset-0 z-0 overflow-hidden pointer-events-none", children: [_jsx("div", { className: "absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-yellow-600/10 blur-[150px] animate-float-slow" }), _jsx("div", { className: "absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-orange-600/10 blur-[150px] animate-float-fast" })] }), _jsxs("header", { className: "relative z-10 flex items-center justify-between mb-12 max-w-4xl mx-auto w-full", children: [_jsxs(Link, { to: "/dashboard", className: "flex items-center gap-2 text-gray-400 hover:text-white transition-colors glass-panel px-4 py-2 rounded-xl", children: [_jsx(ArrowLeft, { size: 18 }), " Back to Dashboard"] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg border border-white/10 shadow-[0_0_15px_rgba(234,179,8,0.3)]", children: _jsx(Trophy, { size: 24, className: "text-yellow-400" }) }), _jsxs("h1", { className: "text-3xl font-black tracking-tight text-white", children: ["Global ", _jsx("span", { className: "text-gradient", children: "Leaderboard" })] })] }), _jsx("div", { className: "w-24" }), " "] }), _jsx("main", { className: "relative z-10 flex-1 max-w-4xl w-full mx-auto", children: _jsx("div", { className: "glass-panel rounded-3xl p-8 border border-white/10", children: loading ? (_jsx("div", { className: "text-center py-20 text-gray-400 font-bold animate-pulse", children: "Loading Champions..." })) : (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-white/5", children: [_jsx("div", { className: "col-span-2 text-center", children: "Rank" }), _jsx("div", { className: "col-span-6", children: "Developer" }), _jsx("div", { className: "col-span-4 text-right", children: "Elo Rating" })] }), users.map((user, index) => {
                                const isCurrentUser = user.id === currentUserId;
                                return (_jsxs("div", { className: `grid grid-cols-12 gap-4 items-center px-6 py-4 rounded-2xl transition-all ${isCurrentUser
                                        ? 'bg-blue-500/20 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                                        : 'glass-panel hover:bg-white/[0.04] border border-white/5'}`, children: [_jsx("div", { className: "col-span-2 text-center", children: index === 0 ? (_jsx(Trophy, { size: 24, className: "text-yellow-400 mx-auto drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" })) : index === 1 ? (_jsx(Trophy, { size: 24, className: "text-gray-300 mx-auto drop-shadow-[0_0_8px_rgba(209,213,219,0.5)]" })) : index === 2 ? (_jsx(Trophy, { size: 24, className: "text-orange-400 mx-auto drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]" })) : (_jsxs("span", { className: "text-xl font-bold text-gray-500", children: ["#", index + 1] })) }), _jsxs("div", { className: "col-span-6 flex items-center gap-3", children: [_jsx("div", { className: `h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${isCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-300'}`, children: user.username.charAt(0).toUpperCase() }), _jsxs("span", { className: `text-lg font-bold ${isCurrentUser ? 'text-blue-300' : 'text-gray-200'}`, children: [user.username, " ", isCurrentUser && '(You)'] })] }), _jsx("div", { className: "col-span-4 text-right", children: _jsx("span", { className: "text-2xl font-black text-white tracking-tight", children: user.elo }) })] }, user.id));
                            })] })) }) })] }));
};
export default LeaderboardPage;
//# sourceMappingURL=LeaderboardPage.js.map