import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import { Plus } from 'lucide-react'

export default function Layout() {
  const navigate = useNavigate()

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
      <BottomNav />
      <button
        className="fab"
        onClick={() => navigate('/transactions?addNew=true')}
        aria-label="Quick add transaction"
        title="Add Transaction"
      >
        <Plus size={24} />
      </button>
    </div>
  )
}
