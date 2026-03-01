import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [privateKey, setPrivateKey] = useState(null); // CryptoKey in memory only
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore user from localStorage on refresh (but NOT private key — requires re-login)
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const login = (userData, cryptoKey) => {
    setUser(userData);
    setPrivateKey(cryptoKey);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userData.access_token);
  };

  const logout = () => {
    setUser(null);
    setPrivateKey(null); // Wipe private key from memory
    localStorage.clear();
    sessionStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, privateKey, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);