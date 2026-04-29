import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  UserCheck,
  UserCircle2,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ResearcherVerification from './components/ResearcherVerification';
import ReportManagement from './components/ReportManagement';
import UserManagement from './components/UserManagement';
import AdminProfile from './components/AdminProfile';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const savedAdmin = localStorage.getItem('admin');
    if (savedAdmin) {
      try {
        const adminData = JSON.parse(savedAdmin);
        setAdmin(adminData);
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem('admin');
      }
    }
  }, []);

  const handleLogin = (adminData) => {
    setAdmin(adminData);
    setIsAuthenticated(true);
    localStorage.setItem('admin', JSON.stringify(adminData));
  };

  const handleLogout = () => {
    setAdmin(null);
    setIsAuthenticated(false);
    localStorage.removeItem('admin');
  };

  const handleUpdateAdmin = (updatedAdmin) => {
    setAdmin(updatedAdmin);
    localStorage.setItem('admin', JSON.stringify(updatedAdmin));
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'researchers', label: 'Researchers', icon: UserCheck },
    { id: 'profile', label: 'Profile', icon: UserCircle2 },
  ];

  return (
    <div className="min-h-screen flex bg-[var(--bg)] text-[var(--text-dark)]">
      {/* Sidebar */}
      <aside
        className={`text-white transition-all duration-300 flex flex-col border-r border-white/10 shadow-2xl ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
        style={{ background: 'linear-gradient(180deg, var(--sidebar-bg) 0%, var(--sidebar-bg-soft) 100%)' }}
      >
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-lg" style={{ background: 'linear-gradient(135deg, var(--accent), #f8c93a)' }}>
            🦌
          </div>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-lg tracking-tight"
            >
              WildlynNorth
            </motion.div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`nav-button ${
                  isActive ? 'nav-button-active' : 'text-emerald-100/70'
                }`}
              >
                <Icon
                  size={20}
                  className={isActive ? 'text-[#1a2a0f]' : 'group-hover:text-white'}
                />
                {isSidebarOpen && <span className="font-medium">{item.label}</span>}
                {isActive && isSidebarOpen && (
                  <ChevronRight size={16} className="ml-auto opacity-70" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-emerald-100/70 hover:bg-red-500/12 hover:text-red-200 transition-all"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/95 backdrop-blur border-b flex items-center justify-between px-8 sticky top-0 z-10" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-light)' }}
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="text-xl font-semibold capitalize" style={{ color: 'var(--text-dark)' }}>
              {activeTab.replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <button
              className="flex items-center gap-3 pl-4 border-l bg-transparent"
              style={{ borderColor: 'var(--border-color)' }}
              onClick={() => setActiveTab('profile')}
              title="Open profile"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>{admin.username}</p>
                <p className="text-xs" style={{ color: 'var(--text-light)' }}>Administrator</p>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold border"
                style={{ background: 'var(--primary-soft)', color: 'var(--primary)', borderColor: 'var(--border-color)' }}
              >
                {admin.username[0].toUpperCase()}
              </div>
            </button>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <Dashboard admin={admin} onNavigate={(tab) => setActiveTab(tab)} />}
              {activeTab === 'reports' && <ReportManagement admin={admin} />}
              {activeTab === 'users' && <UserManagement admin={admin} />}
              {activeTab === 'researchers' && <ResearcherVerification admin={admin} />}
              {activeTab === 'profile' && <AdminProfile admin={admin} onUpdateAdmin={handleUpdateAdmin} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
