import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Download, FileJson, FileText, Zap, X, PanelRightOpen, PanelRightClose, MessageCircle, Mail, CheckCircle2, AlertCircle, Loader2, Send } from 'lucide-react'
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
  const [jobId, setJobId] = useState(null)
  const [stageData, setStageData] = useState({})
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showResults, setShowResults] = useState(true)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showBulkEmail, setShowBulkEmail] = useState(false)
  const [autoSendStatus, setAutoSendStatus] = useState(null) // null | 'sending' | 'done' | 'error'
  const [autoSendResult, setAutoSendResult] = useState(null)
  const autoSendTriggered = useRef(false)
  const exportMenuRef = useRef(null)

  const hasEmailCampaign = !!config.emailCampaign

  const stages = [
    { id: 1, name: 'Initializing', description: 'Preparing AI agent' },
    { id: 2, name: 'AI Generation', description: 'Generating company data' },
    { id: 3, name: 'Web Scraping', description: 'Extracting contact info', skip: !config.enable_web_scraping },
    { id: 4, name: 'Data Consolidation', description: 'Merging results' },
    { id: 5, name: hasEmailCampaign ? 'Sending Emails' : 'Completed', description: hasEmailCampaign ? 'Auto-sending to all leads' : 'Leads ready' },
    ...(hasEmailCampaign ? [{ id: 6, name: 'Completed', description: 'All done' }] : [])
  ]

  const activeStages = stages.filter(s => !s.skip)

  useEffect(() => {
    startGeneration()
  }, [])

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false)
      }
    }

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showExportMenu])

  const exportJSON = () => {
    const dataStr = JSON.stringify(results, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `leads_${config.industry.replace(/\s+/g, '_')}_${Date.now()}.json`
    link.click()
    setShowExportMenu(false)
  }

  const exportTXT = () => {
    const companies = results?.data?.companies || []
    let txtContent = `LEAD GENERATION RESULTS\n`
    txtContent += `${'='.repeat(80)}\n\n`
    txtContent += `Industry: ${config.industry}\n`
    txtContent += `Country: ${config.country}\n`
    txtContent += `Total Companies: ${companies.length}\n`
    txtContent += `Generated: ${new Date().toLocaleString()}\n\n`
    txtContent += `${'='.repeat(80)}\n\n`

    companies.forEach((company, index) => {
      txtContent += `${index + 1}. ${company.company_name}\n`
      txtContent += `${'-'.repeat(80)}\n`
      if (company.website_url) txtContent += `Website: ${company.website_url}\n`
      if (company.contact_email) txtContent += `Email: ${company.contact_email}\n`
      if (company.headquarters_location) txtContent += `Location: ${company.headquarters_location}\n`
      if (company.company_size) txtContent += `Size: ${company.company_size}\n`
      if (company.revenue_market_cap) txtContent += `Revenue: ${company.revenue_market_cap}\n`
      txtContent += `\n`
    })

    const dataBlob = new Blob([txtContent], { type: 'text/plain' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `leads_${config.industry.replace(/\s+/g, '_')}_${Date.now()}.txt`
    link.click()
    setShowExportMenu(false)
  }

  const collectAllEmails = useCallback((companies) => {
    const emailSet = new Set()
    for (const company of companies) {
      if (company.contact_email) emailSet.add(company.contact_email)
      if (company.additional_emails) {
        company.additional_emails.forEach(e => emailSet.add(e))
      }
    }
    return Array.from(emailSet)
  }, [])

  const autoSendEmails = useCallback(async (responseData) => {
    if (!config.emailCampaign || autoSendTriggered.current) return
    autoSendTriggered.current = true

    const companies = responseData?.data?.companies || []
    const allEmails = collectAllEmails(companies)

    if (allEmails.length === 0) {
      setAutoSendStatus('done')
      setAutoSendResult({ successful: 0, failed: 0, total: 0, message: 'No emails found to send to.' })
      return
    }

    setAutoSendStatus('sending')
    setCurrentStage(5)

    try {
      const payload = {
        from_email: config.emailCampaign.from_email,
        to_emails: allEmails,
        subject: config.emailCampaign.subject,
        body: config.emailCampaign.body,
        attachments: config.emailCampaign.attachments
      }

      const apiUrl = API_BASE_URL + API_ENDPOINTS.sendBulkEmail
      const response = await axios.post(apiUrl, payload, { timeout: 600000 })

      setAutoSendResult(response.data)
      setAutoSendStatus('done')
      if (hasEmailCampaign) setCurrentStage(6)
    } catch (err) {
      console.error('Auto-send error:', err)
      const msg = err.response?.data?.detail || err.message || 'Failed to send emails'
      setAutoSendResult({ success: false, message: msg, successful: 0, failed: 0 })
      setAutoSendStatus('error')
      if (hasEmailCampaign) setCurrentStage(6)
    }
  }, [config, collectAllEmails, hasEmailCampaign])

  const startGeneration = async () => {
    setIsProcessing(true)
    setCurrentStage(0)
    setError(null)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setCurrentStage(1)

      setCurrentStage(2)

      const apiUrl = API_BASE_URL + API_ENDPOINTS.generateLeads
      const { emailCampaign, ...leadConfig } = config
      const response = await axios.post(apiUrl, leadConfig, {
        timeout: 1800000
      })

      if (config.enable_web_scraping) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setCurrentStage(3)
      }

      await new Promise(resolve => setTimeout(resolve, 500))
      setCurrentStage(4)

      setResults(response.data)
      setShowResults(true)

      if (config.emailCampaign) {
        await autoSendEmails(response.data)
      }

      setIsProcessing(false)

    } catch (err) {
      console.error('Lead generation error:', err)
      const errorMessage = err.response?.data?.detail || err.message || 'Unknown error occurred'
      setError(errorMessage)
      setIsProcessing(false)
    }
  }


  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Header - Responsive */}
      <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReset}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>

          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-primary-500" />
            <h1 className="text-base sm:text-lg font-semibold">Lead Generator Agent</h1>
          </div>

          <div className="hidden md:block text-sm text-gray-500">
            {config.industry} • {config.number} companies • {config.country}
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          {results && (
            <div className="relative" ref={exportMenuRef}>
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
                <svg
                  className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </motion.button>

              {/* Dropdown Menu */}
              {showExportMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50"
                >
                  <button
                    onClick={exportJSON}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <FileJson className="w-5 h-5 text-blue-600" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900">Export as JSON</div>
                      <div className="text-xs text-gray-500">Structured data</div>
                    </div>
                  </button>

                  <div className="border-t border-gray-100"></div>

                  <button
                    onClick={exportTXT}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <FileText className="w-5 h-5 text-green-600" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900">Export as TXT</div>
                      <div className="text-xs text-gray-500">Human-readable</div>
                    </div>
                  </button>
                </motion.div>
              )}
            </div>
          )}

          {/* Email All Leads Button */}
          {results && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowBulkEmail(!showBulkEmail)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                showBulkEmail
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-medium">Email All</span>
            </motion.button>
          )}

          {/* Toggle Results Panel Button */}
          {results && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowResults(!showResults)}
              className="flex items-center space-x-2 px-3 py-2 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg transition-colors"
              title={showResults ? "Hide results" : "Show results"}
            >
              {showResults ? (
                <PanelRightClose className="w-4 h-4" />
              ) : (
                <PanelRightOpen className="w-4 h-4" />
              )}
              <span className="hidden sm:inline text-sm font-medium">
                {showResults ? 'Hide' : 'Show'}
              </span>
            </motion.button>
          )}

          {/* Feedback Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFeedback(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors"
            title="Send feedback"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden md:inline text-sm font-medium">Feedback</span>
          </motion.button>

          <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="hidden sm:inline">{isProcessing ? 'Processing' : 'Ready'}</span>
            <span className="sm:hidden">{isProcessing ? '...' : '✓'}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Center Canvas / Bulk Email */}
        <div className="flex-1 relative overflow-auto">
          <AnimatePresence mode="wait">
            {showBulkEmail && results ? (
              <BulkEmailPanel
                key="bulk-email"
                results={results}
                onClose={() => setShowBulkEmail(false)}
              />
            ) : (
              <motion.div
                key="process-canvas"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full grid-pattern"
              >
                <ProcessCanvas
                  stages={activeStages}
                  currentStage={currentStage}
                  isProcessing={isProcessing}
                  config={config}
                  results={results}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Backdrop (when results open) */}
        <AnimatePresence>
          {results && showResults && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResults(false)}
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            />
          )}
        </AnimatePresence>

        {/* Right Results Panel */}
        <AnimatePresence>
          {results && showResults && (
            <ResultsPanel
              results={results}
              config={config}
              onClose={() => setShowResults(false)}
              onEmailAll={() => setShowBulkEmail(true)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Auto-Send Status Banner */}
      <AnimatePresence>
        {autoSendStatus && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-xl p-4 shadow-2xl border max-w-md w-full mx-4 ${
              autoSendStatus === 'sending'
                ? 'bg-blue-50 border-blue-300'
                : autoSendStatus === 'done'
                ? 'bg-green-50 border-green-300'
                : 'bg-red-50 border-red-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              {autoSendStatus === 'sending' && (
                <>
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-blue-900">Sending emails to all leads...</div>
                    <div className="text-sm text-blue-700">This may take a moment</div>
                  </div>
                </>
              )}
              {autoSendStatus === 'done' && autoSendResult && (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold text-green-900">
                      {autoSendResult.successful > 0
                        ? `Sent ${autoSendResult.successful} email${autoSendResult.successful !== 1 ? 's' : ''} successfully!`
                        : autoSendResult.message || 'No emails to send.'
                      }
                    </div>
                    {autoSendResult.failed > 0 && (
                      <div className="text-sm text-amber-700">{autoSendResult.failed} failed</div>
                    )}
                  </div>
                  <button
                    onClick={() => setAutoSendStatus(null)}
                    className="p-1 hover:bg-green-200 rounded-lg"
                  >
                    <X className="w-4 h-4 text-green-700" />
                  </button>
                </>
              )}
              {autoSendStatus === 'error' && autoSendResult && (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold text-red-900">Email sending failed</div>
                    <div className="text-sm text-red-700">{autoSendResult.message}</div>
                  </div>
                  <button
                    onClick={() => setAutoSendStatus(null)}
                    className="p-1 hover:bg-red-200 rounded-lg"
                  >
                    <X className="w-4 h-4 text-red-700" />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 bg-red-50 border-2 border-red-300 rounded-xl p-6 shadow-2xl max-w-lg z-50"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <X className="w-6 h-6 text-white" />
              </div>
              <div className="font-bold text-red-800 text-lg">Error</div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setError(null)}
              className="p-1 hover:bg-red-100 rounded-lg"
            >
              <X className="w-5 h-5 text-red-600" />
            </motion.button>
          </div>

          <div className="text-sm text-red-700 leading-relaxed mb-4">{error}</div>

          {error.includes('403') && error.includes('leaked') && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-3 text-xs">
              <div className="font-semibold text-red-900 mb-1">🚨 API Key Leaked!</div>
              <div className="text-red-800">
                1. Get new key: <a href="https://aistudio.google.com/app/apikey" target="_blank" className="underline">Google AI Studio</a><br />
                2. Update .env file with NEW key<br />
                3. Restart API server
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2 mt-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onReset}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Go Back
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Retry
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Floating Feedback Button (Always visible) */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 2 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowFeedback(true)}
        className="fixed bottom-6 left-6 z-30 w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all"
        title="Send feedback"
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>

      {/* Feedback Modal */}
      {showFeedback && (
        <FeedbackModal onClose={() => setShowFeedback(false)} />
      )}
    </div>
  )
}

