import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RecordViewer from './pages/RecordViewer';
import ManageAccess from './pages/ManageAccess';
import AuditLog from './pages/AuditLog';
import FindDoctors from './pages/FindDoctors';
import { useAuth } from './context/AuthContext';

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-bg-main">
      <Navbar />
      <main className="pt-4">{children}</main>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/find-doctors" element={<Layout><FindDoctors /></Layout>} />
      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/records/:id" element={<ProtectedRoute><Layout><RecordViewer /></Layout></ProtectedRoute>} />
      <Route path="/records/:id/access" element={<ProtectedRoute><Layout><ManageAccess /></Layout></ProtectedRoute>} />
      <Route path="/audit" element={<ProtectedRoute><Layout><AuditLog /></Layout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              borderRadius: '10px',
            },
            success: { iconTheme: { primary: '#16A34A', secondary: '#fff' } },
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}