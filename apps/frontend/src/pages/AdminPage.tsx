import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Swords, Plus, Trash2, ArrowRight } from 'lucide-react';

interface TestCase {
  id: number;
  input: string;
  expected: string;
  isHidden: boolean;
}

const AdminPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('EASY');
  const [testCases, setTestCases] = useState<TestCase[]>([
    { id: 1, input: '', expected: '', isHidden: false }
  ]);
  const [status, setStatus] = useState({ message: '', isError: false });

  const addTestCase = () => {
    setTestCases([
      ...testCases, 
      { id: Date.now(), input: '', expected: '', isHidden: false }
    ]);
  };

  const removeTestCase = (id: number) => {
    setTestCases(testCases.filter(t => t.id !== id));
  };

  const updateTestCase = (id: number, field: keyof TestCase, value: any) => {
    setTestCases(testCases.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      if (!res.ok) throw new Error(data.error || 'Failed to create problem');
      
      setStatus({ message: 'Problem created successfully!', isError: false });
      setTitle('');
      setDescription('');
      setTestCases([{ id: Date.now(), input: '', expected: '', isHidden: false }]);
    } catch (err: any) {
      setStatus({ message: err.message, isError: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-8">
      <header className="flex items-center justify-between mb-8">
        <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg border border-white/10">
            <Swords size={20} className="text-blue-400" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">DEV<span className="text-gradient">DUEL</span> Admin</h1>
        </Link>
      </header>
      
      <main className="max-w-4xl mx-auto glass-panel p-8 rounded-3xl border border-white/10">
        <h2 className="text-3xl font-black mb-6">Add New Problem</h2>
        
        {status.message && (
          <div className={`mb-6 p-4 rounded-xl font-bold ${status.isError ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
            {status.message}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Title</label>
              <input 
                required 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500" 
                placeholder="e.g. Two Sum"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Difficulty</label>
              <select 
                value={difficulty} 
                onChange={e => setDifficulty(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
              >
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2">Description</label>
            <textarea 
              required 
              rows={4}
              value={description} 
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500" 
              placeholder="Problem description and function signature instructions..."
            />
          </div>
          
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Test Cases</h3>
              <button 
                type="button" 
                onClick={addTestCase}
                className="flex items-center gap-2 bg-blue-600/20 text-blue-400 px-4 py-2 rounded-lg font-bold hover:bg-blue-600/30 transition-colors"
              >
                <Plus size={16} /> Add Case
              </button>
            </div>
            
            <div className="space-y-4">
              {testCases.map((tc, index) => (
                <div key={tc.id} className="p-4 bg-black/30 rounded-xl border border-white/5 relative">
                  <button 
                    type="button" 
                    onClick={() => removeTestCase(tc.id)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                  <h4 className="text-sm font-bold text-gray-400 mb-3">Case {index + 1}</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Input (JSON Array String)</label>
                      <input 
                        required 
                        type="text" 
                        value={tc.input} 
                        onChange={e => updateTestCase(tc.id, 'input', e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono" 
                        placeholder='e.g. [[2,7,11,15], 9]'
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Expected Output (JSON String)</label>
                      <input 
                        required 
                        type="text" 
                        value={tc.expected} 
                        onChange={e => updateTestCase(tc.id, 'expected', e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono" 
                        placeholder='e.g. [0,1]'
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id={`hidden-${tc.id}`}
                      checked={tc.isHidden} 
                      onChange={e => updateTestCase(tc.id, 'isHidden', e.target.checked)}
                      className="w-4 h-4 bg-black/50 border-white/10 rounded"
                    />
                    <label htmlFor={`hidden-${tc.id}`} className="text-sm text-gray-400 cursor-pointer">Hidden Test Case (used for submission only)</label>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button 
            type="submit"
            className="w-full bg-white text-black rounded-xl py-4 font-black text-lg transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] flex items-center justify-center gap-2 mt-8"
          >
            Submit Problem <ArrowRight size={20} />
          </button>
        </form>
      </main>
    </div>
  );
};

export default AdminPage;
