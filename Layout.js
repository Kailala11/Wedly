import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDaysUntil } from '../utils/helpers';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'events',    label: 'Events',    icon: '📋' },
  { id: 'cashflow',  label: 'Keuangan',  icon: '💰' },
  { id: 'settings',  label: 'Pengaturan',icon: '⚙️' },
];

export default function Layout({ page, setPage, children, urgentCount = 0 }) {
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAF9F7]">

      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-[#E5E0D8] flex-shrink-0">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-[#E5E0D8]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#D4537E]" />
            <span className="text-xl font-bold text-[#72243E]">Wedly</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Wedding Organizer App</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => setPage(n.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full text-left
                ${page === n.id
                  ? 'bg-[#FBEAF0] text-[#72243E]'
                  : 'text-gray-500 hover:bg-[#FAF9F7]'}`}
            >
              <span className="text-base">{n.icon}</span>
              {n.label}
              {n.id === 'dashboard' && urgentCount > 0 && (
                <span className="ml-auto bg-[#E24B4A] text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {urgentCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-[#E5E0D8]">
          <div className="text-xs text-gray-400 mb-1 truncate">{user?.email}</div>
          <button onClick={signOut} className="text-xs text-[#D4537E] font-semibold hover:underline">
            Keluar
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-white flex flex-col z-50">
            <div className="px-5 py-5 border-b border-[#E5E0D8] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#D4537E]" />
                <span className="text-xl font-bold text-[#72243E]">Wedly</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-gray-400 text-xl">×</button>
            </div>
            <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
              {NAV.map(n => (
                <button
                  key={n.id}
                  onClick={() => { setPage(n.id); setMobileOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full text-left
                    ${page === n.id ? 'bg-[#FBEAF0] text-[#72243E]' : 'text-gray-500 hover:bg-[#FAF9F7]'}`}
                >
                  <span className="text-base">{n.icon}</span>
                  {n.label}
                </button>
              ))}
            </nav>
            <div className="px-4 py-4 border-t border-[#E5E0D8]">
              <div className="text-xs text-gray-400 mb-1 truncate">{user?.email}</div>
              <button onClick={signOut} className="text-xs text-[#D4537E] font-semibold">Keluar</button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#E5E0D8]">
          <button onClick={() => setMobileOpen(true)} className="text-gray-500 text-xl">☰</button>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#D4537E]" />
            <span className="font-bold text-[#72243E]">Wedly</span>
          </div>
          {urgentCount > 0 && (
            <span className="bg-[#E24B4A] text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {urgentCount}
            </span>
          )}
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <div className="md:hidden flex bg-white border-t border-[#E5E0D8]">
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => setPage(n.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-semibold transition-colors
                ${page === n.id ? 'text-[#D4537E]' : 'text-gray-400'}`}
            >
              <span className="text-lg">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
