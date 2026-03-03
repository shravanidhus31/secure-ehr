import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../utils/api';
import Prism from '../components/Prism';

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
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black">

      <div className="absolute inset-0 z-0">
        <Prism animationType="rotate" timeScale={0.4} height={3.5} baseWidth={5.5}
          scale={3.6} hueShift={0.8} colorFrequency={1} noise={0} glow={1} bloom={1.2} transparent={false} />
      </div>
      <div className="absolute inset-0 z-10 bg-black/45" />

      <div className="relative z-20 w-full max-w-md mx-6 animate-slide-in">

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{
              background: 'rgba(22,163,74,0.25)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(22,163,74,0.4)', boxShadow: '0 0 40px rgba(22,163,74,0.3)',
            }}>
            <ShieldCheck size={32} className="text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">MediSafe</h1>
          <p className="text-white/60 text-sm">Your Security, Our Policy!</p>
        </div>

        <div className="rounded-2xl p-9" style={{
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(255,255,255,0.18)',
          boxShadow: '0 8px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)',
        }}>
          <h2 className="text-xl font-bold text-white mb-1">Create Account</h2>
          <p className="text-white/50 text-sm mb-7">
            An RSA-2048 keypair will be generated for you on registration.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Dr. Jane Smith' },
              { label: 'Email', key: 'email', type: 'email', placeholder: 'you@example.com' },
              { label: 'Password', key: 'password', type: 'password', placeholder: 'Min. 8 characters' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-widest mb-2">
                  {label}
                </label>
                <input type={type} required className="glass-input" placeholder={placeholder}
                  value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })} />
              </div>
            ))}

            <div>
              <label className="block text-xs font-semibold text-white/60 uppercase tracking-widest mb-2">
                Role
              </label>
              <select className="glass-input" value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="patient" style={{ background: '#1a1a2e' }}>Patient</option>
                <option value="doctor" style={{ background: '#1a1a2e' }}>Doctor</option>
              </select>
            </div>

            <div className="flex items-start gap-3 rounded-xl p-3"
              style={{ background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.3)' }}>
              <Info size={14} className="text-green-400 mt-0.5 shrink-0" />
              <p className="text-xs text-white/55 leading-relaxed">
                {form.role === 'doctor'
                  ? <><span className="text-yellow-400 font-semibold">Doctor accounts require admin approval.</span> You'll be notified once activated.</>
                  : <>Your private key is encrypted with <span className="text-green-400 font-semibold">PBKDF2 + AES-GCM</span> before storage. The server never holds it in plaintext.</>
                }
              </p>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all flex items-center justify-center gap-2"
              style={{
                background: loading ? 'rgba(22,163,74,0.3)' : 'rgba(22,163,74,0.5)',
                border: '1px solid rgba(22,163,74,0.5)',
                backdropFilter: 'blur(10px)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}>
              {loading ? <><div className="spinner" /> Generating keypair...</> : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center mt-5 text-white/50 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-white font-bold hover:text-green-400 transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}