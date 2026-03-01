import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../utils/api';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      const { data } = await authAPI.register(form);
      toast.success(data.message);
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '24px',
      background: 'radial-gradient(ellipse at 50% 0%, #1e3a5f20 0%, var(--bg) 70%)',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px var(--primary-glow)',
          }}>
            <Shield size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>Create Account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            An RSA-2048 keypair will be generated for you
          </p>
        </div>

        <div className="card card-glow">
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Full Name</label>
              <input type="text" required value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Dr. Jane Smith" />
            </div>

            <div className="input-group">
              <label>Email</label>
              <input type="email" required value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com" />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input type="password" required value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Min. 8 characters" />
            </div>

            <div className="input-group">
              <label>Role</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>

            {/* Info box */}
            <div style={{
              display: 'flex', gap: '10px',
              background: 'var(--success)10', border: '1px solid var(--success)30',
              borderRadius: '8px', padding: '12px', marginBottom: '20px',
            }}>
              <Info size={14} style={{ color: 'var(--success)', marginTop: '2px', flexShrink: 0 }} />
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                <strong style={{ color: 'var(--success)' }}>What happens on register:</strong><br />
                An RSA-2048 keypair is generated server-side. Your private key is encrypted with a PBKDF2 key derived from your password and stored — the server never holds it in plaintext.
                {form.role === 'doctor' && <><br /><br /><strong style={{ color: 'var(--warning)' }}>Doctor accounts require admin approval before activation.</strong></>}
              </div>
            </div>

            <button type="submit" className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? <><div className="spinner" /> Generating keypair...</> : 'Create Account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}