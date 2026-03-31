import { Outlet } from 'react-router-dom';
import { MarketingNavbar } from './MarketingNavbar';
import { MarketingFooter } from './MarketingFooter';

export function MarketingLayout() {
  return (
    <div className="bg-[#0A0A0A] text-[#F5F5F0] min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <MarketingNavbar />
      <main>
        <Outlet />
      </main>
      <MarketingFooter />
    </div>
  );
}
