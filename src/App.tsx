import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, AdminRoute } from "@/components/ProtectedRoute";

// Eager: landing + auth (critical path)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// Lazy: public invite landing
const PublicInvite = lazy(() => import("./pages/PublicInvite"));

// Lazy: client pages
const ClientLayout = lazy(() => import("./components/client/ClientLayout"));
const ClientDashboard = lazy(() => import("./pages/client/Dashboard"));
const ClientJourney = lazy(() => import("./pages/client/Journey"));
const ClientModules = lazy(() => import("./pages/client/Modules"));
const ModuleDetail = lazy(() => import("./pages/client/ModuleDetail"));
const ClientMaterials = lazy(() => import("./pages/client/Materials"));
const ClientEncontros = lazy(() => import("./pages/client/Encontros"));
const EncontroDetail = lazy(() => import("./pages/client/EncontroDetail"));
const ClientAnnouncements = lazy(() => import("./pages/client/Announcements"));
const ClientProfile = lazy(() => import("./pages/client/Profile"));

// Lazy: admin pages
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminJourney = lazy(() => import("./pages/admin/Journey"));
const AdminMaterials = lazy(() => import("./pages/admin/Materials"));
const AdminAnnouncements = lazy(() => import("./pages/admin/Announcements"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminProgress = lazy(() => import("./pages/admin/Progress"));
const AdminEncontros = lazy(() => import("./pages/admin/Encontros"));
const AdminFinancial = lazy(() => import("./pages/admin/Financial"));
const AdminInvites = lazy(() => import("./pages/admin/Invites"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen bg-navy-dark flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      <span className="text-sm text-gray-500 font-body">Carregando...</span>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/register" element={<Register />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/convite/:slug" element={<PublicInvite />} />

              {/* Client Area */}
              <Route path="/client" element={<ProtectedRoute><ClientLayout /></ProtectedRoute>}>
                <Route index element={<ClientDashboard />} />
                <Route path="journey" element={<ClientJourney />} />
                <Route path="modules" element={<ClientModules />} />
                <Route path="modules/:id" element={<ModuleDetail />} />
                <Route path="materials" element={<ClientMaterials />} />
                <Route path="encontros" element={<ClientEncontros />} />
                <Route path="encontros/:id" element={<EncontroDetail />} />
                <Route path="announcements" element={<ClientAnnouncements />} />
                <Route path="profile" element={<ClientProfile />} />
              </Route>

              {/* Admin Area */}
              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="encontros" element={<AdminEncontros />} />
                <Route path="materials" element={<AdminMaterials />} />
                <Route path="journey" element={<AdminJourney />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="progress" element={<AdminProgress />} />
                <Route path="financial" element={<AdminFinancial />} />
                <Route path="invites" element={<AdminInvites />} />
                <Route path="announcements" element={<AdminAnnouncements />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
