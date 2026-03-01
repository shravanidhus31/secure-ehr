import { useState, useEffect } from 'react';
import { ClipboardList, Shield, Eye, Key, UserPlus, UserMinus, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { auditAPI } from '../utils/api';

const ACTION_CONFIG = {
  user_registered:  { label: 'Registered',      icon: UserPlus,  color: 'var(--success)' },
  user_login:       { label: 'Logged In',        icon: LogIn,     color: 'var(--primary)' },
  user_login_failed:{ label: 'Login Failed',     icon: LogIn,     color: 'var(--danger)'  },
  record_created:   { label: 'Record Created',   icon: Shield,    color: 'var(--accent)'  },
  record_viewed:    { label: 'Record Viewed',    icon: Eye,       color: 'var(--warning)' },
  access_granted:   { label: 'Access Granted',   icon: UserPlus,  color: 'var(--success)' },
  access_revoked:   { label: 'Access Revoked',   icon: UserMinus, color: 'var(--danger)'  },
};

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auditAPI.mine()
      .then(({ data }) => setLogs(data))
      .catch(() => toast.error('Failed to load audit log'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Activity Log</h1>
        <p>Every action on your account is recorded here. Append-only — nothing is ever deleted.</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : logs.length === 0 ? (
        <div className="empty-state">
          <ClipboardList size={48} />
          <h3>No activity yet</h3>
          <p>Actions you take will appear here</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {logs.map((log, i) => {
            const config = ACTION_CONFIG[log.action] || { label: log.action, icon: Shield, color: 'var(--text-secondary)' };
            const Icon = config.icon;
            return (
              <div key={log.id} style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '16px 20px',
                borderBottom: i < logs.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: `${config.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={16} style={{ color: config.color }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{config.label}</div>
                  {log.record_title && (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Record: {log.record_title}
                    </div>
                  )}
                  {log.details && (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {typeof log.details === 'object'
                        ? Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(' · ')
                        : log.details}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}