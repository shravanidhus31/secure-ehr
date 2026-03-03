import { useState, useEffect } from 'react';
import { Eye, UserPlus, UserMinus, LogIn, FileText, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { auditAPI } from '../utils/api';

const ACTION_CONFIG = {
  user_registered:   { label: 'REGISTERED', bg: '#DBEAFE', color: '#1D4ED8', icon: UserPlus },
  user_login:        { label: 'LOGIN',       bg: '#F3F4F6', color: '#374151', icon: LogIn },
  user_login_failed: { label: 'FAILED LOGIN',bg: '#FEE2E2', color: '#DC2626', icon: LogIn },
  record_created:    { label: 'CREATED',     bg: '#DBEAFE', color: '#1D4ED8', icon: FileText },
  record_viewed:     { label: 'VIEWED',      bg: '#DCFCE7', color: '#15803D', icon: Eye },
  access_granted:    { label: 'GRANTED',     bg: '#FEF9C3', color: '#92400E', icon: UserPlus },
  access_revoked:    { label: 'REVOKED',     bg: '#FEE2E2', color: '#DC2626', icon: UserMinus },
};

export default function AuditLog() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    auditAPI.mine()
      .then(({ data }) => setLogs(data))
      .catch(() => toast.error('Failed to load audit log'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    (l.record_title || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      maxWidth: 1000, margin: '0 auto',
      padding: '40px 24px', fontFamily: 'Inter, sans-serif',
    }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', marginBottom: 4 }}>
          Activity Log
        </h1>
        <p style={{ fontSize: 14, color: '#6B7280' }}>
          Every action on your account — append-only, nothing deleted
        </p>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Filter by action or record..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', maxWidth: 360,
          padding: '10px 16px',
          border: '1px solid #E5E7EB', borderRadius: 10,
          fontSize: 14, fontFamily: 'Inter, sans-serif',
          outline: 'none', color: '#374151',
          background: 'white', marginBottom: 24,
          boxSizing: 'border-box',
        }}
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: 'white', borderRadius: 16,
          boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
          padding: 60, textAlign: 'center',
        }}>
          <Shield size={44} color="#E5E7EB" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#9CA3AF', fontWeight: 500 }}>No activity yet</p>
        </div>
      ) : (
        <div style={{
          background: 'white', borderRadius: 16,
          boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
          overflow: 'hidden',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '180px 140px 1fr 180px',
            gap: 0,
            padding: '12px 24px',
            background: '#F9FAFB',
            borderBottom: '1px solid #F3F4F6',
          }}>
            {['Timestamp', 'Action', 'Record', 'Details'].map(h => (
              <span key={h} style={{
                fontSize: 11, fontWeight: 700, color: '#9CA3AF',
                textTransform: 'uppercase', letterSpacing: '0.07em',
              }}>
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {filtered.map((log, i) => {
            const config = ACTION_CONFIG[log.action] || {
              label: log.action.toUpperCase(),
              bg: '#F3F4F6', color: '#374151', icon: Shield,
            };
            const Icon = config.icon;

            const details = log.details
              ? typeof log.details === 'object'
                ? Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(', ')
                : String(log.details)
              : '—';

            return (
              <div key={log.id} style={{
                display: 'grid',
                gridTemplateColumns: '180px 140px 1fr 180px',
                gap: 0,
                padding: '14px 24px',
                alignItems: 'center',
                background: i % 2 === 0 ? 'white' : '#FAFAFA',
                borderBottom: i < filtered.length - 1 ? '1px solid #F9FAFB' : 'none',
              }}>

                {/* Timestamp */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                    {new Date(log.timestamp).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                    {new Date(log.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </div>

                {/* Action badge */}
                <div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: 11, fontWeight: 700,
                    padding: '4px 10px', borderRadius: 999,
                    background: config.bg, color: config.color,
                  }}>
                    <Icon size={10} />
                    {config.label}
                  </span>
                </div>

                {/* Record */}
                <div style={{
                  fontSize: 13, color: '#374151',
                  fontWeight: log.record_title ? 500 : 400,
                  paddingRight: 16,
                }}>
                  {log.record_title || <span style={{ color: '#D1D5DB' }}>—</span>}
                </div>

                {/* Details */}
                <div style={{
                  fontSize: 12, color: '#9CA3AF',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {details}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}