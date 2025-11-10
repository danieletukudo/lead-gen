import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Building2, Globe, Hash, Zap, ArrowLeft } from 'lucide-react'

export default function InputForm({ onStart, onBack }) {
  const [formData, setFormData] = useState({
    industry: '',
    number: 10,
    country: 'USA',
    enable_web_scraping: true
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.industry.trim()) {
      onStart(formData)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Back button */}
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
      
      {/* Background decoration */}
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
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-5xl font-bold text-gray-900 mb-4"
          >
            AI Lead Generator
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-600"
          >
            Generate qualified leads with AI-powered intelligence
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
            {/* Industry Input */}
            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                <Building2 className="w-5 h-5 mr-2 text-primary-500" />
                Target Industry
              </label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="e.g., health insurance, technology, finance"
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors text-lg"
                required
              />
            </div>

            {/* Number of Companies */}
            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                <Hash className="w-5 h-5 mr-2 text-primary-500" />
                Number of Companies
              </label>
              <input
                type="number"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) })}
                min="1"
                max="50"
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors text-lg"
                required
              />
              <p className="mt-2 text-sm text-gray-500">Maximum 50 companies per request</p>
            </div>

            {/* Country Input */}
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
                  <option value="China">China</option>
                  <option value="Japan">Japan</option>
                  <option value="Singapore">Singapore</option>
                </optgroup>
                <optgroup label="Africa">
                  <option value="Algeria">Algeria</option>
                  <option value="Angola">Angola</option>
                  <option value="Egypt">Egypt</option>
                  <option value="Ethiopia">Ethiopia</option>
                  <option value="Ghana">Ghana</option>
                  <option value="Kenya">Kenya</option>
                  <option value="Morocco">Morocco</option>
                  <option value="Nigeria">Nigeria</option>
                  <option value="South Africa">South Africa</option>
                  <option value="Tanzania">Tanzania</option>
                  <option value="Tunisia">Tunisia</option>
                  <option value="Uganda">Uganda</option>
                </optgroup>
                <optgroup label="Asia">
                  <option value="Afghanistan">Afghanistan</option>
                  <option value="Bangladesh">Bangladesh</option>
                  <option value="Cambodia">Cambodia</option>
                  <option value="Hong Kong">Hong Kong</option>
                  <option value="Indonesia">Indonesia</option>
                  <option value="Israel">Israel</option>
                  <option value="Jordan">Jordan</option>
                  <option value="Kazakhstan">Kazakhstan</option>
                  <option value="South Korea">South Korea</option>
                  <option value="Lebanon">Lebanon</option>
                  <option value="Malaysia">Malaysia</option>
                  <option value="Myanmar">Myanmar</option>
                  <option value="Nepal">Nepal</option>
                  <option value="Pakistan">Pakistan</option>
                  <option value="Philippines">Philippines</option>
                  <option value="Qatar">Qatar</option>
                  <option value="Saudi Arabia">Saudi Arabia</option>
                  <option value="Sri Lanka">Sri Lanka</option>
                  <option value="Taiwan">Taiwan</option>
                  <option value="Thailand">Thailand</option>
                  <option value="Turkey">Turkey</option>
                  <option value="UAE">United Arab Emirates</option>
                  <option value="Vietnam">Vietnam</option>
                </optgroup>
                <optgroup label="Europe">
                  <option value="Albania">Albania</option>
                  <option value="Austria">Austria</option>
                  <option value="Belgium">Belgium</option>
                  <option value="Bulgaria">Bulgaria</option>
                  <option value="Croatia">Croatia</option>
                  <option value="Cyprus">Cyprus</option>
                  <option value="Czech Republic">Czech Republic</option>
                  <option value="Denmark">Denmark</option>
                  <option value="Estonia">Estonia</option>
                  <option value="Finland">Finland</option>
                  <option value="Greece">Greece</option>
                  <option value="Hungary">Hungary</option>
                  <option value="Iceland">Iceland</option>
                  <option value="Ireland">Ireland</option>
                  <option value="Italy">Italy</option>
                  <option value="Latvia">Latvia</option>
                  <option value="Lithuania">Lithuania</option>
                  <option value="Luxembourg">Luxembourg</option>
                  <option value="Malta">Malta</option>
                  <option value="Netherlands">Netherlands</option>
                  <option value="Norway">Norway</option>
                  <option value="Poland">Poland</option>
                  <option value="Portugal">Portugal</option>
                  <option value="Romania">Romania</option>
                  <option value="Russia">Russia</option>
                  <option value="Serbia">Serbia</option>
                  <option value="Slovakia">Slovakia</option>
                  <option value="Slovenia">Slovenia</option>
                  <option value="Spain">Spain</option>
                  <option value="Sweden">Sweden</option>
                  <option value="Switzerland">Switzerland</option>
                  <option value="Ukraine">Ukraine</option>
                </optgroup>
                <optgroup label="North America">
                  <option value="Costa Rica">Costa Rica</option>
                  <option value="Cuba">Cuba</option>
                  <option value="Dominican Republic">Dominican Republic</option>
                  <option value="El Salvador">El Salvador</option>
                  <option value="Guatemala">Guatemala</option>
                  <option value="Honduras">Honduras</option>
                  <option value="Jamaica">Jamaica</option>
                  <option value="Mexico">Mexico</option>
                  <option value="Nicaragua">Nicaragua</option>
                  <option value="Panama">Panama</option>
                  <option value="Puerto Rico">Puerto Rico</option>
                  <option value="Trinidad and Tobago">Trinidad and Tobago</option>
                </optgroup>
                <optgroup label="South America">
                  <option value="Argentina">Argentina</option>
                  <option value="Bolivia">Bolivia</option>
                  <option value="Brazil">Brazil</option>
                  <option value="Chile">Chile</option>
                  <option value="Colombia">Colombia</option>
                  <option value="Ecuador">Ecuador</option>
                  <option value="Paraguay">Paraguay</option>
                  <option value="Peru">Peru</option>
                  <option value="Uruguay">Uruguay</option>
                  <option value="Venezuela">Venezuela</option>
                </optgroup>
                <optgroup label="Oceania">
                  <option value="Fiji">Fiji</option>
                  <option value="New Zealand">New Zealand</option>
                  <option value="Papua New Guinea">Papua New Guinea</option>
                  <option value="Solomon Islands">Solomon Islands</option>
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

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full py-5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Generate Leads →
            </motion.button>
          </form>

          {/* Info Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary-600">10-30s</div>
                <div className="text-xs text-gray-500 mt-1">AI Generation</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary-600">2-5min</div>
                <div className="text-xs text-gray-500 mt-1">With Scraping</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary-600">100%</div>
                <div className="text-xs text-gray-500 mt-1">Accuracy</div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

