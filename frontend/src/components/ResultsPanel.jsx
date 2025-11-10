import { motion } from 'framer-motion'
import { X, Download, Building2, Mail, Linkedin, Twitter, Facebook, Instagram, Youtube, Users, MapPin, DollarSign, TrendingUp, Send, FileText, FileJson } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import EmailModal from './EmailModal'

const socialIcons = {
  linkedin: Linkedin,
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube
}

export default function ResultsPanel({ results, config, onClose }) {
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [emailModalCompany, setEmailModalCompany] = useState(null)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportMenuRef = useRef(null)
  const companies = results?.data?.companies || []

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
    let txtContent = `LEAD GENERATION RESULTS\n`
    txtContent += `${'='.repeat(80)}\n\n`
    txtContent += `Industry: ${config.industry}\n`
    txtContent += `Country: ${config.country}\n`
    txtContent += `Total Companies: ${companies.length}\n`
    txtContent += `Generated: ${new Date().toLocaleString()}\n`
    txtContent += `Web Scraping: ${config.enable_web_scraping ? 'Enabled' : 'Disabled'}\n\n`
    txtContent += `${'='.repeat(80)}\n\n`

    companies.forEach((company, index) => {
      txtContent += `${index + 1}. ${company.company_name}\n`
      txtContent += `${'-'.repeat(80)}\n`

      if (company.website_url) txtContent += `Website: ${company.website_url}\n`
      if (company.company_size) txtContent += `Size: ${company.company_size}\n`
      if (company.headquarters_location) txtContent += `Location: ${company.headquarters_location}\n`
      if (company.revenue_market_cap) txtContent += `Revenue: ${company.revenue_market_cap}\n`
      if (company.number_of_users) txtContent += `Users: ${company.number_of_users}\n`

      // Contact Information
      txtContent += `\nContact Information:\n`
      if (company.contact_email) txtContent += `  Email: ${company.contact_email}\n`
      if (company.additional_emails && company.additional_emails.length > 0) {
        txtContent += `  Additional Emails:\n`
        company.additional_emails.forEach(email => {
          txtContent += `    - ${email}\n`
        })
      }

      // Social Media
      if (company.social_media) {
        txtContent += `\nSocial Media:\n`
        Object.entries(company.social_media).forEach(([platform, url]) => {
          if (url) txtContent += `  ${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${url}\n`
        })
      }

      // Business Information
      if (company.key_products_services) {
        txtContent += `\nProducts/Services: ${company.key_products_services}\n`
      }
      if (company.target_market) {
        txtContent += `Target Market: ${company.target_market}\n`
      }

      // Customers
      if (company.notable_customers && company.notable_customers.length > 0) {
        txtContent += `\nNotable Customers:\n`
        company.notable_customers.forEach(customer => {
          txtContent += `  - ${customer}\n`
        })
      }

      // Decision Makers
      if (company.decision_maker_roles && company.decision_maker_roles.length > 0) {
        txtContent += `\nDecision Maker Roles:\n`
        company.decision_maker_roles.forEach(role => {
          txtContent += `  - ${role}\n`
        })
      }

      // News
      if (company.recent_news_insights) {
        txtContent += `\nRecent News: ${company.recent_news_insights}\n`
      }

      txtContent += `\n${'='.repeat(80)}\n\n`
    })

    const dataBlob = new Blob([txtContent], { type: 'text/plain' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `leads_${config.industry.replace(/\s+/g, '_')}_${Date.now()}.txt`
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
          <div className="flex items-center space-x-2">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Lead Results</h2>
          </div>

          <div className="flex items-center space-x-2">

            {/* Export Dropdown */}
            <div className="relative" ref={exportMenuRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Export</span>
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
                  className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-10"
                >
                  <button
                    onClick={exportJSON}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <FileJson className="w-5 h-5 text-blue-600" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900">Export as JSON</div>
                      <div className="text-xs text-gray-500">Structured data format</div>
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
                      <div className="text-xs text-gray-500">Human-readable format</div>
                    </div>
                  </button>
                </motion.div>
              )}
            </div>

            {/* Close Button (Mobile & All Devices) */}
            {onClose && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="Close results panel"
              >
                <X className="w-5 h-5 text-gray-700" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary-50 rounded-xl p-3">
            <div className="text-sm text-primary-600 font-medium">Total Leads</div>
            <div className="text-2xl font-bold text-primary-700 mt-1">{companies.length}</div>
          </div>
          <div className="bg-green-50 rounded-xl p-3">
            <div className="text-sm text-green-600 font-medium">With Emails</div>
            <div className="text-2xl font-bold text-green-700 mt-1">
              {companies.filter(c => c.contact_email).length}
            </div>
          </div>
        </div>
      </div>

      {/* Company List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {companies.map((company, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedCompany(selectedCompany === index ? null : index)}
            className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 cursor-pointer transition-all border border-gray-200 hover:border-primary-300"
          >
            {/* Company Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg leading-tight">
                  {company.company_name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {company.headquarters_location}
                </p>
              </div>
              <Building2 className="w-8 h-8 text-primary-500 flex-shrink-0" />
            </div>

            {/* Quick Info */}
            <div className="space-y-2 text-sm">
              {company.company_size && (
                <div className="flex items-center text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  {company.company_size}
                </div>
              )}

              {company.contact_email && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-green-600 font-medium">
                    <Mail className="w-4 h-4 mr-2" />
                    {company.contact_email}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setEmailModalCompany(company)
                    }}
                    className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-medium flex items-center space-x-1 transition-colors"
                  >
                    <Send className="w-3 h-3" />
                    <span>Email</span>
                  </motion.button>
                </div>
              )}
            </div>

            {/* Social Media Icons */}
            {company.social_media && (
              <div className="flex items-center space-x-2 mt-3">
                {Object.entries(company.social_media).map(([platform, url]) => {
                  if (!url) return null
                  const Icon = socialIcons[platform]
                  if (!Icon) return null

                  return (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 bg-white rounded-lg hover:bg-primary-50 transition-colors"
                    >
                      <Icon className="w-4 h-4 text-gray-600 hover:text-primary-600" />
                    </a>
                  )
                })}
              </div>
            )}

            {/* Expanded Details */}
            {selectedCompany === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-4 pt-4 border-t border-gray-200 space-y-3"
              >
                {company.website_url && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Website</div>
                    <a
                      href={company.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {company.website_url}
                    </a>
                  </div>
                )}

                {company.revenue_market_cap && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Revenue</div>
                    <div className="text-sm text-gray-700">{company.revenue_market_cap}</div>
                  </div>
                )}

                {company.number_of_users && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Users</div>
                    <div className="text-sm text-gray-700">{company.number_of_users}</div>
                  </div>
                )}

                {company.key_products_services && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Products/Services</div>
                    <div className="text-sm text-gray-700">{company.key_products_services}</div>
                  </div>
                )}

                {company.notable_customers && company.notable_customers.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Notable Customers</div>
                    <div className="flex flex-wrap gap-2">
                      {company.notable_customers.map((customer, i) => (
                        <span key={i} className="px-2 py-1 bg-primary-100 text-primary-700 rounded-lg text-xs">
                          {customer}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {company.additional_emails && company.additional_emails.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Additional Emails</div>
                    <div className="space-y-1">
                      {company.additional_emails.map((email, i) => (
                        <div key={i} className="text-sm text-gray-600">{email}</div>
                      ))}
                    </div>
                  </div>
                )}

                {company.decision_maker_roles && company.decision_maker_roles.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Decision Makers</div>
                    <div className="flex flex-wrap gap-2">
                      {company.decision_maker_roles.slice(0, 5).map((role, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {company.recent_news_insights && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Recent News</div>
                    <div className="text-sm text-gray-700 leading-relaxed">{company.recent_news_insights}</div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Click to expand indicator */}
            <div className="mt-3 text-xs text-center text-gray-400">
              {selectedCompany === index ? 'Click to collapse' : 'Click to expand'}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Email Modal */}
      {emailModalCompany && (
        <EmailModal
          company={emailModalCompany}
          onClose={() => setEmailModalCompany(null)}
        />
      )}
    </motion.div>
  )
}

