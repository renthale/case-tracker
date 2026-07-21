import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CaseForm = () => {
  const { id } = useParams();
  const { t, isArabic } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    caseNumber: '', title: '', description: '', type: 'civil', status: 'active',
    priority: 'medium', courtType: '', court: '', department: '', registrationNumber: '',
    judge: '', opposingParty: '', opposingLawyer: '', opposingCivilId: '',
    clientName: '', clientCivilId: '', clientPhone: '', clientEmail: '',
    clientId: '', filingDate: '', nextHearingDate: '', closingDate: '',
    assignmentDate: '', assignmentEndDate: '', verdict: '', verdictDate: '',
    appealDate: '', consultationFees: '', litigationFees: '', sessionFees: '',
    otherFees: '', paymentStatus: 'unpaid', notes: ''
  });

  const totalFees = useMemo(() => {
    const c = parseFloat(formData.consultationFees) || 0;
    const l = parseFloat(formData.litigationFees) || 0;
    const s = parseFloat(formData.sessionFees) || 0;
    const o = parseFloat(formData.otherFees) || 0;
    return (c + l + s + o).toFixed(3);
  }, [formData.consultationFees, formData.litigationFees, formData.sessionFees, formData.otherFees]);

  useEffect(() => {
    fetchClients();
    if (id) {
      fetchCase();
    } else {
      setFetching(false);
    }
  }, [id]);

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data.clients || response.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

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
        courtType: caseData.courtType || '',
        court: caseData.court || '',
        department: caseData.department || '',
        registrationNumber: caseData.registrationNumber || '',
        judge: caseData.judge || '',
        opposingParty: caseData.opposingParty || '',
        opposingLawyer: caseData.opposingLawyer || '',
        opposingCivilId: caseData.opposingCivilId || '',
        clientName: caseData.clientName || '',
        clientCivilId: caseData.clientCivilId || '',
        clientPhone: caseData.clientPhone || '',
        clientEmail: caseData.clientEmail || '',
        clientId: caseData.clientId || '',
        filingDate: caseData.filingDate || '',
        nextHearingDate: caseData.nextHearingDate?.split('T')[0] || '',
        closingDate: caseData.closingDate || '',
        assignmentDate: caseData.assignmentDate || '',
        assignmentEndDate: caseData.assignmentEndDate || '',
        verdict: caseData.verdict || '',
        verdictDate: caseData.verdictDate || '',
        appealDate: caseData.appealDate || '',
        consultationFees: caseData.consultationFees || '',
        litigationFees: caseData.litigationFees || '',
        sessionFees: caseData.sessionFees || '',
        otherFees: caseData.otherFees || '',
        paymentStatus: caseData.paymentStatus || 'unpaid',
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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClientSelect = (e) => {
    const clientId = e.target.value;
    if (clientId) {
      const client = clients.find(c => String(c.id) === String(clientId));
      if (client) {
        setFormData(prev => ({
          ...prev,
          clientId: client.id,
          clientName: client.name || '',
          clientCivilId: client.civilId || '',
          clientPhone: client.phone || '',
          clientEmail: client.email || ''
        }));
        return;
      }
    }
    setFormData(prev => ({ ...prev, clientId: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const cleanedData = { ...formData, totalFees: parseFloat(totalFees) };
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
      toast.error(error.response?.data?.details || error.response?.data?.error || t.errorSavingCase);
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
        {/* Section 1: Case Info */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="card-title">{isArabic ? 'بيانات القضية' : 'Case Information'}</h3>

          <div className="grid grid-2">
            <div className="form-group">
              <label>{t.caseNumber}</label>
              <input type="text" name="caseNumber" className="form-control" value={formData.caseNumber} onChange={handleChange}
                placeholder={isArabic ? 'اتركه فارغاً للإنشاء الت.AUTO' : 'Leave empty for auto-generation'} />
            </div>

            <div className="form-group">
              <label>{isArabic ? 'نوع التقديم' : 'Filing Type'}</label>
              <select name="filingType" className="form-control" value={formData.filingType || 'new'} onChange={handleChange}>
                <option value="new">{isArabic ? 'جديد' : 'New'}</option>
                <option value="appeal">{isArabic ? 'استئناف' : 'Appeal'}</option>
                <option value="cassation">{isArabic ? 'نقض' : 'Cassation'}</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>{t.caseTitle} *</label>
            <input type="text" name="title" className="form-control" value={formData.title} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>{t.description}</label>
            <textarea name="description" className="form-control" rows="3" value={formData.description} onChange={handleChange} />
          </div>

          <div className="grid grid-3">
            <div className="form-group">
              <label>{t.caseType} *</label>
              <select name="type" className="form-control" value={formData.type} onChange={handleChange} required>
                <option value="civil">{t.civil}</option>
                <option value="criminal">{t.criminal}</option>
                <option value="commercial">{t.commercial}</option>
                <option value="administrative">{t.administrative}</option>
                <option value="family">{t.family}</option>
                <option value="labor">{t.labor}</option>
                <option value="sharia">{t.sharia}</option>
                <option value="traffic">{t.traffic}</option>
                <option value="other">{t.other}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t.caseStatus}</label>
              <select name="status" className="form-control" value={formData.status} onChange={handleChange}>
                <option value="active">{t.active}</option>
                <option value="pending">{t.pending}</option>
                <option value="closed">{t.closed}</option>
                <option value="won">{t.won}</option>
                <option value="lost">{t.lost}</option>
                <option value="settled">{t.settled}</option>
                <option value="appeal">{t.appeal}</option>
                <option value="retrial">{isArabic ? 'إعادة محاكمة' : 'Retrial'}</option>
                <option value="dismissed">{isArabic ? 'مرفوض' : 'Dismissed'}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t.casePriority}</label>
              <select name="priority" className="form-control" value={formData.priority} onChange={handleChange}>
                <option value="low">{t.low}</option>
                <option value="medium">{t.medium}</option>
                <option value="high">{t.high}</option>
                <option value="urgent">{t.urgent}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Court Info */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="card-title">{isArabic ? 'بيانات المحكمة' : 'Court Information'}</h3>

          <div className="grid grid-3">
            <div className="form-group">
              <label>{t.courtType || 'نوع المحكمة'}</label>
              <select name="courtType" className="form-control" value={formData.courtType} onChange={handleChange}>
                <option value="">{isArabic ? 'اختر المحكمة' : 'Select Court'}</option>
                <option value="courtOfFirstInstance">{t.courtOfFirstInstance}</option>
                <option value="familyCourt">{t.familyCourt}</option>
                <option value="criminalCourt">{t.criminalCourt}</option>
                <option value="commercialCourt">{t.commercialCourt}</option>
                <option value="laborCourt">{t.laborCourt}</option>
                <option value="administrativeCourt">{t.administrativeCourt}</option>
                <option value="appealCourt">{t.appealCourt}</option>
                <option value="cassationCourt">{t.cassationCourt}</option>
                <option value="highConstitutionalCourt">{t.highConstitutionalCourt}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t.court}</label>
              <input type="text" name="court" className="form-control" value={formData.court} onChange={handleChange}
                placeholder={isArabic ? 'اسم المحكمة' : 'Court name'} />
            </div>

            <div className="form-group">
              <label>{t.department || 'القسم'}</label>
              <input type="text" name="department" className="form-control" value={formData.department} onChange={handleChange} />
            </div>
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label>{isArabic ? 'رقم القيد' : 'Registration Number'}</label>
              <input type="text" name="registrationNumber" className="form-control" value={formData.registrationNumber} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>{t.judge}</label>
              <input type="text" name="judge" className="form-control" value={formData.judge} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Section 3: Client */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="card-title">{isArabic ? 'الموكل' : 'Client'}</h3>

          <div className="form-group">
            <label>{isArabic ? 'اختر موكل' : 'Select Client'}</label>
            <select name="clientId" className="form-control" value={formData.clientId} onChange={handleClientSelect}>
              <option value="">{isArabic ? 'اختر موكل...' : 'Select client...'}</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label>{t.clientName} *</label>
              <input type="text" name="clientName" className="form-control" value={formData.clientName} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>{t.clientCivilId || 'الرقم المدني'}</label>
              <input type="text" name="clientCivilId" className="form-control" value={formData.clientCivilId} onChange={handleChange} />
            </div>
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label>{t.clientPhone}</label>
              <input type="tel" name="clientPhone" className="form-control" value={formData.clientPhone} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>{t.clientEmail}</label>
              <input type="email" name="clientEmail" className="form-control" value={formData.clientEmail} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Section 4: Opposing Party */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="card-title">{isArabic ? 'الخصم' : 'Opposing Party'}</h3>

          <div className="grid grid-3">
            <div className="form-group">
              <label>{t.opposingParty}</label>
              <input type="text" name="opposingParty" className="form-control" value={formData.opposingParty} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>{t.opposingLawyer}</label>
              <input type="text" name="opposingLawyer" className="form-control" value={formData.opposingLawyer} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>{t.opposingCivilId || 'رقم المدني الخصم'}</label>
              <input type="text" name="opposingCivilId" className="form-control" value={formData.opposingCivilId} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Section 5: Dates */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="card-title">{isArabic ? 'التواريخ' : 'Dates'}</h3>

          <div className="grid grid-3">
            <div className="form-group">
              <label>{t.filingDate}</label>
              <input type="date" name="filingDate" className="form-control" value={formData.filingDate} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>{t.nextHearing}</label>
              <input type="date" name="nextHearingDate" className="form-control" value={formData.nextHearingDate} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>{t.closingDate}</label>
              <input type="date" name="closingDate" className="form-control" value={formData.closingDate} onChange={handleChange} />
            </div>
          </div>

          <div className="grid grid-3">
            <div className="form-group">
              <label>{isArabic ? 'تاريخ التكليف' : 'Assignment Date'}</label>
              <input type="date" name="assignmentDate" className="form-control" value={formData.assignmentDate} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>{isArabic ? 'تاريخ انتهاء التكليف' : 'Assignment End Date'}</label>
              <input type="date" name="assignmentEndDate" className="form-control" value={formData.assignmentEndDate} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>{isArabic ? 'تاريخ الحكم' : 'Verdict Date'}</label>
              <input type="date" name="verdictDate" className="form-control" value={formData.verdictDate} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Section 6: Fees */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="card-title">{isArabic ? 'الأتعاب' : 'Fees'}</h3>

          <div className="grid grid-2">
            <div className="form-group">
              <label>{isArabic ? 'رسوم الاستشارة (د.ك)' : 'Consultation Fees (KWD)'}</label>
              <input type="number" name="consultationFees" className="form-control" step="0.001" min="0"
                value={formData.consultationFees} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>{isArabic ? 'رسوم الترافع (د.ك)' : 'Litigation Fees (KWD)'}</label>
              <input type="number" name="litigationFees" className="form-control" step="0.001" min="0"
                value={formData.litigationFees} onChange={handleChange} />
            </div>
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label>{isArabic ? 'رسوم الجلسات (د.ك)' : 'Session Fees (KWD)'}</label>
              <input type="number" name="sessionFees" className="form-control" step="0.001" min="0"
                value={formData.sessionFees} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>{isArabic ? 'رسوم أخرى (د.ك)' : 'Other Fees (KWD)'}</label>
              <input type="number" name="otherFees" className="form-control" step="0.001" min="0"
                value={formData.otherFees} onChange={handleChange} />
            </div>
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label style={{ fontWeight: 'bold' }}>{isArabic ? 'الإجمالي (د.ك)' : 'Total Fees (KWD)'}</label>
              <input type="text" className="form-control" value={totalFees} readOnly
                style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }} />
            </div>

            <div className="form-group">
              <label>{isArabic ? 'حالة الدفع' : 'Payment Status'}</label>
              <select name="paymentStatus" className="form-control" value={formData.paymentStatus} onChange={handleChange}>
                <option value="unpaid">{isArabic ? 'لم يُدفع' : 'Unpaid'}</option>
                <option value="partial">{isArabic ? 'مدفوع جزئياً' : 'Partial'}</option>
                <option value="paid">{isArabic ? 'مدفوع بالكامل' : 'Paid'}</option>
                <option value="overdue">{isArabic ? 'متأخر' : 'Overdue'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 7: Verdict & Notes */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="card-title">{isArabic ? 'الحكم والملاحظات' : 'Verdict & Notes'}</h3>

          <div className="form-group">
            <label>{isArabic ? 'الحكم' : 'Verdict'}</label>
            <textarea name="verdict" className="form-control" rows="3" value={formData.verdict} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>{t.notes}</label>
            <textarea name="notes" className="form-control" rows="3" value={formData.notes} onChange={handleChange} />
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
