import { useState } from 'react';

export default function AuthForm({ onSignup, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onLogin?.(email, password);
      }}
      style={{ display: 'grid', gap: 8 }}
    >
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => onSignup?.(email, password)}>
          Sign Up
        </button>
        <button type="submit">Login</button>
      </div>
    </form>
  );
}
