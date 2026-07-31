import React, { useState, useEffect, createContext, useContext } from 'react';
import { Navigate, Link, NavLink, useNavigate } from 'react-router-dom';
import {
  FiHome, FiBriefcase, FiCalendar, FiDollarSign, FiFileText,
  FiCreditCard, FiUser, FiBell, FiLogOut, FiGlobe, FiMenu, FiX
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/portalApi';
import { useLanguage } from '../../context/LanguageContext';
import { ar as arTranslations, en as enTranslations } from '../../utils/translations';
import { initials } from './portalUtils';
import './Portal.css';

const PortalContext = createContext();

export const usePortal = () => {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error('usePortal must be used within a PortalProvider');
  }
  return context;
};

const PortalProvider = ({ children }) => {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const { language, toggleLanguage } = useLanguage();
  const t = language === 'ar' ? arTranslations.portal : enTranslations.portal;

  useEffect(() => {
    const token = localStorage.getItem('portalToken');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/portal/profile');
      setClient(res.data.client);
    } catch {
      localStorage.removeItem('portalToken');
      setClient(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/portal/login', { email, password });
    localStorage.setItem('portalToken', res.data.token);
    setClient(res.data.client);
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/portal/logout');
    } catch {
      // token may already be invalid; clear local state regardless
    }
    localStorage.removeItem('portalToken');
    setClient(null);
  };

  return (
    <PortalContext.Provider value={{ client, loading, login, logout, t, language, toggleLanguage }}>
      {children}
    </PortalContext.Provider>
  );
};

export const ProtectedPortal = ({ children }) => {
  const { client, loading, t } = usePortal();
  if (loading) {
    return (
      <div className="portal-loading">
        <div className="portal-spinner" aria-hidden="true" />
        <p>{t.loading}</p>
      </div>
    );
  }
  return client ? children : <Navigate to="/portal/login" replace />;
};

export const PortalLayout = ({ children }) => {
  const { client, logout, t, language, toggleLanguage } = usePortal();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 1024) setMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success(t.loggedOut);
    navigate('/portal/login', { replace: true });
  };

  const navItems = [
    { path: '/portal', icon: FiHome, label: t.dashboard, end: true },
    { path: '/portal/cases', icon: FiBriefcase, label: t.myCases },
    { path: '/portal/sessions', icon: FiCalendar, label: t.sessions },
    { path: '/portal/invoices', icon: FiDollarSign, label: t.invoices },
    { path: '/portal/documents', icon: FiFileText, label: t.documents },
    { path: '/portal/payments', icon: FiCreditCard, label: t.payments },
    { path: '/portal/profile', icon: FiUser, label: t.profile },
    { path: '/portal/notifications', icon: FiBell, label: t.notifications }
  ];

  return (
    <div className="portal-layout" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <header className="portal-header">
        <div className="portal-header-content">
          <button
            className="portal-menu-toggle"
            onClick={() => setMenuOpen(true)}
            aria-label={t.dashboard}
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            <FiMenu />
          </button>

          <Link to="/portal" className="portal-logo">
            <span className="portal-logo-icon" aria-hidden="true"><FiBriefcase /></span>
            <h1>{t.portalName}</h1>
          </Link>

          <nav className={`portal-nav ${menuOpen ? 'open' : ''}`} aria-label={t.dashboard}>
            <div className="portal-nav-close">
              <button onClick={closeMenu} aria-label="Close">
                <FiX />
              </button>
            </div>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) => (isActive ? 'active' : '')}
                onClick={closeMenu}
              >
                <item.icon />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {menuOpen && (
            <button
              className="portal-mobile-overlay"
              onClick={closeMenu}
              aria-label="Close"
            />
          )}

          <div className="portal-header-actions">
            <button
              className="portal-icon-btn"
              onClick={toggleLanguage}
              title={t.language}
              aria-label={t.language}
            >
              <FiGlobe />
            </button>
            <div className="portal-user">
              <span className="portal-user-avatar">{initials(client?.name)}</span>
              <span className="portal-user-name">{client?.name}</span>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
              <FiLogOut /> {t.logout}
            </button>
          </div>
        </div>
      </header>
      <main className="portal-main">{children}</main>
    </div>
  );
};

export { PortalProvider };
