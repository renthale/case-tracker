import React, { useState, useEffect, createContext, useContext } from 'react';
import { Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import api from '../../services/portalApi';
import PortalLogin from './PortalLogin';
import PortalDashboard from './PortalDashboard';
import PortalCases from './PortalCases';
import PortalCaseDetails from './PortalCaseDetails';
import PortalInvoices from './PortalInvoices';
import './Portal.css';

const PortalContext = createContext();

export const usePortal = () => useContext(PortalContext);

const PortalProvider = ({ children }) => {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('portalToken');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/portal/profile');
      setClient(res.data.client);
    } catch {
      localStorage.removeItem('portalToken');
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

  const logout = () => {
    localStorage.removeItem('portalToken');
    setClient(null);
  };

  return (
    <PortalContext.Provider value={{ client, loading, login, logout }}>
      {children}
    </PortalContext.Provider>
  );
};

export const ProtectedPortal = ({ children }) => {
  const { client, loading } = usePortal();
  if (loading) return <div className="portal-loading">Loading...</div>;
  return client ? children : <Navigate to="/portal/login" />;
};

export const PortalLayout = ({ children }) => {
  const { client, logout } = usePortal();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (window.innerWidth <= 768) {
      document.querySelectorAll('table').forEach(table => {
        const headers = [];
        table.querySelectorAll('thead th').forEach(th => {
          headers.push(th.textContent.trim());
        });
        if (headers.length === 0) return;
        table.querySelectorAll('tbody tr').forEach(tr => {
          tr.querySelectorAll('td').forEach((td, i) => {
            if (headers[i] && !td.hasAttribute('data-label')) {
              td.setAttribute('data-label', headers[i]);
            }
          });
        });
      });
    }
  }, []);

  return (
    <div className="portal-layout">
      <header className="portal-header">
        <div className="portal-header-content">
          <Link to="/portal" className="portal-logo">
            <h1>Law Firm Portal</h1>
          </Link>
          <nav className={`portal-nav ${menuOpen ? 'open' : ''}`}>
            <Link to="/portal" onClick={() => setMenuOpen(false)}>Dashboard</Link>
            <Link to="/portal/cases" onClick={() => setMenuOpen(false)}>My Cases</Link>
            <Link to="/portal/invoices" onClick={() => setMenuOpen(false)}>Invoices</Link>
          </nav>
          <div className="portal-user">
            <span>{client?.name}</span>
            <button className="btn btn-secondary btn-sm" onClick={logout}>Logout</button>
          </div>
          <button className="portal-menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        </div>
      </header>
      <main className="portal-main">{children}</main>
    </div>
  );
};

export { PortalProvider };
