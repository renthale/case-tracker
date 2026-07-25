import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiUserPlus, FiToggleLeft, FiToggleRight, FiTrash2, FiKey } from 'react-icons/fi';

const PortalUsers = () => {
  const [portalUsers, setPortalUsers] = useState([]);
  const [availableClients, setAvailableClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ clientId: '', email: '', password: '' });
  const [resetId, setResetId] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [usersRes, clientsRes] = await Promise.all([
        api.get('/api/portal/admin/list'),
        api.get('/api/portal/admin/available-clients')
      ]);
      setPortalUsers(usersRes.data.portalUsers || []);
      setAvailableClients(clientsRes.data.clients || []);
    } catch (error) {
      toast.error('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/portal/admin/create', form);
      toast.success('Portal account created');
      setShowCreate(false);
      setForm({ clientId: '', email: '', password: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error creating account');
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await api.put(`/api/portal/admin/${id}/toggle`);
      toast.success(res.data.message);
      fetchData();
    } catch (error) {
      toast.error('Error toggling account');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this portal account?')) return;
    try {
      await api.delete(`/api/portal/admin/${id}`);
      toast.success('Account deleted');
      fetchData();
    } catch (error) {
      toast.error('Error deleting account');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/portal/admin/${resetId}/reset-password`, { password: newPassword });
      toast.success('Password reset successfully');
      setResetId(null);
      setNewPassword('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error resetting password');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div style={{ padding: '0' }}>
      <div className="card-header">
        <h2 className="card-title">Client Portal Users ({portalUsers.length})</h2>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          <FiUserPlus /> Create Portal Account
        </button>
      </div>

      {showCreate && (
        <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Create New Portal Account</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Client</label>
              <select className="form-control" value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})} required>
                <option value="">Select client...</option>
                {availableClients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.email || c.phone})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Email</label>
              <input type="email" className="form-control" placeholder="client@email.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Password</label>
              <input type="text" className="form-control" placeholder="Min 6 chars" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={6} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary">Create</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {resetId && (
        <div style={{ background: '#fff3cd', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Reset Password</h3>
          <form onSubmit={handleResetPassword} style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>New Password</label>
              <input type="text" className="form-control" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
            </div>
            <button type="submit" className="btn btn-primary">Reset</button>
            <button type="button" className="btn btn-secondary" onClick={() => { setResetId(null); setNewPassword(''); }}>Cancel</button>
          </form>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Client Name</th>
              <th>Email</th>
              <th>Portal Email</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {portalUsers.map(pu => (
              <tr key={pu.id}>
                <td><strong>{pu.client?.name || 'N/A'}</strong></td>
                <td>{pu.client?.email || '-'}</td>
                <td>{pu.email}</td>
                <td>
                  <span style={{
                    padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600',
                    background: pu.isActive ? '#d4edda' : '#f8d7da',
                    color: pu.isActive ? '#155724' : '#721c24'
                  }}>
                    {pu.isActive ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td>{pu.lastLogin ? new Date(pu.lastLogin).toLocaleString() : 'Never'}</td>
                <td>{new Date(pu.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="actions">
                    <button className="btn btn-secondary" title="Toggle" onClick={() => handleToggle(pu.id)}>
                      {pu.isActive ? <FiToggleRight /> : <FiToggleLeft />}
                    </button>
                    <button className="btn btn-secondary" title="Reset Password" onClick={() => setResetId(pu.id)}>
                      <FiKey />
                    </button>
                    <button className="btn btn-danger" title="Delete" onClick={() => handleDelete(pu.id)}>
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {portalUsers.length === 0 && (
              <tr><td colSpan="7" className="no-data">No portal users found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#e8f4fd', borderRadius: '8px', fontSize: '0.9rem' }}>
        <strong>How it works:</strong> Create a portal account for a client → they receive login credentials → they log in at <code>/portal</code> → they can view their cases, sessions, and invoices.
      </div>
    </div>
  );
};

export default PortalUsers;
