
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { Login } from './src/components/auth/Login';
import { History } from './src/pages/History';
import { Welcome } from './src/pages/Welcome';
import { Dashboard } from './src/pages/Dashboard';
import Admin from './src/pages/Admin';
import { AppLayout } from './src/components/layout/AppLayout';

// Layout for authenticated users, redirecting to login if needed
const ProtectedPagesLayout: React.FC = () => {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
};

// Layout for admin-only pages, redirecting to dashboard if not admin
const AdminPagesLayout: React.FC = () => {
  const { currentUser } = useAuth();
  
  // If not logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  // If logged in but not an admin, redirect to dashboard
  // Note: You'll need to implement the isAdmin check based on your auth system
  const isAdmin = true; // Replace with actual admin check
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
};

// Layout for public pages, redirecting to dashboard if user is logged in
const PublicPagesLayout: React.FC = () => {
  const { currentUser } = useAuth();
  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
};

// Main component to handle routing logic, including the initial loading state
const AppRoutes: React.FC = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicPagesLayout />}>
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedPagesLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/history" element={<History />} />
      </Route>

      {/* Admin-only Routes */}
      <Route element={<AdminPagesLayout />}>
        <Route path="/admin" element={<Admin />} />
      </Route>

      {/* Redirect root to the welcome page, which will then handle auth checks */}
      <Route path="/" element={<Navigate to="/welcome" replace />} />
      
      {/* Fallback redirect for any unknown paths */}
      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  );
}

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;