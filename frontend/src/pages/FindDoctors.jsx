import Lottie from 'lottie-react';
import doctorsAnimation from '../assets/doctors.json';
import { useState } from 'react';
import { Search, Star, X, Calendar, Clock, Heart, Brain,
         Bone, Ear, Activity, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';

const doctors = [
  { id: 1, name: "Dr. Omar Karim", specialty: "Cardiologist", rating: 4.9,
    bio: "Experienced cardiologist dedicated to diagnosing and treating complex heart conditions with precision.",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=500&fit=crop&crop=top" },
  { id: 2, name: "Dr. Amira Siddiqua", specialty: "Urologist", rating: 4.9,
    bio: "Experienced urologist dedicated to diagnosing and treating complex urological conditions.",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=500&fit=crop&crop=top" },
  { id: 3, name: "Dr. Esther Howard", specialty: "Cardiologist", rating: 4.8,
    bio: "Dedicated cardiologist focused on delivering personalized advanced cardiac care.",
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=500&fit=crop&crop=top" },
  { id: 4, name: "Dr. Sara Noor", specialty: "ENT Specialist", rating: 4.9,
    bio: "Dedicated ENT specialist focused on delivering personalized advanced healthcare.",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=500&fit=crop&crop=top" },
  { id: 5, name: "Dr. Khalid Raza", specialty: "Orthopedic", rating: 4.9,
    bio: "Skilled orthopedic surgeon dedicated to restoring mobility and quality of life.",
    image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&h=500&fit=crop&crop=top" },
  { id: 6, name: "Dr. Sophia Malik", specialty: "Neurologist", rating: 4.9,
    bio: "Experienced neurologist dedicated to diagnosing complex neurological conditions.",
    image: "https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?w=400&h=500&fit=crop&crop=top" },
];

const CATEGORY_CARDS = [
  { label: 'All Doctors',  icon: Stethoscope, bg: '#1a1f3a', color: 'white',   accent: '#4A90D9', doodle: '🏥' },
  { label: 'Cardiologist', icon: Heart,       bg: '#FFF0F3', color: '#BE123C',  accent: '#FDA4AF', doodle: '❤️' },
  { label: 'Neurologist',  icon: Brain,       bg: '#F5F3FF', color: '#6D28D9',  accent: '#C4B5FD', doodle: '🧠' },
  { label: 'Orthopedic',   icon: Bone,        bg: '#FFFBEB', color: '#92400E',  accent: '#FDE68A', doodle: '🦴' },
  { label: 'ENT Specialist',icon: Ear,        bg: '#ECFDF5', color: '#065F46',  accent: '#6EE7B7', doodle: '👂' },
  { label: 'Urologist',    icon: Activity,    bg: '#EFF6FF', color: '#1D4ED8',  accent: '#BFDBFE', doodle: '🔬' },
];

const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'];

export default function FindDoctors() {
  const [activeCategory, setActiveCategory] = useState('All Doctors');
  const [search, setSearch]                 = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate]     = useState('');
  const [selectedTime, setSelectedTime]     = useState('');
  const [reason, setReason]                 = useState('');

  const filtered = doctors.filter(d => {
    const matchCat = activeCategory === 'All Doctors' || d.specialty === activeCategory;
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialty.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) { toast.error('Please select date and time'); return; }
    toast.success(`Appointment booked with ${selectedDoctor.name}!`);
    setSelectedDoctor(null); setSelectedDate(''); setSelectedTime(''); setReason('');
  };

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px 64px' }}>

      {/* ── Hero Banner ── */}
      <div style={{
        borderRadius: 24, overflow: 'hidden', position: 'relative',
        background: 'linear-gradient(135deg, #0f172a 0%, #1a1f3a 40%, #0f2027 100%)',
        minHeight: 380, marginBottom: 60,
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 60px',
      }}>

        {/* Left — text content */}
        <div style={{ zIndex: 3, maxWidth: 480 }}>

          {/* Feature pills */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(134,239,172,0.4)',
              borderRadius: 999, padding: '7px 14px',
              fontSize: 12, fontWeight: 600, color: '#86EFAC',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#86EFAC', display: 'inline-block' }} />
              Secure Encrypted Records
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(251,191,36,0.4)',
              borderRadius: 999, padding: '7px 14px',
              fontSize: 12, fontWeight: 600, color: '#FCD34D',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FCD34D', display: 'inline-block' }} />
              Trusted by 500+ Patients
            </div>
          </div>

          {/* Main heading */}
          <h1 style={{
            fontSize: 'clamp(36px, 4vw, 58px)',
            fontWeight: 900, lineHeight: 1.1,
            color: 'white', marginBottom: 16,
            letterSpacing: -1,
          }}>
            YOUR HEALTH,<br />
            <span style={{ color: '#86EFAC' }}>OUR PRIORITY</span>
          </h1>

          <p style={{
            fontSize: 15, color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.7, marginBottom: 32, maxWidth: 380,
          }}>
            Connect with certified specialists. Your records stay end-to-end encrypted — always private, always secure.
          </p>

          {/* Bottom actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => document.getElementById('doctors-grid').scrollIntoView({ behavior: 'smooth' })}
              style={{
                background: '#16A34A', color: 'white',
                border: 'none', borderRadius: 999,
                padding: '13px 30px', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                boxShadow: '0 4px 20px rgba(22,163,74,0.4)',
              }}>
              Schedule Meeting →
            </button>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              <span style={{ color: 'white', fontWeight: 700 }}>50+</span> Specialists Available
            </div>
          </div>

          {/* MediSafe network tag */}
          <div style={{ marginTop: 32 }}>
            <p style={{ fontSize: 12, color: 'rgba(147,197,253,0.7)', fontWeight: 500 }}>
              MediSafe Network — Trusted Medical Experts Team
            </p>
          </div>
        </div>

        {/* Right — Lottie animation */}
        <div style={{
          zIndex: 3, width: '45%', maxWidth: 480,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Lottie
            animationData={doctorsAnimation}
            loop={true}
            style={{ width: '100%', height: 'auto', maxHeight: 360 }}
          />
        </div>

        {/* Subtle background glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '30%',
          transform: 'translate(-50%, -50%)',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(22,163,74,0.08) 0%, transparent 70%)',
          zIndex: 1, pointerEvents: 'none',
        }} />
      </div>
      
        {/* ── Section title ── */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 34, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
            Your Trusted Medical Team
          </h2>
          <p style={{ fontSize: 15, color: '#6B7280' }}>
            Dedicated specialists delivering personalized, advanced healthcare for every patient.
          </p>
        </div>

        {/* ── Category Cards ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 12, marginBottom: 40,
        }}>
          {CATEGORY_CARDS.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.label;
            return (
              <div key={cat.label}
                onClick={() => setActiveCategory(cat.label)}
                style={{
                  background: isActive ? cat.bg : 'white',
                  border: `2px solid ${isActive ? cat.accent : '#F3F4F6'}`,
                  borderRadius: 16, padding: '18px 14px',
                  cursor: 'pointer', transition: 'all 0.2s',
                  textAlign: 'center', position: 'relative',
                  overflow: 'hidden',
                  boxShadow: isActive ? `0 4px 20px ${cat.accent}50` : '0 1px 4px rgba(0,0,0,0.05)',
                  transform: isActive ? 'translateY(-2px)' : 'none',
                }}>
                {/* Doodle bg */}
                <div style={{
                  position: 'absolute', bottom: -4, right: 4,
                  fontSize: 36, opacity: 0.15, userSelect: 'none',
                }}>
                  {cat.doodle}
                </div>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: isActive ? `${cat.accent}40` : '#F9FAFB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 10px',
                }}>
                  <Icon size={20} color={isActive ? cat.color : '#9CA3AF'} />
                </div>
                <div style={{
                  fontSize: 12, fontWeight: 700,
                  color: isActive ? cat.color : '#374151',
                  lineHeight: 1.3,
                }}>
                  {cat.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Search + count ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 28,
        }}>
          <p style={{ fontSize: 14, color: '#6B7280', fontWeight: 500 }}>
            Showing <strong style={{ color: '#111827' }}>{filtered.length}</strong> doctors
            {activeCategory !== 'All Doctors' && ` in ${activeCategory}`}
          </p>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'white', border: '1px solid #E5E7EB',
            borderRadius: 999, padding: '10px 18px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            <Search size={15} color="#9CA3AF" />
            <input style={{
              border: 'none', outline: 'none', fontSize: 14,
              color: '#374151', background: 'transparent',
              fontFamily: 'Inter, sans-serif', width: 200,
            }}
              placeholder="Search doctors..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* ── Doctor Grid ── */}
        <div id="doctors-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24,
        }}>
          {filtered.map(doctor => (
            <div key={doctor.id} style={{
              background: 'white', borderRadius: 20,
              boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
              overflow: 'hidden', transition: 'box-shadow 0.2s, transform 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.07)'; }}
            >
              {/* Photo area */}
              <div style={{
                background: 'linear-gradient(180deg, #EEF6FF 0%, white 100%)',
                padding: '20px 20px 0',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{doctor.name}</div>
                    <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{doctor.specialty}</div>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: 'white', borderRadius: 999,
                    padding: '4px 10px', boxShadow: '0 1px 6px rgba(0,0,0,0.1)',
                    border: '1px solid #FEF9C3',
                  }}>
                    <Star size={12} fill="#FBBF24" color="#FBBF24" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{doctor.rating}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <img src={doctor.image} alt={doctor.name} style={{
                    height: 200, width: 160,
                    objectFit: 'cover', objectPosition: 'top',
                    borderRadius: '12px 12px 0 0',
                  }} />
                </div>
              </div>

              <div style={{ height: 1, background: '#F3F4F6', margin: '0 20px' }} />

              <div style={{ padding: '16px 20px 20px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Bio:</div>
                <div style={{
                  fontSize: 13, color: '#6B7280', lineHeight: 1.6, marginBottom: 16,
                  display: '-webkit-box', WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {doctor.bio}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button style={{
                    flex: 1, padding: '10px 0', borderRadius: 999,
                    border: '1px solid #16A34A', background: 'white',
                    color: '#16A34A', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  }}>
                    View Details
                  </button>
                  <button
                    onClick={() => setSelectedDoctor(doctor)}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 999,
                      border: 'none', background: '#16A34A',
                      color: 'white', fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    }}>
                    Book Appointment
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
            <Search size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ fontFamily: 'Inter, sans-serif' }}>No doctors found</p>
          </div>
        )}
      </div>

      {/* ── Booking Modal ── */}
      {selectedDoctor && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 24,
        }} onClick={e => e.target === e.currentTarget && setSelectedDoctor(null)}>
          <div style={{
            background: 'white', borderRadius: 20, width: '100%', maxWidth: 460,
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '20px 24px', borderBottom: '1px solid #F3F4F6',
            }}>
              <img src={selectedDoctor.image} alt={selectedDoctor.name} style={{
                width: 52, height: 52, borderRadius: '50%',
                objectFit: 'cover', objectPosition: 'top',
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{selectedDoctor.name}</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{selectedDoctor.specialty}</div>
              </div>
              <button onClick={() => setSelectedDoctor(null)} style={{
                background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF',
              }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={14} color="#16A34A" /> Select Date
              </div>
              <input type="date" style={{
                width: '100%', padding: '10px 14px',
                border: '1px solid #E5E7EB', borderRadius: 10,
                fontSize: 14, fontFamily: 'Inter, sans-serif',
                outline: 'none', marginBottom: 20, boxSizing: 'border-box',
              }}
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />

              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} color="#16A34A" /> Select Time
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20 }}>
                {timeSlots.map(slot => (
                  <button key={slot}
                    onClick={() => setSelectedTime(slot)}
                    style={{
                      padding: '9px 0', borderRadius: 10, fontSize: 13, fontWeight: 600,
                      border: selectedTime === slot ? 'none' : '1px solid #E5E7EB',
                      background: selectedTime === slot ? '#16A34A' : 'white',
                      color: selectedTime === slot ? 'white' : '#374151',
                      cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    }}>
                    {slot}
                  </button>
                ))}
              </div>

              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                Reason for Visit
              </div>
              <textarea style={{
                width: '100%', padding: '10px 14px',
                border: '1px solid #E5E7EB', borderRadius: 10,
                fontSize: 14, fontFamily: 'Inter, sans-serif',
                outline: 'none', resize: 'none', minHeight: 80,
                marginBottom: 20, boxSizing: 'border-box',
              }}
                placeholder="Brief description..."
                value={reason} onChange={e => setReason(e.target.value)} />

              <button onClick={handleConfirm} style={{
                width: '100%', padding: '13px 0',
                background: '#16A34A', color: 'white',
                border: 'none', borderRadius: 12,
                fontSize: 15, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}>
                Confirm Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}