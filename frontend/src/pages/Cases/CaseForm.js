import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CaseForm = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    caseNumber: '',
    title: '',
    description: '',
    type: 'civil',
    status: 'active',
    priority: 'medium',
    court: '',
    judge: '',
    opposingParty: '',
    opposingLawyer: '',
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    filingDate: '',
    nextHearingDate: '',
    closingDate: '',
    notes: ''
  });

  useEffect(() => {
    if (id) {
      fetchCase();
    } else {
      setFetching(false);
    }
  }, [id]);

  const fetchCase = async () => {
    try {
      const response = await api.get(`/cases/${id}`);
      const caseData = response.data.case;
      setFormData({
        caseNumber: caseData.caseNumber || '',
        title: caseData.title || '',
        description: caseData.description || '',
        type: caseData.type || 'civil',
        status: caseData.status || 'active',
        priority: caseData.priority || 'medium',
        court: caseData.court || '',
        judge: caseData.judge || '',
        opposingParty: caseData.opposingParty || '',
        opposingLawyer: caseData.opposingLawyer || '',
        clientName: caseData.clientName || '',
        clientPhone: caseData.clientPhone || '',
        clientEmail: caseData.clientEmail || '',
        filingDate: caseData.filingDate || '',
        nextHearingDate: caseData.nextHearingDate?.split('T')[0] || '',
        closingDate: caseData.closingDate || '',
        notes: caseData.notes || ''
      });
    } catch (error) {
      toast.error(t.errorFetchingCase);
      navigate('/cases');
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
        await api.put(`/cases/${id}`, cleanedData);
        toast.success(t.caseUpdated);
      } else {
        await api.post('/cases', cleanedData);
        toast.success(t.caseCreated);
      }
      navigate('/cases');
    } catch (error) {
      toast.error(error.response?.data?.error || t.errorSavingCase);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="loading">{t.loading}</div>;
  }

  return (
    <div className="case-form">
      <div className="card-header">
        <h2 className="card-title">{id ? t.editCase : t.addCase}</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-2">
          <div className="card">
            <h3 className="card-title">{t.caseInformation}</h3>
            
            <div className="form-group">
              <label>{t.caseNumber} *</label>
              <input
                type="text"
                name="caseNumber"
                className="form-control"
                value={formData.caseNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>{t.caseTitle} *</label>
              <input
                type="text"
                name="title"
                className="form-control"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>{t.description}</label>
              <textarea
                name="description"
                className="form-control"
                rows="3"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>{t.caseType} *</label>
              <select
                name="type"
                className="form-control"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="civil">{t.civil}</option>
                <option value="criminal">{t.criminal}</option>
                <option value="commercial">{t.commercial}</option>
                <option value="administrative">{t.administrative}</option>
                <option value="family">{t.family}</option>
                <option value="labor">{t.labor}</option>
                <option value="other">{t.other}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t.caseStatus}</label>
              <select
                name="status"
                className="form-control"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="active">{t.active}</option>
                <option value="pending">{t.pending}</option>
                <option value="closed">{t.closed}</option>
                <option value="won">{t.won}</option>
                <option value="lost">{t.lost}</option>
                <option value="settled">{t.settled}</option>
                <option value="appeal">{t.appeal}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t.casePriority}</label>
              <select
                name="priority"
                className="form-control"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="low">{t.low}</option>
                <option value="medium">{t.medium}</option>
                <option value="high">{t.high}</option>
                <option value="urgent">{t.urgent}</option>
              </select>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">{t.courtInformation}</h3>
            
            <div className="form-group">
              <label>{t.court}</label>
              <input
                type="text"
                name="court"
                className="form-control"
                value={formData.court}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>{t.judge}</label>
              <input
                type="text"
                name="judge"
                className="form-control"
                value={formData.judge}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>{t.filingDate}</label>
              <input
                type="date"
                name="filingDate"
                className="form-control"
                value={formData.filingDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>{t.nextHearing}</label>
              <input
                type="date"
                name="nextHearingDate"
                className="form-control"
                value={formData.nextHearingDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>{t.closingDate}</label>
              <input
                type="date"
                name="closingDate"
                className="form-control"
                value={formData.closingDate}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-2">
          <div className="card">
            <h3 className="card-title">{t.clientInformation}</h3>
            
            <div className="form-group">
              <label>{t.clientName}</label>
              <input
                type="text"
                name="clientName"
                className="form-control"
                value={formData.clientName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>{t.clientPhone}</label>
              <input
                type="tel"
                name="clientPhone"
                className="form-control"
                value={formData.clientPhone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>{t.clientEmail}</label>
              <input
                type="email"
                name="clientEmail"
                className="form-control"
                value={formData.clientEmail}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">{t.opposingPartyInformation}</h3>
            
            <div className="form-group">
              <label>{t.opposingParty}</label>
              <input
                type="text"
                name="opposingParty"
                className="form-control"
                value={formData.opposingParty}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>{t.opposingLawyer}</label>
              <input
                type="text"
                name="opposingLawyer"
                className="form-control"
                value={formData.opposingLawyer}
                onChange={handleChange}
              />
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
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t.loading : t.save}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/cases')}>
            {t.cancel}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CaseForm;
