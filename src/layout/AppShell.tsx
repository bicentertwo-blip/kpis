import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { Sidebar } from '@/components/navigation/Sidebar'
import { TopBar } from '@/components/navigation/TopBar'
import { cn } from '@/utils/ui'

export const AppShell = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="relative min-h-[100dvh]">
      {/* Background mesh gradient */}
      <div 
        className="fixed inset-0 bg-mesh-gradient pointer-events-none gpu-accelerated" 
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
          'active:scale-95',
          'touch-manipulation',
          sidebarOpen && 'rotate-90'
        )}
        style={{ 
          WebkitTapHighlightColor: 'transparent',
          transition: 'transform 0.15s ease-out',
        }}
        aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
      >
        {sidebarOpen ? <X className="size-6" /> : <Menu className="size-6" />}
      </button>

      {/* Mobile sidebar backdrop - NO blur en iOS para evitar parpadeo */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-vision-ink/30 lg:hidden gpu-accelerated"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <div className="flex min-h-[100dvh]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block lg:w-80 xl:w-[340px] flex-shrink-0 p-4 xl:p-6">
          <Sidebar />
        </aside>

        {/* Mobile sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ 
                type: 'tween',
                duration: 0.25,
                ease: [0.32, 0.72, 0, 1], // iOS-like ease
              }}
              className="fixed inset-y-0 left-0 z-50 w-80 p-4 lg:hidden gpu-accelerated"
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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="h-full gpu-accelerated"
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
