import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  FiHome, FiBriefcase, FiUsers, FiCalendar, FiDollarSign,
  FiFileText, FiSend, FiMap, FiBell, FiBarChart2,
  FiSettings, FiLogOut, FiMenu, FiX, FiUser, FiGlobe, FiShield, FiClock
} from 'react-icons/fi';

const Layout = () => {
  const { user, logout } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { path: '/dashboard', icon: FiHome, label: t.dashboard },
    { path: '/dashboard/cases', icon: FiBriefcase, label: t.cases },
    { path: '/dashboard/clients', icon: FiUsers, label: t.clients },
    { path: '/dashboard/sessions', icon: FiCalendar, label: t.sessions },
    { path: '/dashboard/invoices', icon: FiDollarSign, label: t.invoices },
    { path: '/dashboard/documents', icon: FiFileText, label: t.legalDocuments },
    { path: '/dashboard/transactions', icon: FiSend, label: t.transactions },
    { path: '/dashboard/court-agent', icon: FiMap, label: t.courtAgent },
    { path: '/dashboard/reports', icon: FiBarChart2, label: t.reports },
    { path: '/dashboard/time-tracking', icon: FiClock, label: t.timeTracking || 'تتبع الوقت' },
    ...(user?.role === 'admin' ? [
      { path: '/dashboard/users', icon: FiShield, label: t.userManagement || 'إدارة المستخدمين' },
      { path: '/dashboard/portal-users', icon: FiGlobe, label: 'Portal Users' }
    ] : [])
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="layout">
      <aside
        className={`sidebar no-print ${sidebarOpen ? 'open' : ''}`}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="sidebar-header">
          <h2>{t.appName}</h2>
          <button className="close-btn" onClick={() => setSidebarOpen(false)}>
            <FiX />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path)) ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info" onClick={handleLogout} style={{ cursor: 'pointer' }} title={t.logout}>
            <FiUser />
            <span>{user?.fullName}</span>
            <FiLogOut style={{ marginInlineStart: 'auto' }} />
          </div>

          <div className="sidebar-footer-actions">
            <button className="language-btn" onClick={toggleLanguage}>
              <FiGlobe />
              <span>{language === 'ar' ? t.english : t.arabic}</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar no-print">
          <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
            <FiMenu />
          </button>
          <h1>{menuItems.find(item => item.path === location.pathname)?.label || t.dashboard}</h1>
          <Link to="/dashboard/notifications" className="top-bar-notification" title={t.notifications}>
            <FiBell />
          </Link>
        </header>

        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
