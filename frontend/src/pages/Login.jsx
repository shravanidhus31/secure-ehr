import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../utils/api';
import { decryptPrivateKey } from '../utils/crypto';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.login(form);

      // Decrypt private key in the browser using entered password
      // Server never sees the decrypted private key
      const privateKey = await decryptPrivateKey(
        data.encrypted_private_key,
        data.salt,
        data.private_key_iv,
        form.password
      );

      login(data, privateKey);
      toast.success(`Welcome back, ${data.name}`);
      navigate('/dashboard');
    } catch (err) {
      if (err.message?.includes('decrypt')) {
        toast.error('Decryption failed — wrong password?');
      } else {
        toast.error(err.response?.data?.detail || 'Login failed');
      }
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
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px var(--primary-glow)',
          }}>
            <Shield size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>SecureEHR</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Hybrid encrypted health records
          </p>
        </div>

        {/* Form Card */}
        <div className="card card-glow">
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>Sign in</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
            Your private key is decrypted locally — never sent to the server.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Email</label>
              <input
                type="email" required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'} required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  style={{ paddingRight: '44px' }}
                />
                <button type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', color: 'var(--text-secondary)'
                  }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Crypto note */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              background: 'var(--primary-glow)', border: '1px solid var(--border-bright)',
              borderRadius: '8px', padding: '12px', marginBottom: '20px',
            }}>
              <Lock size={14} style={{ color: 'var(--primary)', marginTop: '2px', flexShrink: 0 }} />
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Your password derives the key that decrypts your RSA private key locally using PBKDF2 + AES-GCM.
              </p>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? <><div className="spinner" /> Decrypting key...</> : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          No account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}