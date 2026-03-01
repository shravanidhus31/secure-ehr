import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, LayoutDashboard, ClipboardList, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '60px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Shield size={18} color="white" />
        </div>
        <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>
          SecureEHR
        </span>
      </Link>

      {/* Nav Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {[
          { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/audit', icon: ClipboardList, label: 'Activity' },
        ].map(({ to, icon: Icon, label }) => (
          <Link key={to} to={to} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 14px', borderRadius: '6px', textDecoration: 'none',
            fontSize: '14px', fontWeight: 600,
            color: isActive(to) ? 'var(--primary)' : 'var(--text-secondary)',
            background: isActive(to) ? 'var(--primary-glow)' : 'transparent',
            transition: 'all 0.15s',
          }}>
            <Icon size={15} />
            {label}
          </Link>
        ))}
      </div>

      {/* User + Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '13px', fontWeight: 700 }}>{user?.name}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{user?.role}</div>
        </div>
        <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '6px 12px' }}>
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </nav>
  );
}