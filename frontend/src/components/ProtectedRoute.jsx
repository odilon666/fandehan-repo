import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();
  console.log('ProtectedRoute - User:', user, 'Loading:', loading, 'Required role:', role);
  if (loading) return <div>Loading...</div>;
  if (!user) {
    console.log('No user, redirecting to /login-test');
    return <Navigate to="/login-test" replace />;
  }
  if (user.role !== role) {
    console.log('Role mismatch, redirecting to /login-test');
    return <Navigate to="/login-test" replace />;
  }
  return children;
}