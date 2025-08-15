import { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserEmail(user?.email ?? '');
    });
    return unsub;
  }, []);

  const logout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Home</h2>
      <p>Welcome{userEmail ? `, ${userEmail}` : ''}!</p>
      <button onClick={logout}>Log out</button>
    </div>
  );
}
