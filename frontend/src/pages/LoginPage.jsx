import { useState } from 'react';
import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.jsx';

axios.defaults.baseURL = ''; // same-origin in prod

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { user, loading } = useAuth();
  const navigate = useNavigate();

    const signup = async () => {
    const e = (email || '').trim();
    try {
        if (!e || !password) throw new Error('Email and password required');
        console.log('[LoginPage] signup attempt', e);

        const cred = await createUserWithEmailAndPassword(auth, e, password);
        console.log('[LoginPage] signup success', cred.user?.uid, cred.user?.email);

        const token = await cred.user.getIdToken();
        await axios.post('/api/hello', {}, { headers: { Authorization: `Bearer ${token}` } });
        console.log('[LoginPage] backend hello after signup success');

        navigate('/', { replace: true });
    } catch (err) {
        console.error('[LoginPage] signup error', err);
        alert(err?.message || 'Signup failed');
    }
    };

  const login = async () => {
    const e = (email || '').trim();
    try {
      if (!e || !password) throw new Error('Email and password required');
      console.log('[LoginPage] login attempt', e);
      const cred = await signInWithEmailAndPassword(auth, e, password);
      console.log('[LoginPage] login success', cred.user?.uid, cred.user?.email);

      // IMPORTANT: use the user from the credential, not auth.currentUser
      const token = await cred.user.getIdToken();
      console.log('[LoginPage] got ID token length:', token?.length);

      // Example backend ping
      await axios.post('/api/hello', {}, { headers: { Authorization: `Bearer ${token}` } });
      console.log('[LoginPage] backend hello success');

      navigate('/', { replace: true });
    } catch (err) {
      console.error('[LoginPage] login error', err);
      alert(err?.message || 'Login failed');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <input
        value={email}
        placeholder="Email"
        onChange={e => setEmail(e.target.value)}
      />
      <input
        value={password}
        type="password"
        placeholder="Password"
        onChange={e => setPassword(e.target.value)}
      />
      <div>
        <button onClick={signup}>Sign Up</button>
        <button onClick={login}>Login</button>
      </div>
      {!loading && user && (
        <div style={{ marginTop: 10, color: 'green' }}>
          ✅ Logged in as {user.email}
        </div>
      )}
    </div>
  );
}
