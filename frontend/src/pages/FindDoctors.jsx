import { useState } from 'react';
import { Search, Star, X, Calendar, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const doctors = [
  { id: 1, name: "Dr. Omar Karim", specialty: "Cardiologist", rating: 4.9,
    bio: "Dr. Omar Karim is an experienced cardiologist dedicated to diagnosing and treating complex heart conditions with precision.",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=500&fit=crop&crop=top" },
  { id: 2, name: "Dr. Amira Siddiqua", specialty: "Urologist", rating: 4.9,
    bio: "Dr. Amira Siddiqua is an experienced urologist dedicated to diagnosing and treating complex conditions with precision.",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=500&fit=crop&crop=top" },
  { id: 3, name: "Dr. Esther Howard", specialty: "Cardiologist", rating: 4.8,
    bio: "Dr. Esther Howard is an experienced cardiologist dedicated to diagnosing and treating complex heart conditions.",
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=500&fit=crop&crop=top" },
  { id: 4, name: "Dr. Sara Noor", specialty: "ENT Specialist", rating: 4.9,
    bio: "Dr. Sara Noor is a dedicated ENT specialist focused on delivering personalized advanced healthcare for every patient.",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=500&fit=crop&crop=top" },
  { id: 5, name: "Dr. Khalid Raza", specialty: "Orthopedic", rating: 4.9,
    bio: "Dr. Khalid Raza is a skilled orthopedic surgeon dedicated to restoring mobility and improving quality of life.",
    image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&h=500&fit=crop&crop=top" },
  { id: 6, name: "Dr. Sophia Malik", specialty: "Neurologist", rating: 4.9,
    bio: "Dr. Sophia Malik is an experienced neurologist dedicated to diagnosing and treating complex neurological conditions.",
    image: "https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?w=400&h=500&fit=crop&crop=top" },
];

const categories = ['All Doctors', 'Orthopedic', 'Cardiologist', 'Neurologist', 'Urologist', 'ENT Specialist'];
const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'];

const S = {
  page: { minHeight: '100vh', background: '#EEF6FF', fontFamily: 'Inter, sans-serif' },
  inner: { maxWidth: 1200, margin: '0 auto', padding: '32px 32px 64px' },

  // Hero
  hero: {
    borderRadius: 20, overflow: 'hidden', position: 'relative',
    background: 'linear-gradient(135deg, #87CEEB 0%, #4A90D9 100%)',
    height: 420, marginBottom: 64,
  },
  heroBigText: {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: 96, fontWeight: 900, color: 'rgba(255,255,255,0.18)',
    whiteSpace: 'nowrap', letterSpacing: -3, userSelect: 'none',
    width: '100%', textAlign: 'center', lineHeight: 1,
  },
  heroImgs: {
    position: 'absolute', bottom: 0,
    left: '50%', transform: 'translateX(-50%)',
    display: 'flex', alignItems: 'flex-end', gap: 8,
  },
  heroBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: '20px 36px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
    background: 'linear-gradient(to top, rgba(0,0,0,0.22) 0%, transparent 100%)',
  },
  scheduleBtn: {
    background: 'white', color: '#16A34A',
    border: 'none', borderRadius: 999,
    padding: '12px 28px', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
    boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
  },

  // Section title
  sectionWrap: { textAlign: 'center', marginBottom: 40 },
  sectionTitle: { fontSize: 36, fontWeight: 800, color: '#111827', marginBottom: 8, fontFamily: 'Inter, sans-serif' },
  sectionSub: { fontSize: 15, color: '#6B7280', fontFamily: 'Inter, sans-serif' },

  // Filter bar
  filterBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 },
  filterLeft: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  filterLabel: { fontSize: 15, fontWeight: 700, color: '#111827', fontFamily: 'Inter, sans-serif', marginRight: 4 },
  pill: (active) => ({
    padding: '8px 20px', borderRadius: 999, fontSize: 14, fontWeight: 600,
    cursor: 'pointer', border: active ? 'none' : '1px solid #D1D5DB',
    background: active ? '#16A34A' : 'white',
    color: active ? 'white' : '#374151',
    fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
  }),
  searchWrap: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'white', border: '1px solid #E5E7EB',
    borderRadius: 999, padding: '10px 18px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  searchInput: {
    border: 'none', outline: 'none', fontSize: 14,
    color: '#374151', background: 'transparent',
    fontFamily: 'Inter, sans-serif', width: 180,
  },

  // Grid
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 },

  // Card
  card: {
    background: 'white', borderRadius: 16,
    boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
    overflow: 'hidden', fontFamily: 'Inter, sans-serif',
    transition: 'box-shadow 0.2s',
  },
  cardTop: {
    background: 'linear-gradient(180deg, #EEF6FF 0%, white 100%)',
    padding: '20px 20px 0',
  },
  cardNameRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardName: { fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 2 },
  cardSpec: { fontSize: 13, color: '#6B7280' },
  ratingBadge: {
    display: 'flex', alignItems: 'center', gap: 4,
    background: 'white', borderRadius: 999,
    padding: '4px 10px', boxShadow: '0 1px 6px rgba(0,0,0,0.1)',
    border: '1px solid #FEF9C3',
  },
  ratingText: { fontSize: 13, fontWeight: 700, color: '#374151' },
  cardImg: { width: '100%', height: 220, objectFit: 'cover', objectPosition: 'top', display: 'block' },
  divider: { height: 1, background: '#F3F4F6', margin: '0 20px' },
  cardBody: { padding: '16px 20px 20px' },
  bioLabel: { fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 4 },
  bioText: {
    fontSize: 13, color: '#6B7280', lineHeight: 1.6,
    marginBottom: 16,
    display: '-webkit-box', WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical', overflow: 'hidden',
  },
  btnRow: { display: 'flex', gap: 10 },
  viewBtn: {
    flex: 1, padding: '10px 0', borderRadius: 999,
    border: '1px solid #16A34A', background: 'white',
    color: '#16A34A', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'background 0.15s',
  },
  bookBtn: {
    flex: 1, padding: '10px 0', borderRadius: 999,
    border: 'none', background: '#16A34A',
    color: 'white', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'background 0.15s',
  },

  // Modal
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 24,
  },
  modal: {
    background: 'white', borderRadius: 20,
    width: '100%', maxWidth: 460,
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    overflow: 'hidden', fontFamily: 'Inter, sans-serif',
  },
  modalHead: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '20px 24px', borderBottom: '1px solid #F3F4F6',
  },
  modalImg: { width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top' },
  modalBody: { padding: 24 },
  label: { fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 },
  dateInput: {
    width: '100%', padding: '10px 14px',
    border: '1px solid #E5E7EB', borderRadius: 10,
    fontSize: 14, fontFamily: 'Inter, sans-serif',
    outline: 'none', color: '#374151', marginBottom: 20,
  },
  slotsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 },
  slot: (active) => ({
    padding: '9px 0', borderRadius: 10,
    border: active ? 'none' : '1px solid #E5E7EB',
    background: active ? '#16A34A' : 'white',
    color: active ? 'white' : '#374151',
    fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
    transition: 'all 0.15s',
  }),
  textarea: {
    width: '100%', padding: '10px 14px',
    border: '1px solid #E5E7EB', borderRadius: 10,
    fontSize: 14, fontFamily: 'Inter, sans-serif',
    outline: 'none', color: '#374151', resize: 'none',
    marginBottom: 20, minHeight: 80,
  },
  confirmBtn: {
    width: '100%', padding: '13px 0',
    background: '#16A34A', color: 'white',
    border: 'none', borderRadius: 12,
    fontSize: 15, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
    transition: 'background 0.15s',
  },
};

