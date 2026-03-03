import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Unlock, ArrowLeft, Users, ShieldCheck,
         AlertTriangle, Send, FileText, Eye, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { recordsAPI } from '../utils/api';
import { decryptRecord, encryptRecord } from '../utils/crypto';
import { useAuth } from '../context/AuthContext';

const S = {
  page: { maxWidth: 780, margin: '0 auto', padding: '32px 24px', fontFamily: 'Inter, sans-serif' },
  backBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 14, fontWeight: 600, color: '#6B7280',
    background: 'none', border: 'none', cursor: 'pointer',
    marginBottom: 24, padding: 0, fontFamily: 'Inter, sans-serif',
  },
  card: {
    background: 'white', borderRadius: 16,
    boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
    marginBottom: 16, overflow: 'hidden',
  },
  cardPad: { padding: 24 },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  badge: {
    display: 'inline-block', fontSize: 11, fontWeight: 700,
    padding: '4px 12px', borderRadius: 999,
    background: '#DCFCE7', color: '#15803D',
    textTransform: 'capitalize', marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 6 },
  date: { fontSize: 13, color: '#9CA3AF' },
  manageBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 13, fontWeight: 600, color: '#16A34A',
    border: '1px solid #16A34A', borderRadius: 10,
    padding: '8px 16px', background: 'white', cursor: 'pointer',
    fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
  },
  sectionLabel: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 14,
  },
  cryptoBox: {
    background: '#F9FAFB', borderRadius: 12, padding: 16,
    border: '1px solid #F3F4F6', fontFamily: 'monospace', fontSize: 12,
  },
  cryptoRow: { marginBottom: 8, wordBreak: 'break-all', lineHeight: 1.6 },
  lockedCenter: { textAlign: 'center', padding: '48px 24px' },
  lockCircle: {
    width: 64, height: 64, borderRadius: '50%',
    background: '#F3F4F6', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 16px',
  },
  lockTitle: { fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 },
  lockSub: { fontSize: 14, color: '#6B7280', maxWidth: 340, margin: '0 auto 24px', lineHeight: 1.6 },
  decryptBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: '#16A34A', color: 'white',
    border: 'none', borderRadius: 12, padding: '11px 24px',
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
  },
  successBanner: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 13, fontWeight: 700, color: '#16A34A',
    paddingBottom: 16, marginBottom: 20,
    borderBottom: '1px solid #F3F4F6',
  },
  fieldLabel: {
    fontSize: 11, fontWeight: 700, color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
  },
  fieldBox: {
    background: '#F9FAFB', borderRadius: 10, padding: '14px 16px',
    fontSize: 14, color: '#374151', lineHeight: 1.7,
    border: '1px solid #F3F4F6', marginBottom: 16,
  },
  noteLabel: {
    fontSize: 11, fontWeight: 700, color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
    marginTop: 8,
  },
  noteTextarea: {
    width: '100%', padding: '12px 14px',
    border: '1px solid #E5E7EB', borderRadius: 10,
    fontSize: 14, fontFamily: 'Inter, sans-serif',
    color: '#374151', resize: 'vertical', minHeight: 90,
    outline: 'none', marginBottom: 12, boxSizing: 'border-box',
  },
  saveNoteBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: '#16A34A', color: 'white',
    border: 'none', borderRadius: 10, padding: '10px 20px',
    fontSize: 13, fontWeight: 700, cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
  },
  hideBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 13, color: '#9CA3AF', background: 'none',
    border: 'none', cursor: 'pointer', marginTop: 8,
    fontFamily: 'Inter, sans-serif', padding: 0,
  },
  errorCard: {
    background: 'white', borderRadius: 16, padding: 48,
    textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
    maxWidth: 480, margin: '60px auto',
  },
  pdfBox: {
    background: '#F0FDF4', border: '1px solid #BBF7D0',
    borderRadius: 12, padding: 16, marginBottom: 16,
    display: 'flex', alignItems: 'center', gap: 12,
  },
  pdfIcon: {
    width: 44, height: 44, borderRadius: 10,
    background: '#DCFCE7', display: 'flex',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  pdfViewBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: '#16A34A', color: 'white',
    border: 'none', borderRadius: 8, padding: '8px 16px',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'Inter, sans-serif', marginLeft: 'auto',
  },
};

