import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useArenaStore } from '../store/useArenaStore';
import { socket } from '../socket';
import { SOCKET_EVENTS } from '@devduel/shared';
import { Terminal, XCircle, CheckCircle, Loader2 } from 'lucide-react';

const CodeEditor: React.FC = () => {
  const { code, language, setCode, setLanguage, supportedLanguages, matchId, userId, testResult, isExecuting } = useArenaStore();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);

    if (timerRef.current) clearTimeout(timerRef.current);
    
    timerRef.current = setTimeout(() => {
      socket.emit(SOCKET_EVENTS.CODE_UPDATE, {
        matchId,
        userId,
        codeLength: newCode.length,
      });
    }, 500);
  };

  return (
    <div className="h-full w-full rounded-xl overflow-hidden relative z-0 flex flex-col" style={{ background: '#1e1e1e' }}>
      <div className="h-12 bg-[#181818] border-b border-white/5 flex items-center px-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Language:</span>
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-[#2d2d2d] text-gray-200 text-sm font-semibold rounded-lg px-3 py-1.5 border border-white/10 focus:outline-none focus:border-blue-500/50 hover:border-white/20 cursor-pointer transition-colors shadow-inner"
          >
            {supportedLanguages.map(lang => (
              <option key={lang.id} value={lang.id}>{lang.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex-1 min-h-[50%] relative">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={handleChange}
          options={{
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
          }}
        />
      </div>

      {(isExecuting || testResult) && (
        <div className="h-64 bg-[#0f111a] border-t border-white/10 flex flex-col shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-10">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/40">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
              <Terminal size={14} /> Execution Console
            </h3>
            {testResult && (
              <div className={`px-3 py-1 rounded text-xs font-bold ${testResult.success ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                {testResult.success ? 'Accepted' : 'Failed'}
              </div>
            )}
            {isExecuting && (
              <div className="px-3 py-1 rounded text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-2">
                <Loader2 size={12} className="animate-spin" /> Running
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {isExecuting ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
                <Loader2 size={32} className="animate-spin text-blue-500" />
                <p className="font-mono text-sm animate-pulse">Compiling & Executing code...</p>
              </div>
            ) : testResult?.results?.map((res: any, idx: number) => (
              <div key={idx} className={`glass-panel p-4 rounded-xl border ${res.passed ? 'border-white/5 bg-white/[0.02]' : 'border-red-500/10 bg-red-950/10'}`}>
                <div className="flex items-center gap-2 mb-3">
                  {res.passed ? <CheckCircle size={16} className="text-green-400" /> : <XCircle size={16} className="text-red-400" />}
                  <span className="text-sm font-semibold text-gray-200">Test Case {idx + 1}</span>
                </div>
                
                {res.error && (
                  <div className="mb-3 text-xs font-mono text-red-400 bg-red-950/30 p-3 rounded-lg border border-red-500/20 whitespace-pre-wrap">
                    <span className="text-red-500 font-bold mb-1 block">Error:</span>
                    {res.error}
                  </div>
                )}
                
                {res.isHidden ? (
                  <div className="flex items-center justify-center p-6 bg-black/30 rounded-lg border border-white/5">
                    <span className="text-gray-500 font-mono text-xs italic flex items-center gap-2">
                      🔒 Hidden Test Case
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {res.input && (
                      <div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Input</span>
                        <div className="font-mono text-xs text-gray-300 bg-black/50 p-2.5 rounded-lg border border-white/5 overflow-x-auto whitespace-pre">{res.input}</div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {res.expected && (
                        <div>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Expected Output</span>
                          <div className="font-mono text-xs text-green-400 bg-black/50 p-2.5 rounded-lg border border-white/5 overflow-x-auto whitespace-pre">{res.expected}</div>
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Actual Output</span>
                        <div className={`font-mono text-xs bg-black/50 p-2.5 rounded-lg border border-white/5 overflow-x-auto whitespace-pre ${res.passed ? 'text-gray-300' : 'text-red-300'}`}>
                          {res.output || 'No output'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
