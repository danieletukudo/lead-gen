import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Briefcase, Globe, Hash, Zap, ArrowLeft, Mail, FileText, Paperclip, X, Upload, Info } from 'lucide-react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

export default function InputForm({ onStart, onBack }) {
  const [formData, setFormData] = useState({
    industry: '',
    number: 10,
    country: 'USA',
    enable_web_scraping: true
  })

  const [emailData, setEmailData] = useState({
    from_email: '',
    subject: 'Experienced Professional — Open to Opportunities at {{company_name}}',
    body: ''
  })

  const [cvFile, setCvFile] = useState(null)
  const [attachments, setAttachments] = useState([])
  const fileInputRef = useRef(null)
  const cvInputRef = useRef(null)

  const handleCvSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const MAX_FILE_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      alert('CV file is too large. Maximum size is 10MB.')
      return
    }

    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      alert('Please upload a PDF or Word document (.pdf, .doc, .docx)')
      return
    }

    try {
      const base64 = await fileToBase64(file)
      setCvFile({
        filename: file.name,
        content: base64.split(',')[1],
        mimetype: file.type || 'application/octet-stream',
        size: file.size
      })
    } catch (error) {
      console.error('Error reading CV:', error)
      alert('Failed to read CV file.')
    }
    if (cvInputRef.current) cvInputRef.current.value = ''
  }

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    const MAX_FILE_SIZE = 10 * 1024 * 1024

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`)
        continue
      }
      try {
        const base64 = await fileToBase64(file)
        setAttachments(prev => [...prev, {
          filename: file.name,
          content: base64.split(',')[1],
          mimetype: file.type || 'application/octet-stream',
          size: file.size
        }])
      } catch (error) {
        console.error('Error reading file:', error)
        alert(`Failed to read file: ${file.name}`)
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
  })

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.industry.trim()) return

    const hasEmail = emailData.from_email && emailData.subject && emailData.body

    // Combine CV + extra attachments
    const allAttachments = []
    if (cvFile) {
      allAttachments.push({
        filename: cvFile.filename,
        content: cvFile.content,
        mimetype: cvFile.mimetype
      })
    }
    attachments.forEach(a => {
      allAttachments.push({
        filename: a.filename,
        content: a.content,
        mimetype: a.mimetype
      })
    })

    onStart({
      ...formData,
      emailCampaign: hasEmail ? {
        from_email: emailData.from_email,
        subject: emailData.subject,
        body: emailData.body,
        attachments: allAttachments.length > 0 ? allAttachments : null
      } : null
    })
  }

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {onBack && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="absolute top-8 left-8 flex items-center space-x-2 px-4 py-2 bg-white hover:bg-gray-50 rounded-xl shadow-lg transition-colors z-20"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
          <span className="font-medium text-gray-700">Back to Home</span>
        </motion.button>
      )}

      <div className="absolute inset-0 grid-pattern opacity-50"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mb-6 shadow-xl"
          >
            <Briefcase className="w-10 h-10 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-5xl font-bold text-gray-900 mb-4"
          >
            Recruiter Outreach
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-600"
          >
            Find recruiters and send them your CV with a personalized message
          </motion.p>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-3xl shadow-2xl p-8 md:p-12"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Industry/Role Input */}
            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                <Briefcase className="w-5 h-5 mr-2 text-primary-500" />
                Target Role / Industry
              </label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="e.g., software engineering, data science, marketing"
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors text-lg"
                required
              />
            </div>

            {/* Number of Recruiters */}
            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                <Hash className="w-5 h-5 mr-2 text-primary-500" />
                Number of Recruiters
              </label>
              <input
                type="number"
                value={formData.number}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '') {
                    setFormData({ ...formData, number: '' })
                  } else {
                    const num = parseInt(value)
                    if (!isNaN(num)) {
                      setFormData({ ...formData, number: Math.max(1, Math.min(50, num)) })
                    }
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value === '' || isNaN(parseInt(e.target.value))) {
                    setFormData({ ...formData, number: 10 })
                  }
                }}
                min="1"
                max="50"
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors text-lg"
                required
              />
              <p className="mt-2 text-sm text-gray-500">Maximum 50 recruiters per request</p>
            </div>

            {/* Country */}
            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                <Globe className="w-5 h-5 mr-2 text-primary-500" />
                Target Country
              </label>
              <select
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors text-lg"
              >
                <optgroup label="Popular Countries">
                  <option value="USA">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Germany">Germany</option>
                  <option value="France">France</option>
                  <option value="Australia">Australia</option>
                  <option value="India">India</option>
                  <option value="Singapore">Singapore</option>
                  <option value="UAE">United Arab Emirates</option>
                  <option value="Netherlands">Netherlands</option>
                </optgroup>
                <optgroup label="Africa">
                  <option value="Egypt">Egypt</option>
                  <option value="Ghana">Ghana</option>
                  <option value="Kenya">Kenya</option>
                  <option value="Nigeria">Nigeria</option>
                  <option value="South Africa">South Africa</option>
                  <option value="Tanzania">Tanzania</option>
                  <option value="Uganda">Uganda</option>
                </optgroup>
                <optgroup label="Asia">
                  <option value="China">China</option>
                  <option value="Japan">Japan</option>
                  <option value="South Korea">South Korea</option>
                  <option value="Indonesia">Indonesia</option>
                  <option value="Malaysia">Malaysia</option>
                  <option value="Philippines">Philippines</option>
                  <option value="Thailand">Thailand</option>
                  <option value="Vietnam">Vietnam</option>
                  <option value="Israel">Israel</option>
                  <option value="Saudi Arabia">Saudi Arabia</option>
                  <option value="Qatar">Qatar</option>
                  <option value="Pakistan">Pakistan</option>
                  <option value="Bangladesh">Bangladesh</option>
                </optgroup>
                <optgroup label="Europe">
                  <option value="Austria">Austria</option>
                  <option value="Belgium">Belgium</option>
                  <option value="Czech Republic">Czech Republic</option>
                  <option value="Denmark">Denmark</option>
                  <option value="Finland">Finland</option>
                  <option value="Ireland">Ireland</option>
                  <option value="Italy">Italy</option>
                  <option value="Norway">Norway</option>
                  <option value="Poland">Poland</option>
                  <option value="Portugal">Portugal</option>
                  <option value="Spain">Spain</option>
                  <option value="Sweden">Sweden</option>
                  <option value="Switzerland">Switzerland</option>
                </optgroup>
                <optgroup label="Americas">
                  <option value="Brazil">Brazil</option>
                  <option value="Mexico">Mexico</option>
                  <option value="Argentina">Argentina</option>
                  <option value="Colombia">Colombia</option>
                  <option value="Chile">Chile</option>
                </optgroup>
                <optgroup label="Oceania">
                  <option value="New Zealand">New Zealand</option>
                </optgroup>
              </select>
            </div>

            {/* Web Scraping Toggle */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enable_web_scraping}
                  onChange={(e) => setFormData({ ...formData, enable_web_scraping: e.target.checked })}
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <div className="ml-3">
                  <div className="flex items-center font-semibold text-gray-900">
                    <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                    Enable Web Scraping
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Extract real-time contact emails and social media (takes longer but more accurate)
                  </p>
                </div>
              </label>
            </div>

            {/* CV Upload */}
            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                <Upload className="w-5 h-5 mr-2 text-primary-500" />
                Upload Your CV / Resume
              </label>
              {!cvFile ? (
                <div
                  onClick={() => cvInputRef.current?.click()}
                  className="border-2 border-dashed border-primary-300 bg-primary-50/30 rounded-xl p-6 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  <Upload className="w-8 h-8 text-primary-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-primary-700">Click to upload your CV</p>
                  <p className="text-xs text-gray-500 mt-1">PDF or Word document (max 10MB)</p>
                </div>
              ) : (
                <div className="flex items-center justify-between px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <FileText className="w-5 h-5 text-primary-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{cvFile.filename}</div>
                      <div className="text-xs text-gray-500">{formatFileSize(cvFile.size)}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCvFile(null)}
                    className="p-1 hover:bg-red-100 rounded transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              )}
              <input
                ref={cvInputRef}
                type="file"
                className="hidden"
                onChange={handleCvSelect}
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              />
            </div>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm font-semibold text-primary-600 flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Auto-Email Outreach (Optional)</span>
                </span>
              </div>
            </div>

            {/* Email Campaign Section */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 space-y-4">
              <p className="text-sm text-green-700">
                Fill in these fields to automatically email every recruiter found. Your CV will be attached automatically.
                Leave empty to just view results without emailing.
              </p>

              {/* Personalization hint */}
              <div className="bg-white border border-green-300 rounded-lg p-3 flex items-start space-x-2">
                <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-green-800">
                  <span className="font-semibold">Personalization placeholders:</span> Use these in your subject and message to auto-personalize each email:
                  <div className="mt-1 space-x-2 flex flex-wrap gap-1">
                    <code className="px-1.5 py-0.5 bg-green-100 rounded text-green-900">{'{{recruiter_name}}'}</code>
                    <code className="px-1.5 py-0.5 bg-green-100 rounded text-green-900">{'{{company_name}}'}</code>
                    <code className="px-1.5 py-0.5 bg-green-100 rounded text-green-900">{'{{first_name}}'}</code>
                    <code className="px-1.5 py-0.5 bg-green-100 rounded text-green-900">{'{{job_title}}'}</code>
                  </div>
                </div>
              </div>

              {/* From Email */}
              <div>
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <Mail className="w-4 h-4 mr-2 text-green-600" />
                  Your Email
                </label>
                <input
                  type="email"
                  value={emailData.from_email}
                  onChange={(e) => setEmailData({ ...emailData, from_email: e.target.value })}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <FileText className="w-4 h-4 mr-2 text-green-600" />
                  Subject
                </label>
                <input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                  placeholder="e.g., Experienced Developer — Open to Opportunities at {{company_name}}"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                <div className="border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-green-500 bg-white">
                  <ReactQuill
                    value={emailData.body}
                    onChange={(val) => setEmailData({ ...emailData, body: val })}
                    modules={quillModules}
                    placeholder="Hi {{first_name}}, I came across your profile and noticed you recruit for roles in my area of expertise. I'd love to connect about opportunities at {{company_name}}..."
                    className="h-48"
                  />
                </div>
              </div>

              {/* Extra Attachments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Extra Attachments {attachments.length > 0 && `(${attachments.length})`}
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                  >
                    <Paperclip className="w-4 h-4" />
                    <span>Add Files</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    onChange={handleFileSelect}
                    accept="*/*"
                  />
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((att, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-3 py-2 bg-white border border-green-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <Paperclip className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{att.filename}</div>
                            <div className="text-xs text-gray-500">{formatFileSize(att.size)}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="p-1 hover:bg-red-100 rounded transition-colors flex-shrink-0"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full py-5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {emailData.from_email && emailData.subject && emailData.body
                ? 'Find Recruiters & Auto-Send Emails →'
                : 'Find Recruiters →'
              }
            </motion.button>
          </form>

          {/* Info Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary-600">10-30s</div>
                <div className="text-xs text-gray-500 mt-1">AI Search</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary-600">2-5min</div>
                <div className="text-xs text-gray-500 mt-1">With Scraping</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary-600">Auto</div>
                <div className="text-xs text-gray-500 mt-1">Personalized</div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
