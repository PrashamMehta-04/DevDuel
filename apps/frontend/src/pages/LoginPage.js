import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Swords, ArrowRight, Loader2, Key } from 'lucide-react';
import { useArenaStore } from '../store/useArenaStore';
const LoginPage = () => {
    const [username, setUsernameInput] = useState('');
    const [password, setPasswordInput] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { setUserId, setUsername, setElo, setMatchesWon, setMatchesPlayed } = useArenaStore();
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            setError('Both fields are required');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const endpoint = isRegistering ? '/api/register' : '/api/login';
            const res = await fetch(`http://localhost:3001${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.trim(), password: password.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to authenticate');
            }
            localStorage.setItem('token', data.token);
            setUserId(data.id);
            setUsername(data.username);
            setElo(data.elo);
            setMatchesWon(data.matchesWon);
            setMatchesPlayed(data.matchesPlayed);
            navigate('/dashboard');
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen w-full relative flex items-center justify-center bg-[#0B0F19] p-4", children: [_jsxs("div", { className: "absolute inset-0 z-0 overflow-hidden", children: [_jsx("div", { className: "absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[150px] animate-float-slow" }), _jsx("div", { className: "absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/20 blur-[150px] animate-float-fast" })] }), _jsxs(Link, { to: "/", className: "absolute top-8 left-8 z-20 flex items-center gap-3 hover:opacity-80 transition-opacity", children: [_jsx("div", { className: "p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg border border-white/10", children: _jsx(Swords, { size: 20, className: "text-blue-400" }) }), _jsxs("span", { className: "text-xl font-black tracking-tight text-white", children: ["DEV", _jsx("span", { className: "text-gradient", children: "DUEL" })] })] }), _jsx("div", { className: "relative z-10 w-full max-w-md", children: _jsxs("div", { className: "glass-panel p-8 sm:p-10 rounded-[2rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h2", { className: "text-3xl font-black tracking-tight mb-2 text-white", children: isRegistering ? 'Create Account' : 'Welcome Back' }), _jsx("p", { className: "text-gray-400 font-medium", children: isRegistering ? 'Sign up to start dueling' : 'Log in to enter the arena' })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [error && (_jsx("div", { className: "bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm font-medium", children: error })), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-xs font-bold text-gray-400 uppercase tracking-widest pl-1", children: "Username" }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none", children: _jsx(Swords, { size: 18, className: "text-gray-500" }) }), _jsx("input", { type: "text", value: username, onChange: (e) => setUsernameInput(e.target.value), placeholder: "ProCoder123", className: "w-full bg-black/40 border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium", required: true, disabled: isLoading })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-xs font-bold text-gray-400 uppercase tracking-widest pl-1", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none", children: _jsx(Key, { size: 18, className: "text-gray-500" }) }), _jsx("input", { type: "password", value: password, onChange: (e) => setPasswordInput(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", className: "w-full bg-black/40 border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium", required: true, disabled: isLoading })] })] }), _jsx("button", { type: "submit", disabled: isLoading, className: "w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl py-3.5 font-bold transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0", children: isLoading ? _jsx(Loader2, { size: 18, className: "animate-spin" }) : _jsxs(_Fragment, { children: [_jsx(ArrowRight, { size: 18 }), " ", isRegistering ? 'Sign Up' : 'Log In'] }) }), _jsx("div", { className: "text-center mt-4", children: _jsx("button", { type: "button", onClick: () => { setIsRegistering(!isRegistering); setError(''); }, className: "text-sm text-gray-400 hover:text-blue-400 transition-colors font-medium", children: isRegistering ? 'Already have an account? Log in' : "Don't have an account? Sign up" }) })] })] }) })] }));
};
export default LoginPage;
//# sourceMappingURL=LoginPage.js.map