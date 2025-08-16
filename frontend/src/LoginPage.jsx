import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from 'firebase/auth';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

axios.defaults.baseURL = '';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return unsub;
  }, []);

  const signup = () => createUserWithEmailAndPassword(auth, email, password);

  const login = async () => {
    await signInWithEmailAndPassword(auth, email, password);
    const token = await auth.currentUser.getIdToken();
    await axios.post('/api/hello', {}, { headers: { Authorization: `Bearer ${token}` } });
    navigate('/', { replace: true });
  };

  return (
    <div style={{ padding: 24 }}>
      <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
      <div>
        <button onClick={signup}>Sign Up</button>
        <button onClick={login}>Login</button>
      </div>
      {currentUser && (
        <div style={{ marginTop: 10, color: 'green' }}>
          ✅ Logged in as {currentUser.email}
        </div>
      )}
    </div>
  );
}
