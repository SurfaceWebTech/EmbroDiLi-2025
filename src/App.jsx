import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import ThemeProvider from './components/ThemeProvider';
import Navbar from './components/Navbar';
import AuthGuard from './components/AuthGuard';
import { useAuthStore } from './lib/authStore';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Forbidden from './pages/Forbidden';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import Customers from './pages/admin/Customers';
import UserRoles from './pages/admin/UserRoles';
import PlanManagement from './pages/admin/PlanManagement';
import Subscriptions from './pages/admin/Subscriptions';
import Transactions from './pages/admin/Transactions';
import Notifications from './pages/admin/Notifications';
import Settings from './pages/admin/Settings';
import ImportDocuments from './pages/admin/ImportDocuments';

// User pages
import UserDashboard from './pages/user/Dashboard';
import Designs from './pages/user/Designs';
import UserSubscription from './pages/user/Subscription';
import Checkout from './pages/user/Checkout';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';

const queryClient = new QueryClient();

function App() {
  const { initAuth, loadingAuth } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await initAuth();
      setInitialized(true);
    };
    
    initialize();
  }, [initAuth]);

  if (!initialized || loadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <Navbar />
          <div className="pt-16"> {/* Add padding top to account for fixed navbar */}
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/forbidden" element={<Forbidden />} />
              
              {/* Auth routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              {/* Admin routes */}
              <Route path="/admin" element={
                <AuthGuard allowedRoles={['admin']}>
                  <AdminLayout />
                </AuthGuard>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="customers" element={<Customers />} />
                <Route path="user-roles" element={<UserRoles />} />
                <Route path="plans" element={<PlanManagement />} />
                <Route path="subscriptions" element={<Subscriptions />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="invoices" element={<div>Invoices</div>} />
                <Route path="cms" element={<div>CMS</div>} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="settings" element={<Settings />} />
                <Route path="roles" element={<div>Roles & Permissions</div>} />
                <Route path="support" element={<div>Support Messages</div>} />
                <Route path="import-documents" element={<ImportDocuments />} />
              </Route>

              {/* User routes */}
              <Route path="/dashboard" element={
                <AuthGuard>
                  <UserLayout />
                </AuthGuard>
              }>
                <Route index element={<UserDashboard />} />
                <Route path="designs" element={<Designs />} />
                <Route path="my-designs" element={<div>My Designs</div>} />
                <Route path="design-editor" element={<div>Design Editor</div>} />
                <Route path="downloads" element={<div>Downloads</div>} />
                <Route path="profile" element={<div>Profile</div>} />
                <Route path="subscription" element={<UserSubscription />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="settings" element={<div>Settings</div>} />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Toaster position="top-right" />
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;