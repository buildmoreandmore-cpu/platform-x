import { motion } from 'motion/react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const steps = [
  {
    num: '01',
    title: 'Initial Assessment',
    desc: 'We evaluate your facility needs, existing contracts, and energy performance landscape. No generic audits — a targeted diagnostic built around your environment.',
  },
  {
    num: '02',
    title: 'Scope & Subcontractor Sourcing',
    desc: 'We define the scope of work and deploy our vetted subcontractor network. You get licensed, accountable tradespeople — coordinated by Vantage, not chased by you.',
  },
  {
    num: '03',
    title: 'Platform Activation',
    desc: 'Your project goes live on our AI platform. Real-time dashboards, document intelligence, milestone tracking, and automated reporting — all accessible through your client portal.',
  },
  {
    num: '04',
    title: 'Execution & Oversight',
    desc: 'We manage the work in the field and the performance on the platform. Deviations are caught early. Reporting is automated. You stay informed without being buried.',
  },
  {
    num: '05',
    title: 'Continuous Performance Management',
    desc: 'For ESPC clients, we monitor savings, verify M&V, and flag drift. For facility clients, we manage preventive maintenance schedules and respond to issues 24/7.',
  },
];

const differentiators = [
  { title: 'AI-Powered', desc: "Our platform does what spreadsheets can't." },
  { title: 'Independent', desc: 'We represent you, not the ESCO.' },
  { title: 'Integrated', desc: 'Facility ops and energy advisory under one roof.' },
  { title: 'Accountable', desc: 'Fixed scopes, clear deliverables, no surprises.' },
];

export function HowItWorks() {
  return (
    <>
      {/* Hero */}
      <section className="pt-36 pb-20 bg-[#0A0A0A]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp}
            className="text-4xl sm:text-6xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
            How It Works
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-lg text-[#888888] max-w-2xl mx-auto">
            A structured, technology-driven process from first call to ongoing performance.
          </motion.p>
        </div>
      </section>

      {/* Process Timeline */}
      <section className="py-24 bg-[#111111] border-y border-[#222222]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative">
            <div className="hidden md:block absolute left-[39px] top-0 bottom-0 w-px bg-[#222222]" />
            <div className="space-y-16">
              {steps.map((step, i) => (
                <motion.div key={step.num} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                  className="flex flex-col md:flex-row gap-6 md:gap-10">
                  <div className="flex-shrink-0 relative">
                    <div className="w-20 h-20 border border-[#C9A84C]/30 bg-[#0A0A0A] flex items-center justify-center">
                      <span className="text-2xl font-bold text-[#C9A84C]" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {step.num}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <h3 className="text-xl sm:text-2xl font-semibold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {step.title}
                    </h3>
                    <p className="text-[#888888] leading-relaxed max-w-xl">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Vantage */}
      <section className="py-24 bg-[#0A0A0A]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-3xl sm:text-4xl font-bold text-center mb-16" style={{ fontFamily: "'Playfair Display', serif" }}>
            Why Vantage
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {differentiators.map((d, i) => (
              <motion.div key={d.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="bg-[#111111] border border-[#222222] p-8 hover:border-[#C9A84C]/30 transition-colors duration-300">
                <h3 className="text-lg font-semibold mb-2 text-[#C9A84C]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {d.title}
                </h3>
                <p className="text-[#888888] text-sm leading-relaxed">{d.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
