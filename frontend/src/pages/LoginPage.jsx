import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from 'firebase/auth';
import AuthForm from '../components/AuthForm.jsx';

axios.defaults.baseURL = ''; // same-origin in prod

export default function LoginPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return unsub;
  }, []);

  const signup = (email, password) =>
    createUserWithEmailAndPassword(auth, email, password);

  const login = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
    const token = await auth.currentUser.getIdToken();
    await axios.post('/api/hello', {}, { headers: { Authorization: `Bearer ${token}` } });
    navigate('/home'); // absolute + lowercase
  };

  return (
    <div style={{ padding: 24, maxWidth: 360, margin: '0 auto' }}>
      <h2>Login</h2>
      <AuthForm onSignup={signup} onLogin={login} />
    </div>
  );
}
