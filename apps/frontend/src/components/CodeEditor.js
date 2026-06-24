import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useArenaStore } from '../store/useArenaStore';
import { socket } from '../socket';
import { SOCKET_EVENTS } from '@devduel/shared';
import { Terminal, XCircle, CheckCircle } from 'lucide-react';
const CodeEditor = () => {
    const { code, language, setCode, setLanguage, supportedLanguages, matchId, userId, testResult } = useArenaStore();
    const timerRef = useRef(null);
    const handleChange = (value) => {
        const newCode = value || '';
        setCode(newCode);
        if (timerRef.current)
            clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            socket.emit(SOCKET_EVENTS.CODE_UPDATE, {
                matchId,
                userId,
                codeLength: newCode.length,
            });
        }, 500);
    };
    return (_jsxs("div", { className: "h-full w-full rounded-xl overflow-hidden relative z-0 flex flex-col", style: { background: '#1e1e1e' }, children: [_jsx("div", { className: "h-12 bg-[#181818] border-b border-white/5 flex items-center px-4 shrink-0 shadow-sm z-10", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-xs font-bold text-gray-500 uppercase tracking-widest", children: "Language:" }), _jsx("select", { value: language, onChange: (e) => setLanguage(e.target.value), className: "bg-[#2d2d2d] text-gray-200 text-sm font-semibold rounded-lg px-3 py-1.5 border border-white/10 focus:outline-none focus:border-blue-500/50 hover:border-white/20 cursor-pointer transition-colors shadow-inner", children: supportedLanguages.map(lang => (_jsx("option", { value: lang.id, children: lang.name }, lang.id))) })] }) }), _jsx("div", { className: "flex-1 min-h-[50%] relative", children: _jsx(Editor, { height: "100%", language: language, theme: "vs-dark", value: code, onChange: handleChange, options: {
                        minimap: { enabled: false },
                        fontSize: 15,
                        fontFamily: "'Fira Code', 'Menlo', 'Monaco', 'Courier New', monospace",
                        fontLigatures: true,
                        cursorStyle: 'line',
                        cursorBlinking: 'smooth',
                        smoothScrolling: true,
                        padding: { top: 24, bottom: 24 },
                        lineHeight: 24,
                        scrollBeyondLastLine: false,
                        overviewRulerBorder: false,
                        hideCursorInOverviewRuler: true,
                        scrollbar: {
                            verticalScrollbarSize: 8,
                            horizontalScrollbarSize: 8,
                        },
                        renderLineHighlight: 'all',
                        automaticLayout: true,
                    } }) }), testResult && (_jsxs("div", { className: "h-64 bg-[#0f111a] border-t border-white/10 flex flex-col shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-10", children: [_jsxs("div", { className: "flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/40", children: [_jsxs("h3", { className: "text-sm font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2", children: [_jsx(Terminal, { size: 14 }), " Execution Console"] }), _jsx("div", { className: `px-3 py-1 rounded text-xs font-bold ${testResult.success ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`, children: testResult.success ? 'Accepted' : 'Failed' })] }), _jsx("div", { className: "flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar", children: testResult.results?.map((res, idx) => (_jsxs("div", { className: `glass-panel p-4 rounded-xl border ${res.passed ? 'border-white/5 bg-white/[0.02]' : 'border-red-500/10 bg-red-950/10'}`, children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [res.passed ? _jsx(CheckCircle, { size: 16, className: "text-green-400" }) : _jsx(XCircle, { size: 16, className: "text-red-400" }), _jsxs("span", { className: "text-sm font-semibold text-gray-200", children: ["Test Case ", idx + 1] })] }), res.error && (_jsxs("div", { className: "mb-3 text-xs font-mono text-red-400 bg-red-950/30 p-3 rounded-lg border border-red-500/20", children: [_jsx("span", { className: "text-red-500 font-bold mb-1 block", children: "Error:" }), res.error] })), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [res.expected && (_jsxs("div", { children: [_jsx("span", { className: "text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block", children: "Expected Output" }), _jsx("div", { className: "font-mono text-xs text-green-400 bg-black/50 p-2.5 rounded-lg border border-white/5 overflow-x-auto whitespace-pre", children: res.expected })] })), _jsxs("div", { children: [_jsx("span", { className: "text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block", children: "Actual Output" }), _jsx("div", { className: `font-mono text-xs bg-black/50 p-2.5 rounded-lg border border-white/5 overflow-x-auto whitespace-pre ${res.passed ? 'text-gray-300' : 'text-red-300'}`, children: res.output || 'No output' })] })] })] }, idx))) })] }))] }));
};
export default CodeEditor;
//# sourceMappingURL=CodeEditor.js.map