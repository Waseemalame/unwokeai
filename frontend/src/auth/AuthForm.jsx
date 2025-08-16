import { useState } from 'react';

export default function AuthForm({ onSignup, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onLogin?.(email.trim(), password);
      }}
      style={{ display: 'grid', gap: 8 }}
    >
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        inputMode="email"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        required
        minLength={6}
      />
      <div>
        <button
          type="button"
          onClick={() => onSignup?.(email.trim(), password)}
          disabled={!email.trim() || !password}
        >
          Sign Up
        </button>
        <button type="submit">Login</button>
      </div>
    </form>
  );
}
