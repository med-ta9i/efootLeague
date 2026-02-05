import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TournamentList from './pages/TournamentList';
import TournamentDetail from './pages/TournamentDetail';
import TournamentCreate from './pages/TournamentCreate';
import Notifications from './pages/Notifications';
import Friends from './pages/Friends';
import Profile from './pages/Profile';
import propTypes from 'prop-types';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: propTypes.node.isRequired,
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={<Layout />}>
            <Route index element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="tournaments" element={<ProtectedRoute><TournamentList /></ProtectedRoute>} />
            <Route path="tournaments/create" element={<ProtectedRoute><TournamentCreate /></ProtectedRoute>} />
            <Route path="tournaments/:id" element={<ProtectedRoute><TournamentDetail /></ProtectedRoute>} />
            <Route path="notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
            <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="*" element={<div>404 Not Found</div>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
