import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Hosts from './pages/Hosts';
import Topology from './pages/Topology';
import TerminalPage from './pages/Terminal';
import Users from './pages/Users';
import AuditLog from './pages/AuditLog';
import Settings from './pages/Settings';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Dashboard />} />
                <Route path="hosts" element={<Hosts />} />
                <Route path="topology" element={<Topology />} />
                <Route path="terminal" element={<TerminalPage />} />
                <Route path="users" element={<Users />} />
                <Route path="audit" element={<AuditLog />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
}
