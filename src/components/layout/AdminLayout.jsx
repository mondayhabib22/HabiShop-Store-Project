import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: '📊', exact: true },
  { to: '/admin/products', label: 'Products', icon: '📦' },
  { to: '/admin/orders', label: 'Orders', icon: '🛍️' },
  { to: '/admin/users', label: 'Users', icon: '👥' },
  { to: '/admin/categories', label: 'Categories', icon: '🗂️' },
  { to: '/admin/coupons', label: 'Coupons', icon: '🎟️' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (to, exact) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#e85d04] rounded-lg flex items-center justify-center text-white font-bold">H</div>
          <span className="font-bold text-white text-lg" style={{ fontFamily: 'Sora, sans-serif' }}>
            Habi<span className="text-[#e85d04]">Shop</span>
          </span>
        </Link>
        <span className="text-xs text-gray-400 mt-1 block">Admin Panel</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon, exact }) => (
          <Link key={to} to={to}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isActive(to, exact)
                ? 'bg-[#e85d04] text-white shadow-md shadow-orange-900/30'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="text-lg">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 mb-2">
          <div className="w-8 h-8 bg-[#e85d04] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
            {user?.name?.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <Link to="/" className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-gray-300 hover:bg-white/10 transition-colors">
          <span>🏠</span> View Store
        </Link>
        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-red-400 hover:bg-red-900/20 transition-colors">
          <span>🚪</span> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#1a1a2e] flex-col shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-[#1a1a2e] flex flex-col">
            <Sidebar />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-800 capitalize">
            {navItems.find((n) => isActive(n.to, n.exact))?.label || 'Admin'}
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Welcome,</span>
            <span className="font-semibold text-gray-800">{user?.name?.split(' ')[0]}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
