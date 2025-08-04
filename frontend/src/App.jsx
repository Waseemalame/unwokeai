import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';

axios.defaults.baseURL = ''; // same-origin in prod

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const signup = () => createUserWithEmailAndPassword(auth, email, password);
  const login = () => signInWithEmailAndPassword(auth, email, password);

  const testApi = async () => {
    const token = await auth.currentUser.getIdToken();
    const res = await axios.post('/api/hello', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert(res.data.message);
  };

  return (
    <div style={{ padding: 24 }}>
      <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
      <div>
        <button onClick={signup}>Sign Up</button>
        <button onClick={login}>Login</button>
        <button onClick={testApi}>Test API</button>
      </div>
      {currentUser && (
        <div style={{ marginTop: '10px', color: 'green' }}>
          ✅ Logged in as {currentUser.email}
        </div>
      )}
    </div>
  );
}
