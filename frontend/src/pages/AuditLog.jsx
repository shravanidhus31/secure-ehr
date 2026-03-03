import { useState, useEffect } from 'react';
import { ClipboardList, Shield, Eye, UserPlus, UserMinus, LogIn, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { auditAPI } from '../utils/api';

const ACTION_CONFIG = {
  user_registered:   { label: 'REGISTERED',     color: 'bg-blue-100 text-blue-700',   icon: UserPlus  },
  user_login:        { label: 'LOGIN',           color: 'bg-gray-100 text-gray-600',   icon: LogIn     },
  user_login_failed: { label: 'LOGIN FAILED',    color: 'bg-red-100 text-red-600',     icon: LogIn     },
  record_created:    { label: 'CREATED',         color: 'bg-blue-100 text-blue-700',   icon: FileText  },
  record_viewed:     { label: 'VIEWED',          color: 'bg-green-100 text-green-700', icon: Eye       },
  access_granted:    { label: 'GRANTED',         color: 'bg-yellow-100 text-yellow-700', icon: UserPlus },
  access_revoked:    { label: 'REVOKED',         color: 'bg-red-100 text-red-600',     icon: UserMinus },
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
    l.action.includes(search.toLowerCase()) ||
    (l.record_title || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Activity Log</h1>
        <p className="text-sm text-gray-500">Every action on your account — append-only, nothing deleted</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-6">
        <input type="text" placeholder="Filter by action or record..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="light-input max-w-sm rounded-xl" />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card text-center py-20">
          <ClipboardList size={44} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-500">No activity yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-4 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
            {['Timestamp', 'Action', 'Record', 'Details'].map(h => (
              <span key={h} className="text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</span>
            ))}
          </div>

          {/* Rows */}
          {filtered.map((log, i) => {
            const config = ACTION_CONFIG[log.action] || { label: log.action.toUpperCase(), color: 'bg-gray-100 text-gray-600', icon: Shield };
            const Icon = config.icon;
            return (
              <div key={log.id}
                className={`grid grid-cols-4 gap-4 px-6 py-4 items-center border-b border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>

                {/* Timestamp */}
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Action badge */}
                <div>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${config.color}`}>
                    <Icon size={11} />
                    {config.label}
                  </span>
                </div>

                {/* Record */}
                <div>
                  <p className="text-sm text-gray-600 truncate">
                    {log.record_title || <span className="text-gray-300">—</span>}
                  </p>
                </div>

                {/* Details */}
                <div>
                  <p className="text-xs text-gray-400 truncate">
                    {log.details
                      ? typeof log.details === 'object'
                        ? Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(', ')
                        : log.details
                      : '—'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}