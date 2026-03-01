import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Lock, Users, Shield, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { recordsAPI, usersAPI } from '../utils/api';
import { encryptRecord } from '../utils/crypto';
import { useAuth } from '../context/AuthContext';

const RECORD_TYPES = ['diagnosis', 'prescription', 'lab_result', 'imaging', 'note'];

const TYPE_COLORS = {
  diagnosis:    'badge-blue',
  prescription: 'badge-green',
  lab_result:   'badge-yellow',
  imaging:      'badge-cyan',
  note:         'badge-red',
};

export default function Dashboard() {
  const [records, setRecords] = useState([]);
  const [ownerNames, setOwnerNames] = useState({}); // { owner_id: "Patient Name" }
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', record_type: 'diagnosis', content: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async () => {
    try {
      const { data } = await recordsAPI.list();
      setRecords(data);

      // For doctors — fetch owner names for all records they can access
      // Patients own their records so we already know the name
      if (user?.role === 'doctor') {
        const uniqueOwnerIds = [...new Set(data.map(r => r.owner_id))];
        const nameMap = {};
        await Promise.all(
          uniqueOwnerIds.map(async (ownerId) => {
            try {
              const { data: ownerData } = await usersAPI.getPublic(ownerId);
              nameMap[ownerId] = ownerData.name;
            } catch {
              nameMap[ownerId] = 'Unknown Patient';
            }
          })
        );
        setOwnerNames(nameMap);
      }
    } catch {
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const plaintext = {
        content: form.content,
        notes: form.notes,
        created_by: user.name,
      };

      const encrypted = await encryptRecord(plaintext, user.public_key);

      await recordsAPI.create({
        ...encrypted,
        title: form.title,
        record_type: form.record_type,
      });

      toast.success('Record saved — encrypted in your browser');
      setShowModal(false);
      setForm({ title: '', record_type: 'diagnosis', content: '', notes: '' });
      fetchRecords();
    } catch (err) {
      toast.error('Failed to create record');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const isOwnRecord = (record) => record.owner_id === user?.user_id;

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '4px' }}>
            {user?.role === 'doctor' ? 'Patient Records' : 'My Health Records'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {user?.role === 'doctor'
              ? 'Records patients have granted you access to'
              : 'All records are encrypted end-to-end. The server stores only ciphertext.'}
          </p>
        </div>
        {user?.role === 'patient' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> New Record
          </button>
        )}
      </div>

      {/* Stats Bar */}
      <div className="grid-3" style={{ marginBottom: '32px' }}>
        {[
          { label: 'Total Records', value: records.length, icon: FileText, color: 'var(--primary)' },
          { label: 'Encryption', value: 'AES-256-GCM', icon: Lock, color: 'var(--success)' },
          { label: 'Key Exchange', value: 'RSA-2048', icon: Shield, color: 'var(--accent)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `${color}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Icon size={20} style={{ color }} />
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800 }}>{value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Records Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : records.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
          <h3>{user?.role === 'doctor' ? 'No records shared with you yet' : 'No records yet'}</h3>
          <p>{user?.role === 'doctor' ? 'Patients will appear here once they grant you access' : 'Create your first encrypted health record'}</p>
        </div>
      ) : (
        <div className="grid-2">
          {records.map(record => (
            <div
              key={record.id}
              className="card"
              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--border-bright)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Top row — badge + lock icon */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className={`badge ${TYPE_COLORS[record.record_type] || 'badge-blue'}`}>
                  {record.record_type.replace('_', ' ')}
                </span>
                <Lock size={12} style={{ color: 'var(--text-muted)' }} />
              </div>

              {/* Title */}
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
                {record.title}
              </h3>

              {/* Patient name — shown to doctors */}
              {user?.role === 'doctor' && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  marginBottom: '8px',
                  padding: '6px 10px',
                  background: 'var(--primary-glow)',
                  border: '1px solid var(--border-bright)',
                  borderRadius: '6px',
                  width: 'fit-content',
                }}>
                  <User size={12} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>
                    {ownerNames[record.owner_id] || 'Loading...'}
                  </span>
                </div>
              )}

              {/* Date */}
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                {new Date(record.created_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'short', day: 'numeric'
                })}
              </p>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-outline"
                  style={{ flex: 1, justifyContent: 'center', fontSize: '13px', padding: '8px' }}
                  onClick={() => navigate(`/records/${record.id}`)}
                >
                  <FileText size={13} /> View
                </button>
                {user?.role === 'patient' && isOwnRecord(record) && (
                  <button
                    className="btn btn-outline"
                    style={{ flex: 1, justifyContent: 'center', fontSize: '13px', padding: '8px' }}
                    onClick={() => navigate(`/records/${record.id}/access`)}
                  >
                    <Users size={13} /> Access
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Record Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: '#00000080',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '24px',
        }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>New Health Record</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="input-group">
                <label>Title</label>
                <input required value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Blood Test Results — March 2025" />
              </div>

              <div className="input-group">
                <label>Type</label>
                <select value={form.record_type}
                  onChange={e => setForm({ ...form, record_type: e.target.value })}>
                  {RECORD_TYPES.map(t => (
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Content</label>
                <textarea required value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  placeholder="Enter medical details..."
                  style={{ minHeight: '120px' }} />
              </div>

              <div className="input-group">
                <label>Notes (optional)</label>
                <textarea value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Additional notes..."
                  style={{ minHeight: '80px' }} />
              </div>

              <div style={{
                background: 'var(--primary-glow)', border: '1px solid var(--border-bright)',
                borderRadius: '8px', padding: '10px 14px', marginBottom: '20px',
                fontSize: '12px', color: 'var(--text-secondary)',
              }}>
                🔐 This record will be encrypted with AES-256-GCM in your browser before upload. The server only stores ciphertext.
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn btn-outline"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  disabled={saving}>
                  {saving
                    ? <><div className="spinner" /> Encrypting...</>
                    : <><Lock size={14} /> Save Encrypted</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
