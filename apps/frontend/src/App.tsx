import { useState } from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-4">🚀 DevDuel</h1>
      <p className="text-xl text-gray-400">Real-time 1v1 Competitive Programming</p>
      <div className="mt-8 p-6 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
        <p className="text-green-400 font-mono">Status: Environment Ready</p>
      </div>
    </div>
  )
}

export default App
