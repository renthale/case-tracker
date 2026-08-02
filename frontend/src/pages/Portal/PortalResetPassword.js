import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiLock, FiGlobe, FiArrowRight, FiArrowLeft, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/portalApi';
import { usePortal } from './ClientPortal';

const PASSWORD_RE = /^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/;

const PortalResetPassword = () => {
  const { token } = useParams();
  const { t, language, toggleLanguage } = usePortal();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState({});

  const BackIcon = language === 'ar' ? FiArrowRight : FiArrowLeft;

  const validate = () => {
    const next = {};
    if (!password) {
      next.password = t.passwordRequired;
    } else if (!PASSWORD_RE.test(password)) {
      next.password = t.passwordStrengthHint;
    }
    if (!confirm) {
      next.confirm = t.confirmPassword;
    } else if (confirm !== password) {
      next.confirm = t.passwordMismatch;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || !validate()) return;
    setSubmitting(true);
    try {
      await api.post(`/portal/reset-password/${token}`, { password });
      setDone(true);
      toast.success(t.resetSuccess);
    } catch (error) {
      toast.error(error.response?.data?.error || t.resetInvalid);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="portal-login">
      <button className="portal-login-lang" onClick={toggleLanguage}>
        <FiGlobe /> {t.language}
      </button>

      <div className="portal-login-card">
        <div className="portal-login-header">
          <div className="portal-login-icon" aria-hidden="true"><FiLock /></div>
          <h1>{t.resetPasswordTitle}</h1>
          <p>{t.resetPasswordIntro}</p>
        </div>

        {done ? (
          <div className="portal-auth-message success" role="alert">
            <FiCheckCircle size={36} aria-hidden="true" />
            <p>{t.resetSuccess}</p>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/portal/login')}>
              {t.goToLogin}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="reset-password">{t.newPassword}</label>
              <div className="password-input-wrap">
                <FiLock aria-hidden="true" className="portal-input-icon" />
                <input
                  id="reset-password"
                  type="password"
                  autoComplete="new-password"
                  className="portal-form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'reset-password-error' : undefined}
                />
              </div>
              {errors.password && (
                <p className="portal-form-error" id="reset-password-error" role="alert">{errors.password}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="reset-confirm">{t.confirmNewPassword}</label>
              <div className="password-input-wrap">
                <FiLock aria-hidden="true" className="portal-input-icon" />
                <input
                  id="reset-confirm"
                  type="password"
                  autoComplete="new-password"
                  className="portal-form-control"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  aria-invalid={Boolean(errors.confirm)}
                  aria-describedby={errors.confirm ? 'reset-confirm-error' : undefined}
                />
              </div>
              {errors.confirm && (
                <p className="portal-form-error" id="reset-confirm-error" role="alert">{errors.confirm}</p>
              )}
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? t.sending : t.continueBtn}
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

export default PortalResetPassword;
