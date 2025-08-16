import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from 'firebase/auth';
import AuthForm from '../auth/AuthForm';


export default function LoginPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        const token = await user.getIdToken();
        await axios.post('/api/hello', {}, { headers: { Authorization: `Bearer ${token}` } });
      } catch {
        // Todo: Handle error
      }

      navigate('/home');
    });

    return unsub;
  }, [navigate]);

  const signup = (email, password) =>
    createUserWithEmailAndPassword(auth, email, password);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  return (
    <div>
      <h2>Login</h2>
      <AuthForm onSignup={signup} onLogin={login} />
    </div>
  );
}
