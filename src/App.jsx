import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { ProtectedRoute } from './components/ProtectedRoute';

// Auth pages
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import ResetPassword from './pages/ResetPassword';
import EmailVerify from './pages/EmailVerify';

// App pages
import Dashboard from './pages/Dashboard';
import CreateTree from './pages/CreateTree';
import TreeDetail from './pages/TreeDetail';
import AddMember from './pages/AddMember';
import MemberProfile from './pages/MemberProfile';
import EditMember from './pages/EditMember';
import InviteMembers from './pages/InviteMembers';
import JoinTree from './pages/JoinTree';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Landing from './pages/Landing';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Root: Landing page */}
          <Route path="/" element={<Landing />} />

          {/* Auth (public) */}
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/email-verify" element={<EmailVerify />} />

          {/* Protected app routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/trees/new" element={
            <ProtectedRoute><CreateTree /></ProtectedRoute>
          } />
          <Route path="/trees/:treeId" element={
            <ProtectedRoute><TreeDetail /></ProtectedRoute>
          } />
          <Route path="/trees/:treeId/members/new" element={
            <ProtectedRoute><AddMember /></ProtectedRoute>
          } />
          <Route path="/trees/:treeId/members/:memberId" element={
            <ProtectedRoute><MemberProfile /></ProtectedRoute>
          } />
          <Route path="/trees/:treeId/members/:memberId/edit" element={
            <ProtectedRoute><EditMember /></ProtectedRoute>
          } />
          <Route path="/trees/:treeId/invite" element={
            <ProtectedRoute><InviteMembers /></ProtectedRoute>
          } />
          <Route path="/join" element={<JoinTree />} />
          <Route path="/notifications" element={
            <ProtectedRoute><Notifications /></ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute><Settings /></ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
