/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ClientLayout } from './components/ClientLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { ClientPortal } from './pages/ClientPortal';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { FieldAudit } from './pages/FieldAudit';
import { Benchmarking } from './pages/Benchmarking';
import { FinancialModeling } from './pages/FinancialModeling';
import { Governance } from './pages/Governance';
import { Construction } from './pages/Construction';
import { MV } from './pages/MV';
import { Reporting } from './pages/Reporting';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { Workflows } from './pages/Workflows';
import { Timeline } from './pages/Timeline';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing — portal selector */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* Internal team platform (protected) */}
        <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="assets" element={<FieldAudit />} />
          <Route path="benchmarking" element={<Benchmarking />} />
          <Route path="financial" element={<FinancialModeling />} />
          <Route path="governance" element={<Governance />} />
          <Route path="construction" element={<Construction />} />
          <Route path="mv" element={<MV />} />
          <Route path="reporting" element={<Reporting />} />
          <Route path="knowledge" element={<KnowledgeBase />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="workflows" element={<Workflows />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<div className="p-8 text-gray-500">Module under construction</div>} />
        </Route>

        {/* Client-facing portal (protected) */}
        <Route path="/client" element={<ProtectedRoute><ClientLayout /></ProtectedRoute>}>
          <Route index element={<ClientPortal />} />
        </Route>

        {/* Redirect legacy root paths */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
