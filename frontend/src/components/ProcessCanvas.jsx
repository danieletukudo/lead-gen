import { motion } from 'framer-motion'
import ProcessNode from './ProcessNode'

export default function ProcessCanvas({ stages, currentStage, isProcessing, config, results }) {
  return (
    <div className="absolute inset-0 flex items-center p-4 sm:p-8 overflow-x-auto overflow-y-hidden">
      <div className="flex items-start space-x-4 sm:space-x-8 min-w-max mx-auto">
        {stages.map((stage, index) => (
          <div key={stage.id} className="flex items-center">
            <ProcessNode
              stage={stage}
              index={index}
              isActive={index === currentStage}
              isCompleted={index < currentStage}
              isProcessing={isProcessing && index === currentStage}
              config={config}
              results={results}
            />

            {/* Connector Line */}
            {index < stages.length - 1 && (
              <div className="relative h-0.5 w-16 mx-4">
                <div className="absolute inset-0 bg-gray-200"></div>
                <motion.div
                  className="absolute inset-0 bg-primary-500"
                  initial={{ scaleX: 0 }}
                  animate={{
                    scaleX: index < currentStage ? 1 : 0
                  }}
                  transition={{ duration: 0.5 }}
                  style={{ transformOrigin: 'left' }}
                ></motion.div>

                {/* Animated dot */}
                {index === currentStage - 1 && isProcessing && (
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary-500 rounded-full"
                    animate={{ x: [0, 64] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                )}
              </div>
            )}
          </div>
        ))}

        {/* Completion Message */}
        {results && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 sm:mt-8 md:mt-12 text-center px-4 min-w-max"
          >
            <div className="inline-flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-green-100 text-green-700 rounded-full font-semibold text-sm sm:text-base whitespace-nowrap">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>
                {results.data?.companies?.length || 0} leads generated
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

