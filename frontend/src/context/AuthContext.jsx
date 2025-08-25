import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api'; // Vérifiez que ce chemin est correct

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  console.log('Navigate hook initialized successfully');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider useEffect triggered');
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Token found:', token);
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      API.get('/auth/me')
        .then((res) => {
          console.log('Auth/me success:', res.data);
          setUser(res.data);
        })
        .catch((err) => {
          console.error('Auth/me error:', err);
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      console.log('No token, using mock user');
      setTimeout(() => {
        const mockUser = { role: 'user', name: 'Test User', email: 'test@example.com' };
        console.log('Mock user set:', mockUser);
        setUser(mockUser);
        setLoading(false);
      }, 1000);
    }
  }, []);

  const login = async (email, password) => {
    console.log('Login function called with:', { email, password });
    try {
      const res = await API.post('/auth/login', { email, password });
      const token = res.data.access_token;
      localStorage.setItem('token', token);
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(res.data.user);
      console.log('Redirecting to /user with user:', res.data.user);
      navigate('/user'); // Redirection
      console.log('Login success, navigation to /user completed');
      return { success: true };
    } catch (err) {
      console.error('Login error details:', err.response || err.message || err);
      if (email === 'test@example.com' && password === 'password') {
        const mockToken = 'mock-token-123';
        localStorage.setItem('token', mockToken);
        const mockUser = { role: 'user', name: 'Test User', email: 'test@example.com' };
        setUser(mockUser);
        console.log('Redirecting to /user with mock user:', mockUser);
        navigate('/user'); // Redirection pour le mock
        console.log('Mock login success, navigation to /user completed');
        return { success: true };
      }
      const errorMessage = err.response?.data?.detail || 'Erreur lors du login';
      console.log('Login failed with error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    console.log('Register attempt with:', userData);
    try {
      const res = await API.post('/auth/register', userData);
      const token = res.data.access_token;
      localStorage.setItem('token', token);
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(res.data.user);
      navigate('/user');
      return { success: true };
    } catch (err) {
      console.error('Register error:', err);
      return { success: false, error: err.response?.data?.detail || 'Erreur lors de l\'inscription' };
    }
  };

  const logout = () => {
    console.log('Logout triggered');
    localStorage.removeItem('token');
    delete API.defaults.headers.common['Authorization'];
    setUser(null);
    navigate('/login-test');
  };

  console.log('Rendering AuthProvider with user:', user, 'loading:', loading);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);