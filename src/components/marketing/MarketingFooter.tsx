import { Link } from 'react-router-dom';

const services = [
  { label: 'Facility Operations', href: '/services' },
  { label: 'Energy Performance Advisory', href: '/services' },
  { label: 'AI-Powered Intelligence', href: '/services' },
];

const company = [
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Client Portal', href: '/portal' },
  { label: 'Contact', href: '/contact' },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-[#C9A84C]/20">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="text-xl font-bold tracking-tight mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              <span className="text-[#C9A84C]">V</span>ANTAGE
            </div>
            <p className="text-sm text-[#888888] leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Infrastructure Managed.<br />Performance Guaranteed.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-[#888888] mb-4">Services</h4>
            <ul className="space-y-3">
              {services.map((item) => (
                <li key={item.label}>
                  <Link to={item.href} className="text-sm text-[#F5F5F0]/70 hover:text-[#C9A84C] transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-[#888888] mb-4">Company</h4>
            <ul className="space-y-3">
              {company.map((item) => (
                <li key={item.label}>
                  <Link to={item.href} className="text-sm text-[#F5F5F0]/70 hover:text-[#C9A84C] transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-[#888888] mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-[#F5F5F0]/70">
              <li>
                <a href="mailto:hello@vantageinfrastructure.com" className="hover:text-[#C9A84C] transition-colors">
                  hello@vantageinfrastructure.com
                </a>
              </li>
              <li>Atlanta, GA</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-6 border-t border-[#222222] text-center">
          <p className="text-xs text-[#888888]">
            &copy; {new Date().getFullYear()} Vantage Infrastructure Group. Atlanta, GA. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
