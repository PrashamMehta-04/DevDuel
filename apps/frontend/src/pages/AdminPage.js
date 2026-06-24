import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Swords, Plus, Trash2, ArrowRight } from 'lucide-react';
const AdminPage = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState('EASY');
    const [testCases, setTestCases] = useState([
        { id: 1, input: '', expected: '', isHidden: false }
    ]);
    const [status, setStatus] = useState({ message: '', isError: false });
    const addTestCase = () => {
        setTestCases([
            ...testCases,
            { id: Date.now(), input: '', expected: '', isHidden: false }
        ]);
    };
    const removeTestCase = (id) => {
        setTestCases(testCases.filter(t => t.id !== id));
    };
    const updateTestCase = (id, field, value) => {
        setTestCases(testCases.map(t => t.id === id ? { ...t, [field]: value } : t));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ message: 'Submitting...', isError: false });
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3001/api/problems', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title,
                    description,
                    difficulty,
                    testCases: testCases.map((t, idx) => ({ ...t, id: idx + 1 }))
                }),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.error || 'Failed to create problem');
            setStatus({ message: 'Problem created successfully!', isError: false });
            setTitle('');
            setDescription('');
            setTestCases([{ id: Date.now(), input: '', expected: '', isHidden: false }]);
        }
        catch (err) {
            setStatus({ message: err.message, isError: true });
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-[#0B0F19] text-white p-8", children: [_jsx("header", { className: "flex items-center justify-between mb-8", children: _jsxs(Link, { to: "/dashboard", className: "flex items-center gap-3 hover:opacity-80 transition-opacity", children: [_jsx("div", { className: "p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg border border-white/10", children: _jsx(Swords, { size: 20, className: "text-blue-400" }) }), _jsxs("h1", { className: "text-2xl font-black tracking-tight", children: ["DEV", _jsx("span", { className: "text-gradient", children: "DUEL" }), " Admin"] })] }) }), _jsxs("main", { className: "max-w-4xl mx-auto glass-panel p-8 rounded-3xl border border-white/10", children: [_jsx("h2", { className: "text-3xl font-black mb-6", children: "Add New Problem" }), status.message && (_jsx("div", { className: `mb-6 p-4 rounded-xl font-bold ${status.isError ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`, children: status.message })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-bold text-gray-400 mb-2", children: "Title" }), _jsx("input", { required: true, type: "text", value: title, onChange: e => setTitle(e.target.value), className: "w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500", placeholder: "e.g. Two Sum" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-bold text-gray-400 mb-2", children: "Difficulty" }), _jsxs("select", { value: difficulty, onChange: e => setDifficulty(e.target.value), className: "w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500", children: [_jsx("option", { value: "EASY", children: "EASY" }), _jsx("option", { value: "MEDIUM", children: "MEDIUM" }), _jsx("option", { value: "HARD", children: "HARD" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-bold text-gray-400 mb-2", children: "Description" }), _jsx("textarea", { required: true, rows: 4, value: description, onChange: e => setDescription(e.target.value), className: "w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500", placeholder: "Problem description and function signature instructions..." })] }), _jsxs("div", { className: "mt-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-xl font-bold", children: "Test Cases" }), _jsxs("button", { type: "button", onClick: addTestCase, className: "flex items-center gap-2 bg-blue-600/20 text-blue-400 px-4 py-2 rounded-lg font-bold hover:bg-blue-600/30 transition-colors", children: [_jsx(Plus, { size: 16 }), " Add Case"] })] }), _jsx("div", { className: "space-y-4", children: testCases.map((tc, index) => (_jsxs("div", { className: "p-4 bg-black/30 rounded-xl border border-white/5 relative", children: [_jsx("button", { type: "button", onClick: () => removeTestCase(tc.id), className: "absolute top-4 right-4 text-gray-500 hover:text-red-400 transition-colors", children: _jsx(Trash2, { size: 18 }) }), _jsxs("h4", { className: "text-sm font-bold text-gray-400 mb-3", children: ["Case ", index + 1] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-bold text-gray-500 mb-1", children: "Input (JSON Array String)" }), _jsx("input", { required: true, type: "text", value: tc.input, onChange: e => updateTestCase(tc.id, 'input', e.target.value), className: "w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono", placeholder: 'e.g. [[2,7,11,15], 9]' })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-bold text-gray-500 mb-1", children: "Expected Output (JSON String)" }), _jsx("input", { required: true, type: "text", value: tc.expected, onChange: e => updateTestCase(tc.id, 'expected', e.target.value), className: "w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono", placeholder: 'e.g. [0,1]' })] })] }), _jsxs("div", { className: "mt-3 flex items-center gap-2", children: [_jsx("input", { type: "checkbox", id: `hidden-${tc.id}`, checked: tc.isHidden, onChange: e => updateTestCase(tc.id, 'isHidden', e.target.checked), className: "w-4 h-4 bg-black/50 border-white/10 rounded" }), _jsx("label", { htmlFor: `hidden-${tc.id}`, className: "text-sm text-gray-400 cursor-pointer", children: "Hidden Test Case (used for submission only)" })] })] }, tc.id))) })] }), _jsxs("button", { type: "submit", className: "w-full bg-white text-black rounded-xl py-4 font-black text-lg transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] flex items-center justify-center gap-2 mt-8", children: ["Submit Problem ", _jsx(ArrowRight, { size: 20 })] })] })] })] }));
};
export default AdminPage;
//# sourceMappingURL=AdminPage.js.map