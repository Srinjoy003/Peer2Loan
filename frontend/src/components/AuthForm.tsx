import React, { useState } from 'react';

const API_URL = 'http://localhost:4000/api/auth';

export default function AuthForm({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        const res = await fetch(`${API_URL}/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Signup failed');
        setMode('login');
        setError('Signup successful! Please log in.');
      } else {
        const res = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        localStorage.setItem('token', data.token);
        onAuth && onAuth(data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full flex items-center justify-center">
        <div className="bg-card shadow-lg rounded-xl border border-border w-full" style={{ maxWidth: 380, padding: '2rem' }}>
          <h2 className="text-2xl font-semibold text-center mb-6 text-foreground">
            {mode === 'signup' ? 'Create Account' : 'Sign In'}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" style={{ padding: '0.5rem 0' }}>
            {mode === 'signup' && (
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Password</label>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Processing...' : mode === 'signup' ? 'Sign Up' : 'Login'}
            </button>
            <button
              type="button"
              className="w-full text-sm text-primary mt-2 hover:underline"
              onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(''); }}
            >
              {mode === 'signup' ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
            </button>
            {error && <div className="text-red-600 text-sm text-center mt-2">{error}</div>}
          </form>
        </div>
  {/* Copyright removed as requested */}
      </div>
    </div>
  );
}
