import { useState } from 'react';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: 'easeOut' },
  }),
};

const serviceOptions = [
  'Facility Operations',
  'Energy Performance Advisory',
  'Both',
  'Not Sure Yet',
];

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

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);

    try {
      const { error } = await supabase.from('contact_submissions').insert([{
        name: form.name,
        company: form.company,
        email: form.email,
        phone: form.phone || null,
        service_interest: form.service_interest,
        message: form.message,
      }]);
      if (error) throw error;
      setStatus('success');
      setForm({ name: '', company: '', email: '', phone: '', service_interest: '', message: '' });
    } catch {
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = 'w-full bg-[#111111] border border-[#222222] px-4 py-3 text-sm text-[#F5F5F0] placeholder:text-[#888888]/50 focus:outline-none focus:border-[#C9A84C]/50 transition-colors';

  return (
    <>
      {/* Hero */}
      <section className="pt-36 pb-20 bg-[#0A0A0A]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp}
            className="text-4xl sm:text-6xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
            Let's Talk
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-lg text-[#888888] max-w-2xl mx-auto">
            Tell us about your facility or energy contract. We'll respond within one business day.
          </motion.p>
        </div>
      </section>

      {/* Form */}
      <section className="pb-24 bg-[#0A0A0A]">
        <div className="max-w-2xl mx-auto px-6">
          <motion.form onSubmit={handleSubmit} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <input name="name" value={form.name} onChange={handleChange} placeholder="Full Name" required className={inputClass} />
              <input name="company" value={form.company} onChange={handleChange} placeholder="Company Name" required className={inputClass} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email Address" required className={inputClass} />
              <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="Phone Number (optional)" className={inputClass} />
            </div>
            <select name="service_interest" value={form.service_interest} onChange={handleChange} required
              className={`${inputClass} ${!form.service_interest ? 'text-[#888888]/50' : ''}`}>
              <option value="" disabled>Service Interest</option>
              {serviceOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <textarea name="message" value={form.message} onChange={handleChange} placeholder="Message / Project Description" required rows={5}
              className={`${inputClass} resize-none`} />
            <button type="submit" disabled={submitting}
              className="w-full bg-[#C9A84C] text-[#0A0A0A] py-3.5 text-sm font-medium hover:bg-[#D4B85E] transition-colors disabled:opacity-50">
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
            {status === 'success' && (
              <p className="text-sm text-[#C9A84C] text-center">
                We've received your message. Expect to hear from us within one business day.
              </p>
            )}
            {status === 'error' && (
              <p className="text-sm text-red-400 text-center">
                Something went wrong. Please email us directly at{' '}
                <a href="mailto:hello@vantageinfrastructure.com" className="underline">hello@vantageinfrastructure.com</a>
              </p>
            )}
          </motion.form>

          {/* Contact Info */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="mt-16 pt-12 border-t border-[#222222]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center sm:text-left">
              <div>
                <h4 className="text-xs tracking-[0.2em] uppercase text-[#888888] mb-2">Email</h4>
                <a href="mailto:hello@vantageinfrastructure.com" className="text-sm text-[#F5F5F0] hover:text-[#C9A84C] transition-colors">
                  hello@vantageinfrastructure.com
                </a>
              </div>
              <div>
                <h4 className="text-xs tracking-[0.2em] uppercase text-[#888888] mb-2">Phone</h4>
                <p className="text-sm text-[#F5F5F0]">(404) 000-0000</p>
              </div>
              <div>
                <h4 className="text-xs tracking-[0.2em] uppercase text-[#888888] mb-2">Location</h4>
                <p className="text-sm text-[#F5F5F0]">Atlanta, GA</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
