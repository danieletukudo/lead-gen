import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Download, FileJson, FileText, Zap, X, PanelRightOpen, PanelRightClose, MessageCircle, Mail, CheckCircle2, AlertCircle, Loader2, Send, Briefcase } from 'lucide-react'
import ProcessCanvas from './ProcessCanvas'
import ResultsPanel from './ResultsPanel'
import BulkEmailPanel from './BulkEmailPanel'
import FeedbackModal from './FeedbackModal'
import axios from 'axios'
import { API_BASE_URL, API_ENDPOINTS } from '../config/api'

export default function AgentPlayground({ config, onReset }) {
  const [currentStage, setCurrentStage] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showResults, setShowResults] = useState(true)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showBulkEmail, setShowBulkEmail] = useState(false)
  const [autoSendStatus, setAutoSendStatus] = useState(null)
  const [autoSendResult, setAutoSendResult] = useState(null)
  const autoSendTriggered = useRef(false)
  const exportMenuRef = useRef(null)

  const hasEmailCampaign = !!config.emailCampaign

  const stages = [
    { id: 1, name: 'Initializing', description: 'Preparing AI agent' },
    { id: 2, name: 'AI Search', description: 'Finding recruiters' },
    { id: 3, name: 'Web Scraping', description: 'Verifying contact info', skip: !config.enable_web_scraping },
    { id: 4, name: 'Data Consolidation', description: 'Merging results' },
    { id: 5, name: hasEmailCampaign ? 'Sending Emails' : 'Completed', description: hasEmailCampaign ? 'Auto-sending CV to all' : 'Recruiters ready' },
    ...(hasEmailCampaign ? [{ id: 6, name: 'Completed', description: 'All done' }] : [])
  ]
  const activeStages = stages.filter(s => !s.skip)

  const getRecruiters = (data) => data?.data?.recruiters || data?.data?.companies || []

  useEffect(() => { startGeneration() }, [])

  useEffect(() => {
    if (!showExportMenu) return
    const handler = (e) => { if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) setShowExportMenu(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showExportMenu])

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `recruiters_${config.industry.replace(/\s+/g, '_')}_${Date.now()}.json`
    link.click()
    setShowExportMenu(false)
  }

  const exportTXT = () => {
    const recruiters = getRecruiters(results)
    let txt = `RECRUITER OUTREACH RESULTS\n${'='.repeat(80)}\n\nRole/Industry: ${config.industry}\nCountry: ${config.country}\nTotal: ${recruiters.length}\nDate: ${new Date().toLocaleString()}\n\n${'='.repeat(80)}\n\n`
    recruiters.forEach((r, i) => {
      txt += `${i+1}. ${r.recruiter_name || r.company_name}\n${'-'.repeat(60)}\n`
      if (r.job_title) txt += `Title: ${r.job_title}\n`
      if (r.company_name) txt += `Company: ${r.company_name}\n`
      if (r.contact_email) txt += `Email: ${r.contact_email}\n`
      if (r.linkedin_url) txt += `LinkedIn: ${r.linkedin_url}\n`
      if (r.location) txt += `Location: ${r.location}\n`
      if (r.specializations) txt += `Specializations: ${r.specializations.join(', ')}\n`
      txt += '\n'
    })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }))
    link.download = `recruiters_${config.industry.replace(/\s+/g, '_')}_${Date.now()}.txt`
    link.click()
    setShowExportMenu(false)
  }

  const collectAllEmails = useCallback((recruiters) => {
    const s = new Set()
    recruiters.forEach(r => { if (r.contact_email) s.add(r.contact_email); if (r.additional_emails) r.additional_emails.forEach(e => s.add(e)) })
    return Array.from(s)
  }, [])

  const autoSendEmails = useCallback(async (responseData) => {
    if (!config.emailCampaign || autoSendTriggered.current) return
    autoSendTriggered.current = true
    const recruiters = getRecruiters(responseData)
    const allEmails = collectAllEmails(recruiters)
    if (allEmails.length === 0) { setAutoSendStatus('done'); setAutoSendResult({ successful: 0, failed: 0, total: 0, message: 'No emails found.' }); return }
    setAutoSendStatus('sending'); setCurrentStage(5)
    try {
      const payload = { from_email: config.emailCampaign.from_email, to_emails: allEmails, subject: config.emailCampaign.subject, body: config.emailCampaign.body, attachments: config.emailCampaign.attachments, recruiters }
      const res = await axios.post(API_BASE_URL + API_ENDPOINTS.sendBulkEmail, payload, { timeout: 600000 })
      setAutoSendResult(res.data); setAutoSendStatus('done'); if (hasEmailCampaign) setCurrentStage(6)
    } catch (err) {
      setAutoSendResult({ success: false, message: err.response?.data?.detail || err.message, successful: 0, failed: 0 }); setAutoSendStatus('error'); if (hasEmailCampaign) setCurrentStage(6)
    }
  }, [config, collectAllEmails, hasEmailCampaign])

  const startGeneration = async () => {
    setIsProcessing(true); setCurrentStage(0); setError(null)
    try {
      await new Promise(r => setTimeout(r, 1000)); setCurrentStage(1); setCurrentStage(2)
      const { emailCampaign, ...searchConfig } = config
      const response = await axios.post(API_BASE_URL + API_ENDPOINTS.findRecruiters, searchConfig, { timeout: 1800000 })
      if (config.enable_web_scraping) { await new Promise(r => setTimeout(r, 1000)); setCurrentStage(3) }
      await new Promise(r => setTimeout(r, 500)); setCurrentStage(4)
      setResults(response.data); setShowResults(true)
      if (config.emailCampaign) await autoSendEmails(response.data)
      setIsProcessing(false)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Unknown error'); setIsProcessing(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onReset} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div className="flex items-center space-x-2">
            <Briefcase className="w-5 h-5 text-primary-500" />
            <h1 className="text-base sm:text-lg font-semibold">Recruiter Finder Agent</h1>
          </div>
          <div className="hidden md:block text-sm text-gray-500">{config.industry} • {config.number} recruiters • {config.country}</div>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3">
          {results && (
            <div className="relative" ref={exportMenuRef}>
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileHover={{ scale: 1.05 }} onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                <Download className="w-4 h-4" /><span>Export</span>
              </motion.button>
              {showExportMenu && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                  <button onClick={exportJSON} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50"><FileJson className="w-5 h-5 text-blue-600" /><div className="text-left"><div className="text-sm font-medium">JSON</div></div></button>
                  <div className="border-t border-gray-100"></div>
                  <button onClick={exportTXT} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50"><FileText className="w-5 h-5 text-green-600" /><div className="text-left"><div className="text-sm font-medium">TXT</div></div></button>
                </motion.div>
              )}
            </div>
          )}
          {results && (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileHover={{ scale: 1.05 }} onClick={() => setShowBulkEmail(!showBulkEmail)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${showBulkEmail ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
              <Mail className="w-4 h-4" /><span className="hidden sm:inline text-sm font-medium">Email All</span>
            </motion.button>
          )}
          {results && (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileHover={{ scale: 1.05 }} onClick={() => setShowResults(!showResults)}
              className="flex items-center space-x-2 px-3 py-2 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg transition-colors">
              {showResults ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              <span className="hidden sm:inline text-sm font-medium">{showResults ? 'Hide' : 'Show'}</span>
            </motion.button>
          )}
          <motion.button whileHover={{ scale: 1.05 }} onClick={() => setShowFeedback(true)} className="flex items-center space-x-2 px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors">
            <MessageCircle className="w-4 h-4" /><span className="hidden md:inline text-sm font-medium">Feedback</span>
          </motion.button>
          <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="hidden sm:inline">{isProcessing ? 'Processing' : 'Ready'}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 relative overflow-auto">
          <AnimatePresence mode="wait">
            {showBulkEmail && results ? (
              <BulkEmailPanel key="bulk-email" results={results} onClose={() => setShowBulkEmail(false)} />
            ) : (
              <motion.div key="canvas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full grid-pattern">
                <ProcessCanvas stages={activeStages} currentStage={currentStage} isProcessing={isProcessing} config={config} results={results} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {results && showResults && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowResults(false)} className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30" />
              <ResultsPanel results={results} config={config} onClose={() => setShowResults(false)} onEmailAll={() => setShowBulkEmail(true)} />
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Auto-Send Banner */}
      <AnimatePresence>
        {autoSendStatus && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-xl p-4 shadow-2xl border max-w-md w-full mx-4 ${autoSendStatus === 'sending' ? 'bg-blue-50 border-blue-300' : autoSendStatus === 'done' ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
            <div className="flex items-center space-x-3">
              {autoSendStatus === 'sending' && (<><Loader2 className="w-5 h-5 text-blue-600 animate-spin" /><div><div className="font-semibold text-blue-900">Sending CV to all recruiters...</div><div className="text-sm text-blue-700">This may take a moment</div></div></>)}
              {autoSendStatus === 'done' && autoSendResult && (<><CheckCircle2 className="w-5 h-5 text-green-600" /><div className="flex-1"><div className="font-semibold text-green-900">{autoSendResult.successful > 0 ? `Sent to ${autoSendResult.successful} recruiter${autoSendResult.successful !== 1 ? 's' : ''}!` : autoSendResult.message || 'Done.'}</div>{autoSendResult.failed > 0 && <div className="text-sm text-amber-700">{autoSendResult.failed} failed</div>}</div><button onClick={() => setAutoSendStatus(null)} className="p-1 hover:bg-green-200 rounded-lg"><X className="w-4 h-4 text-green-700" /></button></>)}
              {autoSendStatus === 'error' && autoSendResult && (<><AlertCircle className="w-5 h-5 text-red-600" /><div className="flex-1"><div className="font-semibold text-red-900">Email sending failed</div><div className="text-sm text-red-700">{autoSendResult.message}</div></div><button onClick={() => setAutoSendStatus(null)} className="p-1 hover:bg-red-200 rounded-lg"><X className="w-4 h-4 text-red-700" /></button></>)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-4 right-4 bg-red-50 border-2 border-red-300 rounded-xl p-6 shadow-2xl max-w-lg z-50">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2"><div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center"><X className="w-6 h-6 text-white" /></div><div className="font-bold text-red-800 text-lg">Error</div></div>
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded-lg"><X className="w-5 h-5 text-red-600" /></button>
          </div>
          <div className="text-sm text-red-700 mb-4">{error}</div>
          <div className="flex items-center space-x-2">
            <button onClick={onReset} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">Go Back</button>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium">Retry</button>
          </div>
        </motion.div>
      )}

      <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2 }} whileHover={{ scale: 1.1 }} onClick={() => setShowFeedback(true)}
        className="fixed bottom-6 left-6 z-30 w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-full shadow-2xl flex items-center justify-center">
        <MessageCircle className="w-6 h-6" />
      </motion.button>

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
    </div>
  )
}
