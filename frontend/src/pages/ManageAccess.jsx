import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, UserPlus, UserMinus, ArrowLeft,
         Search, ShieldCheck, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { accessAPI, usersAPI, recordsAPI } from '../utils/api';
import { rewrapKeyForUser } from '../utils/crypto';
import { useAuth } from '../context/AuthContext';

const S = {
  page: { maxWidth: 700, margin: '0 auto', padding: '32px 24px', fontFamily: 'Inter, sans-serif' },
  backBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 14, fontWeight: 600, color: '#6B7280',
    background: 'none', border: 'none', cursor: 'pointer',
    marginBottom: 24, padding: 0, fontFamily: 'Inter, sans-serif',
  },
  heading: { fontSize: 24, fontWeight: 800, color: '#111827', marginBottom: 4 },
  subheading: { fontSize: 14, color: '#6B7280', marginBottom: 28 },
  banner: {
    display: 'flex', alignItems: 'flex-start', gap: 12,
    background: '#EFF6FF', border: '1px solid #BFDBFE',
    borderRadius: 12, padding: '14px 16px', marginBottom: 20,
  },
  bannerText: { fontSize: 13, color: '#1D4ED8', lineHeight: 1.6, margin: 0 },
  card: {
    background: 'white', borderRadius: 16,
    boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
    padding: 24, marginBottom: 16,
  },
  cardTitle: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 20,
  },
  emptyText: { fontSize: 14, color: '#9CA3AF', padding: '16px 0' },
  accessRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px', background: '#F9FAFB',
    borderRadius: 12, border: '1px solid #F3F4F6', marginBottom: 10,
  },
  avatar: (bg) => ({
    width: 38, height: 38, borderRadius: '50%',
    background: bg, color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, fontWeight: 700, flexShrink: 0,
    fontFamily: 'Inter, sans-serif',
  }),
  nameWrap: { marginLeft: 12 },
  nameText: { fontSize: 14, fontWeight: 600, color: '#111827' },
  metaRow: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 },
  metaText: { fontSize: 12, color: '#16A34A', fontWeight: 600, textTransform: 'capitalize' },
  metaDate: { fontSize: 12, color: '#9CA3AF' },
  revokeBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 13, fontWeight: 600, color: '#EF4444',
    border: '1px solid #FCA5A5', borderRadius: 10,
    padding: '7px 14px', background: 'white', cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
  },
  searchWrap: { position: 'relative', marginBottom: 16 },
  searchIcon: { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' },
  searchInput: {
    width: '100%', padding: '11px 14px 11px 40px',
    border: '1px solid #E5E7EB', borderRadius: 999,
    fontSize: 14, fontFamily: 'Inter, sans-serif',
    outline: 'none', color: '#374151', background: 'white',
    boxSizing: 'border-box',
  },
  resultRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px', background: '#F9FAFB',
    borderRadius: 12, border: '1px solid #F3F4F6', marginBottom: 8,
  },
  grantBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 13, fontWeight: 600, color: 'white',
    background: '#16A34A', border: 'none', borderRadius: 10,
    padding: '8px 16px', cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
  },
  noResults: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', padding: '20px 0' },
};

