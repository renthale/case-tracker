import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiGlobe, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { usePortal } from './ClientPortal';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PortalLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login, t, language, toggleLanguage } = usePortal();
  const navigate = useNavigate();

  const validate = () => {
    const next = {};
    if (!email.trim()) {
      next.email = t.emailRequired;
    } else if (!EMAIL_RE.test(email.trim())) {
      next.email = t.emailInvalid;
    }
    if (!password) {
      next.password = t.passwordRequired;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success(t.loginSuccess);
      navigate('/portal', { replace: true });
    } catch (error) {
      const status = error.response?.status;
      if (status === 401) {
        toast.error(t.invalidCredentials);
      } else if (status && status >= 500) {
        toast.error(t.serverError);
      } else {
        toast.error(t.networkError);
      }
    } finally {
      setLoading(false);
    }
  };

  const BackIcon = language === 'ar' ? FiArrowRight : FiArrowLeft;

  return (
    <div className="portal-login">
      <button className="portal-login-lang" onClick={toggleLanguage}>
        <FiGlobe /> {t.language}
      </button>

      <div className="portal-login-card">
        <div className="portal-login-header">
          <div className="portal-login-icon" aria-hidden="true"><FiUser /></div>
          <h1>{t.portalName}</h1>
          <p>{t.accessYourCaseInfo}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="portal-email">{t.email}</label>
            <div className="password-input-wrap" style={{ position: 'relative' }}>
              <FiMail
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  insetInlineStart: '0.9rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#a0aec0'
                }}
              />
              <input
                id="portal-email"
                type="email"
                autoComplete="email"
                className="portal-form-control"
                style={{ paddingInlineStart: '2.6rem' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'portal-email-error' : undefined}
              />
            </div>
            {errors.email && (
              <p className="portal-form-error" id="portal-email-error" role="alert">{errors.email}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="portal-password">{t.password}</label>
            <div className="password-input-wrap">
              <FiLock
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  insetInlineStart: '0.9rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#a0aec0'
                }}
              />
              <input
                id="portal-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="portal-form-control"
                style={{ paddingInlineStart: '2.6rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'portal-password-error' : undefined}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t.hidePassword : t.showPassword}
                title={showPassword ? t.hidePassword : t.showPassword}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors.password && (
              <p className="portal-form-error" id="portal-password-error" role="alert">{errors.password}</p>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t.loggingIn : t.login}
          </button>
        </form>

        <div className="portal-login-footer">
          <p>{t.loginFooter}</p>
          <Link to="/" className="portal-login-back">
            <BackIcon /> {t.backToLanding}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PortalLogin;
