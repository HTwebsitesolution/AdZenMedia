import "@/App.css";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { SignIn, SignUp } from "@clerk/react";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/site/Layout";
import ClerkAuthProvider from "@/components/auth/ClerkAuthProvider";
import { ConfigProvider } from "@/lib/config";
import { Seo } from "@/components/site/Seo";
import Home from "@/pages/Home";
import { LegacySolutionRedirect, ServicePage, ServicesHub } from "@/pages/Services";
import { Navigate } from "react-router-dom";
import { AboutPage, CaseStudyPage, IndustryPage, NotFound, PrivacyPage, WorkPage } from "@/pages/InfoPages";
import ContactPage from "@/pages/Contact";
import SystemsCheckPage, { QuotePage } from "@/pages/SystemsCheck";
import QuoteWizard from "@/components/quote/QuoteWizard";
import FounderLayout from "@/pages/founder/FounderLayout";
import Dashboard from "@/pages/founder/Dashboard";
import LeadDetail from "@/pages/founder/LeadDetail";
import Reports from "@/pages/founder/Reports";
import SystemPage from "@/pages/founder/SystemPage";

const AuthShell = () => (
  <ClerkAuthProvider>
    <Seo title="Founder sign-in" noindex />
    <Outlet />
  </ClerkAuthProvider>
);

const Centered = ({ children }) => <div className="dash min-h-screen flex items-center justify-center p-4">{children}</div>;

function App() {
  return (
    <ConfigProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<ServicesHub />} />
            <Route path="/services/:slug" element={<ServicePage />} />
            <Route path="/solutions" element={<LegacySolutionRedirect />} />
            <Route path="/solutions/:slug" element={<LegacySolutionRedirect />} />
            <Route path="/industries/engineering-inspection-calibration" element={<IndustryPage />} />
            <Route path="/industries/commercial-field-service" element={<Navigate to="/industries/engineering-inspection-calibration" replace />} />
            <Route path="/work" element={<WorkPage />} />
            <Route path="/work/:slug" element={<CaseStudyPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/quote" element={<QuotePage><QuoteWizard /></QuotePage>} />
            <Route path="/systems-check" element={<SystemsCheckPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route element={<AuthShell />}>
            <Route path="/sign-in/*" element={<Centered><SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" withSignUp forceRedirectUrl="/founder" /></Centered>} />
            <Route path="/sign-up/*" element={<Centered><SignUp routing="path" path="/sign-up" signInUrl="/sign-in" forceRedirectUrl="/founder" /></Centered>} />
            <Route path="/founder" element={<FounderLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="leads/:id" element={<LeadDetail />} />
              <Route path="reports" element={<Reports />} />
              <Route path="system" element={<SystemPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster theme="dark" position="top-right" />
    </ConfigProvider>
  );
}

export default App;
