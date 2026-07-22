import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SessionForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const caseId = searchParams.get('caseId');
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [cases, setCases] = useState([]);
  const [formData, setFormData] = useState({
    caseId: searchParams.get('caseId') || '',
    sessionType: 'mainSession',
    date: '',
    time: '',
    location: '',
    status: 'scheduled',
    outcome: '',
    notes: ''
  });

  useEffect(() => {
    fetchCases();
    if (id) {
      fetchSession();
    } else {
      setFetching(false);
    }
  }, [id]);

  const fetchCases = async () => {
    try {
      const response = await api.get('/cases', { params: { limit: 100 } });
      setCases(response.data.cases);
    } catch (error) {
      console.error('Error fetching cases');
    }
  };

  const fetchSession = async () => {
    try {
      const response = await api.get(`/sessions/${id}`);
      const session = response.data.session;
      setFormData({
        caseId: session.caseId || '',
        sessionType: session.sessionType || 'mainSession',
        date: session.date?.split('T')[0] || '',
        time: session.time || '',
        location: session.location || '',
        status: session.status || 'scheduled',
        outcome: session.outcome || '',
        notes: session.notes || ''
      });
    } catch (error) {
      toast.error(t.errorFetchingSession);
      navigate(caseId ? `/cases/${caseId}` : '/sessions');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const cleanedData = { ...formData };
    Object.keys(cleanedData).forEach(key => {
      if (cleanedData[key] === '') cleanedData[key] = null;
    });

    try {
      if (id) {
        await api.put(`/sessions/${id}`, cleanedData);
        toast.success(t.sessionUpdated);
      } else {
        await api.post(`/sessions/case/${cleanedData.caseId}`, cleanedData);
        toast.success(t.sessionCreated);
      }
      navigate(caseId ? `/cases/${caseId}` : '/sessions');
    } catch (error) {
      toast.error(error.response?.data?.details || error.response?.data?.error || t.errorSavingSession);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="loading">{t.loading}</div>;
  }

  return (
    <div className="session-form">
      <div className="card-header">
        <h2 className="card-title">{id ? t.editSession : t.addSession}</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="grid grid-2">
            <div className="form-group">
              <label>{t.cases} *</label>
              <select
                name="caseId"
                className="form-control"
                value={formData.caseId}
                onChange={handleChange}
                required
                disabled={!!id || !!searchParams.get('caseId')}
              >
                <option value="">اختر القضية</option>
                {cases.map((caseItem) => (
                  <option key={caseItem.id} value={caseItem.id}>
                    {caseItem.caseNumber} - {caseItem.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>{t.sessionType || 'نوع الجلسة'}</label>
              <select
                name="sessionType"
                className="form-control"
                value={formData.sessionType}
                onChange={handleChange}
              >
                <option value="mainSession">{t.mainSession}</option>
                <option value="subSession">{t.subSession}</option>
                <option value="deliberation">{t.deliberation}</option>
                <option value="verdictSession">{t.verdictSession}</option>
                <option value="evidenceSession">{t.evidenceSession}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t.sessionDate} *</label>
              <input
                type="date"
                name="date"
                className="form-control"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>{t.sessionTime}</label>
              <input
                type="time"
                name="time"
                className="form-control"
                value={formData.time}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>{t.sessionLocation}</label>
              <input
                type="text"
                name="location"
                className="form-control"
                value={formData.location}
                onChange={handleChange}
                placeholder="قاعة الجلسة"
              />
            </div>

            <div className="form-group">
              <label>{t.sessionStatus}</label>
              <select
                name="status"
                className="form-control"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="scheduled">{t.scheduled}</option>
                <option value="completed">{t.completed}</option>
                <option value="postponed">{t.postponed}</option>
                <option value="cancelled">{t.cancelled}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t.sessionOutcome || 'نتيجة الجلسة'}</label>
              <textarea
                name="outcome"
                className="form-control"
                rows="3"
                value={formData.outcome}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>{t.notes}</label>
            <textarea
              name="notes"
              className="form-control"
              rows="3"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t.loading : t.save}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(caseId ? `/cases/${caseId}` : '/sessions')}>
              {t.cancel}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SessionForm;
