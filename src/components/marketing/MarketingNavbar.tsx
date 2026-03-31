import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

const navLinks = [
  { href: '/services', label: 'Services' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/portal', label: 'Client Portal' },
  { href: '/contact', label: 'Contact' },
];

export function MarketingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#222222]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src="/logo.svg" alt="Vantage Infrastructure Group" className="h-8 sm:h-9" />
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-sm text-[#888888] hover:text-[#F5F5F0] transition-colors duration-200"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => navigate('/contact')}
            className="text-sm border border-[#C9A84C] text-[#C9A84C] px-5 py-2 hover:bg-[#C9A84C] hover:text-[#0A0A0A] transition-all duration-200"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Request a Consultation
          </button>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span className={`w-6 h-px bg-[#F5F5F0] transition-transform duration-200 ${mobileOpen ? 'rotate-45 translate-y-[3.5px]' : ''}`} />
          <span className={`w-6 h-px bg-[#F5F5F0] transition-opacity duration-200 ${mobileOpen ? 'opacity-0' : ''}`} />
          <span className={`w-6 h-px bg-[#F5F5F0] transition-transform duration-200 ${mobileOpen ? '-rotate-45 -translate-y-[3.5px]' : ''}`} />
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden overflow-hidden bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#222222]"
          >
            <div className="px-6 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-[#888888] hover:text-[#F5F5F0] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => { setMobileOpen(false); navigate('/contact'); }}
                className="text-sm border border-[#C9A84C] text-[#C9A84C] px-5 py-2 text-center hover:bg-[#C9A84C] hover:text-[#0A0A0A] transition-all duration-200 mt-2"
              >
                Request a Consultation
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
