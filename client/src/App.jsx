import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

// Layout
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import MobileNav from './components/layout/MobileNav';

// Pages
import Login from './features/auth/Login';
import Signup from './features/auth/Signup';
import Dashboard from './features/dashboard/Dashboard';
import WellnessHub from './features/wellness/WellnessHub';
import AIAnalysis from './features/analysis/AIAnalysis';
import Appointments from './features/appointments/Appointments';
import Messaging from './features/messaging/Messaging';
import Notifications from './features/notifications/Notifications';
import TaskTracker from './features/tracker/TaskTracker';
import ReferralCenter from './features/referral/ReferralCenter';
import Directory from './features/directory/Directory';
import AIChat from './features/chat/AIChat';
import MentorDashboard from './features/mentor/MentorDashboard';
import Profile from './features/profile/Profile';

const ProtectedLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0b1326' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid #c0c1ff', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ color: '#c0c1ff', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700 }}>StressSync</p>
      </div>
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: '256px', display: 'flex', flexDirection: 'column' }}>
        <TopBar />
        <main style={{ flex: 1, paddingTop: '72px', paddingBottom: '80px', minHeight: '100vh' }}>
          <Outlet />
        </main>
        <MobileNav />
      </div>
    </div>
  );
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={user?.role === 'mentor' ? <MentorDashboard /> : <Dashboard />} />
        <Route path="/wellness" element={<WellnessHub />} />
        <Route path="/analysis" element={<AIAnalysis />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/messages" element={<Messaging />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/tracker" element={<TaskTracker />} />
        <Route path="/referral" element={user?.role === 'mentor' ? <ReferralCenter /> : <Navigate to="/" />} />
        <Route path="/directory" element={<Directory />} />
        <Route path="/ai-chat" element={<AIChat />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
