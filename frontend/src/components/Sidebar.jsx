import { NavLink } from 'react-router-dom'

function NavItem({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-gold-500/10 text-gold-500 border border-gold-500/20'
            : 'text-slate-400 hover:text-slate-200 hover:bg-navy-600'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  )
}

const ChatIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
)

const AdminIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
  </svg>
)

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 bg-navy-900 border-r border-navy-400 flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-navy-400">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gold-500/15 border border-gold-500/30
                          flex items-center justify-center shrink-0">
            <span className="text-gold-500 text-xs font-bold tracking-wide">YS</span>
          </div>
          <div>
            <p className="text-gold-500 font-semibold text-sm leading-tight">Your Senior</p>
            <p className="text-slate-600 text-xs mt-0.5">Knowledge Assistant</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        <NavItem to="/"      label="Chat"      icon={<ChatIcon />} />
        <NavItem to="/admin" label="Dashboard" icon={<AdminIcon />} />
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-navy-400">
        <p className="text-slate-700 text-xs leading-relaxed">
          Powered by Claude + Gemini
        </p>
      </div>
    </aside>
  )
}
