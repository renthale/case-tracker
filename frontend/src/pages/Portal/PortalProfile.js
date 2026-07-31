import React, { useState, useEffect, useCallback } from 'react';
import { FiUser, FiShield } from 'react-icons/fi';
import { usePortal } from './ClientPortal';
import api from '../../services/portalApi';
import { PortalError, PortalPageHeading } from './PortalUI';
import { formatDate, formatDateTime, initials, translateStatus } from './portalUtils';

const PortalProfile = () => {
  const { t, language } = usePortal();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/portal/profile');
      setProfile(res.data.client);
    } catch {
      setError(t.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className="portal-loading">
        <div className="portal-spinner" aria-hidden="true" />
        <p>{t.loading}</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <>
        <PortalPageHeading title={t.profile} />
        <PortalError message={error || t.notFound} onRetry={fetchProfile} />
      </>
    );
  }

  const fields = [
    { label: t.fullName, value: profile.name },
    { label: t.phone, value: profile.phone },
    { label: t.email, value: profile.email },
    { label: t.civilId, value: profile.civilId },
    { label: t.passportNumber, value: profile.passportNumber },
    { label: t.nationality, value: profile.nationality },
    { label: t.address, value: profile.address },
    { label: t.dateOfBirth, value: formatDate(profile.dateOfBirth, language) },
    { label: t.firstCooperationDate, value: formatDate(profile.firstCooperationDate, language) }
  ].filter((f) => f.value);

  return (
    <div className="portal-profile">
      <PortalPageHeading title={t.profile} />

      <div className="portal-profile-header">
        <div className="portal-profile-avatar" aria-hidden="true">{initials(profile.name)}</div>
        <div>
          <h2>{profile.name}</h2>
          <p>{profile.email || profile.portalEmail}</p>
        </div>
      </div>

      <div className="portal-section">
        <div className="portal-section-header">
          <h3><FiUser /> {t.personalInfo}</h3>
        </div>
        <div className="portal-info-grid">
          {fields.map((f) => (
            <div className="portal-info-item" key={f.label}>
              <label>{f.label}</label>
              <span>{f.value || t.notProvided}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="portal-section">
        <div className="portal-section-header">
          <h3><FiShield /> {t.portalAccount}</h3>
        </div>
        <div className="portal-info-grid">
          <div className="portal-info-item">
            <label>{t.portalEmail}</label>
            <span>{profile.portalEmail || '-'}</span>
          </div>
          <div className="portal-info-item">
            <label>{t.lastLogin}</label>
            <span>{profile.lastLogin ? formatDateTime(profile.lastLogin, language) : '-'}</span>
          </div>
          <div className="portal-info-item">
            <label>{t.accountStatus}</label>
            <span>{profile.isActive ? translateStatus(t, 'active') : translateStatus(t, 'inactive')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalProfile;
