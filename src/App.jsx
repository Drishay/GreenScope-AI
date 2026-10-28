import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import ScrollToTop from "./components/ScrollToTop";
import AppLayout from "@/components/AppLayout";
import AppWorkspaceLayout from "@/components/AppWorkspaceLayout";
import Home from "@/pages/Home";
import Analyze from "@/pages/Analyze";
import History from "@/pages/History";
import AnalysisDetail from "@/pages/AnalysisDetail";
import Login from "@/pages/Login";
import PublicReport from "@/pages/PublicReport";
import ReportStatus from "@/pages/ReportStatus";
import Workspace from "@/pages/Workspace";
import About from "@/pages/About";
import FAQ from "@/pages/FAQ";
import LegacyAnalysisRedirect from "@/components/LegacyAnalysisRedirect";

export default function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/analyze" element={<Analyze />} />
            <Route path="/login" element={<Navigate to="/app/login" replace />} />
            <Route path="/report" element={<PublicReport />} />
            <Route path="/report-status" element={<ReportStatus />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
          </Route>
          <Route path="/app" element={<AppWorkspaceLayout />}>
            <Route index element={<Navigate to="/app/workspace" replace />} />
            <Route path="login" element={<Login />} />
            <Route path="workspace" element={<Workspace />} />
            <Route path="history" element={<History />} />
            <Route path="analysis/:id" element={<AnalysisDetail />} />
          </Route>
          <Route path="/workspace" element={<Navigate to="/app/workspace" replace />} />
          <Route path="/history" element={<Navigate to="/app/history" replace />} />
          <Route path="/analysis/:id" element={<LegacyAnalysisRedirect />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}