export default function ManageAccess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { privateKey } = useAuth();

  const [record, setRecord]           = useState(null);
  const [accessList, setAccessList]   = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]     = useState(false);
  const [granting, setGranting]       = useState(null);
  const [revoking, setRevoking]       = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([recordsAPI.get(id), accessAPI.list(id)])
      .then(([r, a]) => { setRecord(r.data); setAccessList(a.data); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const { data } = await usersAPI.searchDoctors(q);
      const grantedIds = accessList.map(a => a.user_id);
      setSearchResults(data.filter(d => !grantedIds.includes(d.id)));
    } catch { toast.error('Search failed'); }
    finally { setSearching(false); }
  };

  const handleGrant = async (doctor) => {
    if (!privateKey) { toast.error('Private key not in memory'); return; }
    setGranting(doctor.id);
    try {
      // Re-wrap the record AES key for the doctor
      const newKey = await rewrapKeyForUser(
        record.wrapped_aes_key, privateKey, doctor.public_key
      );

      // Also re-wrap the PDF key if this record has a PDF
      let wrappedPdfKey = null;
      if (record.pdf_iv && record.pdf_iv.includes('::')) {
        const parts = record.pdf_iv.split('::');
        const wrappedPdfKeyB64 = parts[1];

        // Unwrap the PDF AES key using owner's private key
        const base64ToBytes = (b64) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        const wrappedPdfKeyBytes = base64ToBytes(wrappedPdfKeyB64);

        const pdfAesKey = await window.crypto.subtle.unwrapKey(
          'raw',
          wrappedPdfKeyBytes,
          privateKey,
          { name: 'RSA-OAEP' },
          { name: 'AES-GCM', length: 256 },
          true,  // extractable so we can re-wrap
          ['decrypt']
        );

        // Re-wrap PDF AES key with doctor's public key
        const pemToBytes = (pem) => {
          const b64 = pem.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\n/g, '');
          return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        };
        const pubKeyBytes = pemToBytes(doctor.public_key);
        const doctorPublicKey = await window.crypto.subtle.importKey(
          'spki', pubKeyBytes,
          { name: 'RSA-OAEP', hash: 'SHA-256' },
          false, ['wrapKey']
        );

        const bytesToBase64 = (bytes) => {
          let binary = '';
          for (let i = 0; i < bytes.length; i += 8192) {
            binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
          }
          return btoa(binary);
        };

        const rewrapped = await window.crypto.subtle.wrapKey(
          'raw', pdfAesKey, doctorPublicKey, { name: 'RSA-OAEP' }
        );
        wrappedPdfKey = bytesToBase64(new Uint8Array(rewrapped));
      }

      await accessAPI.grant(id, {
        doctor_id: doctor.id,
        wrapped_aes_key: newKey,
        wrapped_pdf_key: wrappedPdfKey,
      });

      toast.success(`Access granted to ${doctor.name}`);
      setAccessList(prev => [...prev, {
        user_id: doctor.id, name: doctor.name,
        role: doctor.role, granted_at: new Date().toISOString()
      }]);
      setSearchResults(prev => prev.filter(d => d.id !== doctor.id));
      setSearchQuery('');
    } catch (err) {
      console.error('Grant error:', err);
      toast.error(err.response?.data?.detail || 'Failed to grant');
    } finally {
      setGranting(null);
    }
  };

  const handleRevoke = async (userId, userName) => {
    if (!window.confirm(`Revoke access for ${userName}?`)) return;
    setRevoking(userId);
    try {
      await accessAPI.revoke(id, userId);
      toast.success(`Access revoked for ${userName}`);
      setAccessList(prev => prev.filter(a => a.user_id !== userId));
    } catch { toast.error('Failed to revoke'); }
    finally { setRevoking(null); }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  return (
    <div style={S.page}>
      <button onClick={() => navigate(`/records/${id}`)} style={S.backBtn}>
        <ArrowLeft size={15} /> Back to Record
      </button>

      <h1 style={S.heading}>Manage Access</h1>
      <p style={S.subheading}>{record?.title}</p>

      {/* Info banner */}
      <div style={S.banner}>
        <ShieldCheck size={16} color="#2563EB" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={S.bannerText}>
          Granting access re-wraps the AES session key with the doctor's RSA public key in your browser.
          Revoking deletes their key envelope — immediate cryptographic loss of access.
        </p>
      </div>

      {/* Currently authorized */}
      <div style={S.card}>
        <div style={S.cardTitle}>
          <Users size={16} color="#16A34A" />
          Currently Authorized ({accessList.length})
        </div>

        {accessList.length === 0 ? (
          <p style={S.emptyText}>No one else has access to this record.</p>
        ) : accessList.map(entry => (
          <div key={entry.user_id} style={S.accessRow}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={S.avatar('#16A34A')}>
                {entry.name?.charAt(0).toUpperCase()}
              </div>
              <div style={S.nameWrap}>
                <div style={S.nameText}>{entry.name}</div>
                <div style={S.metaRow}>
                  <span style={S.metaText}>{entry.role}</span>
                  <CheckCircle size={12} color="#16A34A" />
                  <span style={S.metaDate}>
                    Since {new Date(entry.granted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleRevoke(entry.user_id, entry.name)}
              disabled={revoking === entry.user_id}
              style={S.revokeBtn}>
              {revoking === entry.user_id
                ? <div className="spinner" />
                : <><UserMinus size={13} /> Revoke</>}
            </button>
          </div>
        ))}
      </div>

      {/* Grant access */}
      <div style={S.card}>
        <div style={S.cardTitle}>
          <UserPlus size={16} color="#16A34A" />
          Grant Access to a Doctor
        </div>

        <div style={S.searchWrap}>
          <Search size={15} color="#9CA3AF" style={S.searchIcon} />
          <input
            type="text" placeholder="Search doctors by name..."
            value={searchQuery} onChange={e => handleSearch(e.target.value)}
            style={S.searchInput}
          />
          {searching && (
            <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
              <div className="spinner" />
            </div>
          )}
        </div>

        {searchResults.map(doctor => (
          <div key={doctor.id} style={S.resultRow}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={S.avatar('#3B82F6')}>
                {doctor.name?.charAt(0).toUpperCase()}
              </div>
              <div style={S.nameWrap}>
                <div style={S.nameText}>{doctor.name}</div>
                <span style={{ ...S.metaText, color: '#3B82F6' }}>Doctor</span>
              </div>
            </div>
            <button
              onClick={() => handleGrant(doctor)}
              disabled={granting === doctor.id}
              style={S.grantBtn}>
              {granting === doctor.id
                ? <div className="spinner" />
                : <><UserPlus size={13} /> Grant</>}
            </button>
          </div>
        ))}

        {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
          <p style={S.noResults}>No doctors found matching "{searchQuery}"</p>
        )}
      </div>
    </div>
  );
}