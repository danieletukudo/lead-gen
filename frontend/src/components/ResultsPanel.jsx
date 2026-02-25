import { motion } from 'framer-motion'
import { X, Download, Mail, Linkedin, Twitter, Users, MapPin, Send, FileText, FileJson, Briefcase, UserCheck, ExternalLink } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import EmailModal from './EmailModal'

export default function ResultsPanel({ results, config, onClose, onEmailAll }) {
  const [selectedRecruiter, setSelectedRecruiter] = useState(null)
  const [emailModalRecruiter, setEmailModalRecruiter] = useState(null)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportMenuRef = useRef(null)

  // Support both recruiters and companies keys
  const recruiters = results?.data?.recruiters || results?.data?.companies || []

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
    let txt = `RECRUITER OUTREACH RESULTS\n${'='.repeat(80)}\n\nRole: ${config.industry}\nCountry: ${config.country}\nTotal: ${recruiters.length}\nDate: ${new Date().toLocaleString()}\n\n${'='.repeat(80)}\n\n`
    recruiters.forEach((r, i) => {
      txt += `${i+1}. ${r.recruiter_name || r.company_name}\n${'-'.repeat(60)}\n`
      if (r.job_posted) txt += `Hiring: ${r.job_posted}\n`
      if (r.time_posted) txt += `Posted: ${r.time_posted}\n`
      if (r.job_description) txt += `Description: ${r.job_description}\n`
      if (r.company_name) txt += `Company: ${r.company_name}\n`
      if (r.contact_email) txt += `Email: ${r.contact_email}\n`
      if (r.linkedin_url) txt += `LinkedIn: ${r.linkedin_url}\n`
      if (r.location) txt += `Location: ${r.location}\n`
      if (r.specializations) txt += `Specializations: ${r.specializations.join(', ')}\n`
      if (r.recent_activity) txt += `Recent Activity: ${r.recent_activity}\n`
      txt += '\n'
    })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }))
    link.download = `recruiters_${config.industry.replace(/\s+/g, '_')}_${Date.now()}.txt`
    link.click()
    setShowExportMenu(false)
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25 }}
      className="fixed lg:relative inset-y-0 right-0 w-full sm:w-[480px] lg:w-[480px] bg-white border-l border-gray-200 flex flex-col shadow-2xl z-40"
    >
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Recruiters Found</h2>
          <div className="flex items-center space-x-2">
            {onEmailAll && recruiters.filter(r => r.contact_email).length > 0 && (
              <motion.button whileHover={{ scale: 1.05 }} onClick={onEmailAll} className="flex items-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                <Send className="w-4 h-4" /><span className="hidden sm:inline font-medium">Email All</span>
              </motion.button>
            )}
            <div className="relative" ref={exportMenuRef}>
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center space-x-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
                <Download className="w-4 h-4" /><span className="hidden sm:inline font-medium">Export</span>
              </motion.button>
              {showExportMenu && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-10">
                  <button onClick={exportJSON} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50"><FileJson className="w-5 h-5 text-blue-600" /><div className="text-sm font-medium">JSON</div></button>
                  <div className="border-t border-gray-100"></div>
                  <button onClick={exportTXT} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50"><FileText className="w-5 h-5 text-green-600" /><div className="text-sm font-medium">TXT</div></button>
                </motion.div>
              )}
            </div>
            {onClose && (
              <motion.button whileHover={{ scale: 1.1 }} onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-700" />
              </motion.button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary-50 rounded-xl p-3">
            <div className="text-sm text-primary-600 font-medium">Total Found</div>
            <div className="text-2xl font-bold text-primary-700 mt-1">{recruiters.length}</div>
          </div>
          <div className="bg-green-50 rounded-xl p-3">
            <div className="text-sm text-green-600 font-medium">With Emails</div>
            <div className="text-2xl font-bold text-green-700 mt-1">{recruiters.filter(r => r.contact_email).length}</div>
          </div>
        </div>
      </div>

      {/* Recruiter List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {recruiters.map((recruiter, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedRecruiter(selectedRecruiter === index ? null : index)}
            className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 cursor-pointer transition-all border border-gray-200 hover:border-primary-300"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg leading-tight">
                  {recruiter.recruiter_name || recruiter.company_name}
                </h3>
                {recruiter.job_posted && <p className="text-sm text-primary-600 font-medium mt-0.5">Hiring: {recruiter.job_posted}</p>}
                <p className="text-sm text-gray-500 mt-0.5">{recruiter.company_name}{recruiter.time_posted ? ` • ${recruiter.time_posted}` : ''}</p>
                {recruiter.job_description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{recruiter.job_description}</p>}
              </div>
              <UserCheck className="w-8 h-8 text-primary-500 flex-shrink-0" />
            </div>

            <div className="space-y-2 text-sm">
              {recruiter.contact_email && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-green-600 font-medium">
                    <Mail className="w-4 h-4 mr-2" />{recruiter.contact_email}
                  </div>
                  <motion.button whileHover={{ scale: 1.05 }} onClick={(e) => { e.stopPropagation(); setEmailModalRecruiter(recruiter) }}
                    className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-medium flex items-center space-x-1 transition-colors">
                    <Send className="w-3 h-3" /><span>Email</span>
                  </motion.button>
                </div>
              )}

              {recruiter.linkedin_url && (
                <a href={recruiter.linkedin_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                  className="flex items-center text-blue-600 hover:text-blue-800 transition-colors">
                  <Linkedin className="w-4 h-4 mr-2" /><span className="truncate">{recruiter.linkedin_url}</span>
                  <ExternalLink className="w-3 h-3 ml-1 flex-shrink-0" />
                </a>
              )}

              {recruiter.specializations && recruiter.specializations.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {recruiter.specializations.slice(0, 4).map((spec, i) => (
                    <span key={i} className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">{spec}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Expanded Details */}
            {selectedRecruiter === index && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                {recruiter.company_website && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Company Website</div>
                    <a href={recruiter.company_website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-sm text-primary-600 hover:underline">{recruiter.company_website}</a>
                  </div>
                )}
                {recruiter.company_type && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Type</div>
                    <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs capitalize">{recruiter.company_type}</span>
                  </div>
                )}
                {recruiter.company_size && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Company Size</div>
                    <div className="text-sm text-gray-700">{recruiter.company_size}</div>
                  </div>
                )}
                {recruiter.industries_served && recruiter.industries_served.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Industries Served</div>
                    <div className="flex flex-wrap gap-1.5">
                      {recruiter.industries_served.map((ind, i) => (
                        <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">{ind}</span>
                      ))}
                    </div>
                  </div>
                )}
                {recruiter.notable_clients_or_hires && recruiter.notable_clients_or_hires.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Notable Clients/Hires</div>
                    <div className="flex flex-wrap gap-1.5">
                      {recruiter.notable_clients_or_hires.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
                {recruiter.recent_activity && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Recent Activity</div>
                    <div className="text-sm text-gray-700 leading-relaxed">{recruiter.recent_activity}</div>
                  </div>
                )}
              </motion.div>
            )}

            <div className="mt-3 text-xs text-center text-gray-400">
              {selectedRecruiter === index ? 'Click to collapse' : 'Click to expand'}
            </div>
          </motion.div>
        ))}
      </div>

      {emailModalRecruiter && (
        <EmailModal company={emailModalRecruiter} onClose={() => setEmailModalRecruiter(null)} />
      )}
    </motion.div>
  )
}
