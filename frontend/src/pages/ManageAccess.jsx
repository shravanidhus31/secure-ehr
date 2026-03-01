import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, UserPlus, UserMinus, ArrowLeft, Search, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { accessAPI, usersAPI, recordsAPI } from '../utils/api';
import { rewrapKeyForUser } from '../utils/crypto';
import { useAuth } from '../context/AuthContext';

export default function ManageAccess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { privateKey } = useAuth();

  const [record, setRecord] = useState(null);
  const [accessList, setAccessList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [granting, setGranting] = useState(null);
  const [revoking, setRevoking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([recordsAPI.get(id), accessAPI.list(id)])
      .then(([recRes, accRes]) => {
        setRecord(recRes.data);
        setAccessList(accRes.data);
      })
      .catch(() => toast.error('Failed to load access data'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const { data } = await usersAPI.searchDoctors(q);
      // Filter out already-granted doctors
      const grantedIds = accessList.map(a => a.user_id);
      setSearchResults(data.filter(d => !grantedIds.includes(d.id)));
    } catch { toast.error('Search failed'); }
    finally { setSearching(false); }
  };

  const handleGrant = async (doctor) => {
    if (!privateKey) { toast.error('Private key not in memory — please log in again'); return; }
    setGranting(doctor.id);
    try {
      // Re-wrap the AES key with the doctor's public key — happens in browser
      const newWrappedKey = await rewrapKeyForUser(
        record.wrapped_aes_key,
        privateKey,
        doctor.public_key
      );

      await accessAPI.grant(id, {
        doctor_id: doctor.id,
        wrapped_aes_key: newWrappedKey,
      });

      toast.success(`Access granted to ${doctor.name}`);
      setAccessList(prev => [...prev, { user_id: doctor.id, name: doctor.name, role: doctor.role, granted_at: new Date().toISOString() }]);
      setSearchResults(prev => prev.filter(d => d.id !== doctor.id));
      setSearchQuery('');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to grant access');
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
    } catch {
      toast.error('Failed to revoke access');
    } finally {
      setRevoking(null);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  return (
    <div className="page" style={{ maxWidth: '680px' }}>
      <button className="btn btn-outline" style={{ marginBottom: '24px' }}
        onClick={() => navigate(`/records/${id}`)}>
        <ArrowLeft size={14} /> Back to Record
      </button>

      <div className="page-header">
        <h1>Manage Access</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {record?.title} — Grant or revoke doctor access to this record
        </p>
      </div>

      {/* How it works */}
      <div style={{
        display: 'flex', gap: '10px', alignItems: 'flex-start',
        background: 'var(--primary-glow)', border: '1px solid var(--border-bright)',
        borderRadius: '10px', padding: '14px', marginBottom: '28px',
      }}>
        <ShieldCheck size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Granting access re-wraps the AES session key with the doctor's RSA public key in your browser.
          The encrypted record is never duplicated. Revoking deletes their key envelope — they immediately lose access.
        </p>
      </div>

      {/* Current Access */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Users size={16} style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
            Current Access ({accessList.length})
          </h3>
        </div>

        {accessList.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', padding: '12px 0' }}>
            No one else has access to this record yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {accessList.map(entry => (
              <div key={entry.user_id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', background: 'var(--bg)',
                borderRadius: '8px', border: '1px solid var(--border)',
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{entry.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    <span className="badge badge-blue" style={{ marginRight: '8px' }}>{entry.role}</span>
                    Since {new Date(entry.granted_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  className="btn btn-danger"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => handleRevoke(entry.user_id, entry.name)}
                  disabled={revoking === entry.user_id}
                >
                  {revoking === entry.user_id
                    ? <div className="spinner" />
                    : <><UserMinus size={13} /> Revoke</>}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grant Access */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <UserPlus size={16} style={{ color: 'var(--success)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Grant Access to a Doctor</h3>
        </div>

        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={15} style={{
            position: 'absolute', left: '12px', top: '50%',
            transform: 'translateY(-50%)', color: 'var(--text-secondary)',
          }} />
          <input
            type="text"
            placeholder="Search doctors by name..."
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            style={{
              width: '100%', paddingLeft: '38px',
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '10px 14px 10px 38px',
              color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif', fontSize: '14px',
            }}
          />
          {searching && (
            <div className="spinner" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          )}
        </div>

        {searchResults.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {searchResults.map(doctor => (
              <div key={doctor.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', background: 'var(--bg)',
                borderRadius: '8px', border: '1px solid var(--border)',
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{doctor.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    <span className="badge badge-cyan">doctor</span>
                  </div>
                </div>
                <button
                  className="btn btn-success"
                  style={{ padding: '6px 14px', fontSize: '12px' }}
                  onClick={() => handleGrant(doctor)}
                  disabled={granting === doctor.id}
                >
                  {granting === doctor.id
                    ? <div className="spinner" />
                    : <><UserPlus size={13} /> Grant</>}
                </button>
              </div>
            ))}
          </div>
        )}

        {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
            No doctors found matching "{searchQuery}"
          </p>
        )}
      </div>
    </div>
  );
}