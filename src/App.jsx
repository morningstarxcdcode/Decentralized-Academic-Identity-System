import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import { BlockchainProvider } from './contexts/BlockchainContext';
import Navbar from './components/Navbar';
import PageWrapper from './components/PageWrapper';

// Pages
import Landing from './pages/Landing';
import StudentDashboard from './pages/StudentDashboard';
import UniversityPortal from './pages/UniversityPortal';
import VerifierPortal from './pages/VerifierPortal';
import GovernmentDashboard from './pages/GovernmentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import CredentialDetail from './pages/CredentialDetail';
import EditProfile from './pages/EditProfile';
import Analytics from './pages/Analytics';
import ActivityLog from './pages/ActivityLog';
import Marketplace from './pages/Marketplace';
import NotFound from './pages/NotFound';
import './styles/global.css';

const Layout = () => (
  <>
    <Navbar />
    <Outlet />
  </>
);

const AnimatedRoutes = () => {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Layout />}>
                    <Route index element={<PageWrapper><Landing /></PageWrapper>} />
                    <Route path="student" element={<PageWrapper><StudentDashboard /></PageWrapper>} />
                    <Route path="university" element={<PageWrapper><UniversityPortal /></PageWrapper>} />
                    <Route path="verifier" element={<PageWrapper><VerifierPortal /></PageWrapper>} />
                    <Route path="government" element={<PageWrapper><GovernmentDashboard /></PageWrapper>} />
                    <Route path="admin" element={<PageWrapper><AdminDashboard /></PageWrapper>} />
                    <Route path="profile/edit" element={<PageWrapper><EditProfile /></PageWrapper>} />
                    <Route path="profile/:address" element={<PageWrapper><Profile /></PageWrapper>} />
                    <Route path="credential/:id" element={<PageWrapper><CredentialDetail /></PageWrapper>} />
                    <Route path="analytics" element={<PageWrapper><Analytics /></PageWrapper>} />
                    <Route path="activity" element={<PageWrapper><ActivityLog /></PageWrapper>} />
                    <Route path="marketplace" element={<PageWrapper><Marketplace /></PageWrapper>} />
                    <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
                </Route>
            </Routes>
        </AnimatePresence>
    );
};

function App() {
  return (
    <AuthProvider>
      <BlockchainProvider>
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </BlockchainProvider>
    </AuthProvider>
  );
}

export default App;
