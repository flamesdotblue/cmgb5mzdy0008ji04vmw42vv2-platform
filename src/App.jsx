import { useState, useCallback } from 'react'
import Header from './components/Header'
import HUD from './components/HUD'
import ControlsHelp from './components/ControlsHelp'
import GameCanvas from './components/GameCanvas'
import RestartButton from './components/RestartButton'

export default function App() {
  const [score, setScore] = useState(0)
  const [games, setGames] = useState(0)
  const [status, setStatus] = useState('Ready')

  const handleScore = useCallback(() => {
    setScore((s) => s + 1)
    setStatus('Nice! You made it across!')
    setTimeout(() => setStatus('Cross again for more points'), 1200)
  }, [])

  const handleGameOver = useCallback(() => {
    setStatus('Bonk! Watch the cars!')
    setTimeout(() => setStatus('Try again'), 1200)
  }, [])

  const handleRestart = () => {
    setScore(0)
    setGames((g) => g + 1) // signal to reset the game scene
    setStatus('Ready')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-4">
        <Header />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          <div className="lg:col-span-3 rounded-xl overflow-hidden border border-slate-700 bg-slate-900/40">
            <GameCanvas onScore={handleScore} onGameOver={handleGameOver} resetSignal={games} />
          </div>
          <div className="space-y-4">
            <HUD score={score} status={status} />
            <ControlsHelp />
            <RestartButton onClick={handleRestart} />
          </div>
        </div>
        <p className="text-center text-xs text-slate-400">
          Arrow keys to move. Cross all lanes without touching cars.
        </p>
      </div>
    </div>
  )
}
