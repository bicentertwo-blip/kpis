import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/navigation/Sidebar'
import { TopBar } from '@/components/navigation/TopBar'

export const AppShell = () => (
  <div className="flex gap-6 bg-vision-gradient px-6 pb-6">
    <Sidebar />
    <main className="flex-1 space-y-6 pb-10">
      <TopBar />
      <Outlet />
    </main>
  </div>
)
