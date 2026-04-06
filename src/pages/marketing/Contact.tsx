import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const GREEN = '#00ff88';
const DARK = '#020c06';

const serviceOptions = [
  'ESPC Lifecycle Management',
  'Measurement & Verification',
  'Financial Modeling & Analysis',
  'AI-Powered Project Intelligence',
  'Not Sure Yet',
];

const RESPONSIVE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Syne:wght@400;600;700;800&display=swap');

:root {
  --green: #00ff88;
  --green-dim: #00ff8844;
  --dark: #020c06;
  --dark-2: #050f08;
  --text: #c8f0d8;
  --text-dim: #4a7a5a;
}

.vantage-contact * { box-sizing: border-box; }

.vantage-input {
  width: 100%;
  background: #050f08;
  border: 1px solid rgba(0,255,136,0.12);
  padding: 14px 16px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 13px;
  color: #c8f0d8;
  outline: none;
  transition: border-color 0.3s;
}
.vantage-input::placeholder {
  color: #4a7a5a;
  opacity: 0.6;
}
.vantage-input:focus {
  border-color: rgba(0,255,136,0.4);
}

@media (max-width: 600px) {
  .vantage-contact-grid { grid-template-columns: 1fr !important; }
  .vantage-contact-info-grid { grid-template-columns: 1fr !important; }
  .vantage-contact-nav-links { display: none !important; }
}
`;

const S: Record<string, React.CSSProperties> = {
  page: {
    background: 'var(--dark)',
    color: 'var(--text)',
    fontFamily: "'Syne', sans-serif",
    minHeight: '100vh',
  },
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 40px',
    background: 'rgba(2,12,6,0.95)',
    borderBottom: '1px solid rgba(0,255,136,0.08)',
  },
  logo: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '14px',
    letterSpacing: '2px',
    color: GREEN,
    textDecoration: 'none',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
  },
  navLink: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '12px',
    letterSpacing: '1px',
    color: '#4a7a5a',
    textDecoration: 'none',
  },
  hero: {
    paddingTop: '140px',
    paddingBottom: '60px',
    textAlign: 'center' as const,
    position: 'relative' as const,
  },
  scanLine: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,136,0.02) 2px, rgba(0,255,136,0.02) 4px)',
    pointerEvents: 'none' as const,
  },
  tag: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '10px',
    letterSpacing: '4px',
    color: GREEN,
    textTransform: 'uppercase' as const,
    marginBottom: '16px',
    opacity: 0.6,
  },
  h1: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 'clamp(32px, 4vw, 56px)',
    fontWeight: 800,
    color: '#ffffff',
    marginBottom: '16px',
  },
  subtitle: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '14px',
    color: '#4a7a5a',
    maxWidth: '500px',
    margin: '0 auto',
    lineHeight: 1.7,
  },
  formSection: {
    padding: '0 40px 80px',
    maxWidth: '640px',
    margin: '0 auto',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  submitBtn: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '12px',
    letterSpacing: '1px',
    padding: '14px 32px',
    background: GREEN,
    color: DARK,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 700,
    width: '100%',
    transition: 'opacity 0.3s',
  },
  successMsg: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '12px',
    color: GREEN,
    textAlign: 'center' as const,
    marginTop: '12px',
  },
  errorMsg: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '12px',
    color: '#ff4444',
    textAlign: 'center' as const,
    marginTop: '12px',
  },
  divider: {
    borderTop: '1px solid rgba(0,255,136,0.08)',
    marginTop: '48px',
    paddingTop: '40px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '32px',
    textAlign: 'center' as const,
  },
  infoLabel: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '9px',
    letterSpacing: '2px',
    color: '#4a7a5a',
    textTransform: 'uppercase' as const,
    marginBottom: '6px',
  },
  infoValue: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '13px',
    color: '#c8f0d8',
  },
  infoLink: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '13px',
    color: GREEN,
    textDecoration: 'none',
  },
  footerBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 40px',
    borderTop: '1px solid rgba(0,255,136,0.08)',
    background: 'var(--dark)',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '10px',
    letterSpacing: '1px',
    color: '#4a7a5a',
  },
  statusDot: {
    display: 'inline-block',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: GREEN,
    marginRight: '8px',
    boxShadow: `0 0 8px ${GREEN}`,
  },
};

export function Contact() {
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    service_interest: '',
    message: '',
  });
  const [status, setStatus] = useState<'success' | 'error' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = RESPONSIVE_CSS;
    document.head.appendChild(style);
    styleRef.current = style;
    return () => {
      style.remove();
    };
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);

    try {
      const { error } = await supabase.from('contact_submissions').insert([
        {
          name: form.name,
          company: form.company,
          email: form.email,
          phone: form.phone || null,
          service_interest: form.service_interest,
          message: form.message,
        },
      ]);
      if (error) throw error;
      setStatus('success');
      setForm({ name: '', company: '', email: '', phone: '', service_interest: '', message: '' });
    } catch {
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="vantage-contact" style={S.page}>
      {/* NAV */}
      <nav style={S.nav}>
        <Link to="/" style={S.logo}>
          VANTAGE // INFRASTRUCTURE
        </Link>
        <div style={S.navLinks} className="vantage-contact-nav-links">
          <Link to="/" style={S.navLink}>
            Home
          </Link>
          <Link to="/portal" style={S.navLink}>
            Platform
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={S.hero}>
        <div style={S.scanLine} />
        <div style={{ position: 'relative' as const, zIndex: 1, padding: '0 40px' }}>
          <div style={S.tag}>Get In Touch</div>
          <h1 style={S.h1}>Let&apos;s Talk</h1>
          <p style={S.subtitle}>
            Tell us about your facility or energy contract. We&apos;ll respond within one business day.
          </p>
        </div>
      </section>

      {/* FORM */}
      <section style={S.formSection}>
        <form onSubmit={handleSubmit} style={S.form}>
          <div style={S.grid2} className="vantage-contact-grid">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Full Name"
              required
              className="vantage-input"
            />
            <input
              name="company"
              value={form.company}
              onChange={handleChange}
              placeholder="Company Name"
              required
              className="vantage-input"
            />
          </div>
          <div style={S.grid2} className="vantage-contact-grid">
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email Address"
              required
              className="vantage-input"
            />
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="Phone (optional)"
              className="vantage-input"
            />
          </div>
          <select
            name="service_interest"
            value={form.service_interest}
            onChange={handleChange}
            required
            className="vantage-input"
            style={!form.service_interest ? { color: '#4a7a5a', opacity: 0.6 } : undefined}
          >
            <option value="" disabled>
              Service Interest
            </option>
            {serviceOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Message / Project Description"
            required
            rows={5}
            className="vantage-input"
            style={{ resize: 'none' }}
          />
          <button type="submit" disabled={submitting} style={{ ...S.submitBtn, opacity: submitting ? 0.5 : 1 }}>
            {submitting ? 'Sending...' : 'Send Message'}
          </button>
          {status === 'success' && (
            <p style={S.successMsg}>
              We&apos;ve received your message. Expect to hear from us within one business day.
            </p>
          )}
          {status === 'error' && (
            <p style={S.errorMsg}>
              Something went wrong. Please email us directly at{' '}
              <a href="mailto:hello@vantageinfrastructure.com" style={{ color: GREEN, textDecoration: 'underline' }}>
                hello@vantageinfrastructure.com
              </a>
            </p>
          )}
        </form>

        {/* Contact Info */}
        <div style={S.divider}>
          <div style={S.infoGrid} className="vantage-contact-info-grid">
            <div>
              <div style={S.infoLabel}>Email</div>
              <a href="mailto:hello@vantageinfrastructure.com" style={S.infoLink}>
                hello@vantageinfrastructure.com
              </a>
            </div>
            <div>
              <div style={S.infoLabel}>Phone</div>
              <div style={S.infoValue}>(404) 000-0000</div>
            </div>
            <div>
              <div style={S.infoLabel}>Location</div>
              <div style={S.infoValue}>Atlanta, GA</div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER BAR */}
      <footer style={S.footerBar}>
        <span>&copy; 2026 VANTAGE INFRASTRUCTURE GROUP // ATLANTA, GA</span>
        <span>
          <span style={S.statusDot} />
          PLATFORM ONLINE
        </span>
      </footer>
    </div>
  );
}
