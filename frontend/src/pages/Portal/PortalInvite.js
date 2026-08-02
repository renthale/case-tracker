import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiUser, FiLock, FiGlobe, FiArrowRight, FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/portalApi';
import { usePortal } from './ClientPortal';

const PASSWORD_RE = /^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/;

const PortalInvite = () => {
  const { token } = useParams();
  const { t, language, toggleLanguage, login } = usePortal();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    api.get(`/portal/invite/${token}`)
      .then((res) => {
        setEmail(res.data.email);
        setValid(true);
      })
      .catch(() => setValid(false))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
      await api.post(`/portal/invite/${token}/set-password`, { password });
      toast.success(t.inviteSuccess);
      await login(email, password);
      navigate('/portal', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.error || t.inviteInvalid);
    } finally {
      setSubmitting(false);
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
          <h1>{t.inviteTitle}</h1>
          <p>{t.inviteIntro}</p>
        </div>

        {loading ? (
          <div className="portal-loading">
            <div className="portal-spinner" aria-hidden="true" />
            <p>{t.loading}</p>
          </div>
        ) : valid ? (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="invite-email">{t.invitedAs}</label>
              <input
                id="invite-email"
                type="email"
                className="portal-form-control"
                value={email}
                disabled
              />
            </div>

            <div className="form-group">
              <label htmlFor="invite-password">{t.password}</label>
              <div className="password-input-wrap">
                <FiLock aria-hidden="true" className="portal-input-icon" />
                <input
                  id="invite-password"
                  type="password"
                  autoComplete="new-password"
                  className="portal-form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'invite-password-error' : undefined}
                />
              </div>
              {errors.password && (
                <p className="portal-form-error" id="invite-password-error" role="alert">{errors.password}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="invite-confirm">{t.confirmPassword}</label>
              <div className="password-input-wrap">
                <FiLock aria-hidden="true" className="portal-input-icon" />
                <input
                  id="invite-confirm"
                  type="password"
                  autoComplete="new-password"
                  className="portal-form-control"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  aria-invalid={Boolean(errors.confirm)}
                  aria-describedby={errors.confirm ? 'invite-confirm-error' : undefined}
                />
              </div>
              {errors.confirm && (
                <p className="portal-form-error" id="invite-confirm-error" role="alert">{errors.confirm}</p>
              )}
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? t.settingUp : t.setPassword}
            </button>
          </form>
        ) : (
          <div className="portal-auth-message" role="alert">
            <FiAlertCircle size={36} aria-hidden="true" />
            <p>{t.inviteInvalid}</p>
          </div>
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

export default PortalInvite;
