import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Paperclip, X, Mail, Sparkles, CheckCircle2, AlertCircle, Users, Loader2, FileText, ChevronDown, ChevronUp, Info, Upload } from 'lucide-react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import axios from 'axios'
import { API_BASE_URL, API_ENDPOINTS } from '../config/api'

function collectAllEmails(recruiters) {
  const s = new Set()
  recruiters.forEach(r => { if (r.contact_email) s.add(r.contact_email); if (r.additional_emails) r.additional_emails.forEach(e => s.add(e)) })
  return Array.from(s)
}

export default function BulkEmailPanel({ results, onClose }) {
  const recruiters = results?.data?.recruiters || results?.data?.companies || []
  const allEmails = collectAllEmails(recruiters)

  const [fromEmail, setFromEmail] = useState('')
  const [subject, setSubject] = useState('Experienced Professional — Open to Opportunities at {{company_name}}')
  const [body, setBody] = useState('')
  const [cvFile, setCvFile] = useState(null)
  const [attachments, setAttachments] = useState([])
  const [sending, setSending] = useState(false)
  const [sendProgress, setSendProgress] = useState({ sent: 0, failed: 0, total: 0 })
  const [sendResults, setSendResults] = useState(null)
  const [showRecipients, setShowRecipients] = useState(false)
  const [selectedEmails, setSelectedEmails] = useState(new Set(allEmails))
  const fileInputRef = useRef(null)
  const cvInputRef = useRef(null)

  useEffect(() => { setSelectedEmails(new Set(allEmails)) }, [results])

  const toggleEmail = (email) => {
    setSelectedEmails(prev => { const next = new Set(prev); if (next.has(email)) next.delete(email); else next.add(email); return next })
  }

  const handleCvSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert('CV too large. Max 10MB.'); return }
    try {
      const base64 = await fileToBase64(file)
      setCvFile({ filename: file.name, content: base64.split(',')[1], mimetype: file.type || 'application/octet-stream', size: file.size })
    } catch (err) { alert('Failed to read CV.') }
    if (cvInputRef.current) cvInputRef.current.value = ''
  }

  const handleFileSelect = async (e) => {
    for (const file of Array.from(e.target.files)) {
      if (file.size > 10 * 1024 * 1024) { alert(`${file.name} too large.`); continue }
      try {
        const base64 = await fileToBase64(file)
        setAttachments(prev => [...prev, { filename: file.name, content: base64.split(',')[1], mimetype: file.type || 'application/octet-stream', size: file.size }])
      } catch (err) { alert(`Failed: ${file.name}`) }
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const fileToBase64 = (file) => new Promise((resolve, reject) => { const r = new FileReader(); r.readAsDataURL(file); r.onload = () => resolve(r.result); r.onerror = reject })
  const removeAttachment = (i) => setAttachments(prev => prev.filter((_, idx) => idx !== i))
  const formatFileSize = (b) => b < 1024 ? b + ' B' : b < 1024*1024 ? (b/1024).toFixed(1) + ' KB' : (b/(1024*1024)).toFixed(1) + ' MB'

  const handleSendAll = async () => {
    const recipients = Array.from(selectedEmails)
    if (!fromEmail || recipients.length === 0 || !subject || !body) { alert('Please fill in all fields and select recipients.'); return }
    setSending(true); setSendProgress({ sent: 0, failed: 0, total: recipients.length }); setSendResults(null)
    try {
      const allAttachments = []
      if (cvFile) allAttachments.push({ filename: cvFile.filename, content: cvFile.content, mimetype: cvFile.mimetype })
      attachments.forEach(a => allAttachments.push({ filename: a.filename, content: a.content, mimetype: a.mimetype }))

      const payload = { from_email: fromEmail, to_emails: recipients, subject, body, attachments: allAttachments.length > 0 ? allAttachments : null, recruiters }
      const res = await axios.post(API_BASE_URL + API_ENDPOINTS.sendBulkEmail, payload, { timeout: 600000 })
      setSendResults(res.data)
      setSendProgress({ sent: res.data.successful || 0, failed: res.data.failed || 0, total: recipients.length })
    } catch (err) {
      setSendResults({ success: false, message: err.response?.data?.detail || err.message })
    } finally { setSending(false) }
  }

  const modules = { toolbar: [[{ 'header': [1, 2, false] }], ['bold', 'italic', 'underline'], [{ 'list': 'ordered' }, { 'list': 'bullet' }], ['link'], ['clean']] }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="h-full flex flex-col bg-white">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-blue-50 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center"><Mail className="w-5 h-5 text-white" /></div>
          <div><h2 className="text-lg font-bold text-gray-900">Recruiter Email Campaign</h2><p className="text-sm text-gray-500">Send to {selectedEmails.size} of {allEmails.length} recruiters</p></div>
        </div>
        <motion.button whileHover={{ scale: 1.1 }} onClick={onClose} className="p-2 hover:bg-white/60 rounded-lg"><X className="w-5 h-5 text-gray-600" /></motion.button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">
          {/* Personalization hint */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <span className="font-semibold">Personalization:</span> Use placeholders in subject & message — they'll be replaced for each recruiter:
              <div className="mt-1 flex flex-wrap gap-1">
                <code className="px-1.5 py-0.5 bg-amber-100 rounded text-xs">{'{{recruiter_name}}'}</code>
                <code className="px-1.5 py-0.5 bg-amber-100 rounded text-xs">{'{{company_name}}'}</code>
                <code className="px-1.5 py-0.5 bg-amber-100 rounded text-xs">{'{{first_name}}'}</code>
                <code className="px-1.5 py-0.5 bg-amber-100 rounded text-xs">{'{{job_title}}'}</code>
              </div>
            </div>
          </div>

          {/* Recipients */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <button onClick={() => setShowRecipients(!showRecipients)} className="w-full flex items-center justify-between">
              <div className="flex items-center space-x-2"><Users className="w-5 h-5 text-blue-600" /><span className="font-semibold text-blue-900">Recipients ({selectedEmails.size})</span></div>
              {showRecipients ? <ChevronUp className="w-5 h-5 text-blue-600" /> : <ChevronDown className="w-5 h-5 text-blue-600" />}
            </button>
            <AnimatePresence>
              {showRecipients && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2">
                      <button onClick={() => setSelectedEmails(new Set(allEmails))} className="text-xs text-blue-700 hover:underline font-medium">Select All</button>
                      <button onClick={() => setSelectedEmails(new Set())} className="text-xs text-blue-700 hover:underline font-medium">Deselect All</button>
                    </div>
                    {allEmails.map((email) => {
                      const rec = recruiters.find(r => r.contact_email === email || r.additional_emails?.includes(email))
                      return (
                        <label key={email} className="flex items-center space-x-3 px-3 py-2 bg-white rounded-lg border border-blue-100 cursor-pointer hover:border-blue-300">
                          <input type="checkbox" checked={selectedEmails.has(email)} onChange={() => toggleEmail(email)} className="w-4 h-4 rounded text-primary-600" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{email}</div>
                            {rec && <div className="text-xs text-gray-500 truncate">{rec.recruiter_name || rec.company_name}</div>}
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* From Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From (Your Email)</label>
            <div className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-xl focus-within:border-primary-500"><Mail className="w-5 h-5 text-gray-400" /><input type="email" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} placeholder="your.email@example.com" className="flex-1 outline-none bg-transparent" required /></div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-primary-500 outline-none" placeholder="e.g., Open to Opportunities at {{company_name}}" required />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <div className="border border-gray-300 rounded-xl overflow-hidden focus-within:border-primary-500">
              <ReactQuill value={body} onChange={setBody} modules={modules} placeholder="Hi {{first_name}}, I came across your profile and..." className="h-56" />
            </div>
          </div>

          {/* CV Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your CV / Resume</label>
            {!cvFile ? (
              <div onClick={() => cvInputRef.current?.click()} className="border-2 border-dashed border-primary-300 bg-primary-50/30 rounded-xl p-4 text-center cursor-pointer hover:border-primary-500 transition-colors">
                <Upload className="w-6 h-6 text-primary-400 mx-auto mb-1" /><p className="text-sm text-primary-700">Click to upload CV</p><p className="text-xs text-gray-500">PDF or Word (max 10MB)</p>
              </div>
            ) : (
              <div className="flex items-center justify-between px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl">
                <div className="flex items-center space-x-3 flex-1 min-w-0"><FileText className="w-5 h-5 text-primary-600" /><div className="min-w-0"><div className="text-sm font-medium truncate">{cvFile.filename}</div><div className="text-xs text-gray-500">{formatFileSize(cvFile.size)}</div></div></div>
                <button onClick={() => setCvFile(null)} className="p-1 hover:bg-red-100 rounded"><X className="w-4 h-4 text-red-500" /></button>
              </div>
            )}
            <input ref={cvInputRef} type="file" className="hidden" onChange={handleCvSelect} accept=".pdf,.doc,.docx" />
          </div>

          {/* Extra Attachments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Extra Attachments {attachments.length > 0 && `(${attachments.length})`}</label>
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"><Paperclip className="w-4 h-4" /><span>Add</span></button>
              <input ref={fileInputRef} type="file" className="hidden" multiple onChange={handleFileSelect} />
            </div>
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((att, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-3 flex-1 min-w-0"><Paperclip className="w-4 h-4 text-blue-600" /><div className="min-w-0"><div className="text-sm font-medium truncate">{att.filename}</div><div className="text-xs text-gray-500">{formatFileSize(att.size)}</div></div></div>
                    <button onClick={() => removeAttachment(i)} className="p-1 hover:bg-red-100 rounded"><X className="w-4 h-4 text-red-600" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Progress */}
          {sending && (
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
              <div className="flex items-center space-x-3 mb-3"><Loader2 className="w-5 h-5 text-primary-600 animate-spin" /><span className="font-medium text-primary-900">Sending personalized emails...</span></div>
              <div className="w-full bg-primary-200 rounded-full h-2"><motion.div className="bg-primary-600 h-2 rounded-full" initial={{ width: 0 }} animate={{ width: `${((sendProgress.sent + sendProgress.failed) / Math.max(sendProgress.total, 1)) * 100}%` }} /></div>
            </div>
          )}

          {/* Results */}
          {sendResults && !sending && (
            <div className={`rounded-xl p-4 border ${sendResults.success !== false ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center space-x-3">
                {sendResults.success !== false ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
                <span className={`font-semibold ${sendResults.success !== false ? 'text-green-900' : 'text-red-900'}`}>
                  {sendResults.success !== false ? `Done! ${sendResults.successful || 0} emails sent.` : `Error: ${sendResults.message}`}
                </span>
              </div>
              {sendResults.failed > 0 && <p className="text-sm text-amber-700 mt-1">{sendResults.failed} failed.</p>}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="text-sm text-gray-500">{selectedEmails.size} recipient{selectedEmails.size !== 1 ? 's' : ''}{cvFile ? ' • CV attached' : ''}</div>
        <motion.button whileHover={{ scale: 1.05 }} onClick={handleSendAll} disabled={sending || selectedEmails.size === 0}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 transition-all">
          {sending ? (<><Loader2 className="w-5 h-5 animate-spin" /><span>Sending...</span></>) : (<><Send className="w-5 h-5" /><span>Send to All ({selectedEmails.size})</span></>)}
        </motion.button>
      </div>
    </motion.div>
  )
}
