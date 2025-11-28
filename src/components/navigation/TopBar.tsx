import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { Search, Menu, Bell } from 'lucide-react'

interface TopBarProps {
  onMenuClick?: () => void
}

const formatPageTitle = (path: string) => {
  const segment = path.replace('/', '').replace(/-/g, ' ')
  if (!segment) return 'Dashboard'
  return segment.charAt(0).toUpperCase() + segment.slice(1)
}

export const TopBar = ({ onMenuClick }: TopBarProps) => {
  const location = useLocation()
  const pageTitle = formatPageTitle(location.pathname)

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel sticky top-4 lg:top-6 z-10 rounded-2xl lg:rounded-3xl"
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 lg:px-6 lg:py-4">
        {/* Left section */}
        <div className="flex items-center gap-3 lg:gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-white/60 text-vision-ink hover:bg-white/80 transition-colors"
          >
            <Menu className="size-5" />
          </button>
          
          <div>
            <p className="text-[10px] lg:text-xs uppercase tracking-[0.25em] lg:tracking-[0.3em] text-soft-slate font-medium">
              {pageTitle}
            </p>
            <h1 className="text-lg lg:text-xl font-semibold text-vision-ink leading-tight">
              Panel ejecutivo
            </h1>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Search - hidden on mobile, visible on tablet+ */}
          <div className="hidden sm:flex items-center gap-2 rounded-xl lg:rounded-2xl border border-white/50 bg-white/50 hover:bg-white/70 px-3 lg:px-4 py-2 lg:py-2.5 transition-all duration-200 focus-within:border-plasma-blue/30 focus-within:bg-white/70 focus-within:shadow-soft">
            <Search className="size-4 text-soft-slate flex-shrink-0" />
            <input
              className="w-32 lg:w-48 xl:w-64 bg-transparent text-sm outline-none placeholder:text-soft-slate/60"
              placeholder="Buscar..."
            />
          </div>

          {/* Search icon for mobile */}
          <button className="sm:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-white/50 text-soft-slate hover:bg-white/70 hover:text-vision-ink transition-all">
            <Search className="size-5" />
          </button>

          {/* Notifications */}
          <button className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white/50 text-soft-slate hover:bg-white/70 hover:text-vision-ink transition-all">
            <Bell className="size-5" />
            {/* Notification dot */}
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-plasma-blue animate-pulse" />
          </button>
        </div>
      </div>
    </motion.header>
  )
}
