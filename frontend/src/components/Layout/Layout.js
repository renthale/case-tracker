import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  FiHome, FiBriefcase, FiUsers, FiCalendar, FiDollarSign,
  FiFileText, FiSend, FiMap, FiBell, FiBarChart2,
  FiSettings, FiLogOut, FiMenu, FiX, FiUser, FiGlobe
} from 'react-icons/fi';

const Layout = () => {
  const { user, logout } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { path: '/', icon: FiHome, label: t.dashboard },
    { path: '/cases', icon: FiBriefcase, label: t.cases },
    { path: '/clients', icon: FiUsers, label: t.clients },
    { path: '/sessions', icon: FiCalendar, label: t.sessions },
    { path: '/invoices', icon: FiDollarSign, label: t.invoices },
    { path: '/documents', icon: FiFileText, label: t.legalDocuments },
    { path: '/transactions', icon: FiSend, label: t.transactions },
    { path: '/court-agent', icon: FiMap, label: t.courtAgent },
    { path: '/notifications', icon: FiBell, label: t.notifications },
    { path: '/reports', icon: FiBarChart2, label: t.reports }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside
        className={`sidebar ${sidebarOpen ? 'open' : ''}`}
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
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="language-btn" onClick={toggleLanguage}>
            <FiGlobe />
            <span>{language === 'ar' ? t.english : t.arabic}</span>
          </button>

          <div className="user-info">
            <FiUser />
            <span>{user?.fullName}</span>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <FiLogOut />
            <span>{t.logout}</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
            <FiMenu />
          </button>
          <h1>{menuItems.find(item => item.path === location.pathname)?.label || t.dashboard}</h1>
        </header>

        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
