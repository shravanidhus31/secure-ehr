import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{
      background: 'white',
      boxShadow: '0 1px 8px rgba(0,0,0,0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      width: '100%',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 32px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>

        {/* Logo */}
        <Link to={user ? '/dashboard' : '/find-doctors'}
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <ShieldCheck size={28} color="#16A34A" />
          <span style={{ fontSize: 20, fontWeight: 800, color: '#111827', fontFamily: 'Inter, sans-serif' }}>
            MediSafe
          </span>
        </Link>

        {/* Center Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          {[
            { to: '/find-doctors', label: 'Home' },
            { to: '/find-doctors', label: 'Find Doctors' },
            ...(user ? [
              { to: '/dashboard', label: 'Dashboard' },
              { to: '/audit', label: 'Activity' },
            ] : []),
          ].map(({ to, label }) => (
            <Link key={label} to={to} style={{
              fontSize: 15,
              fontWeight: isActive(to) ? 700 : 500,
              color: isActive(to) ? '#111827' : '#6B7280',
              textDecoration: isActive(to) ? 'underline' : 'none',
              textUnderlineOffset: 4,
              fontFamily: 'Inter, sans-serif',
              transition: 'color 0.15s',
            }}>
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#F0FDF4', border: '1px solid #BBF7D0',
                borderRadius: 999, padding: '6px 14px',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: '#16A34A', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, fontFamily: 'Inter, sans-serif',
                }}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#374151', fontFamily: 'Inter, sans-serif' }}>
                  {user.name}
                </span>
                <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, fontFamily: 'Inter, sans-serif', textTransform: 'capitalize' }}>
                  ({user.role})
                </span>
              </div>
              <button onClick={() => { logout(); navigate('/login'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 14, fontWeight: 600, color: '#EF4444',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}>
                <LogOut size={15} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{
                fontSize: 14, fontWeight: 600, color: '#374151',
                textDecoration: 'none', fontFamily: 'Inter, sans-serif',
              }}>
                Sign In
              </Link>
              <Link to="/find-doctors" style={{
                background: '#16A34A', color: 'white',
                borderRadius: 999, padding: '10px 22px',
                fontSize: 14, fontWeight: 700,
                textDecoration: 'none', fontFamily: 'Inter, sans-serif',
                boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
              }}>
                Book Appointment
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}