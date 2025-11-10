import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Send, Paperclip, Image as ImageIcon, Lock, Pen, 
  MoreHorizontal, Bold, Italic, Underline, AlignLeft,
  Lightbulb, Settings, Mic, Sparkles, Mail
} from 'lucide-react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import axios from 'axios'
import { API_BASE_URL, API_ENDPOINTS } from '../config/api'

export default function EmailModal({ company, onClose }) {
  const [fromEmail, setFromEmail] = useState('')
  const [subject, setSubject] = useState(`Partnership Opportunity with ${company.company_name}`)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [suggestions, setSuggestions] = useState(null)
  const [attachments, setAttachments] = useState([])
  const fileInputRef = useRef(null)
  
  const toEmail = company.contact_email || company.additional_emails?.[0] || ''

  // AI-generated suggestions
  const aiSuggestions = [
    {
      emoji: '🤝',
      label: 'Professional',
      text: `Dear ${company.company_name} Team,\n\nI hope this email finds you well. I came across your company and was impressed by your work in ${company.target_market || 'the industry'}. I believe there could be valuable opportunities for collaboration between our organizations.\n\nWould you be available for a brief call to discuss potential partnerships?`
    },
    {
      emoji: '💡',
      label: 'Value Proposition',
      text: `Hi ${company.company_name},\n\nI noticed your impressive growth serving ${company.number_of_users || 'your customer base'}. We specialize in helping companies like yours expand their reach and optimize operations.\n\nI'd love to share how we can add value to your business. Are you open to a quick 15-minute call?`
    },
    {
      emoji: '🎯',
      label: 'Direct',
      text: `Hello,\n\nI'm reaching out because I believe our services could benefit ${company.company_name}. Given your focus on ${company.key_products_services?.substring(0, 100) || 'your industry'}, I think we could create mutual value.\n\nWould next week work for a brief discussion?`
    }
  ]

  const handleSuggestionClick = (suggestion) => {
    setBody(suggestion.text)
    setShowSuggestions(false)
  }

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    
    // Limit file size (10MB per file)
    const MAX_FILE_SIZE = 10 * 1024 * 1024
    
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`)
        continue
      }
      
      try {
        const base64 = await fileToBase64(file)
        const attachment = {
          filename: file.name,
          content: base64.split(',')[1], // Remove data:*/*;base64, prefix
          mimetype: file.type || 'application/octet-stream',
          size: file.size
        }
        
        setAttachments(prev => [...prev, attachment])
      } catch (error) {
        console.error('Error reading file:', error)
        alert(`Failed to read file: ${file.name}`)
      }
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleSend = async () => {
    if (!fromEmail || !toEmail || !subject || !body) {
      alert('Please fill in all required fields')
      return
    }

    setSending(true)
    
    try {
      const payload = {
        from_email: fromEmail,
        to_email: toEmail,
        subject: subject,
        body: body,
        attachments: attachments.length > 0 ? attachments.map(att => ({
          filename: att.filename,
          content: att.content,
          mimetype: att.mimetype
        })) : null
      }

      const apiUrl = API_BASE_URL + API_ENDPOINTS.sendEmail
      const response = await axios.post(apiUrl, payload)

      if (response.data.success) {
        const attachmentInfo = attachments.length > 0 
          ? ` with ${attachments.length} attachment(s)` 
          : ''
        alert(`✅ Email sent successfully${attachmentInfo}!\n\n📧 Sent to: ${toEmail}\n📬 CC copy sent to: ${fromEmail}`)
        onClose()
      }
    } catch (error) {
      console.error('Email send error:', error)
      
      // Better error messages
      let errorMessage = 'Failed to send email.'
      
      if (error.response?.status === 500) {
        errorMessage = 'Server error. Please check:\n' +
          '1. Email service is configured (.env file)\n' +
          '2. Email credentials are correct\n' +
          '3. Your email is valid\n\n' +
          'Error: ' + (error.response?.data?.detail || error.message)
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid email data: ' + (error.response?.data?.detail || error.message)
      } else {
        errorMessage = error.response?.data?.detail || error.message || 'Unknown error'
      }
      
      alert(errorMessage)
    } finally {
      setSending(false)
    }
  }

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ],
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg">LeadGen AI</span>
              </div>

              <div className="h-6 w-px bg-gray-300"></div>

              <button className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors">
                <span>English</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <button className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors">
                <Mic className="w-4 h-4" />
                <span>Voice</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Lightbulb className="w-5 h-5 text-gray-600" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </motion.button>
            </div>
          </div>

          {/* Recipient Intent */}
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
            <div className="text-sm font-semibold text-gray-700 mb-2">Recipient's info</div>
            <div className="text-sm text-gray-600 leading-relaxed">
              <strong>{company.company_name}</strong> is a {company.company_size || 'company'} based in {company.headquarters_location}
              {company.revenue_market_cap && `, with ${company.revenue_market_cap}`}.
              {company.number_of_users && ` They serve ${company.number_of_users}.`}
            </div>
          </div>

          {/* AI Suggestions */}
          {showSuggestions && (
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="text-sm font-semibold text-gray-700 mb-3">AI-powered email ideas</div>
              <div className="space-y-2">
                {aiSuggestions.map((suggestion, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
                  >
                    <div className="flex items-start space-x-2">
                      <span className="text-xl">{suggestion.emoji}</span>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900 mb-1">{suggestion.label}</div>
                        <div className="text-xs text-gray-600 line-clamp-2">{suggestion.text}</div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Email Form */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* From Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From (Your Email)</label>
              <div className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-xl focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100">
                <Mail className="w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder="your.email@company.com"
                  className="flex-1 outline-none text-gray-900"
                  required
                />
              </div>
              <p className="text-xs text-blue-600 mt-2 flex items-center">
                <span className="mr-1">💡</span>
                A copy of this email will be sent to your inbox
              </p>
            </div>

            {/* To Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
              <div className="flex items-center space-x-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                <Mail className="w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={toEmail}
                  readOnly
                  className="flex-1 outline-none bg-transparent text-gray-900"
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
                placeholder="Email subject..."
                required
              />
            </div>

            {/* Body - Rich Text Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <div className="border border-gray-300 rounded-xl overflow-hidden focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100">
                <ReactQuill
                  value={body}
                  onChange={setBody}
                  modules={modules}
                  placeholder="Tell me what to write..."
                  className="h-64"
                />
              </div>
            </div>

            {/* Attachments Display */}
            {attachments.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attachments ({attachments.length})
                </label>
                <div className="space-y-2">
                  {attachments.map((attachment, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <Paperclip className="w-4 h-4 text-blue-600" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {attachment.filename}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatFileSize(attachment.size)}
                          </div>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeAttachment(index)}
                        className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                        title="Remove attachment"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Text formatting"
              >
                <Bold className="w-5 h-5 text-gray-600" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
                onClick={() => fileInputRef.current?.click()}
                title="Attach files"
              >
                <Paperclip className="w-5 h-5 text-gray-600" />
                {attachments.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                    {attachments.length}
                  </span>
                )}
              </motion.button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={handleFileSelect}
                accept="*/*"
              />

              <motion.button
                whileHover={{ scale: 1.1 }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Insert image"
              >
                <ImageIcon className="w-5 h-5 text-gray-600" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Security"
              >
                <Lock className="w-5 h-5 text-gray-600" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Signature"
              >
                <Pen className="w-5 h-5 text-gray-600" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="More options"
              >
                <MoreHorizontal className="w-5 h-5 text-gray-600" />
              </motion.button>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={sending}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {sending ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Send Email</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

