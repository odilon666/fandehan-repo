import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!user) {
    return <Navigate to="/login-test" replace />;
  }
  
  if (role === 'admin' && user.role !== 'admin') {
    return <Navigate to="/login-test" replace />;
  }
  
  if (role === 'user' && user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  
  if (role === 'user' && user.role !== 'client') {
    return <Navigate to="/login-test" replace />;
  }
  
  return children;
}