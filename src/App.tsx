import { useState, useEffect } from 'react';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { Box, CircularProgress } from '@mui/material';
import createAppTheme from './theme';
import { verifyToken, isTokenValidLocal } from './API/login';

// Importações das páginas
import Home from './componnents/home';
import AdminLogin from './componnents/adminpage/login';
import AdminHome from './componnents/adminpage/adminhome';
import AllNewsPage from './componnents/page/AllNewsPage';
import NewsDetailPage from './componnents/page/NewsDetailPage';
import TeamPage from './componnents/page/TeamPage';
import UsefulLinks from './componnents/page/UsefulLinks';
import PrefeiturasPage from './componnents/page/PrefeiturasPage';
import PrefeituraSistemasPage from './componnents/page/PrefeituraSistemasPage';
import PublicLayout from './componnents/PublicLayout';
import AccessibilityWidget from './componnents/common/AccessibilityWidget';

function RedirectPrefeituraIdToOrgao() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? `/orgao/${id}` : '/orgao'} replace />;
}
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        return;
      }

      try {
        const locallyValid = isTokenValidLocal();
        if (locallyValid) {
          setIsAuthenticated(true);
          await verifyToken().catch(() => undefined);
          return;
        }
        await verifyToken();
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};

const ScrollToTop = () => {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);
  return null;
};

function App() {
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const saved = localStorage.getItem('accessibilitySettings');
    if (saved) {
      try {
        const obj = JSON.parse(saved) as { darkMode?: boolean };
        if (obj && typeof obj.darkMode === 'boolean') {
          setMode(obj.darkMode ? 'dark' : 'light');
        }
      } catch { void 0 }
    }

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { darkMode?: boolean } | undefined;
      if (detail && typeof detail.darkMode === 'boolean') {
        setMode(detail.darkMode ? 'dark' : 'light');
      }
    };
    window.addEventListener('accessibilitySettingsChanged', handler);
    return () => window.removeEventListener('accessibilitySettingsChanged', handler);
  }, []);

  return (
    <ThemeProvider theme={createAppTheme(mode)}>
      <CssBaseline />
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/*"
            element={
              <PublicLayout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/noticias" element={<AllNewsPage />} />
                  <Route path="/noticia/:id" element={<NewsDetailPage />} />
                  <Route path="/equipe" element={<TeamPage />} />
                  <Route path="/links-uteis" element={<UsefulLinks />} />
                  <Route path="/orgao" element={<PrefeiturasPage />} />
                  <Route path="/orgao/:id" element={<PrefeituraSistemasPage />} />
                  <Route path="/prefeituras" element={<Navigate to="/orgao" replace />} />
                  <Route path="/prefeituras/:id" element={<RedirectPrefeituraIdToOrgao />} />
                  <Route path="/login" element={<Navigate to="/orgao" replace />} />
                </Routes>
              </PublicLayout>
            }
          />
        </Routes>
        <AccessibilityWidget />
      </Router>
    </ThemeProvider>
  );
}

export default App;
