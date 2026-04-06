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
import { AdminLayout } from './components/admin/AdminLayout';
import { ClientPortalLayout } from './components/client/ClientPortalLayout';
import { CMVPLayout } from './components/cmvp/CMVPLayout';

// Marketing pages (eager — small, SEO-critical)
import { Home } from './pages/marketing/Home';
import { Services } from './pages/marketing/Services';
import { CaseStudies } from './pages/marketing/CaseStudies';
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
const Demo = lazy(() => import('./pages/Demo').then(m => ({ default: m.Demo })));

// Admin portal pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminUpload = lazy(() => import('./pages/admin/AdminUpload').then(m => ({ default: m.AdminUpload })));
const AdminContracts = lazy(() => import('./pages/admin/AdminContracts').then(m => ({ default: m.AdminContracts })));
const AdminContractDetail = lazy(() => import('./pages/admin/AdminContractDetail').then(m => ({ default: m.AdminContractDetail })));
const AdminAlerts = lazy(() => import('./pages/admin/AdminAlerts').then(m => ({ default: m.AdminAlerts })));
const AdminDocuments = lazy(() => import('./pages/admin/AdminDocuments').then(m => ({ default: m.AdminDocuments })));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));

// Client portal
const ClientLogin = lazy(() => import('./pages/client/ClientLogin').then(m => ({ default: m.ClientLogin })));

// CMVP portal
const CMVPDashboard = lazy(() => import('./pages/cmvp/CMVPDashboard').then(m => ({ default: m.CMVPDashboard })));
const CMVPTasks = lazy(() => import('./pages/cmvp/CMVPTasks').then(m => ({ default: m.CMVPTasks })));
const CMVPTaskReview = lazy(() => import('./pages/cmvp/CMVPTaskReview').then(m => ({ default: m.CMVPTaskReview })));
const CMVPContracts = lazy(() => import('./pages/cmvp/CMVPContracts').then(m => ({ default: m.CMVPContracts })));

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
          <Route path="/case-studies" element={<CaseStudies />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/demo" element={<Suspense fallback={<PageSkeleton />}><Demo /></Suspense>} />

        {/* Internal team platform (hidden — access via /admin instead) */}
        {/* <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}> ... </Route> */}

        {/* Super admin panel (key-protected, no tenant auth) */}
        <Route path="/super-admin" element={<Suspense fallback={<PageSkeleton />}><SuperAdmin /></Suspense>} />

        {/* Tenant onboarding (owner only) */}
        <Route path="/onboarding" element={<TenantOnboarding />} />

        {/* Client invite acceptance (public) */}
        <Route path="/client/accept" element={<ClientAccept />} />

        {/* Client Login */}
        <Route path="/client/login" element={<Suspense fallback={<PageSkeleton />}><ClientLogin /></Suspense>} />

        {/* Client Portal (tab-based, no child routes) */}
        <Route path="/client" element={<ClientPortalLayout />} />

        {/* M&V Professional Portal */}
        <Route path="/cmvp" element={<CMVPLayout />}>
          <Route index element={<Suspense fallback={<PageSkeleton />}><CMVPDashboard /></Suspense>} />
          <Route path="tasks" element={<Suspense fallback={<PageSkeleton />}><CMVPTasks /></Suspense>} />
          <Route path="tasks/:id" element={<Suspense fallback={<PageSkeleton />}><CMVPTaskReview /></Suspense>} />
          <Route path="contracts" element={<Suspense fallback={<PageSkeleton />}><CMVPContracts /></Suspense>} />
        </Route>

        {/* Admin Portal */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Suspense fallback={<PageSkeleton />}><AdminDashboard /></Suspense>} />
          <Route path="upload" element={<Suspense fallback={<PageSkeleton />}><AdminUpload /></Suspense>} />
          <Route path="contracts" element={<Suspense fallback={<PageSkeleton />}><AdminContracts /></Suspense>} />
          <Route path="contracts/:id" element={<Suspense fallback={<PageSkeleton />}><AdminContractDetail /></Suspense>} />
          <Route path="alerts" element={<Suspense fallback={<PageSkeleton />}><AdminAlerts /></Suspense>} />
          <Route path="documents" element={<Suspense fallback={<PageSkeleton />}><AdminDocuments /></Suspense>} />
          <Route path="users" element={<Suspense fallback={<PageSkeleton />}><AdminUsers /></Suspense>} />
        </Route>

        {/* Redirect unknown paths */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </TenantThemeProvider>
  );
}
