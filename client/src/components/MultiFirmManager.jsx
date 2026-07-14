// client/src/components/MultiFirmManager.jsx

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Star, X, Save, Loader2, Building2, AlertTriangle } from 'lucide-react';
import { getFirms, createFirm, updateFirm, setDefaultFirm, deleteFirm } from '../services/firm';

const blankForm = () => ({ name: '', address: '', phoneNumber: '', email: '', gstin: '', logoUrl: '' });

export default function MultiFirmManager() {
  const [firms, setFirms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankForm());
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const flash = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };

  const load = async () => {
    try {
      setLoading(true);
      const res = await getFirms();
      if (res.success) setFirms(res.firms);
    } catch {
      setError('Failed to load firms.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(blankForm());
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (firm) => {
    setEditingId(firm._id);
    setForm({ name: firm.name, address: firm.address || '', phoneNumber: firm.phoneNumber || '', email: firm.email || '', gstin: firm.gstin || '', logoUrl: firm.logoUrl || '' });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.name.trim()) { setFormError('Firm name is required.'); return; }
    setSaving(true);
    try {
      if (editingId) {
        const res = await updateFirm(editingId, form);
        if (res.success) { setFirms(f => f.map(x => x._id === editingId ? res.firm : x)); flash('Firm updated!'); }
      } else {
        const res = await createFirm(form);
        if (res.success) { setFirms(f => [...f, res.firm]); flash('Firm created!'); }
      }
      setShowModal(false);
    } catch (e) {
      setFormError(e.response?.data?.error || 'Failed to save firm.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const res = await setDefaultFirm(id);
      if (res.success) { setFirms(f => f.map(x => ({ ...x, isDefault: x._id === id }))); flash('Default firm updated!'); }
    } catch {
      setError('Failed to set default.');
    }
  };

  const handleDelete = async (id) => {
    setDeleteError('');
    try {
      const res = await deleteFirm(id);
      if (res.success) { setFirms(f => f.filter(x => x._id !== id)); setDeletingId(null); flash('Firm deleted!'); }
    } catch (e) {
      setDeleteError(e.response?.data?.error || 'Failed to delete firm.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8, color: '#6B7280' }}>
        <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: 13 }}>Loading firms…</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: '#6B7280' }}>{firms.length} firm{firms.length !== 1 ? 's' : ''}</span>
        <button
          onClick={openAdd}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
        >
          <Plus style={{ width: 13, height: 13 }} />
          Add Firm
        </button>
      </div>

      {/* Success / Error banners */}
      {successMsg && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#065F46', marginBottom: 10 }}>
          ✓ {successMsg}
        </div>
      )}
      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#991B1B', marginBottom: 10 }}>
          {error}
        </div>
      )}

      {/* Firm list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {firms.map(firm => (
          <div key={firm._id}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              background: firm.isDefault ? '#EEF2FF' : '#F9FAFB',
              borderRadius: 8,
              border: `1px solid ${firm.isDefault ? '#C7D2FE' : '#E5E7EB'}`,
              transition: 'all 0.15s'
            }}>
            {/* Icon */}
            <div style={{ width: 32, height: 32, borderRadius: 8, background: firm.isDefault ? '#4F46E5' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Building2 style={{ width: 15, height: 15, color: firm.isDefault ? '#fff' : '#6B7280' }} />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{firm.name}</span>
                {firm.isDefault && (
                  <span style={{ fontSize: 9, color: '#4F46E5', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 4, padding: '1px 6px', fontWeight: 700, letterSpacing: '0.04em', flexShrink: 0 }}>DEFAULT</span>
                )}
              </div>
              {firm.gstin && <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>GSTIN: {firm.gstin}</div>}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              {!firm.isDefault && (
                <button
                  onClick={() => handleSetDefault(firm._id)}
                  title="Set as default"
                  style={{ background: 'transparent', border: '1px solid #D1D5DB', borderRadius: 5, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9CA3AF', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#FEF3C7'; e.currentTarget.style.borderColor = '#F59E0B'; e.currentTarget.style.color = '#D97706'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.color = '#9CA3AF'; }}
                >
                  <Star style={{ width: 13, height: 13 }} />
                </button>
              )}
              <button
                onClick={() => openEdit(firm)}
                title="Edit firm"
                style={{ background: 'transparent', border: '1px solid #D1D5DB', borderRadius: 5, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6B7280', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.borderColor = '#A5B4FC'; e.currentTarget.style.color = '#4F46E5'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.color = '#6B7280'; }}
              >
                <Edit2 style={{ width: 13, height: 13 }} />
              </button>
              {!firm.isDefault && (
                <button
                  onClick={() => { setDeletingId(firm._id); setDeleteError(''); }}
                  title="Delete firm"
                  style={{ background: 'transparent', border: '1px solid #D1D5DB', borderRadius: 5, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9CA3AF', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.borderColor = '#FECACA'; e.currentTarget.style.color = '#EF4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.color = '#9CA3AF'; }}
                >
                  <Trash2 style={{ width: 13, height: 13 }} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── ADD / EDIT MODAL ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
            {/* Modal header */}
            <div style={{ background: '#4F46E5', padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Building2 style={{ width: 18, height: 18, color: '#fff' }} />
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{editingId ? 'Edit Firm' : 'Add New Firm'}</span>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                <X style={{ width: 15, height: 15 }} />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {formError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#991B1B', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle style={{ width: 13, height: 13, flexShrink: 0 }} />{formError}
                </div>
              )}
              {[
                { key: 'name', label: 'Firm Name *', placeholder: 'e.g. My Business Pvt Ltd' },
                { key: 'address', label: 'Address', placeholder: 'e.g. 101, Sector 45, Mumbai' },
                { key: 'phoneNumber', label: 'Phone', placeholder: '+91 98765 43210' },
                { key: 'email', label: 'Email', placeholder: 'billing@mybusiness.com' },
                { key: 'gstin', label: 'GSTIN', placeholder: '27AAAAA1111A1Z1' },
                { key: 'logoUrl', label: 'Logo URL', placeholder: 'https://example.com/logo.png' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
                  <input
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                    onFocus={e => e.target.style.borderColor = '#4F46E5'}
                    onBlur={e => e.target.style.borderColor = '#D1D5DB'}
                  />
                </div>
              ))}
            </div>

            {/* Modal footer */}
            <div style={{ padding: '14px 22px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowModal(false)} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#4F46E5', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 14, height: 14 }} />}
                {saving ? 'Saving…' : 'Save Firm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ── */}
      {deletingId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 style={{ width: 17, height: 17, color: '#EF4444' }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Delete Firm</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>This action cannot be undone.</div>
              </div>
            </div>
            {deleteError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#991B1B', marginBottom: 12 }}>
                {deleteError}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setDeletingId(null)} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(deletingId)} style={{ background: '#EF4444', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
