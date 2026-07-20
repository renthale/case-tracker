import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import toast from 'react-hot-toast';
import { FiMail, FiLock } from 'react-icons/fi';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(email, password);
      toast.success(t.loginSuccess);
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || t.invalidCredentials);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{t.appName}</h1>
          <p>{t.login}</p>
        </div>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t.email}</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <FiMail style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            </div>
          </div>
          
          <div className="form-group">
            <label>{t.password}</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <FiLock style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t.loading : t.login}
          </button>
        </form>
        
        <div className="auth-footer">
          {t.dontHaveAccount} <Link to="/register">{t.register}</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