export default function FindDoctors() {
  const [activeCategory, setActiveCategory] = useState('All Doctors');
  const [search, setSearch] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');

  const filtered = doctors.filter(d => {
    const matchCat = activeCategory === 'All Doctors' || d.specialty === activeCategory;
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialty.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) { toast.error('Please select date and time'); return; }
    toast.success(`Appointment booked with ${selectedDoctor.name} on ${selectedDate} at ${selectedTime}!`);
    setSelectedDoctor(null); setSelectedDate(''); setSelectedTime(''); setReason('');
  };

  return (
    <div style={S.page}>
      <div style={S.inner}>

        {/* ── Hero Banner ── */}
        <div style={S.hero}>
          {/* Big background text */}
          <div style={S.heroBigText}>HEALTH &amp; TRUST</div>

          {/* Doctor images */}
          <div style={S.heroImgs}>
            {[
              { url: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=280&h=340&fit=crop&crop=top", h: 300, zIndex: 10 },
              { url: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&h=370&fit=crop&crop=top", h: 360, zIndex: 20 },
              { url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=280&h=340&fit=crop&crop=top", h: 300, zIndex: 10 },
            ].map((img, i) => (
              <img key={i} src={img.url} alt="doctor" style={{
                height: img.h, width: 'auto', objectFit: 'cover', objectPosition: 'top',
                zIndex: img.zIndex, borderRadius: '12px 12px 0 0',
                filter: 'drop-shadow(0 -8px 24px rgba(0,0,0,0.15))',
              }} />
            ))}
          </div>

          {/* Bottom bar */}
          <div style={S.heroBottom}>
            <div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>
                MediSafe Network
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'white', fontFamily: 'Inter, sans-serif', lineHeight: 1.2 }}>
                Trusted Medical<br />Experts Team
              </div>
            </div>
            <button style={S.scheduleBtn}
              onClick={() => document.getElementById('doctors-grid').scrollIntoView({ behavior: 'smooth' })}>
              Schedule Meeting
            </button>
          </div>
        </div>

        {/* ── Section title ── */}
        <div style={S.sectionWrap}>
          <h2 style={S.sectionTitle}>Your Trusted Medical Team</h2>
          <p style={S.sectionSub}>Dedicated specialists delivering personalized, advanced healthcare for every patient.</p>
        </div>

        {/* ── Filter + Search ── */}
        <div style={S.filterBar}>
          <div style={S.filterLeft}>
            <span style={S.filterLabel}>Doctors Category:</span>
            {categories.map(cat => (
              <button key={cat} style={S.pill(activeCategory === cat)}
                onClick={() => setActiveCategory(cat)}>
                {cat}
              </button>
            ))}
          </div>
          <div style={S.searchWrap}>
            <Search size={16} color="#9CA3AF" />
            <input style={S.searchInput} placeholder="Search Doctors..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* ── Doctor Grid ── */}
        <div id="doctors-grid" style={S.grid}>
          {filtered.map(doctor => (
            <div key={doctor.id} style={S.card}>
              <div style={S.cardTop}>
                <div style={S.cardNameRow}>
                  <div>
                    <div style={S.cardName}>{doctor.name}</div>
                    <div style={S.cardSpec}>{doctor.specialty}</div>
                  </div>
                  <div style={S.ratingBadge}>
                    <Star size={13} fill="#FBBF24" color="#FBBF24" />
                    <span style={S.ratingText}>{doctor.rating}</span>
                  </div>
                </div>
                <img src={doctor.image} alt={doctor.name} style={S.cardImg} />
              </div>

              <div style={S.divider} />

              <div style={S.cardBody}>
                <div style={S.bioLabel}>Bio:</div>
                <div style={S.bioText}>{doctor.bio}</div>
                <div style={S.btnRow}>
                  <button style={S.viewBtn}>View Details</button>
                  <button style={S.bookBtn} onClick={() => setSelectedDoctor(doctor)}>
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
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && setSelectedDoctor(null)}>
          <div style={S.modal}>
            <div style={S.modalHead}>
              <img src={selectedDoctor.image} alt={selectedDoctor.name} style={S.modalImg} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{selectedDoctor.name}</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{selectedDoctor.specialty}</div>
              </div>
              <button onClick={() => setSelectedDoctor(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                <X size={20} />
              </button>
            </div>

            <div style={S.modalBody}>
              <div style={S.label}><Calendar size={14} color="#16A34A" /> Select Date</div>
              <input type="date" style={S.dateInput}
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />

              <div style={S.label}><Clock size={14} color="#16A34A" /> Select Time</div>
              <div style={S.slotsGrid}>
                {timeSlots.map(slot => (
                  <button key={slot} style={S.slot(selectedTime === slot)}
                    onClick={() => setSelectedTime(slot)}>{slot}</button>
                ))}
              </div>

              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Reason for Visit</div>
              <textarea style={S.textarea} placeholder="Brief description of your concern..."
                value={reason} onChange={e => setReason(e.target.value)} rows={3} />

              <button style={S.confirmBtn} onClick={handleConfirm}>Confirm Appointment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}