import { motion } from 'framer-motion'
import { Brain, Globe, Database, CheckCircle, Loader, Sparkles } from 'lucide-react'

const icons = {
  1: Sparkles,
  2: Brain,
  3: Globe,
  4: Database,
  5: CheckCircle
}

export default function ProcessNode({ stage, index, isActive, isCompleted, isProcessing }) {
  const Icon = icons[stage.id] || Brain

  return (
    <div className="flex flex-col items-center">
      {/* Node Circle */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{
          scale: isActive ? 1.1 : 1,
          opacity: 1
        }}
        transition={{ delay: index * 0.1 }}
        className="relative"
      >
        {/* Outer glow effect */}
        {isActive && (
          <motion.div
            className="absolute inset-0 bg-primary-500 rounded-3xl blur-xl opacity-30"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        {/* Main node card */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className={`
            relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-2xl sm:rounded-3xl shadow-lg flex flex-col items-center justify-center
            transition-all duration-300
            ${isCompleted
              ? 'bg-green-50 border-2 border-green-500'
              : isActive
                ? 'bg-white border-2 border-primary-500 node-glow'
                : 'bg-white border-2 border-gray-200'
            }
          `}
        >
          {/* Icon */}
          <motion.div
            animate={isProcessing ? { rotate: 360 } : {}}
            transition={isProcessing ? { duration: 2, repeat: Infinity, ease: "linear" } : {}}
            className={`
              w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-3 md:mb-4
              ${isCompleted
                ? 'bg-green-500'
                : isActive
                  ? 'bg-primary-500'
                  : 'bg-gray-200'
              }
            `}
          >
            {isProcessing ? (
              <Loader className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
            ) : (
              <Icon className={`w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 ${isCompleted || isActive ? 'text-white' : 'text-gray-500'}`} />
            )}
          </motion.div>

          {/* Stage Name */}
          <h3 className={`
            text-sm sm:text-base md:text-lg font-bold text-center
            ${isCompleted ? 'text-green-700' : isActive ? 'text-primary-700' : 'text-gray-500'}
          `}>
            {stage.name}
          </h3>

          {/* Description */}
          <p className="text-xs sm:text-sm text-gray-500 text-center mt-1 sm:mt-2 px-2 sm:px-4 hidden sm:block">
            {stage.description}
          </p>

          {/* Progress indicator */}
          {isProcessing && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '80%' }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute bottom-4 h-1 bg-primary-500 rounded-full"
            />
          )}

          {/* Checkmark for completed */}
          {isCompleted && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-3 -right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
            >
              <CheckCircle className="w-5 h-5 text-white" />
            </motion.div>
          )}

          {/* Pulse effect for active node */}
          {isActive && (
            <motion.div
              className="absolute inset-0 border-2 border-primary-500 rounded-3xl"
              animate={{ opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.div>
      </motion.div>

      {/* Stage Number */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.1 + 0.2 }}
        className={`
          mt-4 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
          ${isCompleted
            ? 'bg-green-500 text-white'
            : isActive
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 text-gray-500'
          }
        `}
      >
        {stage.id}
      </motion.div>
    </div>
  )
}

