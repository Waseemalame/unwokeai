import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth } from '../firebase';
import { onIdTokenChanged, signOut } from 'firebase/auth';

const AuthContext = createContext({
  user: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[AuthProvider] mounting token listener');
    const unsub = onIdTokenChanged(auth, async (u) => {
      console.log('[AuthProvider] onIdTokenChanged fired. user:', !!u, u?.email);
      setUser(u);
      setLoading(false);
    });
    return () => {
      console.log('[AuthProvider] unmounting token listener');
      unsub();
    };
  }, []);

  const logout = async () => {
    console.log('[AuthProvider] logout start');
    setLoading(true);
    try {
      await signOut(auth);
      console.log('[AuthProvider] logout success');
    } catch (e) {
      console.error('[AuthProvider] logout error', e);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const value = useMemo(() => ({ user, loading, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}