import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiGlobe, FiArrowRight, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/portalApi';
import { usePortal } from './ClientPortal';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PortalForgotPassword = () => {
  const { t, language, toggleLanguage } = usePortal();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState({});

  const BackIcon = language === 'ar' ? FiArrowRight : FiArrowLeft;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!email.trim()) {
      next.email = t.emailRequired;
    } else if (!EMAIL_RE.test(email.trim())) {
      next.email = t.emailInvalid;
    }
    setErrors(next);
    if (Object.keys(next).length > 0 || loading) return;

    setLoading(true);
    try {
      await api.post('/portal/forgot-password', { email: email.trim() });
      setSent(true);
    } catch {
      toast.error(t.networkError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="portal-login">
      <button className="portal-login-lang" onClick={toggleLanguage}>
        <FiGlobe /> {t.language}
      </button>

      <div className="portal-login-card">
        <div className="portal-login-header">
          <div className="portal-login-icon" aria-hidden="true"><FiMail /></div>
          <h1>{t.forgotPasswordTitle}</h1>
          <p>{t.forgotPasswordIntro}</p>
        </div>

        {sent ? (
          <div className="portal-auth-message success" role="alert">
            <FiCheckCircle size={36} aria-hidden="true" />
            <p>{t.forgotPasswordSent}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="forgot-email">{t.email}</label>
              <div className="password-input-wrap">
                <FiMail aria-hidden="true" className="portal-input-icon" />
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  className="portal-form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'forgot-email-error' : undefined}
                />
              </div>
              {errors.email && (
                <p className="portal-form-error" id="forgot-email-error" role="alert">{errors.email}</p>
              )}
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t.sending : t.continueBtn}
            </button>
          </form>
        )}

        <div className="portal-login-footer">
          <Link to="/portal/login" className="portal-login-back">
            <BackIcon /> {t.backToLogin}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PortalForgotPassword;
