import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiPhone } from 'react-icons/fi';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error(t.passwordsNotMatch);
      return;
    }
    
    setLoading(true);
    
    try {
      const { confirmPassword, ...userData } = formData;
      await register(userData);
      toast.success(t.registerSuccess);
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || t.registrationFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{t.appName}</h1>
          <p>{t.register}</p>
        </div>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t.fullName}</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                name="fullName"
                className="form-control"
                value={formData.fullName}
                onChange={handleChange}
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <FiUser style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            </div>
          </div>
          
          <div className="form-group">
            <label>{t.username}</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                name="username"
                className="form-control"
                value={formData.username}
                onChange={handleChange}
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <FiUser style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            </div>
          </div>
          
          <div className="form-group">
            <label>{t.email}</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <FiMail style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            </div>
          </div>
          
          <div className="form-group">
            <label>{t.phone}</label>
            <div style={{ position: 'relative' }}>
              <input
                type="tel"
                name="phone"
                className="form-control"
                value={formData.phone}
                onChange={handleChange}
                style={{ paddingRight: '2.5rem' }}
              />
              <FiPhone style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            </div>
          </div>
          
          <div className="form-group">
            <label>{t.password}</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <FiLock style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            </div>
          </div>
          
          <div className="form-group">
            <label>{t.confirmPassword}</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                name="confirmPassword"
                className="form-control"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <FiLock style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t.loading : t.register}
          </button>
        </form>
        
        <div className="auth-footer">
          {t.alreadyHaveAccount} <Link to="/login">{t.login}</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
