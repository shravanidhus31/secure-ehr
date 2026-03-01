import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Unlock, ArrowLeft, Users, ShieldCheck, AlertTriangle,FileText, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { recordsAPI } from '../utils/api';
import { decryptRecord } from '../utils/crypto';
import { useAuth } from '../context/AuthContext';

export default function RecordViewer() {
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, privateKey } = useAuth();

  const [record, setRecord] = useState(null);
  const [decrypted, setDecrypted] = useState(null);
  const [loading, setLoading] = useState(true);
  const [decrypting, setDecrypting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    recordsAPI.get(id)
      .then(({ data }) => setRecord(data))
      .catch(err => setError(err.response?.data?.detail || 'Failed to load record'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDecrypt = async () => {
    if (!privateKey) {
      toast.error('Private key not in memory — please log in again');
      return;
    }
    setDecrypting(true);
    try {
      const plaintext = await decryptRecord(
        record.encrypted_data,
        record.iv,
        record.wrapped_aes_key,
        privateKey
      );
      setDecrypted(plaintext);
      toast.success('Decrypted successfully');
    } catch (err) {
      toast.error('Decryption failed — you may not have the correct key');
      console.error(err);
    } finally {
      setDecrypting(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  if (error) return (
    <div className="page">
      <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
        <AlertTriangle size={40} style={{ color: 'var(--danger)', margin: '0 auto 16px' }} />
        <h3 style={{ marginBottom: '8px' }}>Access Denied</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>{error}</p>
        <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={14} /> Back to Dashboard
        </button>
      </div>
    </div>
  );
  const handleSaveNote = async () => {
  if (!note.trim()) return;
  setSavingNote(true);
  try {
    // Encrypt the note with the record owner's public key
    // We need the owner's public key — fetch it
    const { data: ownerData } = await import('../utils/api').then(m => 
      m.default.get(`/users/doctors?q=`)
    );
    
    // Simpler approach — encrypt with current user's public key for now
    const { encryptRecord } = await import('../utils/crypto');
    const encrypted = await encryptRecord(
      { content: note, type: 'doctor_note', parent_record: id },
      user.public_key
    );
    
    await recordsAPI.create({
      ...encrypted,
      title: `Dr. Note — ${record.title}`,
      record_type: 'note',
    });
    
    toast.success('Note saved and encrypted');
    setNote('');
  } catch (err) {
    toast.error('Failed to save note');
    console.error(err);
  } finally {
    setSavingNote(false);
  }
};

  return (
    <div className="page" style={{ maxWidth: '760px' }}>
      {/* Back button */}
      <button className="btn btn-outline" style={{ marginBottom: '24px' }}
        onClick={() => navigate('/dashboard')}>
        <ArrowLeft size={14} /> Dashboard
      </button>

      {/* Record Header */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span className="badge badge-blue" style={{ marginBottom: '10px', display: 'inline-flex' }}>
              {record.record_type?.replace('_', ' ')}
            </span>
            <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>{record.title}</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Created {new Date(record.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {user?.role === 'patient' && record.owner_id === user.user_id && (
            <button className="btn btn-outline" onClick={() => navigate(`/records/${id}/access`)}>
              <Users size={14} /> Manage Access
            </button>
          )}
        </div>
      </div>

      {/* Encrypted Data (always visible — shows what server stores) */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Lock size={16} style={{ color: 'var(--warning)' }} />
          <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Encrypted Data (what the server stores)</h3>
        </div>
        <div style={{
          background: 'var(--bg)', borderRadius: '8px', padding: '14px',
          fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px',
          color: 'var(--text-secondary)', wordBreak: 'break-all', lineHeight: '1.6',
          border: '1px solid var(--border)',
        }}>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: 'var(--warning)', fontWeight: 600 }}>encrypted_data: </span>
            {record.encrypted_data?.substring(0, 80)}...
          </div>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>iv: </span>
            {record.iv}
          </div>
          <div>
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>wrapped_aes_key: </span>
            {record.wrapped_aes_key?.substring(0, 80)}...
          </div>
        </div>
      </div>

      {/* Decrypt Section */}
      {!decrypted ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <Lock size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <h3 style={{ marginBottom: '8px' }}>Record is Encrypted</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
            Your RSA private key (in memory) will unwrap the AES session key,
            which then decrypts this record — entirely in your browser.
          </p>
          <button className="btn btn-primary" onClick={handleDecrypt} disabled={decrypting}>
            {decrypting
              ? <><div className="spinner" /> Decrypting...</>
              : <><Unlock size={14} /> Decrypt Record</>}
          </button>
        </div>
      ) : (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <ShieldCheck size={18} style={{ color: 'var(--success)' }} />
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--success)' }}>
              Decrypted Successfully — plaintext never sent to server
            </h3>
          </div>

          {Object.entries(decrypted).map(([key, value]) => (
            <div key={key} style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px'
              }}>
                {key.replace('_', ' ')}
              </div>
              <div style={{
                background: 'var(--bg)', borderRadius: '8px', padding: '14px',
                fontSize: '14px', lineHeight: '1.6', border: '1px solid var(--border)',
                whiteSpace: 'pre-wrap'
              }}>
                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
              </div>
            </div>
          ))}
              {/* Doctor note input */}
            {user?.role === 'doctor' && (
             <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px', color: 'var(--text-secondary)' }}>
                  ADD CLINICAL NOTE
                </div>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add your clinical observations..."
                  style={{
                  width: '100%', minHeight: '80px', background: 'var(--bg)',
                  border: '1px solid var(--border)', borderRadius: '8px',
                  padding: '12px', color: 'var(--text-primary)',
                  fontFamily: 'Syne, sans-serif', fontSize: '14px',
                  resize: 'vertical', marginBottom: '10px',
                }}
                />
                <button className="btn btn-primary" onClick={handleSaveNote} disabled={savingNote || !note.trim()}>
                    {savingNote ? <><div className="spinner" /> Encrypting note...</> : <><Send size={14} /> Save Note</>}
                </button>
             </div>
            )}
          

          <button className="btn btn-outline" style={{ marginTop: '8px' }}
            onClick={() => setDecrypted(null)}>
            <Lock size={14} /> Hide Plaintext
          </button>
        </div>
      )}
    </div>
  );
}