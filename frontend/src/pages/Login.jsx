import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../utils/api';
import { decryptPrivateKey } from '../utils/crypto';
import { useAuth } from '../context/AuthContext';
import Prism from '../components/Prism';

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
      const privateKey = await decryptPrivateKey(
        data.encrypted_private_key,
        data.salt,
        data.private_key_iv,
        form.password
      );
      login(data, privateKey);
      toast.success(`Welcome back, ${data.name}!`);
      navigate('/dashboard');
    } catch (err) {
      if (err.message?.includes('decrypt')) {
        toast.error('Decryption failed — check your password');
      } else {
        toast.error(err.response?.data?.detail || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#000',
    }}>

      {/* ── Prism fills entire screen ── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Prism
          animationType="rotate"
          timeScale={0.3}
          height={3.5}
          baseWidth={5.5}
          scale={3.6}
          hueShift={0}
          colorFrequency={1}
          noise={0}
          glow={0.8}
          bloom={0.9}
          transparent={false}
        />
      </div>

      {/* ── Dark overlay ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'rgba(0,0,0,0.45)',
      }} />

      {/* ── Centered card ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              margin: '0 auto 16px',
              background: 'rgba(22,163,74,0.25)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(22,163,74,0.4)',
              boxShadow: '0 0 40px rgba(22,163,74,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShieldCheck size={32} color="#4ade80" />
            </div>
            <h1 style={{
              fontSize: 32, fontWeight: 800, color: 'white',
              fontFamily: 'Inter, sans-serif', marginBottom: 6,
              textShadow: '0 2px 20px rgba(0,0,0,0.5)',
            }}>
              MediSafe
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: 14, fontFamily: 'Inter, sans-serif',
            }}>
              Your Security, Our Policy!
            </p>
          </div>

          {/* Glass card */}
          <div style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 20,
            padding: 36,
            boxShadow: '0 8px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)',
          }}>
            <h2 style={{
              fontSize: 20, fontWeight: 700, color: 'white',
              fontFamily: 'Inter, sans-serif', marginBottom: 6,
            }}>
              Sign In
            </h2>
            <p style={{
              color: 'rgba(255,255,255,0.5)', fontSize: 13,
              fontFamily: 'Inter, sans-serif', marginBottom: 28,
            }}>
              Private key decrypted locally — never sent to server.
            </p>

            <form onSubmit={handleSubmit}>

              {/* Email */}
              <div style={{ marginBottom: 18 }}>
                <label style={{
                  display: 'block', fontSize: 11, fontWeight: 700,
                  color: 'rgba(255,255,255,0.55)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  marginBottom: 8, fontFamily: 'Inter, sans-serif',
                }}>
                  Email
                </label>
                <input
                  type="email" required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  style={{
                    width: '100%', padding: '12px 16px',
                    background: 'rgba(255,255,255,0.10)',
                    border: '1px solid rgba(255,255,255,0.20)',
                    borderRadius: 10, color: 'white',
                    fontFamily: 'Inter, sans-serif', fontSize: 14,
                    outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.20)'}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: 'block', fontSize: 11, fontWeight: 700,
                  color: 'rgba(255,255,255,0.55)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  marginBottom: 8, fontFamily: 'Inter, sans-serif',
                }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'} required
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    style={{
                      width: '100%', padding: '12px 44px 12px 16px',
                      background: 'rgba(255,255,255,0.10)',
                      border: '1px solid rgba(255,255,255,0.20)',
                      borderRadius: 10, color: 'white',
                      fontFamily: 'Inter, sans-serif', fontSize: 14,
                      outline: 'none', boxSizing: 'border-box',
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.20)'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: 12,
                      top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none',
                      cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
                      display: 'flex', alignItems: 'center', padding: 0,
                    }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Crypto note */}
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                background: 'rgba(22,163,74,0.15)',
                border: '1px solid rgba(22,163,74,0.35)',
                borderRadius: 10, padding: '12px 14px',
                marginBottom: 24,
              }}>
                <Lock size={14} color="#4ade80" style={{ marginTop: 2, flexShrink: 0 }} />
                <p style={{
                  fontSize: 12, color: 'rgba(255,255,255,0.55)',
                  lineHeight: 1.6, margin: 0, fontFamily: 'Inter, sans-serif',
                }}>
                  Password derives the key that decrypts your RSA private key locally via{' '}
                  <strong style={{ color: '#4ade80' }}>PBKDF2 + AES-256-GCM</strong>.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '13px 0',
                  background: loading ? 'rgba(22,163,74,0.3)' : 'rgba(22,163,74,0.55)',
                  border: '1px solid rgba(22,163,74,0.5)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 12, color: 'white',
                  fontFamily: 'Inter, sans-serif', fontWeight: 700,
                  fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 8,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(22,163,74,0.75)'; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'rgba(22,163,74,0.55)'; }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: 16, height: 16,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white', borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite',
                    }} />
                    Decrypting key...
                  </>
                ) : 'Sign In'}
              </button>
            </form>
          </div>

          {/* Register link */}
          <p style={{
            textAlign: 'center', marginTop: 20,
            color: 'rgba(255,255,255,0.5)',
            fontSize: 14, fontFamily: 'Inter, sans-serif',
          }}>
            No account?{' '}
            <Link to="/register" style={{
              color: 'white', fontWeight: 700,
              textDecoration: 'none',
            }}
              onMouseEnter={e => e.target.style.color = '#4ade80'}
              onMouseLeave={e => e.target.style.color = 'white'}
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}