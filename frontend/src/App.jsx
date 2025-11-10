import { useState } from 'react'
import LandingPage from './components/LandingPage'
import InputForm from './components/InputForm'
import AgentPlayground from './components/AgentPlayground'

function App() {
  const [view, setView] = useState('landing') // 'landing', 'input', or 'playground'
  const [config, setConfig] = useState(null)

  const handleGetStarted = () => {
    setView('input')
  }

  const handleStart = (formData) => {
    setConfig(formData)
    setView('playground')
  }

  const handleReset = () => {
    setView('input')
    setConfig(null)
  }

  const handleBackToHome = () => {
    setView('landing')
    setConfig(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {view === 'landing' ? (
        <LandingPage onGetStarted={handleGetStarted} />
      ) : view === 'input' ? (
        <InputForm onStart={handleStart} onBack={handleBackToHome} />
      ) : (
        <AgentPlayground config={config} onReset={handleReset} />
      )}
    </div>
  )
}

export default App

