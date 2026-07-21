import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiShield, FiKey, FiUser, FiCheck, FiX } from 'react-icons/fi';

const roles = [
  { value: 'admin', labelAr: 'مدير النظام', labelEn: 'Admin', color: '#e74c3c' },
  { value: 'partner', labelAr: 'شريك', labelEn: 'Partner', color: '#8e44ad' },
  { value: 'lawyer', labelAr: 'محامي', labelEn: 'Lawyer', color: '#3498db' },
  { value: 'trainee_lawyer', labelAr: 'محامي متدرّب', labelEn: 'Trainee Lawyer', color: '#1abc9c' },
  { value: 'legal_consultant', labelAr: 'مستشار قانوني', labelEn: 'Legal Consultant', color: '#f39c12' },
  { value: 'court_agent', labelAr: 'مندوب المحاكم', labelEn: 'Court Agent', color: '#e67e22' },
  { value: 'transactions_agent', labelAr: 'مندوب معاملات', labelEn: 'Transactions Agent', color: '#2ecc71' },
  { value: 'legal_secretary', labelAr: 'سكرتير قانوني', labelEn: 'Legal Secretary', color: '#95a5a6' },
];

const UsersList = () => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [passwordUserId, setPasswordUserId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'lawyer',
    phone: '',
    language: 'ar'
  });

  const [newPassword, setNewPassword] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/auth/users');
      setUsers(data.users || []);
    } catch (error) {
      toast.error(isArabic ? 'خطأ في جلب المستخدمين' : 'Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    if (search && !u.fullName?.toLowerCase().includes(search.toLowerCase()) &&
        !u.email?.toLowerCase().includes(search.toLowerCase()) &&
        !u.username?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterRole && u.role !== filterRole) return false;
    return true;
  });

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      username: '', email: '', password: '', fullName: '',
      role: 'lawyer', phone: '', language: 'ar'
    });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      fullName: user.fullName || '',
      role: user.role,
      phone: user.phone || '',
      language: user.language || 'ar'
    });
    setShowModal(true);
  };

  const openPasswordModal = (userId) => {
    setPasswordUserId(userId);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingUser) {
        const payload = {
          fullName: formData.fullName,
          role: formData.role,
          phone: formData.phone,
          language: formData.language
        };
        await api.put('/auth/users/' + editingUser.id, payload);
        toast.success(isArabic ? 'تم تحديث المستخدم بنجاح' : 'User updated');
      } else {
        if (!formData.username || !formData.email || !formData.password || !formData.fullName) {
          toast.error(isArabic ? 'جميع الحقول المطلوبة يجب ملؤها' : 'All required fields must be filled');
          setSaving(false);
          return;
        }
        await api.post('/auth/users', formData);
        toast.success(isArabic ? 'تم إنشاء المستخدم بنجاح' : 'User created');
      }
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || (isArabic ? 'خطأ في الحفظ' : 'Save error'));
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error(isArabic ? 'كلمة المرور 6 أحرف على الأقل' : 'Password must be 6+ characters');
      return;
    }
    setSaving(true);
    try {
      await api.post('/auth/users/' + passwordUserId + '/reset-password', { newPassword });
      toast.success(isArabic ? 'تم إعادة تعيين كلمة المرور' : 'Password reset');
      setShowPasswordModal(false);
    } catch (error) {
      toast.error(error.response?.data?.error || (isArabic ? 'خطأ' : 'Error'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user) => {
    const msg = user.isActive
      ? (isArabic ? 'هل تريد تعطيل هذا المستخدم؟' : 'Deactivate this user?')
      : (isArabic ? 'هل تريد تفعيل هذا المستخدم؟' : 'Activate this user?');
    if (!window.confirm(msg)) return;

    try {
      await api.put('/auth/users/' + user.id, { isActive: !user.isActive });
      toast.success(isArabic ? 'تم التحديث بنجاح' : 'Updated successfully');
      fetchUsers();
    } catch (error) {
      toast.error(isArabic ? 'خطأ في التحديث' : 'Update error');
    }
  };

  const getRoleLabel = (roleValue) => {
    const r = roles.find(r => r.value === roleValue);
    return r ? (isArabic ? r.labelAr : r.labelEn) : roleValue;
  };

  const getRoleColor = (roleValue) => {
    const r = roles.find(r => r.value === roleValue);
    return r ? r.color : '#666';
  };

  if (loading) {
    return <div className="loading">{isArabic ? 'جاري التحميل...' : 'Loading...'}</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1><FiShield /> {isArabic ? 'إدارة المستخدمين' : 'User Management'}</h1>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <FiPlus /> {isArabic ? 'إضافة مستخدم' : 'Add User'}
        </button>
      </div>

      <div className="filters-bar" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input type="text" className="form-control" style={{ maxWidth: 250 }}
          placeholder={isArabic ? 'بحث بالاسم أو البريد...' : 'Search name or email...'}
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-control" style={{ maxWidth: 200 }}
          value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="">{isArabic ? 'جميع الأدوار' : 'All Roles'}</option>
          {roles.map(r => (
            <option key={r.value} value={r.value}>{isArabic ? r.labelAr : r.labelEn}</option>
          ))}
        </select>
        <div style={{ padding: '0.5rem', background: '#f5f5f5', borderRadius: 6, fontSize: '0.9rem' }}>
          {isArabic ? 'المستخدمين:' : 'Users:'} <strong>{filteredUsers.length}</strong>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>{isArabic ? 'الاسم' : 'Name'}</th>
              <th>{isArabic ? 'المستخدم' : 'Username'}</th>
              <th>{isArabic ? 'البريد' : 'Email'}</th>
              <th>{isArabic ? 'الدور' : 'Role'}</th>
              <th>{isArabic ? 'الجوال' : 'Phone'}</th>
              <th>{isArabic ? 'الحالة' : 'Status'}</th>
              <th>{isArabic ? 'إجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} style={{ opacity: user.isActive ? 1 : 0.5 }}>
                <td style={{ fontWeight: 'bold' }}>{user.fullName}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>
                  <span style={{
                    display: 'inline-block', padding: '2px 10px', borderRadius: 12,
                    fontSize: '0.8rem', fontWeight: 'bold', color: '#fff',
                    background: getRoleColor(user.role)
                  }}>
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td>{user.phone || '-'}</td>
                <td>
                  {user.isActive ? (
                    <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>{isArabic ? 'نشط' : 'Active'}</span>
                  ) : (
                    <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>{isArabic ? 'معطّل' : 'Inactive'}</span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button className="btn-icon" title={isArabic ? 'تعديل' : 'Edit'}
                      onClick={() => openEditModal(user)}>
                      <FiEdit2 />
                    </button>
                    <button className="btn-icon" title={isArabic ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
                      onClick={() => openPasswordModal(user.id)}>
                      <FiKey />
                    </button>
                    <button className={'btn-icon ' + (user.isActive ? 'btn-danger' : 'btn-success')}
                      title={user.isActive ? (isArabic ? 'تعطيل' : 'Deactivate') : (isArabic ? 'تفعيل' : 'Activate')}
                      onClick={() => handleToggleActive(user)}>
                      {user.isActive ? <FiX /> : <FiCheck />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                {isArabic ? 'لا يوجد مستخدمين' : 'No users found'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }} onClick={() => setShowModal(false)}>
          <div className="card" style={{ width: '90%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <h3 className="card-title" style={{ marginBottom: '1rem' }}>
              {editingUser ? (isArabic ? 'تعديل المستخدم' : 'Edit User') : (isArabic ? 'إضافة مستخدم جديد' : 'Add New User')}
            </h3>
            <form onSubmit={handleSubmit}>
              {!editingUser && (
                <>
                  <div className="form-group">
                    <label>{isArabic ? 'اسم المستخدم' : 'Username'} *</label>
                    <input type="text" className="form-control" value={formData.username}
                      onChange={e => setFormData({ ...formData, username: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>{isArabic ? 'البريد الإلكتروني' : 'Email'} *</label>
                    <input type="email" className="form-control" value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>{isArabic ? 'كلمة المرور' : 'Password'} *</label>
                    <input type="password" className="form-control" value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })} required
                      minLength={6} />
                  </div>
                </>
              )}
              <div className="form-group">
                <label>{isArabic ? 'الاسم الكامل' : 'Full Name'} *</label>
                <input type="text" className="form-control" value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>{isArabic ? 'الدور' : 'Role'} *</label>
                <select className="form-control" value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}>
                  {roles.map(r => (
                    <option key={r.value} value={r.value}>{isArabic ? r.labelAr : r.labelEn}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{isArabic ? 'الجوال' : 'Phone'}</label>
                <input type="text" className="form-control" value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label>{isArabic ? 'اللغة' : 'Language'}</label>
                <select className="form-control" value={formData.language}
                  onChange={e => setFormData({ ...formData, language: e.target.value })}>
                  <option value="ar">{isArabic ? 'العربية' : 'Arabic'}</option>
                  <option value="en">{isArabic ? 'الإنجليزية' : 'English'}</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (isArabic ? 'جاري الحفظ...' : 'Saving...') : (isArabic ? 'حفظ' : 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }} onClick={() => setShowPasswordModal(false)}>
          <div className="card" style={{ width: '90%', maxWidth: 400 }}
            onClick={e => e.stopPropagation()}>
            <h3 className="card-title" style={{ marginBottom: '1rem' }}>
              <FiKey /> {isArabic ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
            </h3>
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label>{isArabic ? 'كلمة المرور الجديدة' : 'New Password'} *</label>
                <input type="password" className="form-control" value={newPassword}
                  onChange={e => setNewPassword(e.target.value)} required minLength={6}
                  placeholder={isArabic ? '6 أحرف على الأقل' : 'Min 6 characters'} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (isArabic ? 'جاري الحفظ...' : 'Saving...') : (isArabic ? 'إعادة تعيين' : 'Reset')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersList;