export default function RecordViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, privateKey } = useAuth();

  const [record, setRecord]       = useState(null);
  const [decrypted, setDecrypted] = useState(null);
  const [decryptedPdf, setDecryptedPdf] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [decrypting, setDecrypting] = useState(false);
  const [error, setError]         = useState(null);
  const [note, setNote]           = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    recordsAPI.get(id)
      .then(({ data }) => setRecord(data))
      .catch(err => setError(err.response?.data?.detail || 'Failed to load record'))
      .finally(() => setLoading(false));
  }, [id]);

const handleDecrypt = async () => {
  if (!privateKey) { toast.error('Private key not in memory — please log in again'); return; }
  setDecrypting(true);
  try {
    const plaintext = await decryptRecord(
      record.encrypted_data, record.iv, record.wrapped_aes_key, privateKey
    );
    setDecrypted(plaintext);

    // Decrypt PDF if present
    if (record.encrypted_pdf && record.pdf_iv && record.wrapped_pdf_key) {
      try {
        const base64ToBytes = (b64) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));

        // Extract IV (before :: if old format, or just the iv if new format)
        const ivB64 = record.pdf_iv.includes('::')
          ? record.pdf_iv.split('::')[0]
          : record.pdf_iv;

        // Unwrap PDF AES key using RSA private key
        const wrappedKeyBytes = base64ToBytes(record.wrapped_pdf_key);
        const pdfAesKey = await window.crypto.subtle.unwrapKey(
          'raw',
          wrappedKeyBytes,
          privateKey,
          { name: 'RSA-OAEP' },
          { name: 'AES-GCM', length: 256 },
          false,
          ['decrypt']
        );

        // Decrypt PDF bytes
        const iv = base64ToBytes(ivB64);
        const ciphertext = base64ToBytes(record.encrypted_pdf);
        const decryptedBytes = await window.crypto.subtle.decrypt(
          { name: 'AES-GCM', iv, tagLength: 128 },
          pdfAesKey,
          ciphertext
        );

        setDecryptedPdf({
          bytes: new Uint8Array(decryptedBytes),
          filename: record.pdf_filename || 'document.pdf',
        });
      } catch (pdfErr) {
        console.error('PDF decrypt error:', pdfErr);
      }
    }

    toast.success('Decrypted successfully');
  } catch {
    toast.error('Decryption failed');
  } finally {
    setDecrypting(false);
  }
};

  const handleViewPdf = () => {
  if (!decryptedPdf?.bytes) return;
  const blob = new Blob([decryptedPdf.bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
};

  const handleSaveNote = async () => {
    if (!note.trim()) return;
    setSavingNote(true);
    try {
      const encrypted = await encryptRecord(
        { content: note, type: 'doctor_note', parent_record: id },
        user.public_key
      );
      await recordsAPI.create({ ...encrypted, title: `Dr. Note — ${record.title}`, record_type: 'note' });
      toast.success('Clinical note encrypted and saved');
      setNote('');
    } catch { toast.error('Failed to save note'); }
    finally { setSavingNote(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  if (error) return (
    <div style={S.errorCard}>
      <AlertTriangle size={40} color="#EF4444" style={{ margin: '0 auto 16px' }} />
      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Access Denied</h3>
      <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>{error}</p>
      <button onClick={() => navigate('/dashboard')} style={S.backBtn}>
        <ArrowLeft size={15} /> Back to Dashboard
      </button>
    </div>
  );

  return (
    <div style={S.page}>

      {/* Back button */}
      <button onClick={() => navigate('/dashboard')} style={S.backBtn}>
        <ArrowLeft size={15} /> Dashboard
      </button>

      {/* Header card */}
      <div style={S.card}>
        <div style={S.cardPad}>
          <div style={S.headerRow}>
            <div style={{ flex: 1, marginRight: 16 }}>
              <span style={S.badge}>{record.record_type?.replace('_', ' ')}</span>
              <h1 style={S.title}>{record.title}</h1>
              <p style={S.date}>
                {new Date(record.created_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>
            </div>
            {user?.role === 'patient' && record.owner_id === user.user_id && (
              <button style={S.manageBtn} onClick={() => navigate(`/records/${id}/access`)}>
                <Users size={14} /> Manage Access
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Encrypted data card */}
      <div style={S.card}>
        <div style={S.cardPad}>
          <div style={S.sectionLabel}>
            <Lock size={15} color="#F59E0B" />
            <span>Encrypted Data — what the server stores</span>
          </div>
          <div style={S.cryptoBox}>
            <div style={S.cryptoRow}>
              <span style={{ color: '#D97706', fontWeight: 700 }}>encrypted_data: </span>
              <span style={{ color: '#6B7280' }}>{record.encrypted_data?.substring(0, 80)}...</span>
            </div>
            <div style={S.cryptoRow}>
              <span style={{ color: '#2563EB', fontWeight: 700 }}>iv: </span>
              <span style={{ color: '#6B7280' }}>{record.iv}</span>
            </div>
            <div style={{ ...S.cryptoRow, marginBottom: 0 }}>
              <span style={{ color: '#7C3AED', fontWeight: 700 }}>wrapped_aes_key: </span>
              <span style={{ color: '#6B7280' }}>{record.wrapped_aes_key?.substring(0, 80)}...</span>
            </div>
          </div>
        </div>
      </div>

      {/* Decrypt / Decrypted card */}
      {!decrypted ? (
        <div style={S.card}>
          <div style={S.lockedCenter}>
            <div style={S.lockCircle}>
              <Lock size={28} color="#9CA3AF" />
            </div>
            <h3 style={S.lockTitle}>Record is Encrypted</h3>
            <p style={S.lockSub}>
              Your RSA private key (in memory) will unwrap the AES key and decrypt this record in your browser.
            </p>
            <button onClick={handleDecrypt} disabled={decrypting} style={S.decryptBtn}>
              {decrypting
                ? <><div className="spinner" style={{ borderTopColor: 'white' }} /> Decrypting...</>
                : <><Unlock size={15} /> Decrypt Record</>}
            </button>
          </div>
        </div>
      ) : (
        <div style={S.card}>
          <div style={S.cardPad}>
            <div style={S.successBanner}>
              <ShieldCheck size={17} color="#16A34A" />
              Decrypted successfully — plaintext never sent to server
            </div>
        {decryptedPdf && (
          <div style={S.pdfBox}>
            <div style={S.pdfIcon}>
              <FileText size={22} color="#16A34A" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                {decryptedPdf.filename}
              </div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>
                Decrypted — opens in new tab
              </div>
            </div>
            <button style={S.pdfViewBtn} onClick={handleViewPdf}>
              <Eye size={14} /> View PDF
            </button>
          </div>
        )}

            {/* Decrypted fields */}
            {Object.entries(decrypted).map(([key, value]) => (
              <div key={key}>
                <div style={S.fieldLabel}>{key.replace(/_/g, ' ')}</div>
                <div style={S.fieldBox}>
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </div>
              </div>
            ))}

            {/* PDF viewer (if exists) */}
            {decryptedPdf && (
              <div style={S.pdfBox}>
                <div style={S.pdfIcon}>
                  <FileText size={22} color="#16A34A" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                    {decryptedPdf.filename || 'Attached PDF'}
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>
                    Decrypted — opens in new tab
                  </div>
                </div>
                <button style={S.pdfViewBtn} onClick={handleViewPdf}>
                  <Eye size={14} /> View PDF
                </button>
              </div>
            )}

            {/* Doctor note */}
            {user?.role === 'doctor' && (
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #F3F4F6' }}>
                <div style={S.noteLabel}>Add Clinical Note</div>
                <textarea
                  value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Add your clinical observations..."
                  style={S.noteTextarea}
                />
                <button onClick={handleSaveNote}
                  disabled={savingNote || !note.trim()} style={S.saveNoteBtn}>
                  {savingNote
                    ? <><div className="spinner" /> Encrypting...</>
                    : <><Send size={14} /> Save Note</>}
                </button>
              </div>
            )}

            <button onClick={() => { setDecrypted(null); setDecryptedPdf(null); }} style={S.hideBtn}>
              <Lock size={13} /> Hide Plaintext
            </button>
          </div>
        </div>
      )}
    </div>
  );
}