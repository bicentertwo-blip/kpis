import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { Sidebar } from '@/components/navigation/Sidebar'
import { TopBar } from '@/components/navigation/TopBar'
import { cn } from '@/utils/ui'

// iOS-optimized animation variants
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const sidebarVariants = {
  hidden: { 
    x: '-100%',
    // Use transform3d for iOS GPU acceleration
    transform: 'translate3d(-100%, 0, 0)',
  },
  visible: { 
    x: 0,
    transform: 'translate3d(0, 0, 0)',
  },
}

const contentVariants = {
  hidden: { 
    opacity: 0, 
    y: 8,
    transform: 'translate3d(0, 8px, 0)',
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transform: 'translate3d(0, 0, 0)',
  },
}

export const AppShell = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="relative min-h-[100dvh]">
      {/* Background mesh gradient - simplified for iOS */}
      <div 
        className="fixed inset-0 bg-mesh-gradient pointer-events-none" 
        style={{ 
          // Prevent iOS background repaint
          WebkitTransform: 'translateZ(0)',
          transform: 'translateZ(0)',
        }}
        aria-hidden="true"
      />
      
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={cn(
          'fixed bottom-6 right-6 z-50 lg:hidden',
          'flex items-center justify-center',
          'w-14 h-14 rounded-full',
          'bg-gradient-to-r from-plasma-blue to-plasma-indigo text-white',
          'shadow-glow',
          'transition-transform duration-200', // Faster transition
          'touch-manipulation', // iOS touch optimization
          sidebarOpen && 'rotate-90'
        )}
        style={{ 
          WebkitTapHighlightColor: 'transparent',
          WebkitTransform: 'translateZ(0)',
        }}
        aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
      >
        {sidebarOpen ? <X className="size-6" /> : <Menu className="size-6" />}
      </button>

      {/* Mobile sidebar backdrop */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }} // Faster for iOS
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-vision-ink/20 backdrop-blur-sm lg:hidden"
            style={{
              // iOS backdrop-filter fix
              WebkitBackdropFilter: 'blur(4px)',
              WebkitTransform: 'translateZ(0)',
            }}
          />
        )}
      </AnimatePresence>

      <div className="flex min-h-[100dvh]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block lg:w-80 xl:w-[340px] flex-shrink-0 p-4 xl:p-6">
          <Sidebar />
        </aside>

        {/* Mobile sidebar */}
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.aside
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ 
                type: 'spring', 
                damping: 30, 
                stiffness: 350,
                mass: 0.8, // Lighter for snappier feel on iOS
              }}
              className="fixed inset-y-0 left-0 z-50 w-80 p-4 lg:hidden"
              style={{
                // iOS GPU acceleration
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
                WebkitPerspective: 1000,
                perspective: 1000,
              }}
            >
              <Sidebar onNavigate={() => setSidebarOpen(false)} />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 lg:pl-0">
          <TopBar onMenuClick={() => setSidebarOpen(true)} />
          <div className="flex-1 mt-4 lg:mt-6">
            <motion.div
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              transition={{ 
                duration: 0.3, 
                delay: 0.05,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className="h-full"
              style={{
                // iOS GPU acceleration
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
              }}
            >
              <Outlet />
            </motion.div>
          </div>
          {/* Safe area for mobile */}
          <div className="h-20 lg:h-6 flex-shrink-0 safe-bottom" />
        </main>
      </div>
    </div>
  )
}
