import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Vérifier le token avec le backend
      API.get('/users/profile')
        .then((res) => {
          setUser(res.data);
          setLoading(false);
        })
        .catch((err) => {
          localStorage.removeItem('token');
          delete API.defaults.headers.common['Authorization'];
          setUser(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await API.post('/auth/login', { email, password });
      const { token, data } = res.data;
      localStorage.setItem('token', token);
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(data);
      
      // Redirection basée sur le rôle
      if (data.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/user');
      }
      
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la connexion';
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      const res = await API.post('/auth/register', userData);
      const { token, data } = res.data;
      localStorage.setItem('token', token);
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(data);
      navigate('/user');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Erreur lors de l\'inscription' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete API.defaults.headers.common['Authorization'];
    setUser(null);
    navigate('/login-test');
  };


  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);