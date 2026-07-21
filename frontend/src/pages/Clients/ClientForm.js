import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ClientForm = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    civilId: '',
    passportNumber: '',
    phone: '',
    email: '',
    address: '',
    nationality: '',
    dateOfBirth: '',
    firstCooperationDate: '',
    notes: ''
  });

  useEffect(() => {
    if (id) {
      fetchClient();
    } else {
      setFetching(false);
    }
  }, [id]);

  const fetchClient = async () => {
    try {
      const response = await api.get(`/clients/${id}`);
      const client = response.data.client;
      setFormData({
        name: client.name || '',
        civilId: client.civilId || '',
        passportNumber: client.passportNumber || '',
        phone: client.phone || '',
        email: client.email || '',
        address: client.address || '',
        nationality: client.nationality || '',
        dateOfBirth: client.dateOfBirth?.split('T')[0] || '',
        firstCooperationDate: client.firstCooperationDate?.split('T')[0] || '',
        notes: client.notes || ''
      });
    } catch (error) {
      toast.error(t.errorFetchingClient || 'خطأ في جلب بيانات العميل');
      navigate('/clients');
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
        await api.put(`/clients/${id}`, cleanedData);
        toast.success(t.clientUpdated || 'تم تحديث بيانات العميل بنجاح');
      } else {
        await api.post('/clients', cleanedData);
        toast.success(t.clientCreated || 'تم إنشاء العميل بنجاح');
      }
      navigate('/clients');
    } catch (error) {
      toast.error(error.response?.data?.details || error.response?.data?.error || (t.errorSavingClient || 'خطأ في حفظ بيانات العميل'));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="loading">{t.loading}</div>;
  }

  return (
    <div className="client-form">
      <div className="card-header">
        <h2 className="card-title">{id ? (t.editClient || 'تعديل بيانات العميل') : (t.addClient || 'إضافة عميل')}</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-2">
          <div className="card">
            <h3 className="card-title">{t.personalInformation || 'المعلومات الشخصية'}</h3>

            <div className="form-group">
              <label>{t.clientName || 'الاسم'} *</label>
              <input
                type="text"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>{t.civilId || 'الرقم المدني'}</label>
              <input
                type="text"
                name="civilId"
                className="form-control"
                value={formData.civilId}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>{t.passportNumber || 'رقم الجواز'}</label>
              <input
                type="text"
                name="passportNumber"
                className="form-control"
                value={formData.passportNumber}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>{t.nationality || 'الجنسية'}</label>
              <input
                type="text"
                name="nationality"
                className="form-control"
                value={formData.nationality}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>{t.dateOfBirth || 'تاريخ الميلاد'}</label>
              <input
                type="date"
                name="dateOfBirth"
                className="form-control"
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>{t.firstCooperationDate || 'تاريخ أول تعاون'}</label>
              <input
                type="date"
                name="firstCooperationDate"
                className="form-control"
                value={formData.firstCooperationDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">{t.contactInformation || 'معلومات الاتصال'}</h3>

            <div className="form-group">
              <label>{t.phone || 'الجوال'}</label>
              <input
                type="tel"
                name="phone"
                className="form-control"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>{t.email || 'البريد الإلكتروني'}</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>{t.address || 'العنوان'}</label>
              <textarea
                name="address"
                className="form-control"
                rows="3"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>{t.notes || 'ملاحظات'}</label>
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
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/clients')}>
            {t.cancel}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;
