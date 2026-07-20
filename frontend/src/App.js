import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import CasesList from './pages/Cases/CasesList';
import CaseDetails from './pages/Cases/CaseDetails';
import CaseForm from './pages/Cases/CaseForm';
import SessionsList from './pages/Sessions/SessionsList';
import SessionForm from './pages/Sessions/SessionForm';
import Notifications from './pages/Notifications/Notifications';
import Reports from './pages/Reports/Reports';
import './styles/App.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">جاري التحميل...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">جاري التحميل...</div>;
  }
  
  return user ? <Navigate to="/" /> : children;
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="cases" element={<CasesList />} />
              <Route path="cases/new" element={<CaseForm />} />
              <Route path="cases/:id" element={<CaseDetails />} />
              <Route path="cases/:id/edit" element={<CaseForm />} />
              <Route path="sessions" element={<SessionsList />} />
              <Route path="sessions/new" element={<SessionForm />} />
              <Route path="sessions/:id/edit" element={<SessionForm />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="reports" element={<Reports />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
