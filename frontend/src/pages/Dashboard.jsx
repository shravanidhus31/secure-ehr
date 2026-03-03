import { encryptPdf } from '../utils/crypto';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Lock, Users, Shield, User,Upload, Search, ChevronRight, X, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { recordsAPI, usersAPI } from '../utils/api';
import { encryptRecord } from '../utils/crypto';
import { useAuth } from '../context/AuthContext';

const DS = {
  page: { maxWidth: 1100, margin: '0 auto', padding: '40px 32px', fontFamily: 'Inter, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  h1: { fontSize: 26, fontWeight: 800, color: '#111827', marginBottom: 4 },
  sub: { fontSize: 14, color: '#6B7280' },
  newBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#16A34A', color: 'white',
    border: 'none', borderRadius: 12, padding: '10px 20px',
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
  },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 32 },
  statCard: {
    background: 'white', borderRadius: 16,
    boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
    padding: 20, display: 'flex', alignItems: 'center', gap: 16,
  },
  iconBox: (bg) => ({
    width: 44, height: 44, borderRadius: 12, background: bg,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }),
  statVal: { fontSize: 18, fontWeight: 800, color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280' },
  searchWrap: { position: 'relative', maxWidth: 320, marginBottom: 24 },
  searchIcon: { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' },
  searchInput: {
    width: '100%', padding: '10px 14px 10px 40px',
    border: '1px solid #E5E7EB', borderRadius: 12, fontSize: 14,
    fontFamily: 'Inter, sans-serif', outline: 'none', color: '#374151',
    background: 'white',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 },
  card: {
    background: 'white', borderRadius: 16,
    boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
    overflow: 'hidden', transition: 'box-shadow 0.2s',
  },
  cardInner: { padding: 20 },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badge: (bg, color) => ({
    fontSize: 11, fontWeight: 700, padding: '3px 10px',
    borderRadius: 999, background: bg, color,
    textTransform: 'capitalize',
  }),
  cardTitle: { fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6, lineHeight: 1.4 },
  cardDate: { fontSize: 12, color: '#9CA3AF', marginBottom: 14 },
  blurPreview: { background: '#F9FAFB', borderRadius: 10, padding: 12, marginBottom: 14 },
  blurLine: (w) => ({ height: 8, background: '#E5E7EB', borderRadius: 4, marginBottom: 6, width: w, filter: 'blur(2px)' }),
  btnRow: { display: 'flex', gap: 8 },
  viewBtn: {
    flex: 1, padding: '9px 0', borderRadius: 10,
    border: '1px solid #16A34A', background: 'white',
    color: '#16A34A', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
  },
  accessBtn: {
    flex: 1, padding: '9px 0', borderRadius: 10,
    border: 'none', background: '#16A34A',
    color: 'white', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
  },
  patientPill: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    background: '#F0FDF4', border: '1px solid #BBF7D0',
    borderRadius: 999, padding: '4px 10px', marginBottom: 6,
  },
  empty: {
    background: 'white', borderRadius: 16, padding: 60,
    textAlign: 'center', gridColumn: '1/-1',
    boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
  },
  // Modal
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 24,
  },
  modal: { background: 'white', borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #F3F4F6' },
  modalBody: { padding: 24 },
  mLabel: { fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block' },
  mInput: { width: '100%', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', color: '#374151', marginBottom: 16, boxSizing: 'border-box' },
  mTextarea: { width: '100%', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', color: '#374151', marginBottom: 16, resize: 'vertical', minHeight: 90, boxSizing: 'border-box' },
  mSelect: { width: '100%', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', color: '#374151', marginBottom: 16, background: 'white' },
  cryptoNote: { display: 'flex', alignItems: 'center', gap: 8, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#15803D' },
  mBtnRow: { display: 'flex', gap: 10 },
  cancelBtn: { flex: 1, padding: '11px 0', borderRadius: 12, border: '1px solid #E5E7EB', background: 'white', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
  saveBtn: { flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', background: '#16A34A', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
};

const TYPE_BADGE = {
  diagnosis:    { bg: '#DBEAFE', color: '#1D4ED8', cardBg: '#EFF6FF', border: '#BFDBFE' },
  prescription: { bg: '#DCFCE7', color: '#15803D', cardBg: '#F0FDF4', border: '#BBF7D0' },
  lab_result:   { bg: '#FEF9C3', color: '#92400E', cardBg: '#FFFBEB', border: '#FDE68A' },
  imaging:      { bg: '#CFFAFE', color: '#0E7490', cardBg: '#ECFEFF', border: '#A5F3FC' },
  note:         { bg: '#F3E8FF', color: '#7E22CE', cardBg: '#FAF5FF', border: '#DDD6FE' },
};

const RECORD_TYPES = ['diagnosis', 'prescription', 'lab_result', 'imaging', 'note'];
const TYPE_COLORS = {
  diagnosis:    'bg-blue-100 text-blue-700',
  prescription: 'bg-green-100 text-green-700',
  lab_result:   'bg-yellow-100 text-yellow-700',
  imaging:      'bg-cyan-100 text-cyan-700',
  note:         'bg-purple-100 text-purple-700',
};

export default function Dashboard() {
  const [records, setRecords]       = useState([]);
  const [ownerNames, setOwnerNames] = useState({});
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState({ title: '', record_type: 'diagnosis', content: '', notes: '' });
  const [saving, setSaving]         = useState(false);
  const [search, setSearch]         = useState('');
  const { user }                    = useAuth();
  const [pdfFile, setPdfFile] = useState(null);
  const navigate                    = useNavigate();

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async () => {
    try {
      const { data } = await recordsAPI.list();
      setRecords(data);
      if (user?.role === 'doctor') {
        const ids = [...new Set(data.map(r => r.owner_id))];
        const map = {};
        await Promise.all(ids.map(async id => {
          try {
            const { data: u } = await usersAPI.getPublic(id);
            map[id] = u.name;
          } catch { map[id] = 'Unknown Patient'; }
        }));
        setOwnerNames(map);
      }
    } catch { toast.error('Failed to load records'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Step 1: encrypt the text record
      const encrypted = await encryptRecord(
        { content: form.content, notes: form.notes, created_by: user.name },
        user.public_key
      );

      let pdfFields = {};

      if (pdfFile) {
        // Step 2: encrypt PDF using the same AES key
        // Re-derive by importing the wrapped key — simpler: just encrypt PDF bytes
        // using a separate AES key and store separately
        const arrayBuffer = await pdfFile.arrayBuffer();
        const fileBytes = new Uint8Array(arrayBuffer);

        // Generate a fresh AES key for the PDF
        const pdfAesKey = await window.crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']
        );
        const pdfIv = window.crypto.getRandomValues(new Uint8Array(12));

        const encryptedPdfBytes = await window.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv: pdfIv, tagLength: 128 },
          pdfAesKey,
          fileBytes
        );

        // Import recipient public key and wrap the PDF AES key
        const pemToBytes = (pem) => {
          const b64 = pem.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\n/g, '');
          const binary = atob(b64);
          return Uint8Array.from(binary, c => c.charCodeAt(0));
        };
        const pubKeyBytes = pemToBytes(user.public_key);
        const publicKey = await window.crypto.subtle.importKey(
          'spki', pubKeyBytes,
          { name: 'RSA-OAEP', hash: 'SHA-256' },
          false, ['wrapKey']
        );
        const wrappedPdfKey = await window.crypto.subtle.wrapKey(
          'raw', pdfAesKey, publicKey, { name: 'RSA-OAEP' }
        );
        const bytesToBase64 = (bytes) => {
          let binary = '';
          const chunkSize = 8192;
          for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
          }
          return btoa(binary);
        };
        pdfFields = {
          encrypted_pdf: bytesToBase64(new Uint8Array(encryptedPdfBytes)),
          pdf_iv: bytesToBase64(pdfIv),
          pdf_filename: pdfFile.name,
          // Store the wrapped PDF key inside encrypted_pdf metadata
          // We'll append it to pdf_iv separated by :: for retrieval
        };

        // Store wrapped key alongside iv using separator
        pdfFields.pdf_iv = bytesToBase64(pdfIv) + '::' + bytesToBase64(new Uint8Array(wrappedPdfKey));

        toast('PDF encrypted 🔒', { icon: '✓' });
      }

      await recordsAPI.create({
        ...encrypted,
        ...pdfFields,
        title: form.title,
        record_type: form.record_type,
      });

      toast.success('Record saved — encrypted in your browser');
      setShowModal(false);
      setForm({ title: '', record_type: 'diagnosis', content: '', notes: '' });
      setPdfFile(null);
      fetchRecords();
    } catch (err) {
      console.error('Create record error:', err);
      toast.error('Failed to create record');
    } finally {
      setSaving(false);
    }
};  

  const filteredRecords = records.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={DS.page}>

      {/* Header */}
      <div style={DS.header}>
        <div>
          <h1 style={DS.h1}>{user?.role === 'doctor' ? 'Patient Records' : 'My Health Records'}</h1>
          <p style={DS.sub}>
            {user?.role === 'doctor'
              ? 'Records patients have shared with you'
              : 'All records are end-to-end encrypted — server stores only ciphertext'}
          </p>
        </div>
        {user?.role === 'patient' && (
          <button style={DS.newBtn} onClick={() => setShowModal(true)}>
            <Plus size={16} /> New Record
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={DS.statsRow}>
        {[
          { label: 'Total Records', value: records.length, icon: FileText, iconColor: '#2563EB', iconBg: '#DBEAFE' },
          { label: 'Encryption', value: 'AES-256-GCM', icon: Lock, iconColor: '#16A34A', iconBg: '#DCFCE7' },
          { label: 'Key Exchange', value: 'RSA-2048', icon: Shield, iconColor: '#7C3AED', iconBg: '#EDE9FE' },
        ].map(({ label, value, icon: Icon, iconColor, iconBg }) => (
          <div key={label} style={DS.statCard}>
            <div style={DS.iconBox(iconBg)}><Icon size={20} color={iconColor} /></div>
            <div>
              <div style={DS.statVal}>{value}</div>
              <div style={DS.statLabel}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={DS.searchWrap}>
        <Search size={16} color="#9CA3AF" style={DS.searchIcon} />
        <input style={DS.searchInput} placeholder="Search records..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Records grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : (
        <div style={DS.grid}>
          {filteredRecords.length === 0 ? (
            <div style={DS.empty}>
              <FileText size={44} color="#D1D5DB" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 600, color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
                {user?.role === 'doctor' ? 'No records shared with you yet' : 'No records yet'}
              </p>
            </div>
          ) : filteredRecords.map(record => {
            const badge = TYPE_BADGE[record.record_type] || { bg: '#F3F4F6', color: '#374151' };
            return (
              <div key={record.id} style={{
                ...DS.card,
                background: (TYPE_BADGE[record.record_type] || { cardBg: 'white' }).cardBg,
                borderLeft: `4px solid ${(TYPE_BADGE[record.record_type] || { border: '#E5E7EB' }).border}`,
              }}>
                <div style={DS.cardInner}>
                  <div style={DS.cardTop}>
                    <span style={DS.badge(badge.bg, badge.color)}>
                      {record.record_type.replace('_', ' ')}
                    </span>
                    <Lock size={13} color="#F59E0B" />
                  </div>

                  <div style={DS.cardTitle}>{record.title}</div>

                  {user?.role === 'doctor' && (
                    <div style={DS.patientPill}>
                      <User size={11} color="#16A34A" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', fontFamily: 'Inter, sans-serif' }}>
                        {ownerNames[record.owner_id] || '...'}
                      </span>
                    </div>
                  )}

                  <div style={DS.cardDate}>
                    {new Date(record.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>

                  {/* Blurred preview */}
                  <div style={DS.blurPreview}>
                    <div style={DS.blurLine('100%')} />
                    <div style={DS.blurLine('80%')} />
                    <div style={DS.blurLine('60%')} />
                  </div>

                  <div style={DS.btnRow}>
                    <button style={DS.viewBtn} onClick={() => navigate(`/records/${record.id}`)}>
                      View Record
                    </button>
                    {user?.role === 'patient' && record.owner_id === user?.user_id && (
                      <button style={DS.accessBtn} onClick={() => navigate(`/records/${record.id}/access`)}>
                        Access
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={DS.overlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={DS.modal}>
            <div style={DS.modalHead}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', fontFamily: 'Inter, sans-serif' }}>New Health Record</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                <X size={20} />
              </button>
            </div>
            <div style={DS.modalBody}>
              <form onSubmit={handleCreate}>
                <label style={DS.mLabel}>Title</label>
                <input required style={DS.mInput} placeholder="e.g. Blood Test Results"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />

                <label style={DS.mLabel}>Type</label>
                <select style={DS.mSelect} value={form.record_type}
                  onChange={e => setForm({ ...form, record_type: e.target.value })}>
                  {RECORD_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>

                <label style={DS.mLabel}>Content</label>
                <textarea required style={DS.mTextarea} rows={4} placeholder="Enter medical details..."
                  value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />

                <label style={DS.mLabel}>Notes (optional)</label>
                <textarea style={DS.mTextarea} rows={3} placeholder="Additional notes..."
                  value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                {/* PDF Upload */}
                <div style={{ marginBottom: 16 }}>
                  <label style={DS.mLabel}>Attach PDF (optional — CT scan, MRI, lab report)</label>
                  <div style={{
                    border: '2px dashed #E5E7EB', borderRadius: 10,
                    padding: '20px', textAlign: 'center',
                    background: pdfFile ? '#F0FDF4' : '#FAFAFA',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                    onClick={() => document.getElementById('pdf-upload').click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); setPdfFile(e.dataTransfer.files[0]); }}
                  >
                    <input
                      id="pdf-upload" type="file" accept=".pdf"
                      style={{ display: 'none' }}
                      onChange={e => setPdfFile(e.target.files[0])}
                    />
                    {pdfFile ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <FileText size={20} color="#16A34A" />
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#16A34A' }}>{pdfFile.name}</span>
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); setPdfFile(null); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 18, lineHeight: 1 }}>
                          ×
                        </button>
                      </div>
                    ) : (
                      <div>
                        <FileText size={28} color="#D1D5DB" style={{ margin: '0 auto 8px' }} />
                        <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
                          Click or drag & drop a PDF here
                        </p>
                        <p style={{ fontSize: 11, color: '#D1D5DB', margin: '4px 0 0' }}>
                          Encrypted before upload — server never sees contents
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div style={DS.cryptoNote}>
                  <Lock size={14} color="#16A34A" />
                  Encrypted with AES-256-GCM in your browser before upload
                </div>

                <div style={DS.mBtnRow}>
                  <button type="button" style={DS.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" style={DS.saveBtn} disabled={saving}>
                    {saving ? <><div className="spinner" /> Encrypting...</> : <><Lock size={14} /> Save Encrypted</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}