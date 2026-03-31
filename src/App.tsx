/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ClientLayout } from './components/ClientLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PageSkeleton } from './components/Skeleton';
import { TenantThemeProvider } from './providers/TenantThemeProvider';
import { MarketingLayout } from './components/marketing/MarketingLayout';

// Marketing pages (eager — small, SEO-critical)
import { Home } from './pages/marketing/Home';
import { Services } from './pages/marketing/Services';
import { HowItWorks } from './pages/marketing/HowItWorks';
import { Contact } from './pages/marketing/Contact';

// Eager-loaded (always needed)
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { ClientAccept } from './pages/ClientAccept';
import { TenantOnboarding } from './pages/TenantOnboarding';
import { ensureDatabaseExists } from './lib/initDatabase';

// Lazy-loaded pages
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Projects = lazy(() => import('./pages/Projects').then(m => ({ default: m.Projects })));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail').then(m => ({ default: m.ProjectDetail })));
const FieldAudit = lazy(() => import('./pages/FieldAudit').then(m => ({ default: m.FieldAudit })));
const Benchmarking = lazy(() => import('./pages/Benchmarking').then(m => ({ default: m.Benchmarking })));
const FinancialModeling = lazy(() => import('./pages/FinancialModeling').then(m => ({ default: m.FinancialModeling })));
const Governance = lazy(() => import('./pages/Governance').then(m => ({ default: m.Governance })));
const Construction = lazy(() => import('./pages/Construction').then(m => ({ default: m.Construction })));
const MV = lazy(() => import('./pages/MV').then(m => ({ default: m.MV })));
const Reporting = lazy(() => import('./pages/Reporting').then(m => ({ default: m.Reporting })));
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase').then(m => ({ default: m.KnowledgeBase })));
const Workflows = lazy(() => import('./pages/Workflows').then(m => ({ default: m.Workflows })));
const Timeline = lazy(() => import('./pages/Timeline').then(m => ({ default: m.Timeline })));
const Drawings = lazy(() => import('./pages/Drawings').then(m => ({ default: m.Drawings })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const ClientPortal = lazy(() => import('./pages/ClientPortal').then(m => ({ default: m.ClientPortal })));
const SuperAdmin = lazy(() => import('./pages/SuperAdmin').then(m => ({ default: m.SuperAdmin })));

export default function App() {
  useEffect(() => {
    ensureDatabaseExists();
  }, []);

  return (
    <TenantThemeProvider>
    <BrowserRouter>
      <Routes>
        {/* Marketing site (public) */}
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        {/* Portal gateway — dashboard entry */}
        <Route path="/portal" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Internal team platform (protected) */}
        <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Suspense fallback={<PageSkeleton />}><Dashboard /></Suspense>} />
          <Route path="projects" element={<Suspense fallback={<PageSkeleton />}><Projects /></Suspense>} />
          <Route path="projects/:id" element={<Suspense fallback={<PageSkeleton />}><ProjectDetail /></Suspense>} />
          <Route path="assets" element={<Suspense fallback={<PageSkeleton />}><FieldAudit /></Suspense>} />
          <Route path="benchmarking" element={<Suspense fallback={<PageSkeleton />}><Benchmarking /></Suspense>} />
          <Route path="financial" element={<Suspense fallback={<PageSkeleton />}><FinancialModeling /></Suspense>} />
          <Route path="governance" element={<Suspense fallback={<PageSkeleton />}><Governance /></Suspense>} />
          <Route path="construction" element={<Suspense fallback={<PageSkeleton />}><Construction /></Suspense>} />
          <Route path="mv" element={<Suspense fallback={<PageSkeleton />}><MV /></Suspense>} />
          <Route path="reporting" element={<Suspense fallback={<PageSkeleton />}><Reporting /></Suspense>} />
          <Route path="knowledge" element={<Suspense fallback={<PageSkeleton />}><KnowledgeBase /></Suspense>} />
          <Route path="timeline" element={<Suspense fallback={<PageSkeleton />}><Timeline /></Suspense>} />
          <Route path="workflows" element={<Suspense fallback={<PageSkeleton />}><Workflows /></Suspense>} />
          <Route path="drawings" element={<Suspense fallback={<PageSkeleton />}><Drawings /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<PageSkeleton />}><Settings /></Suspense>} />
          <Route path="*" element={<div className="p-8 text-gray-500">Module under construction</div>} />
        </Route>

        {/* Super admin panel (key-protected, no tenant auth) */}
        <Route path="/super-admin" element={<Suspense fallback={<PageSkeleton />}><SuperAdmin /></Suspense>} />

        {/* Tenant onboarding (owner only) */}
        <Route path="/onboarding" element={<TenantOnboarding />} />

        {/* Client invite acceptance (public) */}
        <Route path="/client/accept" element={<ClientAccept />} />

        {/* Client-facing portal (protected) */}
        <Route path="/client" element={<ProtectedRoute><ClientLayout /></ProtectedRoute>}>
          <Route index element={<Suspense fallback={<PageSkeleton />}><ClientPortal /></Suspense>} />
        </Route>

        {/* Redirect unknown paths */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </TenantThemeProvider>
  );
}
