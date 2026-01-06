import React, { useState } from 'react';
import { useToast } from 'contexts/ToastContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { show } = useToast();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      localStorage.setItem('b1_token', data.token);
      localStorage.setItem('b1_user', JSON.stringify(data.user));
      show('Login successful', 'success');
      window.location.href = '/approvals/pending';
    } catch (err) {
      setError(err.message || String(err));
      try{ show(err.message || 'Login failed', 'error'); }catch(e){}
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Login</h2>
      <form onSubmit={submit} style={{ maxWidth: 400 }}>
        <div style={{ marginBottom: 8 }}>
          <label>Username</label>
          <br />
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Password</label>
          <br />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
        <div>
          <button type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
        </div>
      </form>
    </div>
  );
};

export default Login;
