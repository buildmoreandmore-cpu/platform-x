import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const stats = [
  { value: '$50M+', label: 'Assets Under Management' },
  { value: '24/7', label: 'Response Availability' },
  { value: '100%', label: 'Regulatory Compliance Focus' },
];

const services = [
  {
    title: 'Facility Operations',
    desc: 'Full-spectrum facility management through a vetted network of licensed subcontractors — coordinated, accountable, and responsive.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
  {
    title: 'Energy Performance Advisory',
    desc: "Independent Owner's Representative services for ESPC engagements — protecting your interests from audit through M&V, powered by our AI platform.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
];

const steps = [
  { num: '01', title: 'Assess', desc: 'We evaluate your facility and energy contract landscape.' },
  { num: '02', title: 'Deploy', desc: 'We activate our AI platform and field your subcontractor network.' },
  { num: '03', title: 'Perform', desc: 'We manage, report, and optimize continuously.' },
];

export function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Noise overlay */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />
        {/* Grid pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="text-5xl sm:text-7xl lg:text-[88px] font-bold leading-[1.05] tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Infrastructure Managed.<br />Performance Guaranteed.
          </motion.h1>

          {/* Gold line divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
            className="h-px w-32 bg-[#C9A84C] mx-auto my-8 origin-center"
          />

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="text-lg sm:text-xl text-[#888888] max-w-2xl mx-auto leading-relaxed"
          >
            Vantage delivers integrated facility operations and energy performance advisory for commercial and civic environments — powered by AI.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/services" className="bg-[#C9A84C] text-[#0A0A0A] px-8 py-3.5 text-sm font-medium hover:bg-[#D4B85E] transition-colors">
              Explore Services
            </Link>
            <Link to="/portal" className="border border-[#F5F5F0]/20 text-[#F5F5F0] px-8 py-3.5 text-sm font-medium hover:border-[#F5F5F0]/50 transition-colors">
              Client Portal
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-[#222222] bg-[#111111]">
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
            >
              <div className="text-4xl font-bold text-[#C9A84C]" style={{ fontFamily: "'Playfair Display', serif" }}>
                {stat.value}
              </div>
              <div className="mt-2 text-sm text-[#888888]">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-24 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
              Two Disciplines. One Partner.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((svc, i) => (
              <motion.div key={svc.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <Link to="/services" className="block group">
                  <div className="bg-[#111111] border border-[#222222] p-10 h-full transition-colors duration-300 group-hover:border-[#C9A84C]/40">
                    <div className="text-[#C9A84C] mb-6">{svc.icon}</div>
                    <h3 className="text-2xl font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {svc.title}
                    </h3>
                    <p className="text-[#888888] leading-relaxed mb-6">{svc.desc}</p>
                    <span className="text-sm text-[#C9A84C] group-hover:underline">Learn More →</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Preview */}
      <section className="py-24 bg-[#111111] border-y border-[#222222]">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
              Built Different.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div key={step.num} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="text-center md:text-left">
                <div className="text-5xl font-bold text-[#C9A84C]/30 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {step.num}
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {step.title}
                </h3>
                <p className="text-[#888888] text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Client Portal CTA */}
      <section className="py-24 bg-[#0A0A0A]">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="border border-[#C9A84C]/20 bg-[#111111] p-12 sm:p-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Your Project Dashboard. Always On.
            </h2>
            <p className="text-[#888888] max-w-xl mx-auto mb-8 leading-relaxed">
              Clients get real-time access to project status, energy performance data, and reporting through our secure portal.
            </p>
            <Link to="/portal" className="inline-block bg-[#C9A84C] text-[#0A0A0A] px-8 py-3.5 text-sm font-medium hover:bg-[#D4B85E] transition-colors">
              Access Portal
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-24 bg-[#111111] border-t border-[#222222]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Ready to Talk?
            </h2>
            <p className="text-[#888888] max-w-xl mx-auto mb-8 leading-relaxed">
              Tell us about your facility. We'll tell you what's possible.
            </p>
            <Link to="/contact" className="inline-block border border-[#C9A84C] text-[#C9A84C] px-8 py-3.5 text-sm font-medium hover:bg-[#C9A84C] hover:text-[#0A0A0A] transition-all duration-200">
              Request a Consultation
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
