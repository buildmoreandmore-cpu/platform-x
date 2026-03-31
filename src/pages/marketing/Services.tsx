import { motion } from 'motion/react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const facilityServices = [
  {
    title: 'Mechanical Systems (HVAC)',
    bullets: ['HVAC installation and maintenance', 'Industrial ventilation systems', 'Compressor systems and servicing'],
  },
  {
    title: 'Plumbing & Water Systems',
    bullets: ['Pipe installation and repair', 'Drainage systems', 'Water pressure management'],
  },
  {
    title: 'Electrical Systems',
    bullets: ['System upgrades (cable, electrical, WiFi)', 'Fault detection', 'Wiring and installations'],
  },
  {
    title: 'Fire Protection Systems',
    bullets: ['Sprinkler systems', 'Fire suppression systems', 'Safety compliance checks'],
  },
  {
    title: 'Structural & Carpentry',
    bullets: ['Interior structural work', 'Custom carpentry', 'Facility modifications'],
  },
  {
    title: 'General Contracting',
    bullets: ['Project coordination', 'Multi-service integration', 'Site management'],
  },
];

const energyServices = [
  {
    title: 'ESPC Lifecycle Management',
    bullets: ['End-to-end oversight from feasibility through contract close', 'Milestone tracking and governance', 'Risk identification and change order management'],
  },
  {
    title: 'Measurement & Verification (M&V)',
    bullets: ['Savings verification against guaranteed baselines', 'Drift detection and performance alerts', 'Automated M&V reporting'],
  },
  {
    title: 'Financial Modeling & Analysis',
    bullets: ['DSCR, NPV, and payback analysis', 'ECM-level financial modeling', 'Portfolio benchmarking'],
  },
  {
    title: 'AI-Powered Project Intelligence',
    bullets: ['Natural language project queries', 'Document intelligence and extraction', 'Automated reporting with QA workflow'],
  },
];

export function Services() {
  return (
    <>
      {/* Hero */}
      <section className="pt-36 pb-20 bg-[#0A0A0A]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp}
            className="text-4xl sm:text-6xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
            Services
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-lg text-[#888888] max-w-2xl mx-auto">
            Comprehensive facility and energy performance solutions for commercial and civic environments.
          </motion.p>
        </div>
      </section>

      {/* Facility Operations */}
      <section className="py-24 bg-[#111111] border-y border-[#222222]">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              Facility Operations
            </h2>
            <p className="text-[#888888] max-w-3xl leading-relaxed">
              Vantage manages the full physical operational lifecycle of your facility through a vetted network of licensed subcontractors — coordinated, accountable, and responsive.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {facilityServices.map((svc, i) => (
              <motion.div key={svc.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="bg-[#0A0A0A] border border-[#222222] p-8 hover:border-[#C9A84C]/30 transition-colors duration-300">
                <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>{svc.title}</h3>
                <ul className="space-y-2">
                  {svc.bullets.map((b) => (
                    <li key={b} className="text-sm text-[#888888] flex items-start gap-2">
                      <span className="text-[#C9A84C] mt-1 text-xs">◆</span>{b}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Energy Performance Advisory */}
      <section className="py-24 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              Energy Performance Advisory
            </h2>
            <p className="text-[#888888] max-w-3xl leading-relaxed">
              For clients navigating Energy Savings Performance Contracts, Vantage serves as your independent Owner's Representative — protecting your interests from audit through M&V and beyond, powered by our proprietary AI platform.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {energyServices.map((svc, i) => (
              <motion.div key={svc.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="bg-[#111111] border border-[#222222] p-8 hover:border-[#C9A84C]/30 transition-colors duration-300">
                <div className="w-10 h-10 border border-[#C9A84C]/30 flex items-center justify-center mb-5">
                  <span className="text-[#C9A84C] font-bold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>{svc.title}</h3>
                <ul className="space-y-2">
                  {svc.bullets.map((b) => (
                    <li key={b} className="text-sm text-[#888888] flex items-start gap-2">
                      <span className="text-[#C9A84C] mt-1 text-xs">◆</span>{b}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
