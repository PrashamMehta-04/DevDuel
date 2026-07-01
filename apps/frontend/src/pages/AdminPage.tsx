import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Swords, Plus, Trash2, ArrowRight } from 'lucide-react';

interface TestCase {
  id: number;
  inputs: string[];
  expected: string;
  isHidden: boolean;
}

const AdminPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [constraints, setConstraints] = useState('');
  const [difficulty, setDifficulty] = useState('EASY');
  const [testCases, setTestCases] = useState<TestCase[]>([
    { id: 1, inputs: [''], expected: '', isHidden: false }
  ]);
  const location = useLocation();
  const initialTab = location.state?.tab === 'list' ? 'list' : 'create';
  const [activeTab, setActiveTab] = useState<'create' | 'list'>(initialTab);
  const [problemsList, setProblemsList] = useState<any[]>([]);
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
  const [status, setStatus] = useState({ message: '', isError: false });

  React.useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab === 'list' ? 'list' : 'create');
      if (location.state.tab === 'create') resetForm();
    }
  }, [location.state]);

  React.useEffect(() => {
    if (activeTab === 'list') {
      fetch('/api/problems')
        .then(res => res.json())
        .then(data => setProblemsList(data))
        .catch(err => console.error(err));
    }
  }, [activeTab]);

  const resetForm = () => {
    setEditingProblemId(null);
    setTitle('');
    setDescription('');
    setConstraints('');
    setDifficulty('EASY');
    setTestCases([{ id: Date.now(), inputs: [''], expected: '', isHidden: false }]);
    setStatus({ message: '', isError: false });
  };

  const handleEdit = (problem: any) => {
    setEditingProblemId(problem.id);
    setTitle(problem.title);
    setDescription(problem.description);
    setConstraints(problem.constraints || '');
    setDifficulty(problem.difficulty || 'EASY');
    if (problem.testCases && Array.isArray(problem.testCases)) {
      setTestCases(problem.testCases.map((tc: any, idx: number) => {
        let inputs = [''];
        try {
          const parsed = JSON.parse(tc.input);
          if (Array.isArray(parsed)) {
            inputs = parsed.map(p => JSON.stringify(p));
          } else {
            inputs = [JSON.stringify(parsed)];
          }
        } catch(e) {}
        return {
          id: idx + 1,
          inputs,
          expected: tc.expected,
          isHidden: tc.isHidden
        };
      }));
    } else {
      setTestCases([{ id: Date.now(), inputs: [''], expected: '', isHidden: false }]);
    }
    setActiveTab('create');
  };

  const addTestCase = () => {
    setTestCases([
      ...testCases, 
      { id: Date.now(), inputs: [''], expected: '', isHidden: false }
    ]);
  };

  const removeTestCase = (id: number) => {
    setTestCases(testCases.filter(t => t.id !== id));
  };

  const updateTestCase = (id: number, field: keyof TestCase, value: any) => {
    setTestCases(testCases.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const addParam = (id: number) => {
    setTestCases(testCases.map(t => t.id === id ? { ...t, inputs: [...t.inputs, ''] } : t));
  };

  const removeParam = (id: number, index: number) => {
    setTestCases(testCases.map(t => t.id === id ? { ...t, inputs: t.inputs.filter((_, i) => i !== index) } : t));
  };

  const updateParam = (id: number, index: number, value: string) => {
    setTestCases(testCases.map(t => t.id === id ? { 
      ...t, 
      inputs: t.inputs.map((inp, i) => i === index ? value : inp) 
    } : t));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ message: 'Submitting...', isError: false });
    
    try {
      const token = localStorage.getItem('token');
      const method = editingProblemId ? 'PUT' : 'POST';
      const endpoint = editingProblemId ? `/api/problems/${editingProblemId}` : '/api/problems';
      
      const res = await fetch(endpoint, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          constraints,
          difficulty,
          testCases: testCases.map((t, idx) => ({ 
            id: idx + 1,
            input: '[' + t.inputs.join(',') + ']',
            expected: t.expected,
            isHidden: t.isHidden
          }))
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save problem');
      
      setStatus({ message: editingProblemId ? 'Problem updated successfully!' : 'Problem created successfully!', isError: false });
      if (!editingProblemId) {
        resetForm();
        setStatus({ message: 'Problem created successfully!', isError: false });
      } else {
        setActiveTab('list');
      }
    } catch (err: any) {
      setStatus({ message: err.message, isError: true });
    }
  };

  const handleDelete = async (problemId: string) => {
    if (!window.confirm('Are you sure you want to delete this problem?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/problems/${problemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete problem');
      setProblemsList(problemsList.filter(p => p.id !== problemId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete problem');
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
        
        <div className="flex gap-4 mb-8">
          <button 
            type="button"
            onClick={() => { setActiveTab('create'); if (!editingProblemId) resetForm(); }}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'create' ? 'bg-white text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
          >
            {editingProblemId ? 'Edit Problem' : 'Create Problem'}
          </button>
          <button 
            type="button"
            onClick={() => { setActiveTab('list'); setEditingProblemId(null); resetForm(); }}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'list' ? 'bg-white text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
          >
            Manage Problems
          </button>
        </div>

        {activeTab === 'list' ? (
          <div>
            <h2 className="text-3xl font-black mb-6">Manage Problems</h2>
            <div className="space-y-4">
              {problemsList.map(p => (
                <div key={p.id} className="p-4 bg-black/40 border border-white/10 rounded-xl flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div>
                    <h3 className="font-bold text-lg text-white">{p.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">Difficulty: <span className="text-white font-medium">{p.difficulty}</span> | Test Cases: <span className="text-white font-medium">{p.testCases ? p.testCases.length : 0}</span></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEdit(p)}
                      className="px-5 py-2.5 bg-blue-600/20 text-blue-400 rounded-xl font-bold hover:bg-blue-600/40 transition-colors border border-blue-500/20"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(p.id)}
                      className="px-5 py-2.5 bg-red-600/20 text-red-400 rounded-xl font-bold hover:bg-red-600/40 transition-colors border border-red-500/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {problemsList.length === 0 && (
                <div className="text-center p-8 text-gray-400 font-medium bg-black/20 rounded-xl border border-white/5">
                  No problems found.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-3xl font-black mb-6">{editingProblemId ? 'Edit Problem' : 'Add New Problem'}</h2>
            
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

          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2">Constraints</label>
            <textarea 
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 font-mono text-sm"
              rows={3}
              value={constraints} 
              onChange={e => setConstraints(e.target.value)}
              placeholder="e.g. - 1 <= nums.length <= 10^5"
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
                  
                  <div className="flex flex-col gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-gray-500">Input Parameters (JSON)</label>
                        <button type="button" onClick={() => addParam(tc.id)} className="text-xs text-blue-400 font-bold hover:text-blue-300 transition-colors">+ Add Parameter</button>
                      </div>
                      <div className="space-y-2">
                        {tc.inputs.map((inp, pIdx) => (
                          <div key={pIdx} className="flex gap-2">
                            <input 
                              required 
                              type="text" 
                              value={inp} 
                              onChange={e => updateParam(tc.id, pIdx, e.target.value)}
                              className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500" 
                              placeholder={`Param ${pIdx + 1} (e.g. [2,7,11,15] or 9)`}
                            />
                            {tc.inputs.length > 1 && (
                              <button type="button" onClick={() => removeParam(tc.id, pIdx)} className="text-gray-500 hover:text-red-400 px-2 transition-colors">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Expected Output (JSON String)</label>
                      <input 
                        required 
                        type="text" 
                        value={tc.expected} 
                        onChange={e => updateTestCase(tc.id, 'expected', e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500" 
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
            {editingProblemId ? 'Save Changes' : 'Submit Problem'} <ArrowRight size={20} />
          </button>
        </form>
        </div>
        )}
      </main>
    </div>
  );
};

export default AdminPage;
