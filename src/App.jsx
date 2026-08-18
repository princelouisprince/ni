import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ConfigCheck from './pages/ConfigCheck';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import AssistantDashboard from './assistant/AssistantDashboard';
import CustomerCreation from './assistant/CustomerCreation';
import ProjectCreation from './assistant/ProjectCreation';
import ProjectDetails from './assistant/ProjectDetails';
import CarpenterDashboard from './carpenter/CarpenterDashboard';
import CarpenterProjectPage from './carpenter/CarpenterProjectPage';
import CleanerDashboard from './cleaner/CleanerDashboard';
import CleanerProjectPage from './cleaner/CleanerProjectPage';
import BossDashboard from './boss/BossDashboard';
import DashboardLayout from './layouts/DashboardLayout';

function App() {
  const isConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!isConfigured) {
    return (
      <>
        <ConfigCheck />
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-stone-50">
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/assistant"
            element={
              <ProtectedRoute allowedRoles={['assistant']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AssistantDashboard />} />
            <Route path="customers/new" element={<CustomerCreation />} />
            <Route path="projects/new" element={<ProjectCreation />} />
            <Route path="projects/:id" element={<ProjectDetails />} />
          </Route>
          
          <Route 
            path="/carpenter"
            element={
              <ProtectedRoute allowedRoles={['carpenter']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CarpenterDashboard />} />
            <Route path="projects/:id" element={<CarpenterProjectPage />} />
          </Route>
          
          <Route 
            path="/cleaner" 
            element={
              <ProtectedRoute allowedRoles={['cleaner']}>
                <CleanerDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/cleaner/projects/:id" 
            element={
              <ProtectedRoute allowedRoles={['cleaner']}>
                <CleanerProjectPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/boss" 
            element={
              <ProtectedRoute allowedRoles={['boss']}>
                <BossDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/boss/projects/:id" 
            element={
              <ProtectedRoute allowedRoles={['boss', 'assistant']}>
                <ProjectDetails />
              </ProtectedRoute>
            } 
          />
          
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </BrowserRouter>
  );
}

export default App;
